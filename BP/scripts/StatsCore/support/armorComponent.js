import { matchesDamageType, normalizeDamageType } from "../shared/damage.js";

export const ARMOR_COMPONENT_ID = "utilitycraft:armor";

const DEFAULT_DAMAGE_REDUCTION = 0.05;
const DEFAULT_DAMAGE_NEGATION = 0.025;
const MAX_COMPONENT_REDUCTION = 0.9;

function cloneProfile(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return {
        ...value,
        ...(value.cases && typeof value.cases === "object" && !Array.isArray(value.cases)
            ? { cases: { ...value.cases } }
            : {}),
    };
}

export function getArmorComponentDefinition(stack) {
    if (!stack) return null;

    try {
        const component = stack.getComponent?.(ARMOR_COMPONENT_ID);
        return cloneProfile(component?.customComponentParameters?.params);
    } catch {
        return null;
    }
}

function toFraction(value, fallback) {
    if (value === undefined || value === null || value === false) return 0;
    if (value === true) return fallback;
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return 0;
    return Math.min(MAX_COMPONENT_REDUCTION, numeric > 1 ? numeric / 100 : numeric);
}

function getDamageCase(profile, damageType) {
    if (!profile?.cases || typeof profile.cases !== "object" || Array.isArray(profile.cases)) return null;
    const expected = normalizeDamageType(damageType);
    for (const [rawType, value] of Object.entries(profile.cases)) {
        if (normalizeDamageType(rawType) === expected && value && typeof value === "object") return value;
    }
    return null;
}

function profileMatchesDamageType(profile, damageType) {
    const reduces = profile?.reduces
        ?? (profile?.damage_reduction || profile?.damage_negation ? "all" : "none");
    if (Array.isArray(reduces)) {
        const allowed = reduces.filter(value => normalizeDamageType(value) !== "none");
        return allowed.length > 0 && matchesDamageType(allowed, damageType);
    }
    if (normalizeDamageType(reduces) === "none") return false;
    return matchesDamageType([String(reduces)], damageType);
}

export function resolveArmorComponentMitigation(stack, damageType = "all") {
    const base = getArmorComponentDefinition(stack);
    if (!base) return null;

    const profile = { ...base, ...(getDamageCase(base, damageType) ?? {}) };
    if (!profileMatchesDamageType(profile, damageType)) return null;

    const damageReduction = toFraction(profile.damage_reduction, DEFAULT_DAMAGE_REDUCTION);
    const damageNegation = toFraction(profile.damage_negation, DEFAULT_DAMAGE_NEGATION);
    if (damageReduction <= 0 && damageNegation <= 0) return null;

    return { damageReduction, damageNegation };
}

