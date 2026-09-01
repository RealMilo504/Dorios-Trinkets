import { registerCombatModifierProvider } from "../StatsCore/API.js";
import { getEventDamageType } from "../StatsCore/shared/damage.js";
import { getStatCategory } from "./stats_manager.js";

const PERCENT = 0.01;

function nonNegative(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, number) : 0;
}

/**
 * Legacy Trinkets contributes canonical values to StatsCore. It never applies
 * damage itself; this guarantees one damage decision and one hurt event.
 */
registerCombatModifierProvider("dorios:legacy_trinkets", ({ event, attacker }) => {
    if (attacker?.typeId !== "minecraft:player") return null;

    const stats = getStatCategory(attacker, "stats");
    if (!stats || typeof stats !== "object") return null;

    const isProjectile = getEventDamageType(event) === "projectile";
    const projectileDamage = isProjectile ? nonNegative(stats.projectileDamage) : 0;
    const rangedCritChance = isProjectile ? nonNegative(stats.rangedCritChance) : 0;

    return {
        flatDamage: nonNegative(stats.attack),
        damageMultiplier: 1
            + (nonNegative(stats.attackMulti) + projectileDamage) * PERCENT,
        criticalChance: Math.min(
            1,
            (nonNegative(stats.critChance) + rangedCritChance) * PERCENT,
        ),
        // Legacy critMulti is a bonus: 25 means a 1.25x critical hit.
        criticalMultiplierDelta: nonNegative(stats.critMulti) * PERCENT,
        lifesteal: Math.min(1, nonNegative(stats.lifeSteal) * PERCENT),
        // Keeps legacy high-damage builds viable while retaining a finite
        // safety ceiling for malformed or hostile provider values.
        damageCapMultiplier: 64,
    };
}, { priority: 100 });
