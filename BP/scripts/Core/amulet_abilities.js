import { system, world } from "@minecraft/server";
import { getStatCategory, updatePlayerStats } from "./stats_manager.js";
import { registerTrinketSampler } from "./trinket_sampler.js";
import {
    getEntityHurtAttacker,
    getEntityHurtTarget,
    getEventDamageType,
} from "../StatsCore/shared/damage.js";
import {
    OFFENSIVE_ENTITY_CATEGORIES,
    getEntityCategory,
} from "../StatsCore/shared/entityCategories.js";

const AMULETS = Object.freeze({
    prismatic: "dorios:prismatic_aegis",
    moonstone: "dorios:moonstone_amulet",
    sunstone: "dorios:sunstone_amulet",
    echoheart: "dorios:echoheart_amulet",
    gravekeeper: "dorios:gravekeeper_amulet",
    tempest: "dorios:tempest_heart_amulet",
});
const MOONSTONE_TAG = "dorios:moonstone_active_tag";
const SUNSTONE_TAG = "dorios:sunstone_active_tag";
const PRISMATIC_TYPES = new Set([
    "fire",
    "fire_tick",
    "freezing",
    "lava",
    "lightning",
    "magic",
    "magma",
]);
const OFFENSIVE_CATEGORIES = new Set(OFFENSIVE_ENTITY_CATEGORIES);
const graveCooldowns = new Map();
const tempestCooldowns = new Map();

function currentTick() {
    return Number(system.currentTick ?? 0) || 0;
}

function hasAmulet(player, itemId) {
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

function weatherFor(player) {
    try {
        const id = String(player.dimension?.id ?? "overworld").replace(/^minecraft:/, "");
        return String(world.getDynamicProperty(`dorios:weather_${id}`) ?? "Clear");
    } catch {
        return "Clear";
    }
}

function isNight() {
    try {
        const time = Number(world.getTimeOfDay?.() ?? 0) || 0;
        return time >= 12500 && time <= 23500;
    } catch {
        return false;
    }
}

function hasOpenSky(player) {
    try {
        if (!String(player.dimension?.id ?? "").includes("overworld")) return false;
        const top = player.dimension.getTopmostBlock?.({
            x: Math.floor(player.location.x),
            z: Math.floor(player.location.z),
        });
        return !top || Number(top.location?.y ?? -999) <= Math.floor(player.location.y);
    } catch {
        return true;
    }
}

function restoreMana(player, amount) {
    try {
        const objective = world.scoreboard.getObjective("dorios:mana");
        const identity = player.scoreboardIdentity;
        if (!objective || !identity) return false;
        const maximum = Math.max(0, Number(getStatCategory(player, "stats")?.mana ?? 0) || 0);
        const current = Math.max(0, Number(objective.getScore(identity) ?? 0) || 0);
        const next = Math.min(maximum, current + Math.max(0, amount));
        if (next <= current) return false;
        objective.setScore(identity, next);
        return true;
    } catch {
        return false;
    }
}

function graveSouls(player) {
    const expiresAt = Number(player.getDynamicProperty("dorios:gravekeeper_souls_expiry") ?? 0) || 0;
    if (expiresAt > 0 && expiresAt <= currentTick()) {
        player.setDynamicProperty("dorios:gravekeeper_souls", 0);
        player.setDynamicProperty("dorios:gravekeeper_souls_expiry", 0);
        return 0;
    }
    return Math.max(0, Math.min(3,
        Math.floor(Number(player.getDynamicProperty("dorios:gravekeeper_souls") ?? 0) || 0)));
}

registerTrinketSampler("dorios:amulets", 20, (player) => {
    setAuxTag(player, MOONSTONE_TAG, hasAmulet(player, AMULETS.moonstone) && isNight());
    setAuxTag(
        player,
        SUNSTONE_TAG,
        hasAmulet(player, AMULETS.sunstone) && !isNight() && hasOpenSky(player),
    );
});

world.beforeEvents?.entityHurt?.subscribe?.((event) => {
    try {
        if (event.cancel === true) return;
        const player = getEntityHurtTarget(event);
        if (!hasAmulet(player, AMULETS.prismatic)) return;
        if (!PRISMATIC_TYPES.has(getEventDamageType(event))) return;
        event.damage = Math.max(0, Number(event.damage ?? 0) * 0.92);
    } catch (error) {
        console.warn("[Dorios Trinkets] Prismatic Aegis failed:", error);
    }
});

world.afterEvents.entityHealthChanged?.subscribe?.((event) => {
    try {
        const player = event?.entity;
        if (!hasAmulet(player, AMULETS.echoheart)) return;
        const healed = Number(event?.newValue ?? 0) - Number(event?.oldValue ?? 0);
        if (healed > 0) restoreMana(player, Math.min(6, healed * 0.3));
    } catch (error) {
        console.warn("[Dorios Trinkets] Echoheart conversion failed:", error);
    }
});

world.afterEvents.entityDie.subscribe((event) => {
    try {
        const player = getEntityHurtAttacker(event);
        const deadEntity = event?.deadEntity;
        if (!hasAmulet(player, AMULETS.gravekeeper) || !deadEntity) return;
        if (!OFFENSIVE_CATEGORIES.has(getEntityCategory(deadEntity))) return;
        const current = graveSouls(player);
        if (current < 3) {
            player.setDynamicProperty("dorios:gravekeeper_souls", current + 1);
            player.setDynamicProperty("dorios:gravekeeper_souls_expiry", currentTick() + 12000);
        }
    } catch (error) {
        console.warn("[Dorios Trinkets] Gravekeeper soul capture failed:", error);
    }
});

world.afterEvents.entityHurt.subscribe((event) => {
    try {
        const player = getEntityHurtTarget(event);
        const attacker = getEntityHurtAttacker(event);

        if (player?.typeId === "minecraft:player"
            && hasAmulet(player, AMULETS.gravekeeper)
            && Number(graveCooldowns.get(player.id) ?? 0) <= currentTick()) {
            const health = getHealth(player);
            const current = Number(health?.currentValue ?? 0);
            const maximum = Number(health?.effectiveMax ?? health?.defaultValue ?? 0);
            const previous = Math.min(maximum, current + Math.max(0, Number(event?.damage ?? 0)));
            if (maximum > 0 && previous / maximum > 0.3 && current / maximum <= 0.3) {
                const souls = graveSouls(player);
                if (souls > 0) {
                    player.setDynamicProperty("dorios:gravekeeper_souls", souls - 1);
                    if (souls === 1) {
                        player.setDynamicProperty("dorios:gravekeeper_souls_expiry", 0);
                    }
                    health?.setCurrentValue?.(Math.min(maximum, current + 6));
                    graveCooldowns.set(player.id, currentTick() + 20);
                    player.playSound?.("random.soul", { volume: 0.65, pitch: 0.85 });
                }
            }
        }

        if (player?.typeId === "minecraft:player"
            && attacker?.isValid
            && attacker.id !== player.id
            && hasAmulet(player, AMULETS.tempest)
            && weatherFor(player) !== "Clear"
            && Number(tempestCooldowns.get(player.id) ?? 0) <= currentTick()) {
            tempestCooldowns.set(player.id, currentTick() + 100);
            attacker.applyDamage(3, { cause: "lightning", damagingEntity: player });
            player.dimension.spawnParticle?.("minecraft:electric_spark_particle", attacker.location);
        }

        if (attacker?.typeId === "minecraft:player"
            && attacker.hasTag(SUNSTONE_TAG)
            && Math.random() <= 0.15) {
            player?.setOnFire?.(3);
        }
    } catch (error) {
        console.warn("[Dorios Trinkets] Amulet hurt reaction failed:", error);
    }
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    graveCooldowns.delete(playerId);
    tempestCooldowns.delete(playerId);
});
