const samplers = new Map();

/** Registers sampled trinket behavior without creating another player loop. */
export function registerTrinketSampler(id, intervalTicks, sample) {
    const normalizedId = String(id ?? "").trim().toLowerCase();
    const interval = Math.max(1, Math.floor(Number(intervalTicks) || 1));
    if (!normalizedId || typeof sample !== "function") return false;
    samplers.set(normalizedId, { id: normalizedId, interval, sample });
    return true;
}

/** Runs every interested category from the universal Trinkets player tick. */
export function sampleTrinketAbilities(player, tick) {
    for (const sampler of samplers.values()) {
        if (tick % sampler.interval !== 0) continue;
        try {
            sampler.sample(player, tick);
        } catch (error) {
            console.warn(`[Dorios Trinkets] Sampler '${sampler.id}' failed:`, error);
        }
    }
}
