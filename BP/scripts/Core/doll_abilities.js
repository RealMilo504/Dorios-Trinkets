import { system, world } from "@minecraft/server";
import { updatePlayerStats } from "./stats_manager.js";
import { applyUniversalTrinketEffect } from "./update_stats.js";
import { consumeEquippedTrinket } from "./trinkets_inv.js";
import {
    getEntityHurtAttacker,
    getEntityHurtTarget,
    getEventDamageType,
} from "../StatsCore/shared/damage.js";
import {
    OFFENSIVE_ENTITY_CATEGORIES,
    getEntityCategory,
} from "../StatsCore/shared/entityCategories.js";

const DOLLS = Object.freeze({
    stone: "dorios:stone_guardian_doll",
    straw: "dorios:straw_effigy",
    marionette: "dorios:marionette_of_spite",
    creeper: "dorios:creeper_doll",
    leech: "dorios:leech_doll",
    guardian: "dorios:guardian_effigy",
});

const STONE_GUARD_TAG = "dorios:stone_guardian_retort";
const LEECH_SURGE_TAG = "dorios:leech_doll_surge";
const NEGATIVE_EFFECTS = new Set([
    "minecraft:blindness",
    "minecraft:darkness",
    "minecraft:fatal_poison",
    "minecraft:hunger",
    "minecraft:mining_fatigue",
    "minecraft:nausea",
    "minecraft:poison",
    "minecraft:slowness",
    "minecraft:weakness",
    "minecraft:wither",
]);
const OFFENSIVE_CATEGORIES = new Set(OFFENSIVE_ENTITY_CATEGORIES);

const stoneCooldowns = new Map();
const guardianCooldowns = new Map();
const creeperCooldowns = new Map();
const spiteCooldowns = new Map();
const lastAttackers = new Map();
const leechMarks = new Map();
const temporaryTags = new Map();
const reflectedEffectTargets = new Map();
const pendingStrawSaves = new Set();
const strawGuardUntil = new Map();

function currentTick() {
    return Number(system.currentTick ?? 0) || 0;
}

function isReady(cooldowns, id) {
    return Number(cooldowns.get(id) ?? 0) <= currentTick();
}

function startCooldown(cooldowns, id, ticks) {
    cooldowns.set(id, currentTick() + ticks);
}

function hasDoll(player, dollId) {
    return player?.typeId === "minecraft:player" && player.hasTag?.(dollId);
}

function applyTemporaryStatTag(player, tag, durationTicks) {
    const key = `${player.id}:${tag}`;
    const expiresAt = currentTick() + durationTicks;
    temporaryTags.set(key, expiresAt);

    if (!player.hasTag(tag)) {
        player.addTag(tag);
        updatePlayerStats(player);
    }

    system.runTimeout(() => {
        if (temporaryTags.get(key) !== expiresAt) return;
        temporaryTags.delete(key);
        if (!player.isValid || !player.hasTag(tag)) return;
        player.removeTag(tag);
        updatePlayerStats(player);
    }, durationTicks + 1);
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

function getEffectId(effect) {
    const raw = effect?.typeId ?? effect?.type?.id ?? effect?.effectType?.id ?? "";
    const id = String(raw).toLowerCase();
    return id && !id.includes(":") ? `minecraft:${id}` : id;
}

function rememberAttacker(player, attacker) {
    if (!attacker?.isValid || attacker.id === player.id) return;
    lastAttackers.set(player.id, {
        entity: attacker,
        expiresAt: currentTick() + 100,
    });
}

world.beforeEvents?.entityHurt?.subscribe?.((event) => {
    try {
        if (event.cancel === true) return;
        const player = getEntityHurtTarget(event);
        if (player?.typeId !== "minecraft:player") return;

        // A fatal hit may emit immediate proc/elemental damage before the
        // scheduled inventory transaction consumes the effigy. Treat that
        // short transaction window as part of the same saved hit.
        if (pendingStrawSaves.has(player.id)
            || Number(strawGuardUntil.get(player.id) ?? -1) >= currentTick()) {
            event.cancel = true;
            return;
        }

        if (hasDoll(player, DOLLS.marionette)) {
            rememberAttacker(player, getEntityHurtAttacker(event));
        }

        if (hasDoll(player, DOLLS.creeper)) {
            const damageType = getEventDamageType(event);
            if (damageType === "block_explosion" || damageType === "entity_explosion") {
                event.damage = Math.max(0, Number(event.damage ?? 0) * 0.7);
            }
        }

        if (!hasDoll(player, DOLLS.straw)) return;
        const health = getHealth(player);
        const currentHealth = Number(health?.currentValue ?? health?.value ?? 0);
        const incomingDamage = Number(event.damage ?? 0);
        if (currentHealth <= 0 || incomingDamage < currentHealth) return;

        if (currentHealth <= 1) event.cancel = true;
        else event.damage = currentHealth - 1;
        pendingStrawSaves.add(player.id);
        const guardUntil = currentTick() + 2;
        strawGuardUntil.set(player.id, guardUntil);
        system.runTimeout(() => {
            if (strawGuardUntil.get(player.id) === guardUntil) strawGuardUntil.delete(player.id);
        }, 3);
        system.run(() => {
            try {
                if (!player.isValid || !consumeEquippedTrinket(player, DOLLS.straw)) return;
                applyUniversalTrinketEffect(player, "minecraft:absorption", 1, true);
                applyUniversalTrinketEffect(player, "minecraft:resistance", 1, true);
                player.playSound?.("random.totem", { volume: 0.8, pitch: 0.8 });
            } finally {
                pendingStrawSaves.delete(player.id);
            }
        });
    } catch (error) {
        console.warn("[Dorios Trinkets] Doll damage guard failed:", error);
    }
});

world.afterEvents.entityHurt.subscribe((event) => {
    try {
        const target = getEntityHurtTarget(event);
        const attacker = getEntityHurtAttacker(event);

        if (target?.typeId === "minecraft:player") {
            if (hasDoll(target, DOLLS.marionette)) rememberAttacker(target, attacker);

            if (hasDoll(target, DOLLS.leech) && attacker?.isValid && attacker.id !== target.id) {
                leechMarks.set(target.id, {
                    target: attacker,
                    expiresAt: currentTick() + 120,
                });
            }

            if (hasDoll(target, DOLLS.guardian) && isReady(guardianCooldowns, target.id)) {
                const health = getHealth(target);
                const current = Number(health?.currentValue ?? health?.value ?? 0);
                const maximum = Number(health?.effectiveMax ?? health?.defaultValue ?? 0);
                const previous = Math.min(maximum, current + Math.max(0, Number(event?.damage ?? 0)));
                if (maximum > 0 && previous / maximum > 0.3 && current / maximum <= 0.3) {
                    startCooldown(guardianCooldowns, target.id, 600);
                    applyUniversalTrinketEffect(target, "minecraft:absorption", 1, true);
                    applyUniversalTrinketEffect(target, "minecraft:resistance", 0, true);
                }
            }
        }

        if (hasDoll(target, DOLLS.stone)
            && attacker?.isValid
            && attacker.id !== target.id
            && getEventDamageType(event) === "entity_attack"
            && isReady(stoneCooldowns, target.id)) {
            startCooldown(stoneCooldowns, target.id, 160);
            attacker.applyDamage(2, { cause: "thorns", damagingEntity: target });
            applyTemporaryStatTag(target, STONE_GUARD_TAG, 80);
        }

        if (hasDoll(attacker, DOLLS.leech)) {
            const mark = leechMarks.get(attacker.id);
            if (mark && mark.expiresAt >= currentTick() && mark.target?.id === target?.id) {
                leechMarks.delete(attacker.id);
                applyTemporaryStatTag(attacker, LEECH_SURGE_TAG, 100);
            }
        }
    } catch (error) {
        console.warn("[Dorios Trinkets] Doll hurt reaction failed:", error);
    }
});

world.afterEvents.effectAdd?.subscribe?.((event) => {
    try {
        const player = event?.entity;
        if (!hasDoll(player, DOLLS.marionette)) return;
        if (Number(reflectedEffectTargets.get(player.id) ?? 0) >= currentTick()) return;

        const effect = event?.effect;
        const effectId = getEffectId(effect);
        if (!NEGATIVE_EFFECTS.has(effectId) || !isReady(spiteCooldowns, player.id)) return;

        const contact = lastAttackers.get(player.id);
        const attacker = contact?.entity;
        if (!attacker?.isValid || contact.expiresAt < currentTick()) return;
        if (Math.random() > 0.35) return;

        startCooldown(spiteCooldowns, player.id, 100);
        const reflectedUntil = currentTick() + 1;
        reflectedEffectTargets.set(attacker.id, reflectedUntil);
        const amplifier = Math.max(0, Math.min(4, Number(effect?.amplifier ?? 0) || 0));
        applyUniversalTrinketEffect(attacker, effectId, amplifier, true);
        system.runTimeout(() => {
            if (reflectedEffectTargets.get(attacker.id) === reflectedUntil) {
                reflectedEffectTargets.delete(attacker.id);
            }
        }, 2);
    } catch (error) {
        console.warn("[Dorios Trinkets] Marionette reflection failed:", error);
    }
});

world.afterEvents.entityDie.subscribe((event) => {
    try {
        const player = getEntityHurtAttacker(event);
        const deadEntity = event?.deadEntity;
        if (!hasDoll(player, DOLLS.creeper) || !deadEntity) return;
        if (!OFFENSIVE_CATEGORIES.has(getEntityCategory(deadEntity))) return;
        if (!isReady(creeperCooldowns, player.id) || Math.random() > 0.12) return;

        startCooldown(creeperCooldowns, player.id, 200);
        deadEntity.dimension.createExplosion(deadEntity.location, 2, {
            breaksBlocks: false,
            causesFire: false,
            source: player,
        });
    } catch (error) {
        console.warn("[Dorios Trinkets] Creeper Doll explosion failed:", error);
    }
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    stoneCooldowns.delete(playerId);
    guardianCooldowns.delete(playerId);
    creeperCooldowns.delete(playerId);
    spiteCooldowns.delete(playerId);
    lastAttackers.delete(playerId);
    leechMarks.delete(playerId);
    pendingStrawSaves.delete(playerId);
    strawGuardUntil.delete(playerId);
    reflectedEffectTargets.delete(playerId);

    for (const key of temporaryTags.keys()) {
        if (key.startsWith(`${playerId}:`)) temporaryTags.delete(key);
    }
});
