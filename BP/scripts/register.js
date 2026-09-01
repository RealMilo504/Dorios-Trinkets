import { world, system, BlockPermutation } from '@minecraft/server'

let rpgCoreDetected = false;

world.afterEvents.worldLoad.subscribe(() => {
    for (const value of Object.values(trinkets)) {
        system.sendScriptEvent("dorios:register_stat_data", JSON.stringify(value));
    }

    system.runTimeout(() => {
        if (!rpgCoreDetected) {
            world.sendMessage(
                "§c[Dorios Trinkets] Required dependency missing: Dorios RPG Core.\n" +
                "§7Please download it from §eCurseForge §7or §eMCPEDL§7."
            );
            system.runTimeout(() => {
                if (!rpgCoreDetected) {
                    world.sendMessage(
                        "§c[Dorios Trinkets] Required dependency missing: Dorios RPG Core.\n" +
                        "§7Please download it from §eCurseForge §7or §eMCPEDL§7."
                    );
                }
            }, 3600);
        }
    }, 300);
})

system.afterEvents.scriptEventReceive.subscribe(e => {
    if (e.id !== "dorios:stat_data_registered" || rpgCoreDetected) return;

    try {
        const data = JSON.parse(e.message);
        if (data?.registered == true) {
            rpgCoreDetected = true;
            system.runTimeout(() => {

                world.sendMessage(
                    "§a[Dorios Trinkets] Dorios RPG Core initialized successfully."
                );
            }, 300);
        }
    } catch { }
});


const trinkets = {
    hat: {
        "dorios:abyssal_diver_helmet": { // Obtained in ocean chests, deep more chance and also drowned
            trinket: "hat",
            stats: {
                waterSpeed: 20
            },
            passives: {
                water_breathing: 1
            },
            drops: [
                {
                    entity: "minecraft:drowned",
                    chance: 0.05
                }
            ],
            loot: {
                biomes: [
                    { biome: "minecraft:beach", chance: 0.15 },
                    { biome: "minecraft:ocean", chance: 0.15 },
                    { biome: "minecraft:cold_ocean", chance: 0.15 },
                    { biome: "minecraft:lukewarm_ocean", chance: 0.15 },
                    { biome: "minecraft:deep_ocean", chance: 0.30 },
                    { biome: "minecraft:deep_cold_ocean", chance: 0.30 },
                    { biome: "minecraft:deep_lukewarm_ocean", chance: 0.30 }
                ]
            }

        },
        "dorios:broken_paladin_helmet": {
            trinket: "hat",
            stats: {
                attack: 1
            },
            loot: {
                structures: [
                    {
                        structure: "bastion",
                        chance: 0.30
                    },
                    {
                        structure: "nether_fortress",
                        chance: 0.20
                    }
                ]
            }
        },
        "dorios:restored_paladin_helmet": {
            trinket: "hat",
            stats: {
                attack: 3
            },
            loot: {
                structures: [
                    {
                        structure: "bastion",
                        chance: 0.12
                    },
                    {
                        structure: "nether_fortress",
                        chance: 0.08
                    }
                ]
            }
        },
        "dorios:witchs_crooked_hat": {
            trinket: "hat",
            stats: {
                mana: 30,
                manaRegen: 2
            },
            drops: [
                {
                    entity: "minecraft:witch",
                    chance: 0.025
                }
            ]
        },
        "dorios:paladin_circlet": {
            trinket: "hat",
            stats: {
                health: 4,
                damageReduction: 5
            }
        },
        "dorios:tideforged_crown": {
            trinket: "hat",
            stats: {
                waterSpeed: 30
            },
            passives: {
                conduit_power: 1
            },
            drops: [
                {
                    entity: "minecraft:drowned",
                    chance: 0.02
                }
            ],
            loot: {
                biomes: [
                    { biome: "minecraft:deep_ocean", chance: 0.08 },
                    { biome: "minecraft:deep_cold_ocean", chance: 0.08 },
                    { biome: "minecraft:deep_lukewarm_ocean", chance: 0.08 }
                ]
            }
        },
        "dorios:deepdelvers_cap": {
            trinket: "hat"
        },
        "dorios:deepdelvers_cap_tag": {
            passives: {
                night_vision: 1,
                haste: 1
            }
        },
        "dorios:beekeepers_hat": {
            trinket: "hat",
            immunities: ["Poison"],
            drops: [
                {
                    entity: "minecraft:bee",
                    chance: 0.025
                }
            ]
        },
        "dorios:crown_of_last_light": {
            trinket: "hat",
            drops: [
                {
                    entity: "minecraft:evocation_illager",
                    chance: 0.02
                }
            ]
        },
        "dorios:stormcaller_hood": {
            trinket: "hat",
            drops: [
                {
                    entity: "minecraft:phantom",
                    chance: 0.025
                }
            ]
        },
        "dorios:trial_champion_crown": {
            trinket: "hat",
            loot: {
                structures: [
                    { structure: "trial_chambers", chance: 0.12 }
                ]
            }
        }
    },
    heartyCharm: {
        "dorios:bloodstained_heart": {
            trinket: "heartycharm",
            stats: {
                health: 8
            },
            loot: {
                structures: [
                    {
                        structure: "bastion",
                        chance: 0.15
                    }
                ]
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
            },
            drops: [
                {
                    entity: "minecraft:ender_dragon",
                    chance: 0.25
                }
            ],
            loot: {
                structures: [
                    {
                        structure: "default",
                        chance: 0.01,
                        conditions: {
                            dimension: "minecraft:the_end" // TEST
                        }
                    }
                ]
            }
        },
        "dorios:black_heart": {
            trinket: "heartycharm",
            stats: {
                health: 6
            },
            drops: [
                {
                    entity: "minecraft:enderman",
                    chance: 0.10
                }
            ],
            loot: {
                structures: [
                    {
                        structure: "default",
                        chance: 0.15,
                        conditions: {
                            dimension: "minecraft:the_end" // TEST
                        }
                    }
                ]
            }
        },
        "dorios:candy_heart": {
            trinket: "heartycharm",
            stats: {
                health: 4
            },
            drops: [
                {
                    entity: "minecraft:witch",
                    chance: 0.05
                }
            ]
        },
        "dorios:eternal_heart": {
            trinket: "heartycharm",
            stats: {
                health: 8
            },
            immunities: ['Poison', 'Wither', 'Hunger'],
            drops: [
                {
                    entity: "minecraft:wither",
                    chance: 0.50
                }
            ]
        },
        "dorios:immaculate_heart": {
            trinket: "heartycharm",
            stats: {
                health: 10,
                attack: 1
            },
            loot: {
                structures: [
                    {
                        structure: "desert_pyramid",
                        chance: 0.15
                    }
                ]
            }
        },
        "dorios:rotten_heart": {
            trinket: "heartycharm",
            stats: {
                health: 2
            },
            drops: [
                {
                    entity: "minecraft:zombie",
                    chance: 0.05
                }
            ]
        },
        "dorios:sacred_heart": {
            trinket: "heartycharm",
            stats: {
                health: 20
            },
            passives: {
                regeneration: 1
            },
            loot: {
                structures: [
                    {
                        structure: "desert_pyramid",
                        chance: 0.05
                    }
                ]
            }
        },
        "dorios:soul_heart": {
            trinket: "heartycharm",
            stats: {
                health: 8
            },
            immunities: ['Darkness'],
            drops: [
                {
                    entity: "minecraft:warden",
                    chance: 0.50
                }
            ]
        },
        "dorios:warden_heart": { // Crafteado usando el soul heart
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
            immunities: ['Wither'],
            drops: [
                {
                    entity: "minecraft:wither",
                    chance: 0.20
                }
            ]
        },
        "dorios:tideforged_heart": {
            trinket: "heartycharm",
            stats: {
                health: 4
            },
            loot: {
                biomes: [
                    { biome: "minecraft:beach", chance: 0.15 },
                    { biome: "minecraft:ocean", chance: 0.15 },
                    { biome: "minecraft:cold_ocean", chance: 0.15 },
                    { biome: "minecraft:lukewarm_ocean", chance: 0.15 },
                    { biome: "minecraft:deep_ocean", chance: 0.30 },
                    { biome: "minecraft:deep_cold_ocean", chance: 0.30 },
                    { biome: "minecraft:deep_lukewarm_ocean", chance: 0.30 }
                ]
            }
        }
    },
    body: {
        "dorios:bloodbound_emblem": { // Strength 1 after killing an entity
            trinket: "body",
            drops: [
                {
                    entity: "minecraft:wither_skeleton",
                    chance: 0.05
                }
            ],
            loot: {
                structures: [
                    {
                        structure: "bastion",
                        chance: 0.25
                    },
                    {
                        structure: "nether_fortress",
                        chance: 0.15
                    }
                ]
            }
        },
        "dorios:frost_quiver": { // Inflicts slowness I for 5 seconds when shot an entity
            trinket: "body",
            drops: [
                {
                    entity: "minecraft:stray",
                    chance: 0.10
                }
            ]
        },
        "dorios:idle_bloom": {
            trinket: "body",
            loot: {
                biomes: [
                    { biome: "minecraft:jungle", chance: 0.40 },
                    { biome: "minecraft:jungle_hills", chance: 0.40 },
                    { biome: "minecraft:jungle_edge", chance: 0.40 },
                    { biome: "minecraft:jungle_edge_mutated", chance: 0.40 },
                    { biome: "minecraft:jungle_mutated", chance: 0.40 },
                    { biome: "minecraft:bamboo_jungle", chance: 0.40 },
                    { biome: "minecraft:bamboo_jungle_hills", chance: 0.40 }
                ]
            }
        },
        "dorios:idle_bloom_tag": { // Tag of Idle Bloom, gives effects when still over 3 seconds
            passives: {
                regeneration: 2
            }
        },
        "dorios:molten_quiver": { // Inflicts fire for 5 seconds when shot an entity
            trinket: "body",
            drops: [
                {
                    entity: "minecraft:skeleton",
                    chance: 0.05,
                    conditions: {
                        dimension: "minecraft:nether"
                    }
                    // condition: (entity) =>
                    //     entity.dimension.id === "minecraft:nether"
                }
            ]
        },
        "dorios:tideforged_carapace": {
            trinket: "body",
            drops: [
                {
                    entity: "minecraft:guardian",
                    chance: 0.25
                }
            ]
        },
        "dorios:tideforged_carapace_tag": { // Tag of Tideforged Carapace, gives effects when underwater
            passives: {
                resistance: 1
            }
        },
        "dorios:venom_quiver": { // Inflicts venom for 5 seconds when shot an entity
            trinket: "body",
            drops: [
                {
                    entity: "minecraft:bogged",
                    chance: 0.10
                }
            ]
        },
        "dorios:travelers_cloak_pin": {
            trinket: "body"
        },
        "dorios:alchemists_cloak_pin": {
            trinket: "body",
            stats: {
                mana: 15
            }
        },
        "dorios:spider_silk_mantle": {
            trinket: "body",
            drops: [
                { entity: "minecraft:spider", chance: 0.03 },
                { entity: "minecraft:cave_spider", chance: 0.05 }
            ]
        },
        "dorios:phantom_membrane_mantle": {
            trinket: "body",
            drops: [
                { entity: "minecraft:phantom", chance: 0.04 }
            ]
        },
        "dorios:armadillo_shield_brooch": {
            trinket: "body",
            drops: [
                { entity: "minecraft:armadillo", chance: 0.04 }
            ]
        },
    },
    gauntlet: {
        "dorios:fire_claw": {
            trinket: "gauntlet",
            stats: {
                attack: 2,
                fireAspect: 3
            },
            loot: {
                structures: [
                    {
                        structure: "bastion",
                        chance: 0.25
                    },
                    {
                        structure: "nether_fortress",
                        chance: 0.15
                    }
                ]
            }
        },
        "dorios:fire_gauntlet": {
            trinket: "gauntlet",
            stats: {
                fireAspect: 3
            },
            loot: {
                structures: [
                    {
                        structure: "bastion",
                        chance: 0.30
                    },
                    {
                        structure: "nether_fortress",
                        chance: 0.20
                    }
                ]
            }
        },
        "dorios:ice_claw": {
            trinket: "gauntlet",
            stats: {
                attack: 2
            },
            actives: {
                slowness: 1
            },
            drops: [
                {
                    entity: "minecraft:stray",
                    chance: 0.05
                }
            ]
        },
        "dorios:ice_gauntlet": {
            trinket: "gauntlet",
            actives: {
                slowness: 1
            },
            drops: [
                {
                    entity: "minecraft:stray",
                    chance: 0.10
                }
            ]
        },
        "dorios:venom_claw": {
            trinket: "gauntlet",
            stats: {
                attack: 2
            },
            actives: {
                poison: 1
            },
            drops: [
                {
                    entity: "minecraft:cave_spider",
                    chance: 0.05
                }
            ]
        },
        "dorios:venom_gauntlet": {
            trinket: "gauntlet",
            actives: {
                poison: 1
            },
            drops: [
                {
                    entity: "minecraft:cave_spider",
                    chance: 0.10
                }
            ]
        },
        "dorios:tideforged_knuckles": {
            trinket: "gauntlet",
            stats: {
                attack: 1
            },
            drops: [
                {
                    entity: "minecraft:guardian",
                    chance: 0.15
                },
                {
                    entity: "minecraft:elder_guardian",
                    chance: 0.60
                }
            ]
        },
        "dorios:hoglin_tusk_gauntlet": {
            trinket: "gauntlet",
            stats: {
                attack: 1
            },
            drops: [
                { entity: "minecraft:hoglin", chance: 0.04 }
            ]
        },
        "dorios:wind_bracer": {
            trinket: "gauntlet",
            drops: [
                { entity: "minecraft:breeze", chance: 0.025 }
            ]
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
            },
            loot: {
                biomes: [
                    { biome: "minecraft:ocean", chance: 0.05 },
                    { biome: "minecraft:cold_ocean", chance: 0.05 },
                    { biome: "minecraft:lukewarm_ocean", chance: 0.05 },
                    { biome: "minecraft:deep_ocean", chance: 0.10 },
                    { biome: "minecraft:deep_cold_ocean", chance: 0.10 },
                    { biome: "minecraft:deep_lukewarm_ocean", chance: 0.10 }
                ]
            }
        },
        "dorios:dead_abyssal_orb": {
            trinket: "charm",
            stats: {
                waterSpeed: 30
            },
            loot: {
                biomes: [
                    { biome: "minecraft:beach", chance: 0.20 },
                    { biome: "minecraft:ocean", chance: 0.20 },
                    { biome: "minecraft:cold_ocean", chance: 0.20 },
                    { biome: "minecraft:lukewarm_ocean", chance: 0.20 },
                    { biome: "minecraft:deep_ocean", chance: 0.40 },
                    { biome: "minecraft:deep_cold_ocean", chance: 0.40 },
                    { biome: "minecraft:deep_lukewarm_ocean", chance: 0.40 }
                ]
            }
        },
        "dorios:bloodtide_chalice": {
            trinket: "charm",
            stats: {
                lifeSteal: 10
            },
            loot: {
                structures: [
                    {
                        structure: "bastion",
                        chance: 0.15
                    },
                    {
                        structure: "nether_fortress",
                        chance: 0.05
                    }
                ]
            }
        },
        "dorios:obsidian_skull": { // Crafted
            trinket: "charm",
            loot: {
                structures: [
                    {
                        structure: "ruined_portal",
                        chance: 0.15
                    }
                ]
            }
        },
        "dorios:obsidian_skull_tag": { // Tag of Obsidian Skull, stop giving effect when touching lava
            passives: {
                fire_resistance: 1
            }
        },
        "dorios:purity_blossom": {
            trinket: "charm",
            immunities: ['Poison'],
            drops: [
                {
                    entity: "minecraft:witch",
                    chance: 0.05
                }
            ],
            loot: {
                biomes: [
                    { biome: "minecraft:jungle", chance: 0.25 },
                    { biome: "minecraft:jungle_hills", chance: 0.25 },
                    { biome: "minecraft:jungle_edge", chance: 0.25 },
                    { biome: "minecraft:jungle_edge_mutated", chance: 0.25 },
                    { biome: "minecraft:jungle_mutated", chance: 0.25 },
                    { biome: "minecraft:bamboo_jungle", chance: 0.25 },
                    { biome: "minecraft:bamboo_jungle_hills", chance: 0.25 }
                ]
            }
        },
        "dorios:tideforged_stars": {
            trinket: "charm",
            stats: {
                waterSpeed: 50
            },
            drops: [
                {
                    entity: "minecraft:guardian",
                    chance: 0.05
                },
                {
                    entity: "minecraft:elder_guardian",
                    chance: 0.25
                }
            ],
            loot: {
                biomes: [
                    { biome: "minecraft:beach", chance: 0.15 },
                    { biome: "minecraft:ocean", chance: 0.15 },
                    { biome: "minecraft:cold_ocean", chance: 0.15 },
                    { biome: "minecraft:lukewarm_ocean", chance: 0.15 },
                    { biome: "minecraft:deep_ocean", chance: 0.30 },
                    { biome: "minecraft:deep_cold_ocean", chance: 0.30 },
                    { biome: "minecraft:deep_lukewarm_ocean", chance: 0.30 }
                ]
            }
        },
        "dorios:wayfarers_knot": {
            trinket: "charm"
        },
        "dorios:miners_token": {
            trinket: "charm"
        },
        "dorios:stronghold_eye_charm": {
            trinket: "charm",
            loot: {
                structures: [
                    { structure: "stronghold", chance: 0.10 }
                ]
            }
        },
        "dorios:lost_allay_bell": {
            trinket: "charm",
            loot: {
                structures: [
                    { structure: "pillager_outpost", chance: 0.08 }
                ]
            }
        },
        "dorios:desert_scarab_charm": {
            trinket: "charm",
            loot: {
                structures: [
                    { structure: "desert_pyramid", chance: 0.08 }
                ]
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
            immunities: ['Regeneration'],
            drops: [
                {
                    entity: "minecraft:piglin_brute",
                    chance: 0.025
                }
            ],
            loot: {
                structures: [
                    {
                        structure: "bastion",
                        chance: 0.10
                    },
                    {
                        structure: "nether_fortress",
                        chance: 0.025
                    }
                ]
            }
        },
        "dorios:abyssal_essence": {
            trinket: "archaiccharm",
            stats: {
                waterSpeed: 200
            },
            passives: {
                conduit_power: 1
            },
            drops: [
                {
                    entity: "minecraft:guardian",
                    chance: 0.025
                },
                {
                    entity: "minecraft:elder_guardian",
                    chance: 0.15
                }
            ],
            loot: {
                biomes: [
                    { biome: "minecraft:deep_ocean", chance: 0.05 },
                    { biome: "minecraft:deep_cold_ocean", chance: 0.05 },
                    { biome: "minecraft:deep_lukewarm_ocean", chance: 0.05 }
                ]
            }
        },
        "dorios:abyssal_essence_tag": { // Tag of Abyssal Essence, gives effects when underwater
            passives: {
                strength: 1
            }
        },
        "dorios:void_covenant": {
            trinket: "archaiccharm",
            stats: {
                health: -10,
                attackMulti: 12,
                critChance: 6
            }
        },
        "dorios:endless_eye": {
            trinket: "archaiccharm",
            stats: {
                health: -4,
                critChance: 8
            }
        },
        "dorios:phoenix_ash_sigil": {
            trinket: "archaiccharm"
        },
        "dorios:chronoshard": {
            trinket: "archaiccharm"
        },
        "dorios:worldroot_knot": {
            trinket: "archaiccharm"
        },
        "dorios:worldroot_active_tag": {
            passives: {
                regeneration: 1,
                resistance: 1
            }
        },
        "dorios:stormbound_idol": {
            trinket: "archaiccharm"
        },
        "dorios:gluttons_seal": {
            trinket: "archaiccharm",
            stats: {
                manaRegen: -2
            }
        },
        "dorios:sculk_resonator": {
            trinket: "archaiccharm",
            stats: {
                health: -4
            },
            loot: {
                structures: [
                    { structure: "ancient_city", chance: 0.08 }
                ]
            }
        },
        "dorios:jungle_reliquary": {
            trinket: "archaiccharm",
            loot: {
                structures: [
                    { structure: "jungle_temple", chance: 0.10 }
                ]
            }
        }
    },
    belt: {
        "dorios:adventurers_belt": {
            trinket: "belt",
            stats: {
                mana: 20
            }
        },
        "dorios:ironbound_girdle": {
            trinket: "belt"
        },
        "dorios:miners_tool_belt": {
            trinket: "belt",
            stats: {
                durabilityPreserve: 5
            }
        },
        "dorios:tideforged_girdle": {
            trinket: "belt",
            stats: {
                waterSpeed: 25
            },
            drops: [
                {
                    entity: "minecraft:drowned",
                    chance: 0.035
                }
            ],
            loot: {
                biomes: [
                    { biome: "minecraft:ocean", chance: 0.08 },
                    { biome: "minecraft:deep_ocean", chance: 0.12 },
                    { biome: "minecraft:cold_ocean", chance: 0.08 },
                    { biome: "minecraft:deep_cold_ocean", chance: 0.12 }
                ]
            }
        },
        "dorios:bloodbound_sash": {
            trinket: "belt",
            stats: {
                health: -2
            },
            drops: [
                {
                    entity: "minecraft:piglin_brute",
                    chance: 0.05
                }
            ],
            loot: {
                structures: [
                    { structure: "bastion", chance: 0.08 }
                ]
            }
        },
        "dorios:toolwright_belt": {
            trinket: "belt"
        },
        "dorios:soulcatcher_belt": {
            trinket: "belt",
            drops: [
                {
                    entity: "minecraft:wither_skeleton",
                    chance: 0.035
                }
            ],
            loot: {
                structures: [
                    { structure: "nether_fortress", chance: 0.08 }
                ]
            }
        },
        "dorios:hunters_bandolier": {
            trinket: "belt",
            stats: {
                projectileDamage: 10
            },
            drops: [
                {
                    entity: "minecraft:pillager",
                    chance: 0.025
                }
            ],
            loot: {
                structures: [
                    { structure: "pillager_outpost", chance: 0.12 }
                ]
            }
        },
        "dorios:builders_harness": {
            trinket: "belt"
        },
        "dorios:magma_cinch": {
            trinket: "belt",
            stats: {
                lavaSpeed: 40
            },
            drops: [
                {
                    entity: "minecraft:magma_cube",
                    chance: 0.035
                }
            ],
            loot: {
                structures: [
                    { structure: "bastion", chance: 0.06 },
                    { structure: "nether_fortress", chance: 0.08 }
                ]
            }
        },
        "dorios:magma_cinch_tag": {
            passives: {
                fire_resistance: 1
            }
        },
        "dorios:ravager_horn_buckle": {
            trinket: "belt",
            drops: [
                { entity: "minecraft:ravager", chance: 0.06 }
            ]
        }
    },
    face: {
        "dorios:night_vision_goggles": {
            trinket: "face",
            passives: {
                night_vision: 1
            },
            drops: [
                {
                    entity: "minecraft:phantom",
                    chance: 0.10
                }
            ]
        },
        "dorios:night_vision_mask": {
            trinket: "face",
            passives: {
                night_vision: 1
            },
            immunities: ['Darkness', 'Blindness'],
            drops: [
                {
                    entity: "minecraft:warden",
                    chance: 0.25
                }
            ]
        },
        "dorios:marksman_monocle": {
            trinket: "face",
            stats: {
                projectileDamage: 6,
                rangedCritChance: 3
            },
            drops: [
                {
                    entity: "minecraft:pillager",
                    chance: 0.025
                }
            ],
            loot: {
                structures: [
                    { structure: "pillager_outpost", chance: 0.12 }
                ]
            }
        },
        "dorios:plague_doctor_mask": {
            trinket: "face",
            stats: {
                health: -2
            },
            immunities: ["Poison", "Hunger"],
            drops: [
                {
                    entity: "minecraft:witch",
                    chance: 0.035
                }
            ]
        },
        "dorios:ember_respirator": {
            trinket: "face",
            drops: [
                {
                    entity: "minecraft:blaze",
                    chance: 0.035
                }
            ],
            loot: {
                structures: [
                    { structure: "nether_fortress", chance: 0.08 }
                ]
            }
        },
        "dorios:copper_prospecting_lens": {
            trinket: "face"
        },
        "dorios:echo_visor": {
            trinket: "face",
            drops: [
                {
                    entity: "minecraft:warden",
                    chance: 0.08
                }
            ]
        },
        "dorios:mirror_mask": {
            trinket: "face"
        },
        "dorios:veil_of_silence": {
            trinket: "face",
            drops: [
                {
                    entity: "minecraft:evocation_illager",
                    chance: 0.04
                }
            ]
        },
        "dorios:veil_silence_active_tag": {
            passives: {
                invisibility: 1
            }
        },
        "dorios:ender_visor": {
            trinket: "face",
            drops: [
                {
                    entity: "minecraft:enderman",
                    chance: 0.0125
                },
                {
                    entity: "minecraft:ender_dragon",
                    chance: 0.10
                }
            ]
        },
        "dorios:huskbone_mask": {
            trinket: "face",
            immunities: ["Hunger"],
            drops: [
                { entity: "minecraft:husk", chance: 0.04 }
            ]
        },
        "dorios:duelist_wraps": {
            trinket: "gauntlet",
            stats: {
                attack: 2
            }
        },
        "dorios:impact_glove": {
            trinket: "gauntlet"
        }
    },
    doll: {
        "dorios:voodoo": {
            trinket: "doll",
            stats: {
                thorns: 10
            },
            drops: [
                {
                    entity: "minecraft:witch",
                    chance: 0.05
                }
            ]
        },
        "dorios:stone_guardian_doll": {
            trinket: "doll",
            drops: [
                {
                    entity: "minecraft:iron_golem",
                    chance: 0.025
                }
            ]
        },
        "dorios:stone_guardian_retort": {
            stats: {
                knockbackRes: 15
            }
        },
        "dorios:hollow_doll": {
            trinket: "doll",
            stats: {
                health: -4,
                mana: 35,
                manaRegen: 2
            },
            drops: [
                {
                    entity: "minecraft:warden",
                    chance: 0.12
                }
            ]
        },
        "dorios:lucky_ragdoll": {
            trinket: "doll",
            drops: [
                {
                    entity: "minecraft:evocation_illager",
                    chance: 0.05
                }
            ]
        },
        "dorios:straw_effigy": {
            trinket: "doll"
        },
        "dorios:marionette_of_spite": {
            trinket: "doll",
            drops: [
                {
                    entity: "minecraft:witch",
                    chance: 0.025
                },
                {
                    entity: "minecraft:evocation_illager",
                    chance: 0.05
                }
            ]
        },
        "dorios:creeper_doll": {
            trinket: "doll",
            drops: [
                {
                    entity: "minecraft:creeper",
                    chance: 0.03
                }
            ]
        },
        "dorios:leech_doll": {
            trinket: "doll",
            drops: [
                {
                    entity: "minecraft:drowned",
                    chance: 0.03
                },
                {
                    entity: "minecraft:zombie",
                    chance: 0.01
                }
            ]
        },
        "dorios:leech_doll_surge": {
            stats: {
                lifeSteal: 8
            }
        },
        "dorios:guardian_effigy": {
            trinket: "doll",
            drops: [
                {
                    entity: "minecraft:guardian",
                    chance: 0.025
                },
                {
                    entity: "minecraft:elder_guardian",
                    chance: 0.12
                }
            ]
        },
        "dorios:packed_snow_doll": {
            trinket: "doll",
            loot: {
                structures: [
                    { structure: "igloo", chance: 0.12 }
                ]
            }
        },
        "dorios:shipwrecked_doll": {
            trinket: "doll",
            loot: {
                structures: [
                    { structure: "shipwreck", chance: 0.10 },
                    { structure: "shipwreck_spruce", chance: 0.10 },
                    { structure: "shipwreck_birch", chance: 0.10 },
                    { structure: "shipwreck_jungle", chance: 0.10 },
                    { structure: "shipwreck_acacia", chance: 0.10 },
                    { structure: "shipwreck_dark_oak", chance: 0.10 }
                ]
            }
        }
    },
    feet: {
        "dorios:cloud_steps_boots": {
            trinket: "feet",
            stats: {
                speed: 30,
                extraJumps: 1
            },
            drops: [
                {
                    entity: "minecraft:phantom",
                    chance: 0.05
                }
            ],
            loot: {
                biomes: [
                    { biome: "minecraft:jungle", chance: 0.25 },
                    { biome: "minecraft:jungle_hills", chance: 0.25 },
                    { biome: "minecraft:jungle_edge", chance: 0.25 },
                    { biome: "minecraft:jungle_edge_mutated", chance: 0.25 },
                    { biome: "minecraft:jungle_mutated", chance: 0.25 },
                    { biome: "minecraft:bamboo_jungle", chance: 0.25 },
                    { biome: "minecraft:bamboo_jungle_hills", chance: 0.25 }
                ]
            }
        },
        "dorios:lava_waders": { // Allows the user to walk over lava
            trinket: "feet",
            stats: {
                speed: 20
            },
            drops: [
                {
                    entity: "minecraft:strider",
                    chance: 0.05
                }
            ],
            loot: {
                structures: [
                    {
                        structure: "ruined_portal",
                        chance: 0.15
                    }
                ]
            }
        },
        "dorios:featherstep_anklets": {
            trinket: "feet",
            stats: {
                speed: 10
            }
        },
        "dorios:tidewalker_fins": {
            trinket: "feet",
            stats: {
                waterSpeed: 60,
                speed: -10
            }
        },
        "dorios:weighted_sabaton_charms": {
            trinket: "feet",
            stats: {
                damageReduction: 6,
                knockbackRes: 15,
                speed: -8
            }
        },
        "dorios:sandstrider_boots": {
            trinket: "feet"
        },
        "dorios:sandstrider_bonus_tag": {
            stats: {
                speed: 35
            }
        },
        "dorios:rootwalker_sandals": {
            trinket: "feet"
        },
        "dorios:rootwalker_bonus_tag": {
            stats: {
                speed: 25
            }
        },
        "dorios:frostwalker_soles": {
            trinket: "feet"
        },
        "dorios:shadowstep_greaves": {
            trinket: "feet"
        },
        "dorios:slimebound_boots": {
            trinket: "feet"
        },
        "dorios:goatstep_anklets": {
            trinket: "feet",
            stats: {
                knockbackRes: 10
            },
            drops: [
                { entity: "minecraft:goat", chance: 0.05 }
            ]
        }
    },
    rings: {
        "dorios:guardian_ring": {
            trinket: "ring",
            passives: {
                resistance: 1
            },
            drops: [
                {
                    entity: "minecraft:guardian",
                    chance: 0.05
                },
                {
                    entity: "minecraft:elder_guardian",
                    chance: 0.25
                }
            ]
        },
        "dorios:healer_ring": {
            trinket: "ring",
            passives: {
                regeneration: 1
            },
            drops: [
                {
                    entity: "minecraft:witch",
                    chance: 0.10
                }
            ]
        },
        "dorios:miner_ring": {
            trinket: "ring",
            passives: {
                haste: 1
            },
            loot: {
                biomes: [
                    { biome: "minecraft:jungle", chance: 0.25 },
                    { biome: "minecraft:jungle_hills", chance: 0.25 },
                    { biome: "minecraft:jungle_edge", chance: 0.25 },
                    { biome: "minecraft:jungle_edge_mutated", chance: 0.25 },
                    { biome: "minecraft:jungle_mutated", chance: 0.25 },
                    { biome: "minecraft:bamboo_jungle", chance: 0.25 },
                    { biome: "minecraft:bamboo_jungle_hills", chance: 0.25 }
                ],
                structures: [
                    {
                        structure: "desert_pyramid",
                        chance: 0.15
                    },
                    {
                        structure: "pillager_outpost",
                        chance: 0.30
                    }
                ]
            }
        },
        "dorios:runner_ring": {
            trinket: "ring",
            passives: {
                speed: 1
            },
            loot: {
                biomes: [
                    { biome: "minecraft:jungle", chance: 0.25 },
                    { biome: "minecraft:jungle_hills", chance: 0.25 },
                    { biome: "minecraft:jungle_edge", chance: 0.25 },
                    { biome: "minecraft:jungle_edge_mutated", chance: 0.25 },
                    { biome: "minecraft:jungle_mutated", chance: 0.25 },
                    { biome: "minecraft:bamboo_jungle", chance: 0.25 },
                    { biome: "minecraft:bamboo_jungle_hills", chance: 0.25 }
                ],
                structures: [
                    {
                        structure: "desert_pyramid",
                        chance: 0.15
                    },
                    {
                        structure: "pillager_outpost",
                        chance: 0.30
                    }
                ]
            }
        },
        "dorios:warrior_ring": {
            trinket: "ring",
            stats: {
                attack: 2
            },
            drops: [
                {
                    entity: "minecraft:vindicator",
                    chance: 0.15
                }
            ]
        },
        "dorios:tideforged_ring": {
            trinket: "ring",
            stats: {
                waterSpeed: 30
            },
            drops: [
                {
                    entity: "minecraft:guardian",
                    chance: 0.05
                },
                {
                    entity: "minecraft:elder_guardian",
                    chance: 0.25
                }
            ],
            loot: {
                biomes: [
                    { biome: "minecraft:beach", chance: 0.20 },
                    { biome: "minecraft:ocean", chance: 0.20 },
                    { biome: "minecraft:cold_ocean", chance: 0.20 },
                    { biome: "minecraft:lukewarm_ocean", chance: 0.20 },
                    { biome: "minecraft:deep_ocean", chance: 0.40 },
                    { biome: "minecraft:deep_cold_ocean", chance: 0.40 },
                    { biome: "minecraft:deep_lukewarm_ocean", chance: 0.40 }
                ]
            }
        },
        "dorios:endermite_loop": {
            trinket: "ring",
            stats: {
                critChance: 6,
                speed: 5
            },
            drops: [
                { entity: "minecraft:endermite", chance: 0.05 }
            ]
        },
        "dorios:silverfish_scale_ring": {
            trinket: "ring",
            drops: [
                { entity: "minecraft:silverfish", chance: 0.04 }
            ]
        },
        "dorios:breeze_core_loop": {
            trinket: "ring",
            stats: {
                knockbackRes: 12
            },
            drops: [
                { entity: "minecraft:breeze", chance: 0.035 }
            ]
        },
        "dorios:ominous_key_ring": {
            trinket: "ring",
            loot: {
                structures: [
                    { structure: "trial_chambers", chance: 0.08 }
                ]
            }
        }
    },
    witherrings: {
        "dorios:heavy_guardian_ring": {
            trinket: "witherring",
            passives: {
                resistance: 1
            },
            loot: {
                biomes: [
                    { biome: "minecraft:jungle", chance: 0.15 },
                    { biome: "minecraft:jungle_hills", chance: 0.15 },
                    { biome: "minecraft:jungle_edge", chance: 0.15 },
                    { biome: "minecraft:jungle_edge_mutated", chance: 0.15 },
                    { biome: "minecraft:jungle_mutated", chance: 0.15 },
                    { biome: "minecraft:bamboo_jungle", chance: 0.15 },
                    { biome: "minecraft:bamboo_jungle_hills", chance: 0.15 }
                ],
                structures: [
                    {
                        structure: "desert_pyramid",
                        chance: 0.05
                    }
                ]
            }
        },
        "dorios:heavy_healer_ring": {
            trinket: "witherring",
            passives: {
                regeneration: 1
            },
            loot: {
                biomes: [
                    { biome: "minecraft:jungle", chance: 0.15 },
                    { biome: "minecraft:jungle_hills", chance: 0.15 },
                    { biome: "minecraft:jungle_edge", chance: 0.15 },
                    { biome: "minecraft:jungle_edge_mutated", chance: 0.15 },
                    { biome: "minecraft:jungle_mutated", chance: 0.15 },
                    { biome: "minecraft:bamboo_jungle", chance: 0.15 },
                    { biome: "minecraft:bamboo_jungle_hills", chance: 0.15 }
                ],
                structures: [
                    {
                        structure: "desert_pyramid",
                        chance: 0.05
                    }
                ]
            }
        },
        "dorios:heavy_miner_ring": {
            trinket: "witherring",
            passives: {
                haste: 1
            },
            loot: {
                biomes: [
                    { biome: "minecraft:jungle", chance: 0.15 },
                    { biome: "minecraft:jungle_hills", chance: 0.15 },
                    { biome: "minecraft:jungle_edge", chance: 0.15 },
                    { biome: "minecraft:jungle_edge_mutated", chance: 0.15 },
                    { biome: "minecraft:jungle_mutated", chance: 0.15 },
                    { biome: "minecraft:bamboo_jungle", chance: 0.15 },
                    { biome: "minecraft:bamboo_jungle_hills", chance: 0.15 }
                ],
                structures: [
                    {
                        structure: "desert_pyramid",
                        chance: 0.05
                    }
                ]
            }
        },
        "dorios:heavy_runner_ring": {
            trinket: "witherring",
            passives: {
                speed: 1
            },
            loot: {
                biomes: [
                    { biome: "minecraft:jungle", chance: 0.15 },
                    { biome: "minecraft:jungle_hills", chance: 0.15 },
                    { biome: "minecraft:jungle_edge", chance: 0.15 },
                    { biome: "minecraft:jungle_edge_mutated", chance: 0.15 },
                    { biome: "minecraft:jungle_mutated", chance: 0.15 },
                    { biome: "minecraft:bamboo_jungle", chance: 0.15 },
                    { biome: "minecraft:bamboo_jungle_hills", chance: 0.15 }
                ],
                structures: [
                    {
                        structure: "desert_pyramid",
                        chance: 0.05
                    }
                ]
            }
        },
        "dorios:heavy_warrior_ring": {
            trinket: "witherring",
            passives: {
                strength: 1
            },
            drops: [
                {
                    entity: "minecraft:piglin_brute",
                    chance: 0.05
                }
            ]
        },
        "dorios:strong_abyssal_ring": {
            trinket: "witherring",
            stats: {
                waterSpeed: 50
            },
            passives: {
                regeneration: 1
            },
            drops: [
                {
                    entity: "minecraft:guardian",
                    chance: 0.05
                },
                {
                    entity: "minecraft:elder_guardian",
                    chance: 0.25
                }
            ]
        },
        "dorios:strong_ancient_ring": {
            trinket: "witherring",
            stats: {
                attack: 2,
                health: 4,
                speed: 10
            },
            loot: {
                biomes: [
                    { biome: "minecraft:jungle", chance: 0.25 },
                    { biome: "minecraft:jungle_hills", chance: 0.25 },
                    { biome: "minecraft:jungle_edge", chance: 0.25 },
                    { biome: "minecraft:jungle_edge_mutated", chance: 0.25 },
                    { biome: "minecraft:jungle_mutated", chance: 0.25 },
                    { biome: "minecraft:bamboo_jungle", chance: 0.25 },
                    { biome: "minecraft:bamboo_jungle_hills", chance: 0.25 }
                ]
            }
        },
        "dorios:strong_blood_ring": {
            trinket: "witherring",
            stats: {
                attack: 2
            },
            drops: [
                {
                    entity: "minecraft:piglin_brute",
                    chance: 0.10
                }
            ],
            loot: {
                structures: [
                    {
                        structure: "bastion",
                        chance: 0.15
                    },
                    {
                        structure: "nether_fortress",
                        chance: 0.05
                    }
                ]
            }
        },
        "dorios:strong_breeze_ring": { // Elevates the enemy into the air
            trinket: "witherring",
            stats: {
                attack: 3
            },
            drops: [
                {
                    entity: "minecraft:breeze",
                    chance: 0.10
                }
            ]
        },
        "dorios:strong_brute_ring": {
            trinket: "witherring",
            stats: {
                attack: 4
            },
            passives: {
                strength: 1
            },
            drops: [
                {
                    entity: "minecraft:piglin_brute",
                    chance: 0.10
                }
            ]
        },
        "dorios:strong_celestial_ring": {
            trinket: "witherring",
            stats: {
                extraJumps: 2
            },
            drops: [
                {
                    entity: "minecraft:vex",
                    chance: 0.05
                }
            ],
            loot: {
                structures: [
                    {
                        structure: "default",
                        chance: 0.15,
                        conditions: {
                            dimension: "minecraft:the_end" // TEST
                        }
                    }
                ]
            }
        },
        "dorios:strong_celestial_ring_tag": { // Gives effect when sneaking
            passives: {
                slow_falling: 1
            }
        },
        "dorios:strong_echo_ring": { // Does a second hit a second later with 25% of the original damage
            trinket: "witherring",
            drops: [
                {
                    entity: "minecraft:warden",
                    chance: 0.15
                }
            ],
            loot: {
                structures: [
                    {
                        structure: "default",
                        chance: 0.05,
                        conditions: {
                            dimension: "minecraft:the_end" // TEST
                        }
                    }
                ]
            }
        },
        "dorios:strong_ender_ring": {
            trinket: "witherring",
            stats: {
                attack: 2
            },
            drops: [
                {
                    entity: "minecraft:enderman",
                    chance: 0.05
                }
            ],
            loot: {
                structures: [
                    {
                        structure: "default",
                        chance: 0.05,
                        conditions: {
                            dimension: "minecraft:the_end" // TEST
                        }
                    }
                ]
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
            },
            drops: [
                {
                    entity: "minecraft:wither_skeleton",
                    chance: 0.05
                }
            ]
        },
        "dorios:strong_inferno_ring": {
            trinket: "witherring",
            stats: {
                attack: 4,
                fireAspect: 5
            },
            passives: {
                fire_resistance: 1
            },
            drops: [
                {
                    entity: "minecraft:piglin_brute",
                    chance: 0.05
                }
            ]
        },
        "dorios:strong_jade_ring": {
            trinket: "witherring",
            stats: {
                health: 10
            },
            passives: {
                regeneration: 1
            },
            loot: {
                biomes: [
                    { biome: "minecraft:jungle", chance: 0.20 },
                    { biome: "minecraft:jungle_hills", chance: 0.20 },
                    { biome: "minecraft:jungle_edge", chance: 0.20 },
                    { biome: "minecraft:jungle_edge_mutated", chance: 0.20 },
                    { biome: "minecraft:jungle_mutated", chance: 0.20 },
                    { biome: "minecraft:bamboo_jungle", chance: 0.20 },
                    { biome: "minecraft:bamboo_jungle_hills", chance: 0.20 }
                ]
            }
        },
        "dorios:strong_shulker_ring": {
            trinket: "witherring",
            stats: {
                attack: 1
            },
            actives: {
                levitation: 1
            },
            drops: [
                {
                    entity: "minecraft:shulker",
                    chance: 0.10
                }
            ],
            loot: {
                structures: [
                    {
                        structure: "default",
                        chance: 0.15,
                        conditions: {
                            dimension: "minecraft:the_end" // TEST
                        }
                    }
                ]
            }
        },
        "dorios:strong_trader_ring": {
            trinket: "witherring",
            passives: {
                village_hero: 2
            },
            drops: [
                {
                    entity: "minecraft:pillager",
                    chance: 0.05
                }
            ],
            loot: {
                biomes: [
                    { biome: "minecraft:jungle", chance: 0.25 },
                    { biome: "minecraft:jungle_hills", chance: 0.25 },
                    { biome: "minecraft:jungle_edge", chance: 0.25 },
                    { biome: "minecraft:jungle_edge_mutated", chance: 0.25 },
                    { biome: "minecraft:jungle_mutated", chance: 0.25 },
                    { biome: "minecraft:bamboo_jungle", chance: 0.25 },
                    { biome: "minecraft:bamboo_jungle_hills", chance: 0.25 }
                ],
                structures: [
                    {
                        structure: "desert_pyramid",
                        chance: 0.15
                    },
                    {
                        structure: "pillager_outpost",
                        chance: 0.30
                    }
                ]
            }
        }
    },
    amulet: {
        "dorios:abyssal_sun_amulet": {
            trinket: "amulet",
            stats: {
                waterSpeed: 100
            },
            drops: [
                {
                    entity: "minecraft:guardian",
                    chance: 0.05
                }
            ],
            loot: {
                structures: [
                    {
                        structure: "default",
                        chance: 0.15,
                        conditions: {
                            dimension: "minecraft:the_end" // TEST
                        }
                    }
                ]
            }
        },
        "dorios:abyssal_sun_amulet_tag": {
            passives: {
                regeneration: 1
            }
        },
        "dorios:blazing_amulet": {
            trinket: "amulet",
            stats: {
                fireAspect: 5
            },
            drops: [
                {
                    entity: "minecraft:blaze",
                    chance: 0.05
                }
            ],
            loot: {
                structures: [
                    {
                        structure: "ruined_portal",
                        chance: 0.15
                    }
                ]
            }
        },
        "dorios:bloodbound_amulet": {
            trinket: "amulet",
            stats: {
                health: 6,
                lifeSteal: 6
            },
            drops: [
                {
                    entity: "minecraft:piglin_brute",
                    chance: 0.05
                }
            ]
        },
        "dorios:lapis_focus": {
            trinket: "amulet",
            stats: {
                mana: 40,
                manaRegen: 2
            }
        },
        "dorios:geode_amulet": {
            trinket: "amulet",
            stats: {
                health: 4,
                damageReduction: 5
            }
        },
        "dorios:prismatic_aegis": {
            trinket: "amulet"
        },
        "dorios:moonstone_amulet": {
            trinket: "amulet"
        },
        "dorios:moonstone_active_tag": {
            stats: {
                critChance: 5,
                manaRegen: 2
            }
        },
        "dorios:sunstone_amulet": {
            trinket: "amulet"
        },
        "dorios:sunstone_active_tag": {
            passives: {
                regeneration: 1
            }
        },
        "dorios:echoheart_amulet": {
            trinket: "amulet"
        },
        "dorios:gravekeeper_amulet": {
            trinket: "amulet"
        },
        "dorios:tempest_heart_amulet": {
            trinket: "amulet"
        },
        "dorios:mansion_ward_amulet": {
            trinket: "amulet",
            stats: {
                mana: 20
            },
            loot: {
                structures: [
                    { structure: "woodland_mansion", chance: 0.10 }
                ]
            }
        }
    },
    talisman: {
        "dorios:abyssal_clam_shell": {
            trinket: "talisman",
            stats: {
                waterSpeed: 50
            },
            drops: [
                {
                    entity: "minecraft:drowned",
                    chance: 0.05
                }
            ]
        },
        "dorios:bloodgem": {
            trinket: "talisman",
            stats: {
                lifeSteal: 4
            },
            loot: {
                structures: [
                    {
                        structure: "bastion",
                        chance: 0.20
                    },
                    {
                        structure: "nether_fortress",
                        chance: 0.10
                    }
                ]
            }
        },
        "dorios:holy_cross": {
            trinket: "talisman",
            drops: [
                {
                    entity: "evocation_illager",
                    chance: 0.05
                }
            ]
        },
        "dorios:tideforged_eye": {
            trinket: "talisman",
            passives: {
                conduit_power: 1
            },
            drops: [
                {
                    entity: "minecraft:drowned",
                    chance: 0.05
                }
            ]
        },
        "dorios:wardstone": {
            trinket: "talisman",
            stats: {
                knockbackRes: 10
            }
        },
        "dorios:hunters_fang": {
            trinket: "talisman"
        },
        "dorios:ocean_coin": {
            trinket: "talisman",
            stats: {
                waterSpeed: 20
            },
            passives: {
                luck: 1
            }
        },
        "dorios:quarry_sigil": {
            trinket: "talisman"
        },
        "dorios:totem_of_momentum": {
            trinket: "talisman"
        },
        "dorios:wayfinder_compass": {
            trinket: "talisman"
        },
        "dorios:stormglass_talisman": {
            trinket: "talisman"
        },
        "dorios:harvesters_token": {
            trinket: "talisman"
        },
        "dorios:end_city_orb": {
            trinket: "talisman",
            loot: {
                structures: [
                    { structure: "end_city", chance: 0.10 }
                ]
            }
        },

    },
    necklace: {
        "dorios:blazed_heart_necklace": {
            trinket: "necklace",
            stats: {
                health: 4
            },
            drops: [
                {
                    entity: "minecraft:blaze",
                    chance: 0.05
                }
            ]
        },
        "dorios:blood_pendant": {
            trinket: "necklace",
            stats: {
                health: 4,
                lifeSteal: 2
            },
            drops: [
                {
                    entity: "minecraft:piglin_brute",
                    chance: 0.05
                }
            ]
        },
        "dorios:mender_pendant": {
            trinket: "necklace",
            loot: {
                biomes: [
                    { biome: "minecraft:jungle", chance: 0.15 },
                    { biome: "minecraft:jungle_hills", chance: 0.15 },
                    { biome: "minecraft:jungle_edge", chance: 0.15 },
                    { biome: "minecraft:jungle_edge_mutated", chance: 0.15 },
                    { biome: "minecraft:jungle_mutated", chance: 0.15 },
                    { biome: "minecraft:bamboo_jungle", chance: 0.15 },
                    { biome: "minecraft:bamboo_jungle_hills", chance: 0.15 }
                ],
                structures: [
                    {
                        structure: "desert_pyramid",
                        chance: 0.05
                    },
                    {
                        structure: "default",
                        chance: 0.15,
                        conditions: {
                            dimension: "minecraft:the_end" // TEST
                        }
                    }
                ]
            }
        },
        "dorios:rabbit_rush": {
            trinket: "necklace",
            stats: {
                speed: 20
            },
            drops: [
                {
                    entity: "minecraft:rabbit",
                    chance: 0.05
                }
            ],
            loot: {
                biomes: [
                    { biome: "minecraft:jungle", chance: 0.25 },
                    { biome: "minecraft:jungle_hills", chance: 0.25 },
                    { biome: "minecraft:jungle_edge", chance: 0.25 },
                    { biome: "minecraft:jungle_edge_mutated", chance: 0.25 },
                    { biome: "minecraft:jungle_mutated", chance: 0.25 },
                    { biome: "minecraft:bamboo_jungle", chance: 0.25 },
                    { biome: "minecraft:bamboo_jungle_hills", chance: 0.25 }
                ],
                structures: [
                    {
                        structure: "desert_pyramid",
                        chance: 0.15
                    },
                    {
                        structure: "pillager_outpost",
                        chance: 0.30
                    }
                ]
            }
        },
        "dorios:repair_talis": {
            trinket: "necklace",
            loot: {
                biomes: [
                    { biome: "minecraft:jungle", chance: 0.30 },
                    { biome: "minecraft:jungle_hills", chance: 0.30 },
                    { biome: "minecraft:jungle_edge", chance: 0.30 },
                    { biome: "minecraft:jungle_edge_mutated", chance: 0.30 },
                    { biome: "minecraft:jungle_mutated", chance: 0.30 },
                    { biome: "minecraft:bamboo_jungle", chance: 0.30 },
                    { biome: "minecraft:bamboo_jungle_hills", chance: 0.30 }
                ],
                structures: [
                    {
                        structure: "desert_pyramid",
                        chance: 0.10
                    },
                    {
                        structure: "pillager_outpost",
                        chance: 0.05
                    }
                ]
            }
        },
        "dorios:rush_of_fear": {
            trinket: "necklace",
            stats: {
                health: 4
            },
            loot: {
                biomes: [
                    { biome: "minecraft:jungle", chance: 0.25 },
                    { biome: "minecraft:jungle_hills", chance: 0.25 },
                    { biome: "minecraft:jungle_edge", chance: 0.25 },
                    { biome: "minecraft:jungle_edge_mutated", chance: 0.25 },
                    { biome: "minecraft:jungle_mutated", chance: 0.25 },
                    { biome: "minecraft:bamboo_jungle", chance: 0.25 },
                    { biome: "minecraft:bamboo_jungle_hills", chance: 0.25 }
                ],
                structures: [
                    {
                        structure: "desert_pyramid",
                        chance: 0.15
                    }
                ]
            }
        },
        "dorios:rush_of_fear_tag": {
            stats: {
                speed: 100
            }
        },
        "dorios:tideforged_pendant": {
            trinket: "necklace",
            stats: {
                waterSpeed: 20
            },
            drops: [
                {
                    entity: "minecraft:drowned",
                    chance: 0.05
                }
            ],
            loot: {
                biomes: [
                    { biome: "minecraft:beach", chance: 0.20 },
                    { biome: "minecraft:ocean", chance: 0.20 },
                    { biome: "minecraft:cold_ocean", chance: 0.20 },
                    { biome: "minecraft:lukewarm_ocean", chance: 0.20 },
                    { biome: "minecraft:deep_ocean", chance: 0.40 },
                    { biome: "minecraft:deep_cold_ocean", chance: 0.40 },
                    { biome: "minecraft:deep_lukewarm_ocean", chance: 0.40 }
                ]
            }
        },
        "dorios:iron_locket": {
            trinket: "necklace",
            stats: {
                knockbackRes: 8
            }
        },
        "dorios:emerald_chain": {
            trinket: "necklace",
            passives: {
                luck: 1
            }
        },
        "dorios:ghast_tear_locket": {
            trinket: "necklace",
            stats: {
                health: 2
            },
            drops: [
                { entity: "minecraft:ghast", chance: 0.04 }
            ]
        },
        "dorios:cracked_bastion_medallion": {
            trinket: "necklace",
            loot: {
                structures: [
                    { structure: "bastion", chance: 0.08 }
                ]
            }
        }
    }
}
