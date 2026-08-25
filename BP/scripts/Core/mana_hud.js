import { world } from '@minecraft/server'
import { manaBarFrames } from './mana_frames.js'

const MANA_OBJECTIVE = 'dorios:mana'
const MANA_TEXT_SCALE = 100
const MAX_MANA_VALUE = 9999

function clampInteger(value, min, max, fallback = 0) {
    const number = Number(value)
    if (!Number.isFinite(number)) return fallback

    return Math.min(max, Math.max(min, Math.round(number)))
}

function readCurrentMana(player) {
    const identity = player?.scoreboardIdentity
    if (!identity) return 0

    try {
        return world.scoreboard.getObjective(MANA_OBJECTIVE)?.getScore(identity) ?? 0
    } catch {
        return 0
    }
}

function getManaText(currentMana, maxMana) {
    const percentage = maxMana > 0 ? currentMana / maxMana : 0
    const frameIndex = clampInteger(
        Math.floor(percentage * (manaBarFrames.length - 1)),
        0,
        manaBarFrames.length - 1
    )

    return manaBarFrames[frameIndex] ?? ''
}

/**
 * Publishes Trinkets' Mana state through Insight's optional public API. The emoji
 * remains owned by Trinkets; textScale lets Insight size its label without
 * importing this add-on or depending on its internal files.
 *
 * @param {import('@minecraft/server').Player} player
 * @param {{ mana?: number }} stats
 * @param {number} [currentManaOverride]
 * @returns {boolean} Whether a usable snapshot was available or published.
 */
export function publishManaHud(player, stats, currentManaOverride) {
    const manaHud = globalThis.DoriosAPI?.insight?.manaHud
    if (typeof manaHud?.publish !== 'function' || !player?.id) return false

    const maxMana = clampInteger(stats?.mana, 0, MAX_MANA_VALUE)
    if (maxMana <= 0) {
        try {
            manaHud.clear?.(player)
        } catch {
            // Insight is optional and must never affect Trinkets' lifecycle.
        }
        return false
    }

    const currentMana = clampInteger(
        currentManaOverride ?? readCurrentMana(player),
        0,
        maxMana
    )
    try {
        return manaHud.publish(player, {
            visible: true,
            currentMana,
            maxMana,
            text: getManaText(currentMana, maxMana),
            textScale: MANA_TEXT_SCALE
        }) === true
    } catch {
        return false
    }
}

/**
 * Clears Insight's volatile snapshot when that API is currently available.
 */
export function forgetManaHudPlayer(playerId) {
    try {
        globalThis.DoriosAPI?.insight?.manaHud?.clear?.(playerId)
    } catch {
        // Insight is optional and must never affect Trinkets' lifecycle.
    }
}
