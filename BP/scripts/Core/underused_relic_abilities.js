import { system, world } from "@minecraft/server";
import { registerCombatModifierProvider } from "../StatsCore/API.js";
import {
    getEntityHurtTarget,
    getEventDamageType,
} from "../StatsCore/shared/damage.js";
import {
    OFFENSIVE_ENTITY_CATEGORIES,
    getEntityCategory,
} from "../StatsCore/shared/entityCategories.js";
import { applyUniversalTrinketEffect } from "./update_stats.js";
import { getStatCategory } from "./stats_manager.js";
import { registerTrinketSampler } from "./trinket_sampler.js";

const ITEMS = Object.freeze({
    silverfishRing: "dorios:silverfish_scale_ring",
    breezeLoop: "dorios:breeze_core_loop",
    ominousRing: "dorios:ominous_key_ring",
    phantomMantle: "dorios:phantom_membrane_mantle",
    armadilloBrooch: "dorios:armadillo_shield_brooch",
    allayBell: "dorios:lost_allay_bell",
    desertScarab: "dorios:desert_scarab_charm",
    snowDoll: "dorios:packed_snow_doll",
    shipwreckedDoll: "dorios:shipwrecked_doll",
    windBracer: "dorios:wind_bracer",
    bastionMedallion: "dorios:cracked_bastion_medallion",
    jungleReliquary: "dorios:jungle_reliquary",
});

const OFFENSIVE_CATEGORIES = new Set(OFFENSIVE_ENTITY_CATEGORIES);
const EXPLOSION_DAMAGE_TYPES = new Set(["block_explosion", "entity_explosion"]);
const GOLD_INGOT = "minecraft:gold_ingot";
const OMINOUS_KEY = "minecraft:ominous_trial_key";

const phantomCooldowns = new Map();
const scarabCooldowns = new Map();
const shipwreckCooldowns = new Map();
const snowDollCooldowns = new Map();
const bastionCooldowns = new Map();
const jungleCooldowns = new Map();
const ominousCharges = new Set();
const allayXpStates = new Map();

function currentTick() {
    return Number(system.currentTick ?? 0) || 0;
}

function hasTrinket(player, itemId) {
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

function restoreMana(player, amount) {
    try {
        const objective = world.scoreboard.getObjective("dorios:mana");
        const identity = player.scoreboardIdentity;
        if (!objective || !identity) return false;
        const maximum = Math.max(0, Number(getStatCategory(player, "stats")?.mana ?? 0) || 0);
        const current = Math.max(0, Number(objective.getScore(identity) ?? 0) || 0);
        const next = Math.min(maximum, current + amount);
        if (next <= current) return false;
        objective.setScore(identity, next);
        return true;
    } catch {
        return false;
    }
}

function countNearbyHostiles(player) {
    try {
        const entities = player.dimension.getEntities({
            location: player.location,
            maxDistance: 5,
        });
        let count = 0;
        for (const entity of entities) {
            if (entity.id === player.id) continue;
            if (OFFENSIVE_CATEGORIES.has(getEntityCategory(entity))) count++;
            if (count >= 5) break;
        }
        return count;
    } catch {
        return 0;
    }
}

function findGoldIngotSlot(player) {
    try {
        const inventory = player.getComponent("minecraft:inventory")?.container
            ?? player.getComponent("inventory")?.container;
        if (!inventory) return -1;
        for (let index = 0; index < inventory.size; index++) {
            if (inventory.getItem(index)?.typeId === GOLD_INGOT) return index;
        }
    } catch { }
    return -1;
}

function consumeGoldIngot(player, slot) {
    try {
        const inventory = player.getComponent("minecraft:inventory")?.container
            ?? player.getComponent("inventory")?.container;
        const stack = inventory?.getItem(slot);
        if (!stack || stack.typeId !== GOLD_INGOT) return false;
        if (stack.amount <= 1) inventory.setItem(slot);
        else {
            stack.amount -= 1;
            inventory.setItem(slot, stack);
        }
        return true;
    } catch {
        return false;
    }
}

registerCombatModifierProvider("dorios:underused_relics", ({ event, attacker, target }) => {
    if (attacker?.typeId !== "minecraft:player" || !target) return null;
    const damageType = getEventDamageType(event);
    let damageMultiplier = 1;

    if (damageType === "entity_attack"
        && hasTrinket(attacker, ITEMS.ominousRing)
        && ominousCharges.delete(attacker.id)) {
        damageMultiplier *= 1.35;
    }

    if (damageType === "entity_attack"
        && hasTrinket(attacker, ITEMS.windBracer)
        && target.isOnGround === false) {
        damageMultiplier *= 1.20;
    }

    return damageMultiplier === 1 ? null : { damageMultiplier };
}, { priority: 155 });

world.beforeEvents?.entityHurt?.subscribe?.((event) => {
    try {
        if (event.cancel === true) return;
        const player = getEntityHurtTarget(event);
        if (player?.typeId !== "minecraft:player") return;

        const tick = currentTick();
        const damageType = getEventDamageType(event);
        let damage = Math.max(0, Number(event.damage ?? 0));

        if (hasTrinket(player, ITEMS.silverfishRing)) {
            const reduction = Math.min(0.10, countNearbyHostiles(player) * 0.02);
            damage *= 1 - reduction;
        }

        if (hasTrinket(player, ITEMS.breezeLoop) && player.isOnGround === false) {
            damage *= 0.85;
        }

        if (damageType === "fall"
            && hasTrinket(player, ITEMS.phantomMantle)
            && Number(phantomCooldowns.get(player.id) ?? 0) <= tick) {
            damage *= 0.40;
            phantomCooldowns.set(player.id, tick + 300);
            system.run(() => {
                if (player.isValid && hasTrinket(player, ITEMS.phantomMantle)) {
                    applyUniversalTrinketEffect(player, "minecraft:slow_falling", 0, true);
                }
            });
        }

        if (damageType === "projectile"
            && player.isSneaking
            && hasTrinket(player, ITEMS.armadilloBrooch)) {
            damage *= 0.65;
        }

        if (EXPLOSION_DAMAGE_TYPES.has(damageType) && hasTrinket(player, ITEMS.desertScarab)) {
            damage *= 0.65;
            if (Number(scarabCooldowns.get(player.id) ?? 0) <= tick) {
                scarabCooldowns.set(player.id, tick + 200);
                system.run(() => {
                    if (player.isValid && hasTrinket(player, ITEMS.desertScarab)) {
                        applyUniversalTrinketEffect(player, "minecraft:speed", 0, true);
                    }
                });
            }
        }

        if (damageType === "drowning"
            && hasTrinket(player, ITEMS.shipwreckedDoll)
            && Number(shipwreckCooldowns.get(player.id) ?? 0) <= tick) {
            damage = 0;
            shipwreckCooldowns.set(player.id, tick + 400);
            system.run(() => {
                if (!player.isValid || !hasTrinket(player, ITEMS.shipwreckedDoll)) return;
                applyUniversalTrinketEffect(player, "minecraft:water_breathing", 0, true);
                player.applyImpulse?.({ x: 0, y: 0.45, z: 0 });
            });
        }

        if (damageType === "projectile"
            && hasTrinket(player, ITEMS.jungleReliquary)
            && Number(jungleCooldowns.get(player.id) ?? 0) <= tick) {
            damage = 0;
            jungleCooldowns.set(player.id, tick + 400);
            system.run(() => {
                try {
                    if (player.isValid) player.playSound?.("random.orb", { volume: 0.5, pitch: 1.4 });
                } catch { }
            });
        }

        if (damage > 0
            && hasTrinket(player, ITEMS.bastionMedallion)
            && Number(bastionCooldowns.get(player.id) ?? 0) <= tick) {
            const goldSlot = findGoldIngotSlot(player);
            if (goldSlot >= 0) {
                damage *= 0.60;
                bastionCooldowns.set(player.id, tick + 200);
                system.run(() => consumeGoldIngot(player, goldSlot));
            }
        }

        event.damage = Math.max(0, damage);
    } catch (error) {
        console.warn("[Dorios Trinkets] underused relic defense failed:", error);
    }
});

world.afterEvents.entityHurt.subscribe((event) => {
    try {
        const player = getEntityHurtTarget(event);
        if (!hasTrinket(player, ITEMS.snowDoll)
            || Number(snowDollCooldowns.get(player.id) ?? 0) > currentTick()) return;

        const health = getHealth(player);
        const current = Number(health?.currentValue ?? 0);
        const maximum = Number(health?.effectiveMax ?? 0);
        const previous = Math.min(maximum, current + Math.max(0, Number(event.damage ?? 0)));
        if (maximum <= 0 || current <= 0 || previous / maximum <= 0.5 || current / maximum > 0.5) return;

        snowDollCooldowns.set(player.id, currentTick() + 600);
        const golem = player.dimension.spawnEntity("minecraft:snow_golem", player.location);
        golem.addTag?.("dorios:packed_snow_guardian");
        system.runTimeout(() => {
            try {
                if (golem.isValid) golem.remove();
            } catch { }
        }, 140);
    } catch (error) {
        console.warn("[Dorios Trinkets] Packed Snow Doll failed:", error);
    }
});

world.afterEvents?.entityItemPickup?.subscribe?.((event) => {
    try {
        const player = event.entity;
        if (!hasTrinket(player, ITEMS.ominousRing)) return;
        if (event.items?.some(stack => stack?.typeId === OMINOUS_KEY)) {
            ominousCharges.add(player.id);
        }
    } catch { }
});

registerTrinketSampler("dorios:allay_xp_conversion", 10, (player) => {
    if (!hasTrinket(player, ITEMS.allayBell)) {
        allayXpStates.delete(player.id);
        return;
    }

    let totalXp;
    try {
        totalXp = Math.max(0, Math.floor(Number(player.getTotalXp?.() ?? 0) || 0));
    } catch {
        return;
    }

    const state = allayXpStates.get(player.id);
    if (!state) {
        allayXpStates.set(player.id, { totalXp, remainder: 0 });
        return;
    }

    const gained = Math.max(0, totalXp - state.totalXp);
    state.totalXp = totalXp;
    if (gained <= 0) return;

    const accumulated = state.remainder + gained;
    const mana = Math.floor(accumulated / 3);
    state.remainder = accumulated % 3;
    if (mana > 0) restoreMana(player, mana);
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    phantomCooldowns.delete(playerId);
    scarabCooldowns.delete(playerId);
    shipwreckCooldowns.delete(playerId);
    snowDollCooldowns.delete(playerId);
    bastionCooldowns.delete(playerId);
    jungleCooldowns.delete(playerId);
    ominousCharges.delete(playerId);
    allayXpStates.delete(playerId);
});
