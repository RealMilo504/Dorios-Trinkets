const providers = new Map();
let orderedProviders = [];

function finite(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function clamp01(value) {
    return Math.min(1, Math.max(0, finite(value)));
}

function rebuildProviderOrder() {
    orderedProviders = [...providers.values()].sort((left, right) =>
        left.priority - right.priority || left.id.localeCompare(right.id)
    );
}

/**
 * Registers one external combat-stat source. Providers only describe values;
 * StatsCore remains the sole owner of applying the final before-hurt damage.
 */
export function registerCombatModifierProvider(id, resolve, options = {}) {
    const normalizedId = String(id ?? "").trim().toLowerCase();
    if (!normalizedId || typeof resolve !== "function") return false;

    providers.set(normalizedId, {
        id: normalizedId,
        resolve,
        priority: finite(options.priority),
    });
    rebuildProviderOrder();
    return true;
}

export function unregisterCombatModifierProvider(id) {
    const removed = providers.delete(String(id ?? "").trim().toLowerCase());
    if (removed) rebuildProviderOrder();
    return removed;
}

/**
 * Resolves external values in canonical units.
 * - damageMultiplier is a full multiplier (1.10 means +10%).
 * - criticalMultiplierDelta is a delta (0.25 turns 1.0x into 1.25x).
 * - chances/lifesteal are fractions.
 */
export function resolveCombatModifiers(context) {
    let flatDamage = 0;
    let damageMultiplier = 1;
    let criticalChance = 0;
    let criticalMultiplierDelta = 0;
    let lifesteal = 0;
    let damageCapMultiplier = 0;
    let hasContributions = false;

    for (const provider of orderedProviders) {
        let contribution;
        try {
            contribution = provider.resolve(context);
        } catch (error) {
            console.warn(`[StatsCore] combat provider '${provider.id}' failed:`, error);
            continue;
        }
        if (!contribution || typeof contribution !== "object") continue;

        const nextFlatDamage = Math.max(0, finite(contribution.flatDamage));
        const nextDamageMultiplier = Math.max(0, finite(contribution.damageMultiplier, 1));
        const nextCriticalChance = clamp01(contribution.criticalChance);
        const nextCriticalMultiplierDelta = Math.max(0, finite(contribution.criticalMultiplierDelta));
        const nextLifesteal = clamp01(contribution.lifesteal);
        const nextDamageCapMultiplier = Math.max(0, finite(contribution.damageCapMultiplier));

        flatDamage += nextFlatDamage;
        damageMultiplier *= nextDamageMultiplier;
        criticalChance = clamp01(criticalChance + nextCriticalChance);
        criticalMultiplierDelta += nextCriticalMultiplierDelta;
        lifesteal = clamp01(lifesteal + nextLifesteal);
        damageCapMultiplier = Math.max(damageCapMultiplier, nextDamageCapMultiplier);
        hasContributions ||= nextFlatDamage > 0
            || nextDamageMultiplier !== 1
            || nextCriticalChance > 0
            || nextCriticalMultiplierDelta > 0
            || nextLifesteal > 0;
    }

    return Object.freeze({
        flatDamage,
        damageMultiplier,
        criticalChance,
        criticalMultiplierDelta,
        lifesteal,
        damageCapMultiplier,
        hasContributions,
    });
}

export function getCombatModifierProviderIds() {
    return orderedProviders.map(provider => provider.id);
}
