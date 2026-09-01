import { system, world } from "@minecraft/server";
import { registerCombatModifierProvider } from "../StatsCore/API.js";
import {
    getEntityHurtAttacker,
    getEntityHurtTarget,
    getEventDamageType,
} from "../StatsCore/shared/damage.js";

const FACES = Object.freeze({
    ember: "dorios:ember_respirator",
    prospector: "dorios:copper_prospecting_lens",
    echo: "dorios:echo_visor",
    mirror: "dorios:mirror_mask",
    veil: "dorios:veil_of_silence",
    ender: "dorios:ender_visor",
});

const FIRE_DAMAGE_TYPES = new Set(["fire", "fire_tick", "lava", "magma"]);
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

const ECHO_MARK_TICKS = 120;
const ECHO_RETURN_MULTIPLIER = 1.10;
const MIRROR_CLEANSE_CHANCE = 0.30;
const MIRROR_COOLDOWN_TICKS = 100;
const ENDER_CHARGE_TICKS = 600;
const ENDER_BONUS_DAMAGE = 4;
const PROSPECTING_ORES_PER_XP = 4;

const echoMarks = new Map();
const mirrorCooldowns = new Map();
const enderCharges = new Map();

function currentTick() {
    return Number(system.currentTick ?? 0) || 0;
}

function hasFace(player, faceId) {
    return player?.typeId === "minecraft:player" && player.hasTag?.(faceId);
}

function getEffectId(effect) {
    const raw = effect?.typeId ?? effect?.type?.id ?? effect?.effectType?.id ?? "";
    const id = String(raw).toLowerCase();
    return id && !id.includes(":") ? `minecraft:${id}` : id;
}

function isOre(typeId) {
    return typeId === "minecraft:ancient_debris"
        || typeId === "minecraft:nether_quartz_ore"
        || /_ore$/.test(String(typeId ?? ""));
}

function incrementProspectingCounter(player) {
    const property = "dorios:prospecting_ore_breaks";
    const current = Math.max(0, Math.floor(Number(player.getDynamicProperty(property) ?? 0) || 0));
    const next = current + 1;
    if (next < PROSPECTING_ORES_PER_XP) {
        player.setDynamicProperty(property, next);
        return false;
    }
    player.setDynamicProperty(property, 0);
    return true;
}

function playProcFeedback(player, sound, pitch = 1) {
    system.run(() => {
        try {
            if (player?.isValid) player.playSound?.(sound, { volume: 0.65, pitch });
        } catch { }
    });
}

registerCombatModifierProvider("dorios:face_trinkets", ({ event, attacker, target }) => {
    if (attacker?.typeId !== "minecraft:player" || getEventDamageType(event) !== "projectile") {
        return null;
    }

    let flatDamage = 0;
    let damageMultiplier = 1;

    const echoMark = echoMarks.get(attacker.id);
    if (echoMark) {
        if (echoMark.expiresAt < currentTick() || !hasFace(attacker, FACES.echo)) {
            echoMarks.delete(attacker.id);
        } else if (target?.id === echoMark.targetId) {
            echoMarks.delete(attacker.id);
            damageMultiplier *= ECHO_RETURN_MULTIPLIER;
            playProcFeedback(attacker, "random.orb", 0.75);
        }
    }

    const enderExpiry = Number(enderCharges.get(attacker.id) ?? 0);
    if (enderExpiry > 0) {
        if (enderExpiry < currentTick() || !hasFace(attacker, FACES.ender)) {
            enderCharges.delete(attacker.id);
        } else {
            enderCharges.delete(attacker.id);
            flatDamage += ENDER_BONUS_DAMAGE;
            playProcFeedback(attacker, "mob.endermen.portal", 1.25);
        }
    }

    if (flatDamage <= 0 && damageMultiplier === 1) return null;
    return { flatDamage, damageMultiplier };
}, { priority: 110 });

world.beforeEvents.entityHurt.subscribe((event) => {
    try {
        if (event.cancel === true) return;
        const target = getEntityHurtTarget(event);
        const attacker = getEntityHurtAttacker(event);
        const damageType = getEventDamageType(event);

        if (hasFace(target, FACES.ember) && FIRE_DAMAGE_TYPES.has(damageType)) {
            event.damage = Math.max(0, Number(event.damage ?? 0) * 0.7);
        }

        if (hasFace(target, FACES.echo)
            && damageType === "projectile"
            && attacker?.isValid
            && attacker.id !== target.id) {
            echoMarks.set(target.id, {
                targetId: attacker.id,
                expiresAt: currentTick() + ECHO_MARK_TICKS,
            });
        }
    } catch (error) {
        console.warn("[Dorios Trinkets] Face damage reaction failed:", error);
    }
});

world.afterEvents.effectAdd?.subscribe?.((event) => {
    try {
        const player = event?.entity;
        if (!hasFace(player, FACES.mirror)) return;

        const effectId = getEffectId(event?.effect);
        if (!NEGATIVE_EFFECTS.has(effectId)) return;

        const now = currentTick();
        if (Number(mirrorCooldowns.get(player.id) ?? 0) > now) return;
        if (Math.random() > MIRROR_CLEANSE_CHANCE) return;

        mirrorCooldowns.set(player.id, now + MIRROR_COOLDOWN_TICKS);
        system.run(() => {
            try {
                if (!player.isValid || !player.hasTag(FACES.mirror)) return;
                player.removeEffect(effectId);
                player.playSound?.("random.glass", { volume: 0.55, pitch: 1.35 });
            } catch { }
        });
    } catch (error) {
        console.warn("[Dorios Trinkets] Mirror Mask cleanse failed:", error);
    }
});

world.afterEvents.playerBreakBlock.subscribe((event) => {
    try {
        const player = event?.player;
        const blockId = event?.brokenBlockPermutation?.type?.id
            ?? event?.brokenBlockPermutation?.typeId
            ?? "";
        if (!hasFace(player, FACES.prospector) || !isOre(blockId)) return;
        if (player.getGameMode?.() !== "Survival") return;
        if (!incrementProspectingCounter(player)) return;

        player.addExperience(1);
        player.playSound?.("random.orb", { volume: 0.5, pitch: 1.4 });
    } catch (error) {
        console.warn("[Dorios Trinkets] Prospecting Lens failed:", error);
    }
});

world.afterEvents.playerDimensionChange?.subscribe?.(({ player }) => {
    if (!hasFace(player, FACES.ender)) return;
    enderCharges.set(player.id, currentTick() + ENDER_CHARGE_TICKS);
    try {
        player.playSound?.("mob.endermen.portal", { volume: 0.5, pitch: 0.8 });
    } catch { }
});

world.afterEvents.entityHurt.subscribe((event) => {
    try {
        const attacker = getEntityHurtAttacker(event);
        if (attacker?.typeId !== "minecraft:player") return;
        if (!attacker.hasTag("dorios:veil_silence_active_tag")) return;

        attacker.removeTag("dorios:veil_silence_active_tag");
        attacker.addTag("dorios:veil_silence_locked_tag");
        attacker.removeEffect("minecraft:invisibility");
    } catch (error) {
        console.warn("[Dorios Trinkets] Veil of Silence break failed:", error);
    }
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    echoMarks.delete(playerId);
    mirrorCooldowns.delete(playerId);
    enderCharges.delete(playerId);
});
