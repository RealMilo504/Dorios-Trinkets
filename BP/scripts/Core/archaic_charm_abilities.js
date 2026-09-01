import { system, world } from "@minecraft/server";
import { getStatCategory, updatePlayerStats } from "./stats_manager.js";
import { applyUniversalTrinketEffect } from "./update_stats.js";
import { consumeEquippedTrinket } from "./trinkets_inv.js";
import { registerTrinketSampler } from "./trinket_sampler.js";
import {
    getEntityHurtAttacker,
    getEntityHurtTarget,
    getEventDamageType,
} from "../StatsCore/shared/damage.js";

const CHARMS = Object.freeze({
    endlessEye: "dorios:endless_eye",
    phoenix: "dorios:phoenix_ash_sigil",
    chronoshard: "dorios:chronoshard",
    worldroot: "dorios:worldroot_knot",
    stormbound: "dorios:stormbound_idol",
    glutton: "dorios:gluttons_seal",
});
const WORLDROOT_TAG = "dorios:worldroot_active_tag";
const worldrootStates = new Map();
const stormCooldowns = new Map();
const deferredDamage = new Set();
const phoenixGuards = new Set();

function currentTick() {
    return Number(system.currentTick ?? 0) || 0;
}

function hasCharm(player, itemId) {
    return player?.typeId === "minecraft:player" && player.hasTag?.(itemId);
}

function getHealth(entity) {
    try {
        return entity?.getComponent?.("minecraft:health")
            ?? entity?.getComponent?.("health")
            ?? null;
    } catch {
        return null;
    }
}

function setAuxTag(player, tag, enabled) {
    const hasTag = player.hasTag(tag);
    if (enabled === hasTag) return;
    if (enabled) player.addTag(tag);
    else player.removeTag(tag);
    updatePlayerStats(player);
}

function isThunder(player) {
    try {
        const dimensionId = String(player.dimension?.id ?? "overworld").replace(/^minecraft:/, "");
        return String(world.getDynamicProperty(`dorios:weather_${dimensionId}`) ?? "Clear") === "Thunder";
    } catch {
        return false;
    }
}

function scheduleChronoshardDebt(player, attacker, amount) {
    const tranche = Math.max(0, amount / 3);
    if (tranche <= 0) return;

    for (let part = 1; part <= 3; part++) {
        system.runTimeout(() => {
            try {
                if (!player.isValid) return;
                const health = getHealth(player);
                if (Number(health?.currentValue ?? 0) <= 0) return;
                deferredDamage.add(player.id);
                const options = attacker?.isValid
                    ? { cause: "magic", damagingEntity: attacker }
                    : { cause: "magic" };
                player.applyDamage(tranche, options);
            } catch { }
            finally {
                deferredDamage.delete(player.id);
            }
        }, part * 20);
    }
}

function sampleWorldroot(player) {
    const id = player.id;
    if (!hasCharm(player, CHARMS.worldroot)) {
        worldrootStates.delete(id);
        setAuxTag(player, WORLDROOT_TAG, false);
        return;
    }

    const location = player.location;
    const state = worldrootStates.get(id) ?? {
        location: { ...location },
        stillTicks: 0,
    };
    const distance = Math.hypot(
        location.x - state.location.x,
        location.y - state.location.y,
        location.z - state.location.z,
    );
    state.stillTicks = distance <= 0.06 && !player.isJumping
        ? Math.min(100, state.stillTicks + 5)
        : 0;
    state.location = { ...location };
    worldrootStates.set(id, state);
    setAuxTag(player, WORLDROOT_TAG, state.stillTicks >= 60);
}

registerTrinketSampler("dorios:archaic_charms", 5, sampleWorldroot);

world.beforeEvents?.entityHurt?.subscribe?.((event) => {
    try {
        if (event.cancel === true) return;
        const player = getEntityHurtTarget(event);
        if (player?.typeId !== "minecraft:player" || deferredDamage.has(player.id)) return;

        if (hasCharm(player, CHARMS.endlessEye) && Math.random() < 0.05) {
            event.cancel = true;
            system.run(() => {
                try {
                    if (player.isValid) {
                        player.playSound?.("mob.endermen.portal", { volume: 0.45, pitch: 1.35 });
                    }
                } catch { }
            });
            return;
        }

        const incoming = Math.max(0, Number(event.damage ?? 0));
        if (incoming <= 0) return;
        if (hasCharm(player, CHARMS.chronoshard)) {
            event.damage = incoming * 0.7;
            scheduleChronoshardDebt(player, getEntityHurtAttacker(event), incoming * 0.3);
        }

        if (!hasCharm(player, CHARMS.phoenix) || phoenixGuards.has(player.id)) return;
        const health = getHealth(player);
        const currentHealth = Number(health?.currentValue ?? 0);
        const finalIncoming = Math.max(0, Number(event.damage ?? 0));
        if (currentHealth <= 0 || finalIncoming < currentHealth) return;

        if (currentHealth <= 1) event.cancel = true;
        else event.damage = currentHealth - 1;
        const phoenixAttacker = getEntityHurtAttacker(event);
        phoenixGuards.add(player.id);
        system.run(() => {
            try {
                if (!player.isValid || !consumeEquippedTrinket(player, CHARMS.phoenix)) return;
                const current = Number(getHealth(player)?.currentValue ?? 0);
                getHealth(player)?.setCurrentValue?.(Math.max(6, current));
                applyUniversalTrinketEffect(player, "minecraft:fire_resistance", 0, true);
                applyUniversalTrinketEffect(player, "minecraft:weakness", 0, true);
                phoenixAttacker?.setOnFire?.(4);
                player.playSound?.("random.totem", { volume: 0.9, pitch: 1.45 });
            } finally {
                phoenixGuards.delete(player.id);
            }
        });
    } catch (error) {
        console.warn("[Dorios Trinkets] Archaic damage reaction failed:", error);
    }
});

world.afterEvents.entityHurt.subscribe((event) => {
    try {
        const attacker = getEntityHurtAttacker(event);
        const target = getEntityHurtTarget(event);
        if (!hasCharm(attacker, CHARMS.stormbound) || !target?.isValid) return;
        const damageType = getEventDamageType(event);
        if (damageType !== "entity_attack" && damageType !== "projectile") return;
        if (!isThunder(attacker) || Number(stormCooldowns.get(attacker.id) ?? 0) > currentTick()) return;

        const critChance = Math.min(0.5, Math.max(0.05,
            Number(getStatCategory(attacker, "stats")?.critChance ?? 5) / 100));
        if (Math.random() > critChance) return;
        stormCooldowns.set(attacker.id, currentTick() + 200);
        target.dimension.spawnEntity("minecraft:lightning_bolt", target.location);
    } catch (error) {
        console.warn("[Dorios Trinkets] Stormbound Idol failed:", error);
    }
});

world.afterEvents.itemCompleteUse?.subscribe?.((event) => {
    try {
        const player = event?.source;
        const stack = event?.itemStack;
        if (!hasCharm(player, CHARMS.glutton) || !stack?.getComponent?.("minecraft:food")) return;
        const hunger = player.getComponent("minecraft:player.hunger")
            ?? player.getComponent("player.hunger");
        const current = Number(hunger?.currentValue ?? 0);
        const maximum = Number(hunger?.effectiveMax ?? 20);
        if (maximum > 0 && current >= maximum) {
            applyUniversalTrinketEffect(player, "minecraft:absorption", 1, true);
        }
    } catch (error) {
        console.warn("[Dorios Trinkets] Glutton's Seal failed:", error);
    }
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    worldrootStates.delete(playerId);
    stormCooldowns.delete(playerId);
    deferredDamage.delete(playerId);
    phoenixGuards.delete(playerId);
});
