import { system, world } from "@minecraft/server";
import { registerCombatModifierProvider } from "../StatsCore/API.js";
import { applyUniversalTrinketEffect } from "./update_stats.js";
import {
    getEntityHurtAttacker,
    getEntityHurtTarget,
    getEventDamageType,
} from "../StatsCore/shared/damage.js";

const HATS = Object.freeze({
    beekeeper: "dorios:beekeepers_hat",
    lastLight: "dorios:crown_of_last_light",
    stormcaller: "dorios:stormcaller_hood",
});

const LAST_LIGHT_COOLDOWN_TICKS = 2400;
const STORM_PROJECTILE_MULTIPLIER = 1.12;
const lastLightCooldowns = new Map();
const lastLightGuards = new Map();
const weatherCache = new Map();

function currentTick() {
    return Number(system.currentTick ?? 0) || 0;
}

function hasHat(player, hatId) {
    return player?.typeId === "minecraft:player" && player.hasTag?.(hatId);
}

function normalizedDimensionId(value) {
    return String(value?.id ?? value ?? "").replace(/^minecraft:/, "").toLowerCase();
}

function getWeatherProperty(dimensionId) {
    return `dorios:weather_${normalizedDimensionId(dimensionId)}`;
}

function isThunder(dimension) {
    const id = normalizedDimensionId(dimension);
    if (weatherCache.has(id)) return weatherCache.get(id) === "Thunder";

    try {
        const saved = String(world.getDynamicProperty(getWeatherProperty(id)) ?? "Clear");
        weatherCache.set(id, saved);
        return saved === "Thunder";
    } catch {
        return false;
    }
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

registerCombatModifierProvider("dorios:hat_trinkets", ({ event, attacker }) => {
    if (!hasHat(attacker, HATS.stormcaller)) return null;
    if (getEventDamageType(event) !== "projectile") return null;
    if (!isThunder(attacker.dimension)) return null;
    return { damageMultiplier: STORM_PROJECTILE_MULTIPLIER };
}, { priority: 120 });

world.beforeEvents.entityHurt.subscribe((event) => {
    try {
        if (event.cancel === true) return;
        const player = getEntityHurtTarget(event);
        if (player?.typeId !== "minecraft:player") return;

        const attacker = getEntityHurtAttacker(event);
        if (hasHat(player, HATS.beekeeper) && attacker?.typeId === "minecraft:bee") {
            event.damage = Math.max(0, Number(event.damage ?? 0) * 0.5);
        }

        if (!hasHat(player, HATS.lastLight)) return;
        if (Number(lastLightGuards.get(player.id) ?? 0) >= currentTick()) {
            event.cancel = true;
            return;
        }
        if (Number(lastLightCooldowns.get(player.id) ?? 0) > currentTick()) return;

        const health = getHealth(player);
        const currentHealth = Number(health?.currentValue ?? 0);
        const incomingDamage = Number(event.damage ?? 0);
        if (currentHealth <= 0 || incomingDamage < currentHealth) return;

        if (currentHealth <= 1) event.cancel = true;
        else event.damage = currentHealth - 1;
        lastLightGuards.set(player.id, currentTick() + 2);
        lastLightCooldowns.set(player.id, currentTick() + LAST_LIGHT_COOLDOWN_TICKS);
        system.runTimeout(() => lastLightGuards.delete(player.id), 3);
        system.run(() => {
            try {
                if (!player.isValid || !player.hasTag(HATS.lastLight)) return;
                applyUniversalTrinketEffect(player, "minecraft:resistance", 1, true);
                applyUniversalTrinketEffect(player, "minecraft:weakness", 0, true);
                player.playSound?.("random.totem", { volume: 0.75, pitch: 1.25 });
            } catch { }
        });
    } catch (error) {
        console.warn("[Dorios Trinkets] Hat damage reaction failed:", error);
    }
});

world.afterEvents.itemCompleteUse?.subscribe?.((event) => {
    try {
        const player = event?.source;
        if (!hasHat(player, HATS.beekeeper)) return;
        if (event?.itemStack?.typeId !== "minecraft:honey_bottle") return;
        restoreHunger(player, 2);
    } catch (error) {
        console.warn("[Dorios Trinkets] Beekeeper honey bonus failed:", error);
    }
});

world.afterEvents.weatherChange?.subscribe?.((event) => {
    const id = normalizedDimensionId(event?.dimension);
    const weather = String(event?.newWeather ?? "Clear");
    if (!id) return;
    weatherCache.set(id, weather);
    try { world.setDynamicProperty(getWeatherProperty(id), weather); } catch { }
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    lastLightCooldowns.delete(playerId);
    lastLightGuards.delete(playerId);
});
