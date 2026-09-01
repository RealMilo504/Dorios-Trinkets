import { system, world } from "@minecraft/server";
import { getEntityHurtTarget, getEventDamageType } from "../StatsCore/shared/damage.js";
import { updatePlayerStats } from "./stats_manager.js";
import { registerTrinketSampler } from "./trinket_sampler.js";

const FEET = Object.freeze({
    featherstep: "dorios:featherstep_anklets",
    sandstrider: "dorios:sandstrider_boots",
    rootwalker: "dorios:rootwalker_sandals",
    frostwalker: "dorios:frostwalker_soles",
    shadowstep: "dorios:shadowstep_greaves",
    slimebound: "dorios:slimebound_boots",
});

const SAND_BONUS_TAG = "dorios:sandstrider_bonus_tag";
const ROOT_BONUS_TAG = "dorios:rootwalker_bonus_tag";
const SAND_BLOCKS = new Set([
    "minecraft:sand",
    "minecraft:red_sand",
    "minecraft:soul_sand",
]);
const ROOT_BLOCKS = new Set([
    "minecraft:grass_block",
    "minecraft:moss_block",
    "minecraft:mud",
    "minecraft:mycelium",
    "minecraft:podzol",
    "minecraft:rooted_dirt",
]);
const shadowStates = new Map();
const temporaryIce = new Map();

function currentTick() {
    return Number(system.currentTick ?? 0) || 0;
}

function hasFeet(player, itemId) {
    return player?.typeId === "minecraft:player" && player.hasTag?.(itemId);
}

function setAuxTag(player, tag, enabled) {
    const hasTag = player.hasTag(tag);
    if (enabled === hasTag) return;
    if (enabled) player.addTag(tag);
    else player.removeTag(tag);
    updatePlayerStats(player);
}

function blockBelow(player) {
    const location = player.location;
    return player.dimension.getBlock({
        x: Math.floor(location.x),
        y: Math.floor(location.y) - 1,
        z: Math.floor(location.z),
    });
}

function freezeWater(player) {
    if (!player.isOnGround) return;
    const center = {
        x: Math.floor(player.location.x),
        y: Math.floor(player.location.y) - 1,
        z: Math.floor(player.location.z),
    };
    const dimension = player.dimension;
    const dimensionId = String(dimension.id ?? "overworld");

    for (let x = center.x - 1; x <= center.x + 1; x++) {
        for (let z = center.z - 1; z <= center.z + 1; z++) {
            const position = { x, y: center.y, z };
            const block = dimension.getBlock(position);
            if (block?.typeId !== "minecraft:water") continue;

            const key = `${dimensionId}:${x}:${center.y}:${z}`;
            if (temporaryIce.has(key)) continue;
            const originalPermutation = block.permutation;
            temporaryIce.set(key, true);
            block.setType("minecraft:frosted_ice");

            system.runTimeout(() => {
                temporaryIce.delete(key);
                try {
                    const current = dimension.getBlock(position);
                    if (current?.typeId === "minecraft:frosted_ice") {
                        current.setPermutation(originalPermutation);
                    }
                } catch { }
            }, 80);
        }
    }
}

function sampleShadowstep(player) {
    const id = player.id;
    if (!hasFeet(player, FEET.shadowstep)) {
        shadowStates.delete(id);
        return;
    }

    const state = shadowStates.get(id) ?? {
        sprintTicks: 0,
        wasJumping: false,
        cooldownUntil: 0,
    };
    state.sprintTicks = player.isSprinting
        ? Math.min(60, state.sprintTicks + 5)
        : Math.max(0, state.sprintTicks - 10);

    const jumpEdge = player.isJumping && !state.wasJumping;
    if (jumpEdge && state.sprintTicks >= 30 && state.cooldownUntil <= currentTick()) {
        const view = player.getViewDirection?.() ?? { x: 0, z: 0 };
        const length = Math.hypot(view.x, view.z) || 1;
        player.applyKnockback?.({
            x: (view.x / length) * 1.2,
            z: (view.z / length) * 1.2,
        }, 0.15);
        player.playSound?.("mob.enderdragon.flap", { volume: 0.35, pitch: 1.4 });
        state.sprintTicks = 0;
        state.cooldownUntil = currentTick() + 60;
    }
    state.wasJumping = player.isJumping;
    shadowStates.set(id, state);
}

registerTrinketSampler("dorios:feet", 5, (player) => {
    const belowType = blockBelow(player)?.typeId ?? "";
    setAuxTag(
        player,
        SAND_BONUS_TAG,
        hasFeet(player, FEET.sandstrider) && SAND_BLOCKS.has(belowType),
    );
    setAuxTag(
        player,
        ROOT_BONUS_TAG,
        hasFeet(player, FEET.rootwalker) && ROOT_BLOCKS.has(belowType),
    );
    if (hasFeet(player, FEET.frostwalker)) freezeWater(player);
    sampleShadowstep(player);
});

world.beforeEvents?.entityHurt?.subscribe?.((event) => {
    try {
        if (event.cancel === true || getEventDamageType(event) !== "fall") return;
        const player = getEntityHurtTarget(event);
        if (player?.typeId !== "minecraft:player") return;

        if (hasFeet(player, FEET.featherstep)) {
            event.damage = Math.max(0, Number(event.damage ?? 0) * 0.5);
        } else if (hasFeet(player, FEET.slimebound)) {
            const incoming = Math.max(0, Number(event.damage ?? 0));
            event.damage = incoming * 0.35;
            if (incoming >= 4) {
                system.run(() => {
                    try {
                        if (!player.isValid || !hasFeet(player, FEET.slimebound)) return;
                        player.applyKnockback?.({ x: 0, z: 0 }, Math.min(1.1, 0.45 + incoming * 0.035));
                        player.playSound?.("mob.slime.jump", { volume: 0.6, pitch: 0.9 });
                    } catch { }
                });
            }
        }
    } catch (error) {
        console.warn("[Dorios Trinkets] Feet fall reaction failed:", error);
    }
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    shadowStates.delete(playerId);
});
