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
import { registerTrinketSampler } from "./trinket_sampler.js";
import { getStatCategory } from "./stats_manager.js";

const ITEMS = Object.freeze({
    ravagerBuckle: "dorios:ravager_horn_buckle",
    spiderMantle: "dorios:spider_silk_mantle",
    huskMask: "dorios:huskbone_mask",
    goatstep: "dorios:goatstep_anklets",
    hoglinGauntlet: "dorios:hoglin_tusk_gauntlet",
    ghastLocket: "dorios:ghast_tear_locket",
    trialCrown: "dorios:trial_champion_crown",
    sculkResonator: "dorios:sculk_resonator",
    mansionWard: "dorios:mansion_ward_amulet",
    strongholdEye: "dorios:stronghold_eye_charm",
    endCityOrb: "dorios:end_city_orb",
});
const OFFENSIVE_CATEGORIES = new Set(OFFENSIVE_ENTITY_CATEGORIES);
const END_ENTITIES = new Set([
    "minecraft:enderman",
    "minecraft:endermite",
    "minecraft:shulker",
    "minecraft:ender_dragon",
]);
const FIRE_DAMAGE_TYPES = new Set(["fire", "fire_tick", "lava", "magma"]);
const KINETIC_DAMAGE_TYPES = new Set(["fall", "fly_into_wall", "ram_attack"]);
const MANSION_WARD_TYPES = new Set(["magic", "sonic_boom", "wither"]);

const ravagerStates = new Map();
const spiderCooldowns = new Map();
const hungerCooldowns = new Map();
const ghastCooldowns = new Map();
const trialStreaks = new Map();
const sculkCooldowns = new Map();
const endOrbCooldowns = new Map();

function currentTick() {
    return Number(system.currentTick ?? 0) || 0;
}

function hasTrinket(player, itemId) {
    return player?.typeId === "minecraft:player" && player.hasTag?.(itemId);
}

function getHealth(entity) {
    try {
        return entity?.getComponent?.("minecraft:health") ?? entity?.getComponent?.("health") ?? null;
    } catch {
        return null;
    }
}

function restoreHunger(player, amount) {
    try {
        const hunger = player.getComponent("minecraft:player.hunger")
            ?? player.getComponent("player.hunger");
        if (!hunger) return false;
        const current = Number(hunger.currentValue ?? 0) || 0;
        const maximum = Number(hunger.effectiveMax ?? 20) || 20;
        if (current >= maximum) return false;
        return hunger.setCurrentValue(Math.min(maximum, current + amount)) !== false;
    } catch {
        return false;
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

function isUndead(entity) {
    try {
        return entity?.getComponent?.("minecraft:type_family")?.hasTypeFamily?.("undead") === true
            || entity?.getComponent?.("type_family")?.hasTypeFamily?.("undead") === true;
    } catch {
        return false;
    }
}

registerTrinketSampler("dorios:relic_charge", 5, (player) => {
    if (!hasTrinket(player, ITEMS.ravagerBuckle)) {
        ravagerStates.delete(player.id);
        return;
    }

    const tick = currentTick();
    const state = ravagerStates.get(player.id) ?? {
        sprintTicks: 0,
        chargedUntil: 0,
        cooldownUntil: 0,
    };
    if (state.cooldownUntil > tick) {
        state.sprintTicks = 0;
    } else if (player.isSprinting) {
        state.sprintTicks = Math.min(30, state.sprintTicks + 5);
        if (state.sprintTicks >= 30) {
            state.chargedUntil = tick + 60;
            state.sprintTicks = 0;
        }
    } else {
        state.sprintTicks = Math.max(0, state.sprintTicks - 10);
    }
    ravagerStates.set(player.id, state);
});

registerCombatModifierProvider("dorios:rare_relics", ({ event, attacker, target }) => {
    if (attacker?.typeId !== "minecraft:player" || !target) return null;
    const damageType = getEventDamageType(event);
    let damageMultiplier = 1;

    if (damageType === "entity_attack" && hasTrinket(attacker, ITEMS.ravagerBuckle)) {
        const state = ravagerStates.get(attacker.id);
        const tick = currentTick();
        if (state?.chargedUntil >= tick && state.cooldownUntil <= tick) {
            damageMultiplier *= 1.20;
            state.chargedUntil = 0;
            state.cooldownUntil = tick + 120;
            const source = { ...attacker.location };
            const destination = { ...target.location };
            system.run(() => {
                try {
                    if (!target.isValid) return;
                    const dx = destination.x - source.x;
                    const dz = destination.z - source.z;
                    const magnitude = Math.hypot(dx, dz) || 1;
                    target.applyKnockback?.({ x: dx / magnitude, z: dz / magnitude }, 0.5);
                } catch { }
            });
        }
    }

    if (damageType === "entity_attack" && hasTrinket(attacker, ITEMS.hoglinGauntlet)) {
        const health = getHealth(target);
        const current = Number(health?.currentValue ?? 0);
        const maximum = Number(health?.effectiveMax ?? 0);
        if (maximum > 0 && current / maximum >= 0.8) damageMultiplier *= 1.15;
    }

    if (hasTrinket(attacker, ITEMS.strongholdEye) && END_ENTITIES.has(target.typeId)) {
        damageMultiplier *= 1.12;
    }

    return damageMultiplier === 1 ? null : { damageMultiplier };
}, { priority: 150 });

world.beforeEvents?.entityHurt?.subscribe?.((event) => {
    try {
        if (event.cancel === true) return;
        const player = getEntityHurtTarget(event);
        if (player?.typeId !== "minecraft:player") return;
        const damageType = getEventDamageType(event);

        if (hasTrinket(player, ITEMS.goatstep) && KINETIC_DAMAGE_TYPES.has(damageType)) {
            event.damage = Math.max(0, Number(event.damage ?? 0) * 0.65);
        }

        if (hasTrinket(player, ITEMS.mansionWard) && MANSION_WARD_TYPES.has(damageType)) {
            event.damage = Math.max(0, Number(event.damage ?? 0) * 0.80);
        }

        if (hasTrinket(player, ITEMS.ghastLocket)
            && FIRE_DAMAGE_TYPES.has(damageType)
            && Number(ghastCooldowns.get(player.id) ?? 0) <= currentTick()) {
            event.damage = Math.max(0, Number(event.damage ?? 0) * 0.75);
            ghastCooldowns.set(player.id, currentTick() + 300);
            system.run(() => {
                try {
                    if (!player.isValid || !hasTrinket(player, ITEMS.ghastLocket)) return;
                    player.extinguishFire?.(true);
                    applyUniversalTrinketEffect(player, "minecraft:regeneration", 0, true);
                } catch { }
            });
        }

        if (damageType === "entity_attack"
            && hasTrinket(player, ITEMS.spiderMantle)
            && Number(spiderCooldowns.get(player.id) ?? 0) <= currentTick()) {
            const attacker = getEntityHurtAttacker(event);
            if (attacker?.isValid) {
                spiderCooldowns.set(player.id, currentTick() + 100);
                system.run(() => {
                    try {
                        if (attacker.isValid) {
                            applyUniversalTrinketEffect(attacker, "minecraft:slowness", 1, true);
                        }
                    } catch { }
                });
            }
        }
    } catch (error) {
        console.warn("[Dorios Trinkets] rare relic defense failed:", error);
    }
});

world.afterEvents.entityDie.subscribe((event) => {
    try {
        const player = getEntityHurtAttacker(event);
        const dead = event?.deadEntity;
        if (player?.typeId !== "minecraft:player" || !dead) return;
        const tick = currentTick();

        if (hasTrinket(player, ITEMS.huskMask)
            && isUndead(dead)
            && Number(hungerCooldowns.get(player.id) ?? 0) <= tick
            && restoreHunger(player, 1)) {
            hungerCooldowns.set(player.id, tick + 40);
        }

        if (hasTrinket(player, ITEMS.trialCrown)
            && OFFENSIVE_CATEGORIES.has(getEntityCategory(dead))) {
            const previous = trialStreaks.get(player.id);
            const count = previous?.expiresAt >= tick ? previous.count + 1 : 1;
            if (count >= 3) {
                trialStreaks.delete(player.id);
                applyUniversalTrinketEffect(player, "minecraft:strength", 0, true);
                applyUniversalTrinketEffect(player, "minecraft:resistance", 0, true);
            } else {
                trialStreaks.set(player.id, { count, expiresAt: tick + 200 });
            }
        }

        if (hasTrinket(player, ITEMS.endCityOrb)
            && END_ENTITIES.has(dead.typeId)
            && Number(endOrbCooldowns.get(player.id) ?? 0) <= tick
            && restoreMana(player, 8)) {
            endOrbCooldowns.set(player.id, tick + 60);
        }
    } catch (error) {
        console.warn("[Dorios Trinkets] rare relic kill reaction failed:", error);
    }
});

world.afterEvents.entityHurt.subscribe((event) => {
    try {
        const player = getEntityHurtTarget(event);
        if (!hasTrinket(player, ITEMS.sculkResonator)
            || Number(sculkCooldowns.get(player.id) ?? 0) > currentTick()) return;

        const health = getHealth(player);
        const current = Number(health?.currentValue ?? 0);
        const maximum = Number(health?.effectiveMax ?? 0);
        const previous = Math.min(maximum, current + Math.max(0, Number(event?.damage ?? 0)));
        if (maximum <= 0 || previous / maximum <= 0.3 || current / maximum > 0.3) return;

        sculkCooldowns.set(player.id, currentTick() + 400);
        const targets = player.dimension.getEntities({
            location: player.location,
            maxDistance: 6,
            closest: 6,
        });
        for (const target of targets) {
            if (target.id === player.id || !OFFENSIVE_CATEGORIES.has(getEntityCategory(target))) continue;
            try {
                target.applyDamage(4, { cause: "sonicBoom", damagingEntity: player });
            } catch { }
        }
        player.playSound?.("mob.warden.sonic_boom", { volume: 0.6, pitch: 1.3 });
    } catch (error) {
        console.warn("[Dorios Trinkets] Sculk Resonator failed:", error);
    }
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    ravagerStates.delete(playerId);
    spiderCooldowns.delete(playerId);
    hungerCooldowns.delete(playerId);
    ghastCooldowns.delete(playerId);
    trialStreaks.delete(playerId);
    sculkCooldowns.delete(playerId);
    endOrbCooldowns.delete(playerId);
});
