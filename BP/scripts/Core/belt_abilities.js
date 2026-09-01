import { ItemStack, system, world } from "@minecraft/server";
import { getStatCategory } from "./stats_manager.js";
import { repairItemDurability } from "../StatsCore/shared/durability.js";
import {
    OFFENSIVE_ENTITY_CATEGORIES,
    getEntityCategory,
} from "../StatsCore/shared/entityCategories.js";

const BELTS = Object.freeze({
    miner: "dorios:miners_tool_belt",
    bloodbound: "dorios:bloodbound_sash",
    toolwright: "dorios:toolwright_belt",
    soulcatcher: "dorios:soulcatcher_belt",
    hunter: "dorios:hunters_bandolier",
    builder: "dorios:builders_harness",
});

const TOOLWRIGHT_BLOCKS = 12;
const BUILDER_PLACEMENTS = 12;
const HUNTER_ARROW_RECOVERY_CHANCE = 0.20;
const SOULCATCHER_COOLDOWN_TICKS = 60;
const BLOODBOUND_COOLDOWN_TICKS = 40;
const OFFENSIVE_CATEGORIES = new Set(OFFENSIVE_ENTITY_CATEGORIES);
const soulcatcherCooldowns = new Map();
const bloodboundCooldowns = new Map();

const SIMPLE_BUILDER_BLOCKS = new Set([
    "minecraft:blackstone",
    "minecraft:bricks",
    "minecraft:calcite",
    "minecraft:clay",
    "minecraft:coarse_dirt",
    "minecraft:cobbled_deepslate",
    "minecraft:cobblestone",
    "minecraft:deepslate",
    "minecraft:dirt",
    "minecraft:end_stone",
    "minecraft:glass",
    "minecraft:grass_block",
    "minecraft:gravel",
    "minecraft:mud",
    "minecraft:netherrack",
    "minecraft:packed_mud",
    "minecraft:red_sand",
    "minecraft:sand",
    "minecraft:smooth_stone",
    "minecraft:stone",
    "minecraft:tuff",
]);

function isSurvivalPlayer(player) {
    try {
        return player?.getGameMode?.() === "Survival";
    } catch {
        return true;
    }
}

function isRecognizedTool(stack) {
    const id = String(stack?.typeId ?? "");
    return id === "minecraft:shears"
        || /_(pickaxe|axe|shovel|hoe)$/.test(id);
}

function getDurabilityDamage(stack) {
    try {
        const durability = stack?.getComponent?.("minecraft:durability")
            ?? stack?.getComponent?.("durability");
        const damage = Number(durability?.damage);
        return Number.isFinite(damage) ? Math.max(0, damage) : null;
    } catch {
        return null;
    }
}

function repairSelectedTool(player, expectedTypeId, amount = 1) {
    try {
        const inventory = player.getComponent("minecraft:inventory")?.container
            ?? player.getComponent("inventory")?.container;
        const slot = player.selectedSlotIndex;
        const stack = inventory?.getItem(slot);
        if (!stack || stack.typeId !== expectedTypeId) return false;
        if (!repairItemDurability(stack, amount)) return false;
        inventory.setItem(slot, stack);
        return true;
    } catch {
        return false;
    }
}

function incrementCounter(player, propertyId, threshold) {
    const current = Math.max(0, Math.floor(Number(player.getDynamicProperty(propertyId) ?? 0) || 0));
    const next = current + 1;
    if (next < threshold) {
        player.setDynamicProperty(propertyId, next);
        return false;
    }
    player.setDynamicProperty(propertyId, 0);
    return true;
}

function giveItem(player, itemId, amount = 1) {
    try {
        const inventory = player.getComponent("minecraft:inventory")?.container
            ?? player.getComponent("inventory")?.container;
        const stack = new ItemStack(itemId, amount);
        const remainder = inventory?.addItem(stack);
        if (remainder) player.dimension.spawnItem(remainder, player.location);
        else if (!inventory) player.dimension.spawnItem(stack, player.location);
        return true;
    } catch {
        return false;
    }
}

function isSimpleBuilderBlock(typeId) {
    if (!typeId?.startsWith("minecraft:")) return false;
    if (SIMPLE_BUILDER_BLOCKS.has(typeId)) return true;
    return /_(concrete|planks|log|terracotta|wood|wool)$/.test(typeId);
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

function restoreHunger(player, amount) {
    try {
        const hunger = player.getComponent("minecraft:player.hunger")
            ?? player.getComponent("player.hunger");
        if (!hunger) return false;

        const current = Number(hunger.currentValue ?? 0) || 0;
        const maximum = Number(hunger.effectiveMax ?? 20) || 20;
        const next = Math.min(maximum, current + amount);
        if (next <= current) return false;
        return hunger.setCurrentValue(next) !== false;
    } catch {
        return false;
    }
}

world.afterEvents.playerBreakBlock.subscribe((event) => {
    try {
        const player = event.player;
        const toolBefore = event.itemStackBeforeBreak;
        const toolAfter = event.itemStackAfterBreak;
        if (!player || !isSurvivalPlayer(player) || !isRecognizedTool(toolBefore)) return;

        const expectedTypeId = toolBefore.typeId;
        if (player.hasTag(BELTS.miner)) {
            const beforeDamage = getDurabilityDamage(toolBefore);
            const afterDamage = getDurabilityDamage(toolAfter);
            const preserveChance = Math.max(
                3,
                Number(getStatCategory(player, "stats")?.durabilityPreserve ?? 0) || 0,
            ) / 100;
            if (beforeDamage !== null
                && afterDamage !== null
                && afterDamage > beforeDamage
                && Math.random() <= preserveChance) {
                repairSelectedTool(player, expectedTypeId, afterDamage - beforeDamage);
            }
        }

        if (player.hasTag(BELTS.toolwright)
            && incrementCounter(player, "dorios:toolwright_blocks", TOOLWRIGHT_BLOCKS)) {
            repairSelectedTool(player, expectedTypeId, 1);
        }
    } catch (error) {
        console.warn("[Dorios Trinkets] Belt block-break reaction failed:", error);
    }
});

world.afterEvents.entityDie.subscribe((event) => {
    try {
        const player = event?.damageSource?.damagingEntity;
        const deadEntity = event?.deadEntity;
        if (player?.typeId !== "minecraft:player") return;
        if (!deadEntity || !OFFENSIVE_CATEGORIES.has(getEntityCategory(deadEntity))) return;

        const now = Number(system.currentTick ?? 0) || 0;
        if (player.hasTag(BELTS.soulcatcher)
            && Number(soulcatcherCooldowns.get(player.id) ?? 0) <= now
            && restoreMana(player, 8)) {
            soulcatcherCooldowns.set(player.id, now + SOULCATCHER_COOLDOWN_TICKS);
        }
        if (player.hasTag(BELTS.bloodbound)
            && Number(bloodboundCooldowns.get(player.id) ?? 0) <= now
            && restoreHunger(player, 1)) {
            bloodboundCooldowns.set(player.id, now + BLOODBOUND_COOLDOWN_TICKS);
        }
    } catch (error) {
        console.warn("[Dorios Trinkets] Belt kill reaction failed:", error);
    }
});

world.afterEvents.projectileHitEntity.subscribe((event) => {
    try {
        const player = event?.source;
        if (player?.typeId !== "minecraft:player" || !player.hasTag(BELTS.hunter)) return;
        if (event?.projectile?.typeId !== "minecraft:arrow") return;
        if (Math.random() <= HUNTER_ARROW_RECOVERY_CHANCE) giveItem(player, "minecraft:arrow");
    } catch (error) {
        console.warn("[Dorios Trinkets] Hunter's Bandolier failed:", error);
    }
});

world.afterEvents.playerPlaceBlock.subscribe((event) => {
    try {
        const player = event.player;
        const blockId = event.block?.typeId;
        if (!player?.hasTag(BELTS.builder) || !isSurvivalPlayer(player)) return;
        if (!isSimpleBuilderBlock(blockId)) return;
        if (!incrementCounter(player, "dorios:builder_placements", BUILDER_PLACEMENTS)) return;
        giveItem(player, blockId);
    } catch (error) {
        console.warn("[Dorios Trinkets] Builder's Harness failed:", error);
    }
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    soulcatcherCooldowns.delete(playerId);
    bloodboundCooldowns.delete(playerId);
});
