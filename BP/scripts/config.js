import { world, system } from '@minecraft/server'

const trinkets = {
    head: {
        "dorios:abyssal_diver_helmet": {
            trinket: "head",
            stats: {
                waterSpeed: 20
            },
            passives: {
                water_breathing: 1
            }
        },
        "dorios:broken_paladin_helmet": {
            trinket: "head",
            stats: {
                attack: 1
            }
        },
        "dorios:night_vision_goggles": {
            trinket: "head",
            passives: {
                night_vision: 1
            }
        },
        "dorios:night_vision_mask": {
            trinket: "head",
            passives: {
                night_vision: 1
            },
            immunities: ['Darkness', 'Blindness']
        },
        "dorios:restored_paladin_helmet": {
            trinket: "head",
            stats: {
                attack: 3
            }
        }
    },
    heartyCharm: {
        "dorios:bloodstained_heart": {
            trinket: "heartycharm",
            stats: {
                health: 8
            }
        },
        "dorios:dragon_heart": {
            trinket: "heartycharm",
            stats: {
                health: 20,
                attack: 2
            },
            passives: {
                regeneration: 1
            }
        },
        "dorios:black_heart": {
            trinket: "heartycharm",
            stats: {
                health: 6
            }
        },
        "dorios:candy_heart": {
            trinket: "heartycharm",
            stats: {
                health: 4
            }
        },
        "dorios:eternal_heart": {
            trinket: "heartycharm",
            stats: {
                health: 8
            },
            immunities: ['Poison', 'Wither', 'Hunger']
        },
        "dorios:immaculate_heart": {
            trinket: "heartycharm",
            stats: {
                health: 10,
                attack: 1
            }
        },
        "dorios:rotten_heart": {
            trinket: "heartycharm",
            stats: {
                health: 2
            }
        },
        "dorios:sacred_heart": {
            trinket: "heartycharm",
            stats: {
                health: 20
            },
            passives: {
                regeneration: 1
            }
        },
        "dorios:soul_heart": {
            trinket: "heartycharm",
            stats: {
                health: 8
            },
            immunities: ['Darkness']
        },
        "dorios:warden_heart": {
            trinket: "heartycharm",
            stats: {
                health: 16
            },
            immunities: ['Darkness', 'Blindness']
        },
        "dorios:wither_heart": {
            trinket: "heartycharm",
            stats: {
                health: 16
            },
            passives: {
                regeneration: 1
            },
            immunities: ['Wither']
        },
        "dorios:tideforged_heart": {
            trinket: "heartycharm",
            stats: {
                health: 4
            }
        }
    },
    body: {
        "dorios:bloodbound_emblem": { // Strength 1 after killing an entity
            trinket: "body",
        },
        "dorios:frost_quiver": { // Inflicts slowness I for 5 seconds when shot an entity
            trinket: "body"
        },
        "dorios:idle_bloom": {
            trinket: "body"
        },
        "dorios:idle_bloom_tag": { // Tag of Idle Bloom, gives effects when still over 3 seconds
            passives: {
                regeneration: 2
            }
        },
        "dorios:molten_quiver": { // Inflicts fire for 5 seconds when shot an entity
            trinket: "body"
        },
        "dorios:tideforged_carapace": {
            trinket: "body"
        },
        "dorios:tideforged_carapace_tag": { // Tag of Tideforged Carapace, gives effects when underwater
            passives: {
                resistance: 1
            }
        },
        "dorios:venom_quiver": { // Inflicts venom for 5 seconds when shot an entity
            trinket: "body"
        },
    },
    gauntlet: {
        "dorios:fire_claw": {
            trinket: "gauntlet",
            stats: {
                attack: 2,
                fireAspect: 3
            }
        },
        "dorios:fire_gauntlet": {
            trinket: "gauntlet",
            stats: {
                fireAspect: 3
            }
        },
        "dorios:ice_claw": {
            trinket: "gauntlet",
            stats: {
                attack: 2
            },
            actives: {
                slowness: 1
            }
        },
        "dorios:ice_gauntlet": {
            trinket: "gauntlet",
            actives: {
                slowness: 1
            }
        },
        "dorios:venom_claw": {
            trinket: "gauntlet",
            stats: {
                attack: 2
            },
            actives: {
                poison: 1
            }
        },
        "dorios:venom_gauntlet": {
            trinket: "gauntlet",
            actives: {
                poison: 1
            }
        },
        "dorios:tideforged_knuckles": {
            trinket: "gauntlet",
            stats: {
                attack: 1
            }
        }
    },
    charm: {
        "dorios:abyssal_orb": {
            trinket: "charm",
            stats: {
                waterSpeed: 100
            },
            passives: {
                conduit_power: 1
            }
        },
        "dorios:dead_abyssal_orb": {
            trinket: "charm",
            stats: {
                waterSpeed: 30
            }
        },
        "dorios:bloodtide_chalice": {
            trinket: "charm",
            stats: {
                lifeSteal: 10
            }
        },
        "dorios:obsidian_skull": {
            trinket: "charm"
        },
        "dorios:obsidian_skull_tag": { // Tag of Obsidian Skull, stop giving effect when touching lava
            passives: {
                fire_resistance: 1
            }
        },
        "dorios:purity_blossom": {
            trinket: "charm",
            immunities: ['Poison']
        },
        "dorios:tideforged_stars": {
            trinket: "charm",
            stats: {
                waterSpeed: 50
            }
        }
    },
    archaicCharm: {
        "dorios:blood_pact": {
            trinket: "archaiccharm",
            stats: {
                health: -20,
                lifeSteal: 12
            },
            immunities: ['Regeneration']
        },
        "dorios:abyssal_essence": {
            trinket: "archaiccharm",
            stats: {
                waterSpeed: 200
            },
            passives: {
                conduit_power: 1
            }
        },
        "dorios:abyssal_essence_tag": { // Tag of Abyssal Essence, gives effects when underwater
            trinket: "archaiccharm",
            passives: {
                strength: 1
            }
        }
    },
    doll: {
        "dorios:voodoo": {
            trinket: "doll",
            stats: {
                thorns: 10
            }
        }
    },
    feet: {
        "dorios:cloud_steps_boots": {
            trinket: "feet",
            stats: {
                speed: 30,
                extraJumps: 1
            }
        },
        "dorios:lava_waders": { // Allows the user to walk over lava
            trinket: "feet",
            stats: {
                speed: 20
            }
        }
    },
    rings: {
        "dorios:guardian_ring": {
            trinket: "ring",
            passives: {
                resistance: 1
            }
        },
        "dorios:healer_ring": {
            trinket: "ring",
            passives: {
                regeneration: 1
            }
        },
        "dorios:miner_ring": {
            trinket: "ring",
            passives: {
                haste: 1
            }
        },
        "dorios:runner_ring": {
            trinket: "ring",
            passives: {
                speed: 1
            }
        },
        "dorios:warrior_ring": {
            trinket: "ring",
            stats: {
                attack: 2
            }
        },
        "dorios:tideforged_ring": {
            trinket: "ring",
            stats: {
                waterSpeed: 30
            }
        }
    },
    witherrings: {
        "dorios:heavy_guardian_ring": {
            trinket: "witherring",
            passives: {
                resistance: 1
            }
        },
        "dorios:heavy_healer_ring": {
            trinket: "witherring",
            passives: {
                regeneration: 1
            }
        },
        "dorios:heavy_miner_ring": {
            trinket: "witherring",
            passives: {
                haste: 1
            }
        },
        "dorios:heavy_runner_ring": {
            trinket: "witherring",
            passives: {
                speed: 1
            }
        },
        "dorios:heavy_warrior_ring": {
            trinket: "witherring",
            passives: {
                strength: 1
            }
        },
        "dorios:strong_abyssal_ring": {
            trinket: "witherring",
            stats: {
                waterSpeed: 50
            },
            passives: {
                regeneration: 1
            }
        },
        "dorios:strong_ancient_ring": {
            trinket: "witherring",
            stats: {
                attack: 2,
                health: 4,
                speed: 10
            }
        },
        "dorios:strong_blood_ring": {
            trinket: "witherring",
            stats: {
                attack: 2
            }
        },
        "dorios:strong_breeze_ring": { // Elevates the enemy into the air
            trinket: "witherring",
            stats: {
                attack: 3
            }
        },
        "dorios:strong_brute_ring": {
            trinket: "witherring",
            stats: {
                attack: 4
            },
            passives: {
                strength: 1
            }
        },
        "dorios:strong_celestial_ring": {
            trinket: "witherring",
            stats: {
                extraJumps: 2
            }
        },
        "dorios:strong_celestial_ring_tag": { // Gives effect when sneaking
            trinket: "witherring",
            passives: {
                slow_falling: 1
            }
        },
        "dorios:strong_echo_ring": { // Does a second hit a second later with 25% of the original damage
            trinket: "witherring"
        },
        "dorios:strong_ender_ring": {
            trinket: "witherring",
            stats: {
                attack: 2
            }
        },
        "dorios:strong_fortress_ring": {
            trinket: "witherring",
            stats: {
                attack: 2
            },
            passives: {
                resistance: 1,
                fire_resistance: 1
            }
        },
        "dorios:strong_inferno_ring": {
            trinket: "witherring",
            stats: {
                attack: 4,
                fireAspect: 5
            },
            passives: {
                fire_resistance: 1
            }
        },
        "dorios:strong_jade_ring": {
            trinket: "witherring",
            stats: {
                health: 10
            },
            passives: {
                regeneration: 1
            },
            immunities: ['Regeneration']
        },
        "dorios:strong_shulker_ring": {
            trinket: "witherring",
            stats: {
                attack: 1
            },
            actives: {
                levitation: 1
            }
        },
        "dorios:strong_trader_ring": {
            trinket: "witherring",
            passives: {
                village_hero: 2
            }
        }
    },
    amulet: {
        "dorios:abyssal_sun_amulet": {
            trinket: "amulet",
            stats: {
                waterSpeed: 100
            }
        },
        "dorios:abyssal_sun_amulet_tag": {
            trinket: "amulet",
            passives: {
                regeneration: 1
            }
        },
        "dorios:blazing_amulet": {
            trinket: "amulet",
            stats: {
                fireAspect: 5
            }
        },
        "dorios:bloodbound_amulet": {
            trinket: "amulet",
            stats: {
                health: 6,
                lifeSteal: 6
            }
        }
    },
    talisman: {
        "dorios:abyssal_clam_shell": {
            trinket: "talisman",
            stats: {
                waterSpeed: 50
            }
        },
        "dorios:bloodgem": {
            trinket: "talisman",
            stats: {
                lifeSteal: 4
            }
        },
        "dorios:holy_cross": {
            trinket: "talisman"
        },
        "dorios:tideforged_eye": {
            trinket: "talisman",
            passives: {
                conduit_power: 1
            }
        },

    },
    necklace: {
        "dorios:blazed_heart_necklace": {
            trinket: "necklace",
            stats: {
                health: 4
            }
        },
        "dorios:blood_pendant": {
            trinket: "necklace",
            stats: {
                health: 4,
                lifeSteal: 2
            }
        },
        "dorios:mender_pendant": {
            trinket: "necklace"
        },
        "dorios:rabbit_rush": {
            trinket: "necklace",
            stats: {
                speed: 20
            }
        },
        "dorios:repair_talis": {
            trinket: "necklace"
        },
        "dorios:rush_of_fear": {
            trinket: "necklace",
            stats: {
                health: 4
            }
        },
        "dorios:rush_of_fear_tag": {
            trinket: "necklace",
            stats: {
                speed: 100
            }
        },
        "dorios:tideforged_pendant": {
            trinket: "necklace",
            stats: {
                waterSpeed: 20
            }
        }
    }
}

world.afterEvents.worldLoad.subscribe(() => {
    console.warn("[Dorios RPG Core] Dorios' Trinkets - Register Sent")

    for (const [key, value] of Object.entries(trinkets)) {
        const payload = {};
        payload[key] = value;

        system.sendScriptEvent("dorios:register_stat_data", JSON.stringify(payload));
    }
})

// https://discord.com/channels/@me/1328021511776243754/1397674571687006248