import { ItemStack, system, world } from "@minecraft/server";
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

const TALISMANS = Object.freeze({
    wardstone: "dorios:wardstone",
    hunter: "dorios:hunters_fang",
    quarry: "dorios:quarry_sigil",
    momentum: "dorios:totem_of_momentum",
    wayfinder: "dorios:wayfinder_compass",
    stormglass: "dorios:stormglass_talisman",
    harvester: "dorios:harvesters_token",
});
const OFFENSIVE_CATEGORIES = new Set(OFFENSIVE_ENTITY_CATEGORIES);
const momentum = new Map();

const ORE_BONUS_ITEMS = Object.freeze({
    "minecraft:coal_ore": "minecraft:coal",
    "minecraft:deepslate_coal_ore": "minecraft:coal",
    "minecraft:copper_ore": "minecraft:raw_copper",
    "minecraft:deepslate_copper_ore": "minecraft:raw_copper",
    "minecraft:diamond_ore": "minecraft:diamond",
    "minecraft:deepslate_diamond_ore": "minecraft:diamond",
    "minecraft:emerald_ore": "minecraft:emerald",
    "minecraft:deepslate_emerald_ore": "minecraft:emerald",
    "minecraft:gold_ore": "minecraft:raw_gold",
    "minecraft:deepslate_gold_ore": "minecraft:raw_gold",
    "minecraft:iron_ore": "minecraft:raw_iron",
    "minecraft:deepslate_iron_ore": "minecraft:raw_iron",
    "minecraft:lapis_ore": "minecraft:lapis_lazuli",
    "minecraft:deepslate_lapis_ore": "minecraft:lapis_lazuli",
    "minecraft:nether_gold_ore": "minecraft:gold_nugget",
    "minecraft:nether_quartz_ore": "minecraft:quartz",
    "minecraft:redstone_ore": "minecraft:redstone",
    "minecraft:deepslate_redstone_ore": "minecraft:redstone",
});
const CROPS = Object.freeze({
    "minecraft:beetroot": { state: "growth", mature: 7, item: "minecraft:beetroot_seeds" },
    "minecraft:carrots": { state: "growth", mature: 7, item: "minecraft:carrot" },
    "minecraft:potatoes": { state: "growth", mature: 7, item: "minecraft:potato" },
    "minecraft:wheat": { state: "growth", mature: 7, item: "minecraft:wheat_seeds" },
});

function currentTick() {
    return Number(system.currentTick ?? 0) || 0;
}

function hasTalisman(player, itemId) {
    return player?.typeId === "minecraft:player" && player.hasTag?.(itemId);
}

function weatherFor(player) {
    try {
        const id = String(player.dimension?.id ?? "overworld").replace(/^minecraft:/, "");
        return String(world.getDynamicProperty(`dorios:weather_${id}`) ?? "Clear");
    } catch {
        return "Clear";
    }
}

function giveAt(player, itemId, location) {
    try {
        player.dimension.spawnItem(new ItemStack(itemId), location ?? player.location);
        return true;
    } catch {
        return false;
    }
}

registerCombatModifierProvider("dorios:talisman_trinkets", ({ event, attacker, target }) => {
    if (attacker?.typeId !== "minecraft:player" || !target) return null;
    let multiplier = 1;

    if (hasTalisman(attacker, TALISMANS.hunter)
        && OFFENSIVE_CATEGORIES.has(getEntityCategory(target))) {
        multiplier *= 1.08;
    }

    const momentumState = momentum.get(attacker.id);
    if (hasTalisman(attacker, TALISMANS.momentum)
        && momentumState?.expiresAt >= currentTick()
        && momentumState.targetId === target.id) {
        multiplier *= 1 + Math.min(5, momentumState.stacks) * 0.02;
    }

    if (hasTalisman(attacker, TALISMANS.stormglass)
        && getEventDamageType(event) === "projectile"
        && weatherFor(attacker) !== "Clear") {
        multiplier *= 1.10;
    }

    return multiplier === 1 ? null : { damageMultiplier: multiplier };
}, { priority: 130 });

world.beforeEvents?.entityHurt?.subscribe?.((event) => {
    try {
        if (event.cancel === true) return;
        const player = getEntityHurtTarget(event);
        if (!hasTalisman(player, TALISMANS.wardstone)) return;
        const damageType = getEventDamageType(event);
        if (damageType !== "block_explosion" && damageType !== "entity_explosion") return;
        event.damage = Math.max(0, Number(event.damage ?? 0) * 0.85);
    } catch (error) {
        console.warn("[Dorios Trinkets] Wardstone failed:", error);
    }
});

world.afterEvents.entityHurt.subscribe((event) => {
    try {
        const attacker = getEntityHurtAttacker(event);
        const target = getEntityHurtTarget(event);
        if (!hasTalisman(attacker, TALISMANS.momentum) || !target?.isValid) return;
        const damageType = getEventDamageType(event);
        if (damageType !== "entity_attack" && damageType !== "projectile") return;

        const previous = momentum.get(attacker.id);
        const sameTarget = previous?.targetId === target.id && previous.expiresAt >= currentTick();
        momentum.set(attacker.id, {
            targetId: target.id,
            stacks: sameTarget ? Math.min(5, previous.stacks + 1) : 1,
            expiresAt: currentTick() + 60,
        });
    } catch (error) {
        console.warn("[Dorios Trinkets] Momentum tracking failed:", error);
    }
});

world.afterEvents.playerDimensionChange?.subscribe?.(({ player }) => {
    try {
        if (!hasTalisman(player, TALISMANS.wayfinder)) return;
        applyUniversalTrinketEffect(player, "minecraft:speed", 0, true);
        applyUniversalTrinketEffect(player, "minecraft:resistance", 0, true);
    } catch (error) {
        console.warn("[Dorios Trinkets] Wayfinder Compass failed:", error);
    }
});

world.afterEvents.playerBreakBlock.subscribe((event) => {
    try {
        const player = event?.player;
        const permutation = event?.brokenBlockPermutation;
        const typeId = permutation?.type?.id ?? permutation?.typeId ?? "";
        if (player?.getGameMode?.() !== "Survival") return;

        if (hasTalisman(player, TALISMANS.quarry)) {
            const bonusItem = ORE_BONUS_ITEMS[typeId];
            if (bonusItem && Math.random() <= 0.08) {
                giveAt(player, bonusItem, event.block?.location ?? player.location);
            }
        }

        if (hasTalisman(player, TALISMANS.harvester)) {
            const crop = CROPS[typeId];
            const age = crop ? Number(permutation?.getState?.(crop.state) ?? -1) : -1;
            if (crop && age >= crop.mature && Math.random() <= 0.25) {
                giveAt(player, crop.item, event.block?.location ?? player.location);
            }
        }
    } catch (error) {
        console.warn("[Dorios Trinkets] Talisman harvest reaction failed:", error);
    }
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    momentum.delete(playerId);
});
