import { world, system, BlockPermutation } from '@minecraft/server'
import {
    applyUniversalTrinketEffect,
    refreshPlayerPassives,
} from './Core/update_stats.js'

world.afterEvents.entityDie.subscribe(({ damageSource, deadEntity }) => {
    const player = damageSource.damagingEntity
    if (player?.typeId != 'minecraft:player') return

    if (player.hasTag("dorios:bloodbound_emblem")) {
        applyUniversalTrinketEffect(player, 'strength')
    }
})

const CONDITION_SAMPLE_INTERVAL = 5
const REPAIR_INTERVAL = 20
const LAVA_RESCAN_INTERVAL = 10
const IDLE_ACTIVATION_TICKS = 60
const IDLE_SPEED_EPSILON_SQUARED = 0.0001
const LANTERN_LIGHT_BLOCK = "minecraft:light_block_15"
const LANTERN_LIGHT_PROPERTY = "dorios:lantern_light_cell"
const MAGNET_RADIUS = 7
const MAGNET_ENTITY_LIMIT = 16
const REPAIRABLE_SLOTS = Object.freeze(['Mainhand', 'Offhand', 'Head', 'Chest', 'Legs', 'Feet'])
const playerRuntime = new Map()
const lavaWaderPlayers = new Map()
const pendingPassiveRefreshes = new Set()
let lastSlowTaskTick = -REPAIR_INTERVAL

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    clearLanternLight(playerRuntime.get(playerId))
    playerRuntime.delete(playerId)
    lavaWaderPlayers.delete(playerId)
    pendingPassiveRefreshes.delete(playerId)
})

world.afterEvents.worldLoad.subscribe(() => {
    system.runInterval(sampleConditionalTrinkets, CONDITION_SAMPLE_INTERVAL)
    system.runInterval(tickLavaWaders, 1)
})

function sampleConditionalTrinkets() {
    const players = world.getAllPlayers()
    const activePlayerIds = new Set()
    const runSlowTasks = system.currentTick - lastSlowTaskTick >= REPAIR_INTERVAL
    if (runSlowTasks) lastSlowTaskTick = system.currentTick

    for (const player of players) {
        const playerId = player.id
        activePlayerIds.add(playerId)
        const tags = new Set(player.getTags())
        let state = playerRuntime.get(playerId)
        if (!state) {
            const idleTicks = player.getDynamicProperty("dorios:idle_ticks") ?? 0
            state = {
                idleTicks,
                persistedIdleTicks: idleTicks,
                lastIdlePersistTick: system.currentTick,
                player,
                lanternLight: readPersistedLanternLight(player),
            }
            playerRuntime.set(playerId, state)
        }
        state.player = player

        if (tags.has("dorios:idle_bloom")) {
            const velocity = player.getVelocity()
            const speedSquared = velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2
            if (speedSquared <= IDLE_SPEED_EPSILON_SQUARED) {
                state.idleTicks = Math.min(
                    IDLE_ACTIVATION_TICKS,
                    state.idleTicks + CONDITION_SAMPLE_INTERVAL
                )
            } else {
                state.idleTicks = 0
            }
            setTagState(player, tags, "dorios:idle_bloom_tag", state.idleTicks >= IDLE_ACTIVATION_TICKS)
            persistIdleTicks(player, state)
        } else {
            setTagState(player, tags, "dorios:idle_bloom_tag", false)
            if (state.idleTicks !== 0) {
                state.idleTicks = 0
                persistIdleTicks(player, state, true)
            }
        }

        setTagState(
            player,
            tags,
            "dorios:tideforged_carapace_tag",
            tags.has("dorios:tideforged_carapace") && player.isInWater
        )

        const needsLavaState = tags.has("dorios:obsidian_skull") || tags.has("dorios:magma_cinch")
        const lavaState = needsLavaState ? getPlayerLavaState(player) : undefined
        setTagState(
            player,
            tags,
            "dorios:obsidian_skull_tag",
            tags.has("dorios:obsidian_skull") && !lavaState?.fullySubmerged
        )

        setTagState(
            player,
            tags,
            "dorios:magma_cinch_tag",
            tags.has("dorios:magma_cinch") && lavaState?.touching
        )

        if (tags.has("dorios:adventurers_belt")) updateLanternLight(player, state)
        else clearLanternLight(state)

        if (tags.has("dorios:ironbound_girdle")) attractNearbyItems(player)

        sampleVeilOfSilence(player, tags, state)

        setTagState(
            player,
            tags,
            "dorios:abyssal_essence_tag",
            tags.has("dorios:abyssal_essence") && player.isInWater
        )

        setTagState(
            player,
            tags,
            "dorios:strong_celestial_ring_tag",
            tags.has("dorios:strong_celestial_ring") && player.isSneaking
        )

        setTagState(
            player,
            tags,
            "dorios:abyssal_sun_amulet_tag",
            tags.has("dorios:abyssal_sun_amulet") && player.isInWater
        )

        if (tags.has("dorios:lava_waders")) {
            const tracked = lavaWaderPlayers.get(playerId)
            if (tracked) tracked.player = player
            else lavaWaderPlayers.set(playerId, { player, lastCell: undefined, lastScanTick: -LAVA_RESCAN_INTERVAL })
        } else {
            lavaWaderPlayers.delete(playerId)
        }

        if (runSlowTasks) {
            if (tags.has("dorios:rush_of_fear") || tags.has("dorios:rush_of_fear_tag")) {
                const rushSeconds = player.getDynamicProperty("dorios:rush_of_fear_time") ?? 0
                if (rushSeconds > 1) {
                    player.setDynamicProperty("dorios:rush_of_fear_time", rushSeconds - 1)
                } else if (tags.has("dorios:rush_of_fear_tag")) {
                    player.setDynamicProperty("dorios:rush_of_fear_time", 0)
                    setTagState(player, tags, "dorios:rush_of_fear_tag", false)
                }
            }

            if (tags.has("dorios:mender_pendant")) repair(player, "all")
            if (tags.has("dorios:repair_talis")) repair(player, ["Mainhand"])
            sampleDeepdelversCap(player, tags)
        }
    }

    for (const playerId of playerRuntime.keys()) {
        if (!activePlayerIds.has(playerId)) {
            clearLanternLight(playerRuntime.get(playerId))
            playerRuntime.delete(playerId)
        }
    }
}

function updateLanternLight(player, state) {
    try {
        const head = player.getHeadLocation()
        const location = {
            x: Math.floor(head.x),
            y: Math.floor(head.y),
            z: Math.floor(head.z),
        }
        const dimension = player.dimension
        const key = `${dimension.id}:${location.x},${location.y},${location.z}`
        const current = dimension.getBlock(location)

        if (state.lanternLight?.key === key) {
            if (current?.typeId === LANTERN_LIGHT_BLOCK) return
            state.lanternLight = undefined
            clearLanternLightProperty(state)
        } else {
            clearLanternLight(state)
            if (state.lanternLight) return
        }

        if (current?.typeId !== "minecraft:air") return
        current.setType(LANTERN_LIGHT_BLOCK)
        state.lanternLight = { dimension, location, key }
        player.setDynamicProperty(LANTERN_LIGHT_PROPERTY, JSON.stringify({
            dimensionId: dimension.id,
            ...location,
        }))
    } catch {
        clearLanternLight(state)
    }
}

function clearLanternLight(state) {
    const light = state?.lanternLight
    if (!light) return

    try {
        const block = light.dimension.getBlock(light.location)
        if (block?.typeId === LANTERN_LIGHT_BLOCK) block.setType("minecraft:air")
        state.lanternLight = undefined
        clearLanternLightProperty(state)
    } catch { }
}

function readPersistedLanternLight(player) {
    try {
        const value = player.getDynamicProperty(LANTERN_LIGHT_PROPERTY)
        if (typeof value !== "string" || value.length === 0) return undefined
        const saved = JSON.parse(value)
        const x = Math.floor(Number(saved.x))
        const y = Math.floor(Number(saved.y))
        const z = Math.floor(Number(saved.z))
        if (!saved.dimensionId || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
            player.setDynamicProperty(LANTERN_LIGHT_PROPERTY, undefined)
            return undefined
        }
        const dimension = world.getDimension(saved.dimensionId)
        const location = { x, y, z }
        return {
            dimension,
            location,
            key: `${dimension.id}:${x},${y},${z}`,
        }
    } catch {
        try { player.setDynamicProperty(LANTERN_LIGHT_PROPERTY, undefined) } catch { }
        return undefined
    }
}

function clearLanternLightProperty(state) {
    try {
        state?.player?.setDynamicProperty(LANTERN_LIGHT_PROPERTY, undefined)
    } catch { }
}

function attractNearbyItems(player) {
    let items
    try {
        items = player.dimension.getEntities({
            type: "minecraft:item",
            location: player.location,
            maxDistance: MAGNET_RADIUS,
            closest: MAGNET_ENTITY_LIMIT,
        })
    } catch {
        return
    }

    const target = {
        x: player.location.x,
        y: player.location.y + 0.65,
        z: player.location.z,
    }
    for (const item of items) {
        try {
            const dx = target.x - item.location.x
            const dy = target.y - item.location.y
            const dz = target.z - item.location.z
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
            if (distance <= 1.1) continue
            const strength = Math.min(0.16, 0.055 + distance * 0.012)
            item.applyImpulse({
                x: dx / distance * strength,
                y: dy / distance * strength + 0.018,
                z: dz / distance * strength,
            })
        } catch { }
    }
}

function sampleVeilOfSilence(player, tags, state) {
    const equipped = tags.has("dorios:veil_of_silence")
    const activeTag = "dorios:veil_silence_active_tag"
    const lockedTag = "dorios:veil_silence_locked_tag"

    if (!equipped) {
        state.veilSneakTicks = 0
        if (tags.has(activeTag)) {
            player.removeEffect("minecraft:invisibility")
            setTagState(player, tags, activeTag, false)
        }
        setTagState(player, tags, lockedTag, false)
        return
    }

    if (tags.has(activeTag)) {
        return
    }

    if (!player.isSneaking) {
        state.veilSneakTicks = 0
        setTagState(player, tags, lockedTag, false)
        return
    }

    if (tags.has(lockedTag)) {
        state.veilSneakTicks = 0
        return
    }

    state.veilSneakTicks = Math.min(60, (state.veilSneakTicks ?? 0) + CONDITION_SAMPLE_INTERVAL)
    if (state.veilSneakTicks < 60) return

    setTagState(player, tags, activeTag, true)
}

function sampleDeepdelversCap(player, tags) {
    setTagState(
        player,
        tags,
        "dorios:deepdelvers_cap_tag",
        tags.has("dorios:deepdelvers_cap")
            && player.dimension.id.endsWith("overworld")
            && player.location.y < 48
    )
}

function tickLavaWaders() {
    for (const [playerId, state] of lavaWaderPlayers) {
        const player = state.player
        if (!player.isValid || !player.hasTag("dorios:lava_waders")) {
            lavaWaderPlayers.delete(playerId)
            continue
        }

        let feetBlock
        let headBlock
        try {
            feetBlock = player.dimension.getBlock(player.location)
            headBlock = player.dimension.getBlock(player.getHeadLocation())
        } catch {
            continue
        }

        const location = player.location
        const cell = `${player.dimension.id}:${Math.floor(location.x)},${Math.floor(location.y)},${Math.floor(location.z)}`
        const shouldScan = cell !== state.lastCell || system.currentTick - state.lastScanTick >= LAVA_RESCAN_INTERVAL
        if (shouldScan) {
            state.lastCell = cell
            state.lastScanTick = system.currentTick
        }
        handleLavaWaders(player, feetBlock, headBlock, shouldScan)
    }
}

function setTagState(player, knownTags, tag, enabled) {
    const currentlyEnabled = knownTags.has(tag)
    if (currentlyEnabled === enabled) return
    if (enabled) {
        player.addTag(tag)
        knownTags.add(tag)
    } else {
        player.removeTag(tag)
        knownTags.delete(tag)
    }
    schedulePassiveRefresh(player)
}

function schedulePassiveRefresh(player) {
    if (pendingPassiveRefreshes.has(player.id)) return
    pendingPassiveRefreshes.add(player.id)
    system.run(() => {
        pendingPassiveRefreshes.delete(player.id)
        if (!player.isValid) return
        refreshPlayerPassives(player)
    })
}

function persistIdleTicks(player, state, force = false) {
    if (!force && system.currentTick - state.lastIdlePersistTick < REPAIR_INTERVAL) return
    state.lastIdlePersistTick = system.currentTick
    if (state.persistedIdleTicks === state.idleTicks) return
    state.persistedIdleTicks = state.idleTicks
    player.setDynamicProperty("dorios:idle_ticks", state.idleTicks)
}

function getPlayerLavaState(player) {
    try {
        const feet = player.dimension.getBlock(player.location)
        const head = player.dimension.getBlock(player.getHeadLocation())
        const feetInLava = feet?.typeId.includes("lava") === true
        const headInLava = head?.typeId.includes("lava") === true
        return {
            touching: feetInLava || headInLava,
            fullySubmerged: feetInLava && headInLava,
        }
    } catch {
        return { touching: false, fullySubmerged: false }
    }
}

world.afterEvents.entityHurt.subscribe(({ hurtEntity, damage, damageSource }) => {
    const attacker = damageSource.damagingEntity
    const cause = damageSource.cause

    if (!attacker || !hurtEntity) return

    if (attacker.typeId == 'minecraft:player') {
        const player = attacker
        if (cause == 'projectile') {
            if (player.hasTag("dorios:frost_quiver")) {
                applyUniversalTrinketEffect(hurtEntity, 'slowness')
            }
            if (player.hasTag("dorios:molten_quiver")) {
                hurtEntity.setOnFire(5)
            }
            if (player.hasTag("dorios:venom_quiver")) {
                applyUniversalTrinketEffect(hurtEntity, 'poison')
            }
        }

        if (cause == 'entityAttack') {
            if (player.hasTag("dorios:strong_breeze_ring")) {
                // Emit breeze wind explosion particles
                hurtEntity.dimension.spawnParticle("minecraft:wind_explosion_emitter", hurtEntity.location);

                // Apply knockback away from the source
                const hx = hurtEntity.location.x;
                const hz = hurtEntity.location.z;
                const sx = player.location.x;
                const sz = player.location.z;

                // Calculate normalized direction vector
                const dx = hx - sx;
                const dz = hz - sz;
                const magnitude = (Math.sqrt(dx * dx + dz * dz) || 1) * 2;

                const knockbackPower = 0.8; // You can tweak this
                hurtEntity.applyKnockback(
                    {
                        x: dx / magnitude,
                        z: dz / magnitude
                    },
                    knockbackPower
                );
            }
            if (player.hasTag("dorios:strong_echo_ring")) {
                system.runTimeout(() => {
                    hurtEntity.applyDamage(damage * 0.25, { cause: 'thorns', damagingEntity: player })
                }, 20)
            }
            if (player.hasTag("dorios:holy_cross")) {
                if (hurtEntity.getComponent('type_family').hasTypeFamily('undead')) {
                    hurtEntity.applyDamage(damage * 0.50, { cause: 'thorns', damagingEntity: player })
                }
            }
        }
    }

    if (hurtEntity.typeId == 'minecraft:player') {
        const player = hurtEntity

        if (player.hasTag("dorios:rush_of_fear")) {
            player.addTag("dorios:rush_of_fear_tag")
            player.setDynamicProperty("dorios:rush_of_fear_time", 3) // segundos restantes
        }
    }

})

/**
 * Maneja el efecto de caminar sobre lava con Lava Waders
 * @param {Player} player Jugador
 * @param {Block} feetBlock Bloque en los pies
 * @param {Block} headBlock Bloque en la cabeza
 */
function handleLavaWaders(player, feetBlock, headBlock, scanWorld) {
    const dim = player.dimension
    const px = Math.floor(player.location.x)
    const py = Math.floor(player.location.y)
    const pz = Math.floor(player.location.z)

    const view = player.getViewDirection?.() ?? { x: 0, z: 0 }
    const fx = Math.sign(view.x)
    const fz = Math.sign(view.z)

    // Centros a revisar: bajo pies y 1 bloque al frente
    const centers = [
        { x: px, z: pz },
        { x: px + fx, z: pz + fz }
    ]

    // Flotación si está en lava
    const inLava =
        (feetBlock?.typeId?.includes("lava") ?? false) ||
        (headBlock?.typeId?.includes("lava") ?? false)

    if (inLava) {
        player.applyKnockback?.({ x: 0, z: 0 }, 0.1)
    }

    if (!scanWorld) return

    const visitedCenters = new Set()
    for (const c of centers) {
        const centerKey = `${c.x},${c.z}`
        if (visitedCenters.has(centerKey)) continue
        visitedCenters.add(centerKey)

        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                const bx = c.x + dx
                const bz = c.z + dz

                // Buscar la lava más alta en un rango de 3 bloques hacia abajo
                let lavaY = null
                for (let checkY = py; checkY >= py - 3; checkY--) {
                    const blockCheck = dim.getBlock({ x: bx, y: checkY, z: bz })
                    if (blockCheck?.typeId === "minecraft:lava") {
                        lavaY = checkY
                        break
                    }
                }

                // Si no hay lava cerca, no hacemos nada
                if (lavaY === null) continue

                // Colocar bloque sólido justo encima de la lava detectada
                const lavaBlock = dim.getBlock({ x: bx, y: lavaY, z: bz })
                const depth = lavaBlock.permutation?.getState?.("liquid_depth")
                const targetId = depth === 0 ? "dorios:lava_solid_0" : "dorios:lava_flow_0"

                try {
                    lavaBlock.setPermutation(getCachedPermutation(targetId))
                } catch { }
            }
        }
    }
}

const permutationCache = new Map()

function getCachedPermutation(typeId) {
    let permutation = permutationCache.get(typeId)
    if (!permutation) {
        permutation = BlockPermutation.resolve(typeId)
        permutationCache.set(typeId, permutation)
    }
    return permutation
}

/**
 * Repairs durability on equipped items for the given slots.
 *
 * Behavior:
 * - If targets is "all", repairs all standard slots.
 * - If targets is an array, repairs only those slots.
 * - If targets is empty/omitted, repairs "Mainhand" only.
 *
 * @param {Player} player Player to repair
 * @param {("Mainhand"|"Offhand"|"Head"|"Chest"|"Legs"|"Feet")[]|"all"} [targets] Target slots to repair or "all"
 *
 * @example
 * // Repair only mainhand and offhand
 * repair(player, ["Mainhand", "Offhand"])
 *
 * @example
 * // Repair everything
 * repair(player, "all")
 *
 * @example
 * // Default behavior (Mainhand only)
 * repair(player)
 */
function repair(player, targets) {
    const equippable = player.getComponent('equippable')
    if (!equippable) return

    // Build slot list based on targets
    let slots
    if (targets === 'all') {
        slots = REPAIRABLE_SLOTS
    } else if (Array.isArray(targets) && targets.length > 0) {
        slots = targets.filter(s => REPAIRABLE_SLOTS.includes(s))
    } else {
        // default behavior: only Mainhand
        slots = ['Mainhand']
    }

    for (const slot of slots) {
        const item = equippable.getEquipment(slot)
        if (!item) continue

        if (!item.hasComponent('minecraft:durability')) continue
        const durability = item.getComponent('minecraft:durability')
        if (!durability) continue

        if (typeof durability.damage === 'number' && durability.damage > 0) {
            durability.damage = Math.max(durability.damage - 1, 0)
            equippable.setEquipment(slot, item)
        }
    }
}

