import { system, world } from "@minecraft/server";
import { registerCombatModifierProvider } from "../StatsCore/API.js";
import {
    getEntityHurtAttacker,
    getEntityHurtTarget,
    getEventDamageType,
} from "../StatsCore/shared/damage.js";
import {
    OFFENSIVE_ENTITY_CATEGORIES,
    getEntityCategory,
} from "../StatsCore/shared/entityCategories.js";
import { applyUniversalTrinketEffect } from "./update_stats.js";

const ITEMS = Object.freeze({
    traveler: "dorios:travelers_cloak_pin",
    alchemist: "dorios:alchemists_cloak_pin",
    ironLocket: "dorios:iron_locket",
    emeraldChain: "dorios:emerald_chain",
    certaintyKnot: "dorios:wayfarers_knot",
    minerToken: "dorios:miners_token",
    duelistWraps: "dorios:duelist_wraps",
    impactGlove: "dorios:impact_glove",
});
const OFFENSIVE_CATEGORIES = new Set(OFFENSIVE_ENTITY_CATEGORIES);
const ORES = new Set([
    "minecraft:coal_ore", "minecraft:deepslate_coal_ore",
    "minecraft:copper_ore", "minecraft:deepslate_copper_ore",
    "minecraft:diamond_ore", "minecraft:deepslate_diamond_ore",
    "minecraft:emerald_ore", "minecraft:deepslate_emerald_ore",
    "minecraft:gold_ore", "minecraft:deepslate_gold_ore",
    "minecraft:iron_ore", "minecraft:deepslate_iron_ore",
    "minecraft:lapis_ore", "minecraft:deepslate_lapis_ore",
    "minecraft:nether_gold_ore", "minecraft:nether_quartz_ore",
    "minecraft:redstone_ore", "minecraft:deepslate_redstone_ore",
]);

const travelerCooldowns = new Map();
const alchemistHealingUntil = new Map();
const emeraldKills = new Map();
const certaintyCooldowns = new Map();
const parries = new Map();
const impactCooldowns = new Map();

function currentTick() {
    return Number(system.currentTick ?? 0) || 0;
}

function hasTrinket(player, itemId) {
    return player?.typeId === "minecraft:player" && player.hasTag?.(itemId);
}

function healthComponent(entity) {
    try {
        return entity?.getComponent?.("minecraft:health") ?? entity?.getComponent?.("health") ?? null;
    } catch {
        return null;
    }
}

registerCombatModifierProvider("dorios:accessory_trinkets", ({ event, attacker, target }) => {
    if (attacker?.typeId !== "minecraft:player" || !target) return null;

    const tick = currentTick();
    const damageType = getEventDamageType(event);
    let damageMultiplier = 1;
    let criticalChance = 0;

    if (damageType === "entity_attack" && hasTrinket(attacker, ITEMS.duelistWraps)) {
        const parry = parries.get(attacker.id);
        if (parry?.expiresAt >= tick && parry.attackerId === target.id) {
            damageMultiplier *= 1.20;
            parries.delete(attacker.id);
        }
    }

    if ((damageType === "entity_attack" || damageType === "projectile")
        && hasTrinket(attacker, ITEMS.certaintyKnot)
        && Number(certaintyCooldowns.get(attacker.id) ?? 0) <= tick) {
        criticalChance = 1;
        certaintyCooldowns.set(attacker.id, tick + 160);
    }

    if (damageMultiplier === 1 && criticalChance === 0) return null;
    return { damageMultiplier, criticalChance };
}, { priority: 140 });

world.beforeEvents?.entityHurt?.subscribe?.((event) => {
    try {
        if (event.cancel === true) return;
        const player = getEntityHurtTarget(event);
        if (player?.typeId !== "minecraft:player") return;

        const damageType = getEventDamageType(event);
        if (damageType === "projectile") {
            if (hasTrinket(player, ITEMS.ironLocket)) {
                event.damage = Math.max(0, Number(event.damage ?? 0) * 0.88);
            }

            const readyAt = Number(travelerCooldowns.get(player.id) ?? 0);
            if (hasTrinket(player, ITEMS.traveler) && readyAt <= currentTick()) {
                event.damage = Math.max(0, Number(event.damage ?? 0) * 0.75);
                travelerCooldowns.set(player.id, currentTick() + 120);
                system.run(() => {
                    if (player?.isValid) {
                        applyUniversalTrinketEffect(player, "minecraft:speed", 0, true);
                    }
                });
            }
        }

        if (damageType === "entity_attack" && hasTrinket(player, ITEMS.duelistWraps)) {
            const attacker = getEntityHurtAttacker(event);
            if (attacker?.id) {
                parries.set(player.id, {
                    attackerId: attacker.id,
                    expiresAt: currentTick() + 60,
                });
            }
        }
    } catch (error) {
        console.warn("[Dorios Trinkets] accessory defense failed:", error);
    }
});

world.afterEvents.entityHealthChanged?.subscribe?.((event) => {
    const player = event?.entity;
    if (!hasTrinket(player, ITEMS.alchemist)
        || Number(alchemistHealingUntil.get(player.id) ?? -1) >= currentTick()) return;

    const gained = Number(event.newValue ?? 0) - Number(event.oldValue ?? 0);
    if (!Number.isFinite(gained) || gained <= 0) return;

    const suppressedUntil = currentTick() + 2;
    alchemistHealingUntil.set(player.id, suppressedUntil);
    system.run(() => {
        try {
            const health = healthComponent(player);
            if (!health || !player?.isValid) return;
            health.setCurrentValue(Math.min(health.effectiveMax, health.currentValue + gained * 0.10));
        } catch (error) {
            console.warn("[Dorios Trinkets] Alchemist's Cloak Pin failed:", error);
        }
    });
    system.runTimeout(() => {
        if (alchemistHealingUntil.get(player.id) === suppressedUntil) {
            alchemistHealingUntil.delete(player.id);
        }
    }, 3);
});

world.afterEvents.entityDie.subscribe((event) => {
    try {
        const player = getEntityHurtAttacker(event);
        const dead = event?.deadEntity;
        if (!hasTrinket(player, ITEMS.emeraldChain)
            || !OFFENSIVE_CATEGORIES.has(getEntityCategory(dead))) return;

        const kills = Number(emeraldKills.get(player.id) ?? 0) + 1;
        if (kills < 5) {
            emeraldKills.set(player.id, kills);
            return;
        }

        emeraldKills.set(player.id, 0);
        player.addExperience?.(1);
    } catch (error) {
        console.warn("[Dorios Trinkets] Emerald Chain failed:", error);
    }
});

world.afterEvents.playerBreakBlock.subscribe((event) => {
    try {
        const player = event?.player;
        const permutation = event?.brokenBlockPermutation;
        const typeId = permutation?.type?.id ?? permutation?.typeId ?? "";
        if (player?.getGameMode?.() !== "Survival"
            || !hasTrinket(player, ITEMS.minerToken)
            || !ORES.has(typeId)) return;

        applyUniversalTrinketEffect(player, "minecraft:haste", 0, true);
    } catch (error) {
        console.warn("[Dorios Trinkets] Miner's Token failed:", error);
    }
});

world.afterEvents.entityHurt.subscribe((event) => {
    try {
        const player = getEntityHurtAttacker(event);
        const target = getEntityHurtTarget(event);
        if (!hasTrinket(player, ITEMS.impactGlove)
            || getEventDamageType(event) !== "entity_attack"
            || !target?.isValid) return;

        const tick = currentTick();
        if (Number(impactCooldowns.get(player.id) ?? 0) > tick) return;
        impactCooldowns.set(player.id, tick + 80);

        const dx = Number(target.location?.x ?? 0) - Number(player.location?.x ?? 0);
        const dz = Number(target.location?.z ?? 0) - Number(player.location?.z ?? 0);
        const magnitude = Math.hypot(dx, dz) || 1;
        target.applyKnockback?.({ x: dx / magnitude, z: dz / magnitude }, 0.65);
    } catch (error) {
        console.warn("[Dorios Trinkets] Impact Glove failed:", error);
    }
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    travelerCooldowns.delete(playerId);
    alchemistHealingUntil.delete(playerId);
    emeraldKills.delete(playerId);
    certaintyCooldowns.delete(playerId);
    parries.delete(playerId);
    impactCooldowns.delete(playerId);
});
