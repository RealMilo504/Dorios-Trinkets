import { system, world } from '@minecraft/server'
import { updatePlayerStats, getStatCategory } from './stats_manager.js'
import { trinketTick } from './trinkets_inv.js'
import { data, manaBarFrames } from './config.js'
import { sampleTrinketAbilities } from './trinket_sampler.js'

const previousEquipmentMap = new Map();
const intervalMap = new Map();
// Universal trinket-effect window: refresh every 5 seconds and keep each
// passive for 12 seconds, preventing flicker without per-item timers.
const PASSIVE_EFFECT_REFRESH_TICKS = 20;
const PASSIVE_EFFECT_DURATION_TICKS = 240;

world.afterEvents.playerSpawn.subscribe(e => { updateData(e.player); });
world.afterEvents.playerHotbarSelectedSlotChange.subscribe(e => updatePlayerStats(e.player))
world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    const interval = intervalMap.get(playerId);
    if (interval !== undefined) system.clearRun(interval);
    intervalMap.delete(playerId);
    previousEquipmentMap.delete(playerId);
});

world.afterEvents.worldLoad.subscribe(() => {
    system.runTimeout(() => {
        world.getDimension('overworld').runCommand('scoreboard objectives add dorios:mana dummy Mana')
        for (const player of world.getPlayers()) {
            const id = player.id;
            if (!intervalMap.has(id)) {
                updateData(player);
            }
        }
    }, 20);
});

world.beforeEvents.effectAdd.subscribe(e => {
    const { effectType, entity } = e
    if (entity.typeId != 'minecraft:player') return
    const immunities = getStatCategory(entity, "immunities")
    const incomingId = String(effectType?.id ?? effectType?.typeId ?? effectType ?? '')
        .replace(/^minecraft:/, '')
        .toLowerCase()
    for (const effect of immunities) {
        const immunityId = String(effect ?? '')
            .replace(/^minecraft:/, '')
            .toLowerCase()
        if (incomingId === immunityId) {
            e.cancel = true
            break
        }
    }
})

/**
 * Converts equipment and tags into a single string for comparison.
 */
function equipmentAndTagsString(player) {
    const equippable = player.getComponent('equippable');
    const equipmentStr = ['Head', 'Chest', 'Legs', 'Feet', 'Mainhand', 'Offhand']
        .map(slot => equippable?.getEquipment(slot)?.typeId ?? 'none')
        .join('|');

    const tagsStr = player.getTags()
        .filter(tag => data[tag] !== undefined)
        .sort()
        .join('|');

    return `${equipmentStr}:${tagsStr}`;
}

function manaDisplay(manaScore, player, stats) {
    let scoreId = player.scoreboardIdentity
    if (scoreId != undefined) {
        let mana = manaScore.getScore(scoreId);
        if (mana < 0 || Number.isNaN(mana) || mana == undefined) mana = 0
        const maxMana = stats.mana;
        const regen = Math.min(stats.manaRegen / 5, maxMana - mana)
        mana += regen
        manaScore.setScore(scoreId, mana || 0);
        const percentage = mana / maxMana;
        const frameIndex = Math.floor(percentage * (manaBarFrames.length - 1));
        const bar = manaBarFrames[frameIndex];
        try {
            if (player.getGameMode() == 'Survival') {
                player.onScreenDisplay.setActionBar(`                         ${bar}`);
            }
        } catch { return false }
    } else {
        player.runCommand('scoreboard players add @s dorios:mana 100')
        world.getDimension('overworld').runCommand('scoreboard objectives add dorios:mana dummy Mana')
    }
}

function updateData(player) {
    const id = player.id;
    if (intervalMap.has(id)) return
    previousEquipmentMap.set(id, equipmentAndTagsString(player));

    let tick = 0;
    let remainingExtraJumps = player.getDynamicProperty('dorios:extraJumps') || 0;

    const interval = system.runInterval(() => {
        // Ensure player is still valid
        if (!player.isValid) {
            system.clearRun(interval);
            intervalMap.delete(id);
            previousEquipmentMap.delete(id);
            return
        }
        // world.sendMessage(`${player.dimension.getBiome(player.location).id}`)
        // Trinket updates and extra jump logic
        trinketTick(player);
        sampleTrinketAbilities(player, tick);

        // Equipment or tag change detection every 20 ticks (1 second)
        if (tick % 20 === 0) {
            const current = equipmentAndTagsString(player);
            const previous = previousEquipmentMap.get(id);
            if (current !== previous) {
                previousEquipmentMap.set(id, current);
                refreshPlayerPassives(player)
            } else if (tick % PASSIVE_EFFECT_REFRESH_TICKS === 0) {
                applyPassiveEffects(player)
            }
        }

        const stats = getStatCategory(player, 'stats');


        // Mana display and refill every 4 ticks (up to 5 times)
        // if (tick % 4 == 0) {
        //     if (stats) {
        //         const manaScore = world.scoreboard.getObjective('dorios:mana');
        //         manaDisplay(manaScore, player, stats);

        //         // Health regeneration
        //         if (stats.healthRegen > 0) {
        //         }
        //     }
        // }


        const maxExtraJumps = stats?.extraJumps ?? 0;
        if (maxExtraJumps > 0) {
            let nextExtraJumps = remainingExtraJumps;

            if (player.isFalling && nextExtraJumps > 0 && player.isJumping) {
                const { x, z } = player.getVelocity();
                player.applyKnockback({ x, z }, 0.6);
                nextExtraJumps -= 1;
            }
            if (player.isOnGround) {
                nextExtraJumps = maxExtraJumps;
            }
            if (nextExtraJumps !== remainingExtraJumps) {
                remainingExtraJumps = nextExtraJumps;
                player.setDynamicProperty('dorios:extraJumps', remainingExtraJumps);
            }
        } else if (remainingExtraJumps !== 0) {
            remainingExtraJumps = 0;
            player.setDynamicProperty('dorios:extraJumps', 0);
        }

        tick++;
        if (tick > 1000) tick = 0; // prevent overflow
    }, 1);

    intervalMap.set(id, interval);
}

/**
 * Applies all passive status effects to a player based on their passive stats.
 * Effects are refreshed periodically with a short duration to ensure persistence.
 *
 * @param {import('@minecraft/server').Player} player Player entity to apply passive effects to
 */
function applyPassiveEffects(player) {
    // Apply passive effects
    const passives = getStatCategory(player, "passives");
    for (const [effectName, level] of Object.entries(passives)) {
        try {
            applyUniversalTrinketEffect(player, effectName, level - 1)
        } catch (e) {
            console.warn(`[Dorios RPG Core] Error applying effect '${effectName}': `, e);
        }
    }
}

/** Applies a Trinkets status effect through the shared 12-second window. */
export function applyUniversalTrinketEffect(entity, effectName, amplifier = 0, showParticles = false) {
    entity.addEffect(effectName, PASSIVE_EFFECT_DURATION_TICKS, {
        amplifier,
        showParticles,
    })
}

/** Rebuilds stats and applies every currently registered passive in one pass. */
export function refreshPlayerPassives(player) {
    updatePlayerStats(player)
    applyPassiveEffects(player)
}

