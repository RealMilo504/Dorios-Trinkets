const REINFORCEMENT_POINTS_KEY = "utilitycraft:reinforcement";
const REINFORCEMENT_MAXIMUM_KEY = "utilitycraft:reinforcement_max";
const REINFORCEMENT_LORE = /Reinforcement\s*:\s*(\d+)(?:\s*\/\s*(\d+))?/i;

function readNumber(stack, key) {
    try {
        const raw = stack?.getDynamicProperty?.(key);
        const value = Number(raw);
        return raw !== undefined && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : undefined;
    } catch {
        return undefined;
    }
}

function readLoreMatch(stack) {
    try {
        for (const line of stack?.getLore?.() ?? []) {
            const match = String(line).match(REINFORCEMENT_LORE);
            if (match) return match;
        }
    } catch { }
    return undefined;
}

/** Compatibility reader; Trinkets does not own Ascendant's reinforcement runtime. */
export function getReinforcementPoints(stack) {
    return readNumber(stack, REINFORCEMENT_POINTS_KEY)
        ?? Math.max(0, Math.floor(Number(readLoreMatch(stack)?.[1]) || 0));
}

/** Compatibility reader; existing reinforced items keep their mitigation profile. */
export function getReinforcementMaximum(stack) {
    return readNumber(stack, REINFORCEMENT_MAXIMUM_KEY)
        ?? Math.max(0, Math.floor(Number(readLoreMatch(stack)?.[2]) || getReinforcementPoints(stack)));
}
