import { world, system, ItemStack } from '@minecraft/server'

// Todos los trinkets deben ser registrados en las listas, se puede usar la misma, pero aqui lo separe para organizar mejor

// Slots: Head, Body, Feet, Necklace, Ring, Charm, Gauntlet, Talisman, Hearty Charm, Doll, Wither Ring, Archaic Charm
// Abilities: ['health', 'speed', 'attack', 'waterSpeed', 'magicD'];

// const initialValues = {
//         health: 20,       // Valor inicial de vida
//         speed: 0.1,         // Valor inicial de velocidad
//         attack: 1,        // Valor inicial de ataque
//         waterSpeed: 0.02,    // Velocidad en agua
//         magicD: 1,   // Protección mágica
//     };

const doriosTrinkets = [
    // Hearty Charm
    { identifier: "dorios:rotten_heart", slot: 'heartycharm', health: 2 }, // Zombie 5%
    { identifier: "dorios:candy_heart", slot: 'heartycharm', health: 4 }, // Witch 5%
    { identifier: `dorios:soul_heart`, slot: 'heartycharm', health: 8 }, // Ancient City 10%
    { identifier: "dorios:immaculate_heart", slot: 'heartycharm', health: 10, attack: 1 }, // Desert Pyramid 5%
    { identifier: `dorios:black_heart`, slot: 'heartycharm', health: 6 }, // Enderman 5%
    { identifier: `dorios:eternal_heart`, slot: 'heartycharm', health: 8 }, // Ancient City 5%
    { identifier: "dorios:sacred_heart", slot: 'heartycharm', health: 20 }, // Desert Pyramid 2%
    { identifier: `dorios:warden_heart`, slot: 'heartycharm', health: 16, magicD: -1 }, // Crafted
    { identifier: `dorios:wither_heart`, slot: 'heartycharm', health: 16 }, // Wither 5%, 
    { identifier: `dorios:dragon_heart`, slot: 'heartycharm', health: 20, attack: 2 }, // Dragon 20%
    { identifier: `dorios:bloodstained_heart`, slot: 'heartycharm', health: 8 }, // Bastion 10%
    { identifier: `dorios:tideforged_heart`, slot: 'heartycharm', health: 4 }, // Ocean Create 25%

    // Feet
    { identifier: `dorios:cloud_steps_boots`, slot: 'feet', speed: 0.03 }, // Phantom 5%
    { identifier: "dorios:lava_waders", slot: 'feet', speed: 0.02 }, // Strider 5%

    // Charm
    { identifier: `dorios:dead_abyssal_orb`, slot: 'charm', waterSpeed: 0.006 }, // Buried Treasure & Underwater Ruin 25%
    { identifier: `dorios:abyssal_clam_shell`, slot: 'talisman', waterSpeed: 0.01 }, // Underwater Ruin 10%
    { identifier: `dorios:abyssal_orb`, slot: 'charm', waterSpeed: 0.02 }, // Crafted
    { identifier: `dorios:abyssal_essence`, slot: 'archaiccharm', waterSpeed: 0.04 }, // Underwater Ruin 2%
    { identifier: `dorios:abyssal_diver_helmet`, slot: 'head', waterSpeed: 0.004 }, //Shipwreck Treasure 20%
    { identifier: "dorios:obsidian_skull", slot: 'charm' }, // Crafted
    { identifier: "dorios:purity_blossom", slot: 'charm' }, // Witch 5% 
    { identifier: "dorios:bloodtide_chalice", slot: 'charm' }, // Bastion 10%
    { identifier: "dorios:tideforged_stars", slot: 'charm', waterSpeed: 0.01 }, // Ocean Create 20%

    //Gauntlet
    { identifier: "dorios:fire_gauntlet", slot: 'gauntlet' }, // Netherfortress 20%
    { identifier: `dorios:ice_gauntlet`, slot: 'gauntlet' }, // Igloo 25%
    { identifier: `dorios:venom_gauntlet`, slot: 'gauntlet' }, // Jungle Temple 50%
    { identifier: `dorios:fire_claw`, slot: 'gauntlet', attack: 2 }, // Netherfortress 5%
    { identifier: `dorios:venom_claw`, slot: 'gauntlet', attack: 2 },// Jungle Temple 20%
    { identifier: `dorios:ice_claw`, slot: 'gauntlet', attack: 2 },// Igloo 10%
    { identifier: `dorios:tideforged_knuckles`, slot: 'gauntlet', attack: 1 }, // Ocean Create 30%

    // Head
    { identifier: "dorios:night_vision_mask", slot: 'head' }, // Stronghold 10%
    { identifier: "dorios:night_vision_goggles", slot: 'head' }, // Crafted
    { identifier: `dorios:broken_paladin_helmet`, slot: 'head', attack: 1 }, // Ruined Portal 10%
    { identifier: `dorios:restored_paladin_helmet`, slot: 'head', attack: 3 }, // End City 5%

    // Necklace
    { identifier: "dorios:rush_of_fear", slot: 'necklace', health: 4 }, // Desert Pyramid 15%
    { identifier: `dorios:repair_talis`, slot: 'necklace' }, // Blacksmith 20%
    { identifier: `dorios:mender_pendant`, slot: 'necklace' }, // Desert Pyramid 10%
    { identifier: `dorios:blood_pendant`, slot: 'necklace', health: 4 }, // Ruined Portal 10%
    { identifier: `dorios:rabbit_rush`, slot: 'necklace', speed: 0.02 }, // Rabits 25%
    { identifier: 'dorios:tideforged_pendant', slot: 'necklace', waterSpeed: 0.004 }, // Ocean Create 40%
    { identifier: 'dorios:blazed_heart_necklace', slot: 'necklace', health: 4 }, // Blazed Crate 20%

    // Ring
    { identifier: `dorios:guardian_ring`, slot: 'ring' }, // Crafted
    { identifier: `dorios:runner_ring`, slot: 'ring' }, // Crafted
    { identifier: `dorios:healer_ring`, slot: 'ring' }, // Crafted
    { identifier: `dorios:miner_ring`, slot: 'ring' }, // Crafted
    { identifier: `dorios:warrior_ring`, slot: 'ring', attack: 2 }, // Vindicators 5%
    { identifier: `dorios:tideforged_ring`, slot: 'ring', waterSpeed: 0.006 },  // Ocean Create 35%

    // Wither Ring
    { identifier: `dorios:heavy_guardian_ring`, slot: 'witherring' }, // Desert Pyramid 5%
    { identifier: `dorios:heavy_runner_ring`, slot: 'witherring' }, // Desert Pyramid 5%
    { identifier: `dorios:heavy_healer_ring`, slot: 'witherring' }, // Desert Pyramid 5%
    { identifier: `dorios:heavy_miner_ring`, slot: 'witherring' }, // Desert Pyramid 5%
    { identifier: `dorios:heavy_warrior_ring`, slot: 'witherring' }, // Desert Pyramid 5%
    { identifier: `dorios:strong_abyssal_ring`, slot: 'witherring', waterSpeed: 0.01 },  // Ocean Create 10%
    { identifier: `dorios:strong_ancient_ring`, slot: 'witherring', attack: 2, health: 4, speed: 0.01 },  // Desert Pyramid 5%
    { identifier: `dorios:strong_breeze_ring`, slot: 'witherring', attack: 3 }, // Stronghold 10%
    { identifier: `dorios:strong_brute_ring`, slot: 'witherring', attack: 4 }, // Brutes 10%
    { identifier: `dorios:strong_celestial_ring`, slot: 'witherring' }, // End City 20%
    { identifier: `dorios:strong_echo_ring`, slot: 'witherring' }, // Ancient City 15%
    { identifier: `dorios:strong_ender_ring`, slot: 'witherring' }, // End City 30%
    { identifier: `dorios:strong_fortress_ring`, slot: 'witherring', attack: 2 }, // Nether fortress 15%
    { identifier: `dorios:strong_jade_ring`, slot: 'witherring', health: 10 }, // Jungle 50%
    { identifier: `dorios:strong_shulker_ring`, slot: 'witherring', attack: 1 }, // Shulker 10%
    { identifier: `dorios:strong_trader_ring`, slot: 'witherring' }, // Desert Pyramid 25%
    { identifier: `dorios:strong_inferno_ring`, slot: 'witherring', attack: 4 }, // Bastion 20%
    { identifier: `dorios:strong_blood_ring`, slot: 'witherring', attack: 2 }, // Bastion 20%


    // Body
    { identifier: "dorios:molten_quiver", slot: 'body' }, // Nether Skeletons 5%
    { identifier: `dorios:frost_quiver`, slot: 'body' }, // Strays 10%
    { identifier: `dorios:venom_quiver`, slot: 'body' }, // Jungle Temple 30%
    { identifier: `dorios:idle_bloom`, slot: 'body' }, // Jungle Temple 10%
    { identifier: `dorios:tideforged_carapace`, slot: 'body' },  // Ocean Create 20%
    { identifier: `dorios:bloodbound_emblem`, slot: 'body' },  // Bastion 20%

    // Archaic Charm
    { identifier: `dorios:blood_pact`, slot: 'archaiccharm', health: -20 }, // Bastion Treasure 10%

    // Talisman
    { identifier: `dorios:holy_cross`, slot: 'talisman' }, // Desert Pyramid 10%
    { identifier: `dorios:bloodgem`, slot: 'talisman' },  // Bastion 20%
    { identifier: `dorios:tideforged_eye`, slot: 'talisman' },  // Ocean Create 30%

    // Amulet
    { identifier: `dorios:bloodbound_amulet`, slot: 'amulet', health: 6 }, // Bastion Treasure 20%
    { identifier: `dorios:blazing_amulet`, slot: 'amulet' }, // Blazed Crate 40%
    { identifier: `dorios:abyssal_sun_amulet`, slot: 'amulet', waterSpeed: 0.02 }, // End city 20%

    // Doll
    { identifier: `dorios:voodoo`, slot: 'doll', fallingD: -1, defense: 2, attacksD: -1 } // Bastion Treasure 20%
]


// Se juntan ambas listas en una sola
const trinkets = doriosTrinkets.concat(archaismTrinkets, amuletsVanilla)
// Para agregar otra seria asi (archaismTtrinkets,ejemploTrinkets)

//////////////////////////////////////////////////////////////////// De aqui en adelante van los buffos

// Aqui va todo lo que ejecutara un evento en el jugador, como las mascaras (Mucho cuidado con estos por que el player jala medio raro, de preferencia solo 1 slot que cambie evento)




// Efectos que recibe el jugador pasivamente (se ejecuta cada 2.5 segundos para no tener lag)
world.afterEvents.worldInitialize.subscribe(() => {
    system.runInterval(() => {
        let start = Date.now()
        // We obtain all the players 
        let players = world.getAllPlayers()
        players.forEach(player => {

            // We obtain both blocks where the player is
            const feetBlock = player.dimension?.getBlock(player.location);
            const headBlock = player.dimension?.getBlock(player.location)?.above(1);

            const mainhand = player.getComponent('minecraft:equippable').getEquipment('Mainhand')
            const id = mainhand?.typeId
            const amount = mainhand?.amount
            // Effects list
            // effect: is the name of the effect
            // condition: if it needs an external condition or even having another tag (for doing sets)
            // If the trinket doesnt need any conditions, write 1 or True
            // level: the level of the given effect

            // Tag = item identifier + slot
            const passiveEffects = {
                'dorios:night_vision_goggles_head': [
                    { effect: 'night_vision', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:night_vision_mask_head': [
                    { effect: 'night_vision', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:obsidian_skull_charm': [
                    { effect: 'fire_resistance', level: 1, effectTime: 330, condition: !headBlock?.typeId.includes('lava') && !feetBlock?.typeId.includes('lava') }
                ],
                'dorios:abyssal_diver_helmet_head': [
                    { effect: 'water_breathing', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:abyssal_orb_charm': [
                    { effect: 'conduit_power', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:abyssal_essence_archaiccharm': [
                    { effect: 'conduit_power', level: 1, effectTime: 330, condition: 1 },
                    { effect: 'strength', level: 2, effectTime: 330, condition: headBlock.typeId.includes('water') && feetBlock?.typeId.includes('water') }
                ],
                'dorios:guardian_ring_ring': [
                    { effect: 'resistance', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:runner_ring_ring': [
                    { effect: 'speed', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:healer_ring_ring': [
                    { effect: 'regeneration', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:miner_ring_ring': [
                    { effect: 'haste', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:heavy_guardian_ring_witherring': [
                    { effect: 'resistance', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:heavy_runner_ring_witherring': [
                    { effect: 'speed', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:heavy_healer_ring_witherring': [
                    { effect: 'regeneration', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:heavy_miner_ring_witherring': [
                    { effect: 'haste', level: 2, effectTime: 330, condition: 1 }
                ],
                'dorios:heavy_warrior_ring_witherring': [
                    { effect: 'strength', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:sacred_heart_heartycharm': [
                    { effect: 'regeneration', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:wither_heart_heartycharm': [
                    { effect: 'regeneration', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:idle_bloom_body': [
                    { effect: 'regeneration', level: 2, effectTime: 330, condition: player.getVelocity().x == 0 && player.getVelocity().y == 0 && player.getVelocity().z == 0 }
                ],
                'dorios:dragon_heart_heartycharm': [
                    { effect: 'regeneration', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:strong_abyssal_ring_witherring': [
                    { effect: 'resistance', level: 1, effectTime: 330, condition: headBlock.typeId.includes('water') && feetBlock?.typeId.includes('water') }
                ],
                'dorios:strong_brute_ring_witherring': [
                    { effect: 'strength', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:strong_fortress_ring_witherring': [
                    { effect: 'resistance', level: 1, effectTime: 330, condition: 1 },
                    { effect: 'fire_resistance', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:strong_jade_ring_witherring': [
                    { effect: 'regeneration', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:strong_trader_ring_witherring': [
                    { effect: 'village_hero', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:strong_trader_ring_witherring': [
                    { effect: 'fire_resistance', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:strong_inferno_ring_witherring': [
                    { effect: 'fire_resistance', level: 1, effectTime: 330, condition: 1 }
                ],
                'dorios:tideforged_carapace_body': [
                    { effect: 'resistance', level: 1, effectTime: 330, condition: headBlock.typeId.includes('water') && feetBlock?.typeId.includes('water') }
                ],
                'dorios:abyssal_sun_amulet_amulet': [
                    { effect: 'regeneration', level: 1, effectTime: 330, condition: headBlock.typeId.includes('water') && feetBlock?.typeId.includes('water') }
                ],
                'bloodemblem_active': [
                    { effect: 'strength', level: 1, effectTime: 330, condition: 1 }
                ],
                ////////////////////////////////////////////// Archaism Talisman 
                'arena:ethereal_sight_mask_head': [
                    { effect: 'strength', level: 1, effectTime: 330, condition: player.dimension.id == 'minecraft:the_end' }
                ],
                'arena:blaze_skull_mask_head': [
                    { effect: 'strength', level: 2, effectTime: 330, condition: player.dimension.id == 'minecraft:nether' },

                    { effect: 'weakness', level: 2, effectTime: 330, condition: player.dimension.id == 'minecraft:overworld' }
                ],
                'arena:poseidon_mask_head': [
                    { effect: 'strength', level: 2, effectTime: 330, condition: headBlock.typeId.includes('water') && feetBlock?.typeId.includes('water') }
                ],
                'arena:natural_butterfly_mask_head': [
                    { effect: 'blindness', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:unnatural_mask_head': [
                    { effect: 'haste', level: 3, effectTime: 330, condition: 1 },
                    { effect: 'hunger', level: 3, effectTime: 330, condition: 1 }
                ],
                'arena:demon_mask_head': [
                    { effect: 'haste', level: 1, effectTime: 330, condition: 1 },
                    { effect: 'haste', level: 2, effectTime: 330, condition: player.hasTag('mask9_ready') },
                    { effect: 'speed', level: 1, effectTime: 330, condition: player.hasTag('mask9_ready') }
                ],
                'arena:cat_mask_head': [
                    { effect: 'weakness', level: 2, effectTime: 330, condition: !player.hasTag('light_off') },
                    { effect: 'mining_fatigue', level: 1, effectTime: 330, condition: !player.hasTag('light_off') },
                    { effect: 'jump_boost', level: 2, effectTime: 330, condition: 1 },
                    { effect: 'jump_boost', level: 3, effectTime: 330, condition: player.isSneaking },
                    { effect: 'speed', level: 1, effectTime: 330, condition: 1 },
                    { effect: 'night_vision', level: 1, effectTime: 330, condition: player.hasTag('light_off') },
                    { effect: 'invisibility', level: 1, effectTime: 330, condition: player.hasTag('light_off') && player.isSneaking }
                ],
                'arena:wither_mask_head': [
                    { effect: 'weakness', level: 1, effectTime: 330, condition: 1 },
                    { effect: 'strength', level: 1, effectTime: 330, condition: player.getComponent('minecraft:health').currentValue <= 10 },
                    { effect: 'strength', level: 2, effectTime: 330, condition: player.getComponent('minecraft:health').currentValue <= 8 },
                    { effect: 'speed', level: 3, effectTime: 330, condition: player.getComponent('minecraft:health').currentValue <= 6 },
                    { effect: 'resistance', level: 1, effectTime: 330, condition: player.getComponent('minecraft:health').currentValue <= 4 }
                ],
                'arena:archaic_soul_hand_archaiccharm': [
                    { effect: 'fire_resistance', level: 1, effectTime: 330, condition: player.getComponent('minecraft:health').currentValue <= 10 }
                ],
                'arena:archaic_ruler_of_prismas_archaiccharm': [
                    { effect: 'weakness', level: 2, effectTime: 330, condition: headBlock.typeId.includes('air') && feetBlock?.typeId.includes('air') },
                    { effect: 'mining_fatigue', level: 1, effectTime: 330, condition: headBlock.typeId.includes('air') && feetBlock?.typeId.includes('air') },
                    { effect: 'conduit_power', level: 4, effectTime: 330, condition: 1 }
                ],
                'arena:archaic_dimensions_table_archaiccharm': [
                    { effect: 'slow_falling', level: 1, effectTime: 330, condition: player.dimension.id == 'minecraft:the_end' },
                    { effect: 'weakness', level: 1, effectTime: 330, condition: player.dimension.id == 'minecraft:the_end' && player.isFalling },
                    { effect: 'fire_resistance', level: 1, effectTime: 330, condition: player.dimension.id == 'minecraft:nether' },
                    { effect: 'strength', level: 2, effectTime: 40, condition: player.dimension.id == 'minecraft:nether' && player.isJumping },
                    { effect: 'blindness', level: 1, effectTime: 330, condition: player.dimension.id == 'minecraft:overworld' && !player.isSneaking },
                    { effect: 'night_vision', level: 1, effectTime: 330, condition: player.dimension.id == 'minecraft:overworld' && player.isSneaking }
                ],
                'arena:archaic_dimensions_horn_archaiccharm': [
                    { effect: 'strength', level: 2, effectTime: 330, condition: player.dimension.id == 'minecraft:the_end' },
                    { effect: 'slowness', level: 2, effectTime: 330, condition: player.dimension.id == 'minecraft:the_end' && player.isFalling },
                    { effect: 'resistance', level: 1, effectTime: 330, condition: player.dimension.id == 'minecraft:nether' },
                    { effect: 'weakness', level: 3, effectTime: 40, condition: player.dimension.id == 'minecraft:nether' && player.isJumping },
                    { effect: 'darkness', level: 1, effectTime: 330, condition: player.dimension.id == 'minecraft:overworld' && !player.isSneaking },
                    { effect: 'regeneration', level: 1, effectTime: 330, condition: player.dimension.id == 'minecraft:overworld' && player.isSneaking }
                ],
                'arena:jump_copper_wither_ring_witherring': [
                    { effect: 'jump_boost', level: 3, effectTime: 330, condition: 1 }
                ],
                'arena:jump_iron_wither_ring_witherring': [
                    { effect: 'jump_boost', level: 4, effectTime: 330, condition: 1 }
                ],
                'arena:jump_golden_wither_ring_witherring': [
                    { effect: 'jump_boost', level: 5, effectTime: 330, condition: 1 }
                ],
                'arena:jump_prismarine_wither_ring_witherring': [
                    { effect: 'jump_boost', level: 6, effectTime: 330, condition: 1 }
                ],
                'arena:hearts_golden_wither_ring_witherring': [
                    { effect: 'mining_fatigue', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:hearts_prismarine_wither_ring_witherring': [
                    { effect: 'mining_fatigue', level: 2, effectTime: 330, condition: 1 }
                ],
                'arena:movement_golden_wither_ring_witherring': [
                    { effect: 'weakness', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:movement_prismarine_wither_ring_witherring': [
                    { effect: 'weakness', level: 2, effectTime: 330, condition: 1 }
                ],
                'arena:night_vision_gogles_talisman_talisman': [
                    { effect: 'night_vision', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:obsidian_skull_talisman_talisman': [
                    { effect: 'fire_resistance', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:rabbit_boots_talisman_talisman': [
                    { effect: 'jump_boost', level: 3, effectTime: 330, condition: 1 }
                ],
                'arena:shadow_of_nobody_talisman_talisman': [
                    { effect: 'invisibility', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:blessed_necklace_talisman_talisman': [
                    { effect: 'haste', level: 2, effectTime: 330, condition: 1 }
                ],
                'arena:hermes_boots_talisman_talisman': [
                    { effect: 'speed', level: 2, effectTime: 330, condition: 1 }
                ],
                'arena:marble_emerald_necklace_talisman_talisman': [
                    { effect: 'village_hero', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:marble_feather_talisman_talisman': [
                    { effect: 'slow_falling', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:spectral_talisman_talisman': [
                    { effect: 'invisibility', level: 1, effectTime: 330, condition: player.hasTag('light_off') },
                    { effect: 'slow_falling', level: 1, effectTime: 330, condition: player.hasTag('light_off') && player.isFalling }
                ],
                'arena:jesus_doll_doll': [
                    { effect: 'speed', level: 1, effectTime: 330, condition: 1 },
                    { effect: 'haste', level: 1, effectTime: 330, condition: 1 },
                    { effect: 'hunger', level: 3, effectTime: 330, condition: 1 }
                ],
                'arena:masked_doll_doll': [
                    { effect: 'weakness', level: 1, effectTime: 330, condition: 1 },
                    { effect: 'haste', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:vulak_doll_doll': [
                    { effect: 'resistance', level: 1, effectTime: 330, condition: 1 },
                    { effect: 'slowness', level: 2, effectTime: 330, condition: feetBlock?.typeId.includes('water') }
                ],
                'arena:aplpha_doll_doll': [
                    { effect: 'regeneration', level: 1, effectTime: 330, condition: 1 },
                    { effect: 'mining_fatigue', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:fire_doll_doll': [
                    { effect: 'strength', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:harena_doll_doll': [
                    { effect: 'hunger', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:illuminated_doll_doll': [
                    { effect: 'saturation', level: 1, effectTime: 1, condition: 1 },
                    { effect: 'blindness', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:sacronkaiden_doll_doll': [
                    { effect: 'poison', level: 1, effectTime: 330, condition: feetBlock?.typeId.includes('water') }
                ],
                'arena:alaniz_doll_doll': [
                    { effect: 'resistance', level: 1, effectTime: 330, condition: feetBlock?.typeId.includes('coweb') }
                ],
                'arena:gold_doll_doll': [
                    { effect: 'strength', level: 1, effectTime: 330, condition: player.getComponent('equippable').getEquipment('Head')?.typeId == 'minecraft:golden_helmet' }
                ],
                'arena:jrice_doll_doll': [
                    { effect: 'hunger', level: 4, effectTime: 330, condition: player.getComponent('minecraft:health').currentValue <= 20 },
                    { effect: 'invisibility', level: 1, effectTime: 330, condition: player.getComponent('minecraft:health').currentValue <= 3 },
                    { effect: 'regeneration', level: 1, effectTime: 330, condition: player.getComponent('minecraft:health').currentValue <= 2 }
                ],
                'arena:archaic_marble_bracelets_archaiccharm': [
                    { effect: 'strength', level: 3, effectTime: 330, condition: player.getComponent('equippable').getEquipment('Mainhand')?.typeId == 'minecraft:golden_axe' },
                    { effect: 'resistance', level: 2, effectTime: 330, condition: 1 }
                ],
                'arena:archaic_blessed_shield_archaiccharm': [
                    { effect: 'resistance', level: 3, effectTime: 330, condition: player.getComponent('equippable').getEquipment('Offhand')?.typeId == 'minecraft:shield' }
                ],
                'arena:archaic_marble_wings_archaiccharm': [
                    { effect: 'weakness', level: 2, effectTime: 330, condition: 1 },
                    { effect: 'speed', level: 2, effectTime: 330, condition: 1 }
                ],
                'arena:archaic_arnold_archaiccharm': [
                    { effect: 'poison', level: 1, effectTime: 330, condition: 1 },
                    { effect: 'hunger', level: 2, effectTime: 330, condition: 1 },
                    { effect: 'jump_boost', level: 3, effectTime: 330, condition: 1 }
                ],
                'arena:archaic_cursed_book_archaiccharm': [
                    { effect: 'regeneration', level: 3, effectTime: 330, condition: player.getTotalXp() > 30 },
                    { effect: 'mining_fatigue', level: 2, effectTime: 330, condition: 1 }
                ],
                'arena:archaic_cursed_skull_archaiccharm': [
                    { effect: 'strength', level: 2, effectTime: 330, condition: 1 }
                ],
                'arena:piglin_bracelet_charm_charm': [
                    { effect: 'resistance', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:prismatic_relic_charm_charm': [
                    { effect: 'conduit_power', level: 2, effectTime: 330, condition: 1 }
                ],
                'arena:marble_hand_charm_charm': [
                    { effect: 'haste', level: 2, effectTime: 330, condition: 1 }
                ],
                'arena:night_hood_charm_charm': [
                    { effect: 'resistance', level: 2, effectTime: 330, condition: 1 }
                ],
                'arena:chained_heart_talisman_talisman': [
                    { effect: 'regeneration', level: 2, effectTime: 330, condition: 1 }
                ],
                'arena:archaic_chained_soul_archaiccharm': [
                    { effect: 'speed', level: 2, effectTime: 330, condition: player.getComponent('minecraft:health').currentValue <= 6 },
                    { effect: 'resistance', level: 2, effectTime: 330, condition: player.getComponent('minecraft:health').currentValue <= 6 },
                    { effect: 'strength', level: 2, effectTime: 330, condition: player.getComponent('minecraft:health').currentValue <= 6 }
                ],
                'arena:archaic_good_and_evil_flower_archaiccharm': [
                    { effect: 'weakness', level: 1, effectTime: 330, condition: player.getComponent('minecraft:health').currentValue <= 15 },
                    { effect: 'slowness', level: 2, effectTime: 330, condition: player.getComponent('minecraft:health').currentValue <= 10 },
                    { effect: 'weakness', level: 2, effectTime: 330, condition: player.getComponent('minecraft:health').currentValue <= 5 },
                    { effect: 'regeneration', level: 1, effectTime: 40, condition: player.getComponent('minecraft:health').currentValue >= 20 },
                    { effect: 'strength', level: 2, effectTime: 330, condition: 1 }
                ],
                'arena:archaic_triple_edged_sword_archaiccharm': [
                    { effect: 'speed', level: 2, effectTime: 330, condition: player.getDynamicProperty('triple_edged_kills') >= 60 }
                ],
                'arena:bunny_hoppers_feet': [
                    { effect: 'jump_boost', level: 2, effectTime: 330, condition: 1 }
                ],
                'arena:running_shoes_feet': [
                    { effect: 'speed', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:digging_claws_gauntlet': [
                    { effect: 'haste', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:umbrella_gauntlet': [
                    { effect: 'slow_falling', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:a_obsidian_skull_talisman': [
                    { effect: 'fire_resistance', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:cross_necklace_necklace': [
                    { effect: 'resistance', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:regeneration_necklace_necklace': [
                    { effect: 'regeneration', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:scarf_of_invisibility_necklace': [
                    { effect: 'invisibility', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:n_drink_hat_head': [
                    { effect: 'saturation', level: 2, effectTime: 1, condition: 1 }
                ],
                'arena:a_night_vision_goggles_head': [
                    { effect: 'night_vision', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:snorkel_head': [
                    { effect: 'water_breathing', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:p_drink_hat_head': [
                    { effect: 'saturation', level: 1, effectTime: 1, condition: 1 }
                ],
                'arena:villager_hat_head': [
                    { effect: 'village_hero', level: 2, effectTime: 330, condition: 1 }
                ],
                'arena:bonnet_head': [
                    { effect: 'water_breathing', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:midnight_skull_head': [
                    { effect: 'fire_resistance', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:frog_leg_feet': [
                    { effect: 'jump_boost', level: 2, effectTime: 330, condition: 1 }
                ],
                'arena:frog_flipper_feet': [
                    { effect: 'jump_boost', level: 2, effectTime: 330, condition: 1 }
                ],
                'arena:lucky_horseshoe_feet': [
                    { effect: 'jump_boost', level: 2, effectTime: 330, condition: 1 }
                ],
                'arena:obsidian_horseshoe_feet': [
                    { effect: 'jump_boost', level: 2, effectTime: 330, condition: 1 },
                    { effect: 'fire_resistance', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:midnight_skull_head_feet': [
                    { effect: 'fire_resistance', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:band_of_regeneration_gauntlet': [
                    { effect: 'regeneration', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:ancient_chisel_gauntlet': [
                    { effect: 'haste', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:shackle_gauntlet': [
                    { effect: 'resistance', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:valentine_ring_ring': [
                    { effect: 'jump_boost', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:shiny_red_balloon_gauntlet': [
                    { effect: 'slow_falling', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:lucky_horseshoe_balloon_gauntlet': [
                    { effect: 'slow_falling', level: 1, effectTime: 330, condition: 1 },
                    { effect: 'jump_boost', level: 2, effectTime: 330, condition: 1 }
                ],
                'arena:obsidian_horseshoe_balloon_gauntlet': [
                    { effect: 'slow_falling', level: 1, effectTime: 330, condition: 1 },
                    { effect: 'jump_boost', level: 2, effectTime: 330, condition: 1 },
                    { effect: 'fire_resistance', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:jellyfish_necklace_necklace': [
                    { effect: 'conduit_power', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:discount_card_charm': [
                    { effect: 'village_hero', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:neptunes_shell_charm': [
                    { effect: 'conduit_power', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:cobalt_shield_charm': [
                    { effect: 'resistance', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:obsidian_shield_charm': [
                    { effect: 'resistance', level: 1, effectTime: 330, condition: 1 },
                    { effect: 'fire_resistance', level: 1, effectTime: 330, condition: 1 }
                ],
                'arena:ankh_shield_archaiccharm': [
                    { effect: 'resistance', level: 1, effectTime: 330, condition: 1 },
                    { effect: 'fire_resistance', level: 1, effectTime: 330, condition: 1 }
                ],
                ////// 
                'g:netherite_amulet_amulet': [
                    { effect: 'fire_resistance', level: 1, effectTime: 330, condition: 1 }
                ],
                'g:light_amulet_amulet': [
                    { effect: 'speed', level: 2, effectTime: 330, condition: 1 },
                    { effect: 'night_vision', level: 1, effectTime: 330, condition: 1 }
                ],
                'g:explosive_amulet_amulet': [
                    { effect: 'resistance', level: 1, effectTime: 330, condition: 1 }
                ],
                'g:crucifix_amulet_amulet': [
                    { effect: 'speed', level: 2, effectTime: 330, condition: player.getComponent('equippable').getEquipment('Offhand')?.typeId == 'minecraft:totem_of_undying' },
                    { effect: 'night_vision', level: 1, effectTime: 330, condition: player.getComponent('equippable').getEquipment('Offhand')?.typeId == 'minecraft:totem_of_undying' }
                ],
                'g:bloodlust_amulet_amulet': [
                    { effect: 'strength', level: 2, effectTime: 330, condition: 1 },
                    { effect: 'blindness', level: 1, effectTime: 330, condition: 1 }
                ],
                'g:soul_amulet_amulet': [
                    { effect: 'haste', level: 2, effectTime: 330, condition: 1 },
                    { effect: 'slowness', level: 1, effectTime: 330, condition: 1 },
                    { effect: 'invisibility', level: 1, effectTime: 330, condition: 1 }
                ],
                'g:fire_amulet_amulet': [
                    { effect: 'fire_resistance', level: 1, effectTime: 330, condition: 1 },
                    { effect: 'regeneration', level: 1, effectTime: 330, condition: feetBlock?.typeId.includes('fire') }
                ],
                'g:beserker_amulet_amulet': [
                    { effect: 'speed', level: 1, effectTime: 330, condition: player.getComponent('minecraft:health').currentValue <= 15 },
                    { effect: 'strength', level: 1, effectTime: 330, condition: player.getComponent('minecraft:health').currentValue <= 12 },
                    { effect: 'speed', level: 1, effectTime: 330, condition: player.getComponent('minecraft:health').currentValue <= 9 },
                    { effect: 'resistance', level: 2, effectTime: 330, condition: player.getComponent('minecraft:health').currentValue <= 6 },
                    { effect: 'strength', level: 1, effectTime: 330, condition: player.getComponent('minecraft:health').currentValue <= 3 }
                ],
                'g:eye_amulet_amulet': [
                    { effect: 'weakness', level: 2, effectTime: 330, condition: 1 }
                ],
                'g:firework_amulet_charm': [
                    { effect: 'speed', level: 2, effectTime: 330, condition: player.getComponent('equippable').getEquipment('Chest')?.typeId == 'minecraft:elytra' },
                    { effect: 'levitation', level: 2, effectTime: 100, condition: player.isSneaking }
                ],
                'g:arcane_amulet_charm': [
                    { effect: 'regeneration', level: 1, effectTime: 330, condition: 1 }
                ],
                'g:momentum_amulet_amulet': [
                    { effect: 'haste', level: 1, effectTime: 330, condition: player.getDynamicProperty('g:momentum_amulet_amulet') >= 15 },
                    { effect: 'haste', level: 1, effectTime: 330, condition: player.getDynamicProperty('g:momentum_amulet_amulet') >= 63 }
                ],
                'g:multi_mask_head': [
                    { effect: 'jump_boost', level: 3, effectTime: 60, condition: player.isSneaking },
                    { effect: 'speed', level: 2, effectTime: 60, condition: player.isSneaking }
                ],
                'g:shameful_amulet_amulet': [
                    { effect: 'strength', level: 2, effectTime: 330, condition: player.dimension.id == 'minecraft:nether' },
                    { effect: 'poison', level: 1, effectTime: 330, condition: player.dimension.id == 'minecraft:overworld' },
                    { effect: 'weakness', level: 1, effectTime: 330, condition: player.dimension.id == 'minecraft:the_end' }
                ],
                'g:slime_amulet_amulet': [
                    { effect: 'jump_boost', level: 2, effectTime: 330, condition: 1 },
                    { effect: 'slow_falling', level: 2, effectTime: 330, condition: 1 }
                ],
                'g:greed_amulet_amulet': [
                    { effect: 'village_hero', level: 1, effectTime: 330, condition: mainhand?.typeId == 'minecraft:emerald_block' && mainhand?.amount > 16 },
                    { effect: 'village_hero', level: 1, effectTime: 330, condition: mainhand?.typeId == 'minecraft:emerald_block' && mainhand?.amount > 32 },
                    { effect: 'village_hero', level: 1, effectTime: 330, condition: mainhand?.typeId == 'minecraft:emerald_block' && mainhand?.amount > 48 },
                    { effect: 'village_hero', level: 1, effectTime: 330, condition: mainhand?.typeId == 'minecraft:emerald_block' && mainhand?.amount > 64 }
                ]

            };
            giveEffect(player, passiveEffects, player)

            if (player.hasTag('dorios:repair_talis_necklace') || player.hasTag('dorios:mender_pendant_necklace')) {
                repair(player)
            }
        });
        // world.sendMessage(`${Date.now() - start}`)
    }, 50)
})

// Efectos que recibe el jugador pasivamente (se ejecuta cada tick, solo usar cuando es necesario)
world.afterEvents.worldInitialize.subscribe(() => {
    system.runInterval(() => {
        // We obtain all the players 
        let players = world.getAllPlayers()
        players.forEach(player => {
            if (player.hasTag('dorios:lava_waders_feet')) {
                player.runCommand('function lava_waders')
            }
            if (player.hasTag('dorios:cloud_steps_boots_feet') || player.hasTag('dorios:strong_celestial_ring_witherring')) {
                let jumps = player.getDynamicProperty('dorios:jumps') || 0
                const maxExtraJumps = player.hasTag('dorios:cloud_steps_boots_feet') + 2 * player.hasTag('dorios:strong_celestial_ring_witherring')
                if (player.isFalling && jumps < maxExtraJumps) {
                    if (player.isJumping) {
                        let { x, y, z } = player.getVelocity()
                        player.applyKnockback(x, z, Math.SQRT2 * Math.sqrt(x * x + z * z), 0.65)
                        jumps += 1
                    }
                }
                if (player.isOnGround) {
                    jumps = 0
                }
                player.setDynamicProperty('dorios:jumps', jumps)
            }
            if (player.hasTag('dorios:strong_celestial_ring_witherring') && player.isSneaking) {
                player.addEffect('slow_falling', 10)
            }
        });
    }, 1)
})



// Inmunidades a efectos (no evita el daño, simplemente el efecto es cancelado antes de recibirlo)
world.beforeEvents.effectAdd.subscribe(e => {
    const { effectType, entity } = e;
    if (entity.typeId != 'minecraft:player') return;

    const tagImmunities = {
        'dorios:purity_blossom_charm': ['Poison'],
        'dorios:wither_heart_heartycharm': ['Wither'],
        'dorios:warden_heart_heartycharm': ['Darkness', 'Blindness'],
        'dorios:night_vision_mask_head': ['Darkness', 'Blindness'],
        'dorios:soul_heart_heartycharm': ['Darkness'],
        'dorios:eternal_heart_heartycharm': ['Poison', 'Wither', 'Hunger'],
        'dorios:blood_pact_archaiccharm': ['Regeneration'],
        'dorios:strong_jade_ring_witherring': ['Poison}'],
        /////////////////////////////////// 
        'arena:poseidon_mask_head': ['Mining Fatigue'],
        'arena:kitsume_mask_head': ['Regeneration', 'Resistance', 'Strength', 'Speed', 'Jump Boost', 'Health Boost', 'Absortion', 'Fire Resistance'],
        'arena:wither_mask_head': ['Wither', 'Regeneration', 'Absortion'],
        'arena:withered_ring_jelewer_ring': ['Wither'],
        'arena:silk_ring_jelewer_ring': ['Poison'],
        'arena:shulked_ring_jelewer_ring': ['Levitation'],
        'arena:shadow_step_ring_jelewer_ring': ['Slowness'],
        'arena:obsidian_ring_jelewer_ring': ['Mining Fatigue'],
        'arena:crimson_ring_jelewer_ring': ['Weakness'],
        'arena:crimsom_amethyst_ring_jelewer_ring': ['Hunger'],
        'arena:blinding_of_shinning_ring_jelewer_ring': ['Blindness'],
        'arena:skull_heart_heartycharm': ['Regeneration'],
        'arena:demon_heart_heartycharm': ['Resistance', 'Poison'],
        'arena:nefrite_bracelet_talisman_talisman': ['Weakness', 'Mining Fatigue'],
        'arena:shulked_doll_doll': ['Strength'],
        'arena:bee_doll_doll': ['Speed'],
        'arena:gold_doll_doll': ['Resistance'],
        'arena:archaic_incript_paper_archaiccharm': ['Darkness'],
        'arena:archaic_good_and_evil_flower_archaiccharm': ['Wither', 'Speed'],
        'arena:archaic_soul_hand_archaiccharm': ['Wither', 'Haste'],
        'arena:nefrite_crow_charm_charm': ['Poison', 'Wither', 'Hunger'],
        'arena:blindfold_head': ['Darkness', 'Blindness'],
        'arena:phantom_eye_head': ['Darkness'],
        'arena:midnight_skull_head': ['Darkness'],
        'arena:bezoar_talisman': ['Poison'],
        'arena:adhesive_bandage_talisman': ['Wither'],
        'arena:fast_clock_talisman': ['Slowness'],
        'arena:chorus_heart_talisman': ['Levitation'],
        'arena:forbidden_fruit_talisman': ['Hunger'],
        'arena:vitamins_talisman': ['Weakness', 'Mining Fatigue'],
        'arena:medicated_bandage_talisman': ['Wither', 'Poison'],
        'arena:chorus_clock_talisman': ['Slowness', 'Levitation'],
        'arena:ankh_charm_archaiccharm': ['Poison', 'Wither', 'Slowness', 'Mining Fatigue', 'Darkness', 'Blindness', 'Hunger', 'Levitation', 'Weakness'],
        'arena:ankh_shield_archaiccharm': ['Poison', 'Wither', 'Slowness', 'Mining Fatigue', 'Darkness', 'Blindness', 'Hunger', 'Levitation', 'Weakness'],
        /////////////////////////////////// 
        'g:neutralizer_amulet_amulet': ['Night Vision', 'Regeneration', 'Resistance', 'Strength', 'Speed', 'Jump Boost', 'Health Boost', 'Absortion', 'Fire Resistance', 'Poison', 'Wither', 'Slowness', 'Mining Fatigue', 'Darkness', 'Blindness', 'Hunger', 'Levitation', 'Weakness']

    };


    for (const [tag, effects] of Object.entries(tagImmunities)) {
        if (entity.hasTag(tag) && effects.some(effect => effectType.includes(effect))) {
            e.duration = -1;
        }
    }
})



// Se ejecuta al golpear a una entidad
world.afterEvents.entityHurt.subscribe(e => {
    const { hurtEntity, damageSource, damage } = e
    const undead = [
        "minecraft:bogged",
        "minecraft:drowned",
        "minecraft:husk",
        "minecraft:phantom",
        "minecraft:skeleton",
        "minecraft:skeleton_horse",
        "minecraft:stray",
        "minecraft:wither_skeleton",
        "minecraft:zoglin",
        "minecraft:zombie",
        "minecraft:zombie_horse",
        "minecraft:zombie_pigman",
        "minecraft:zombie_villager"
    ];
    let attacker = damageSource.damagingEntity
    if (attacker?.typeId == 'minecraft:player') {
        // Effects list
        // effect: is the name of the effect
        // condition: if it needs an external condition or even having another tag (for doing sets)
        // If the trinket doesnt need any conditions, write 1 or True
        // level: the level of the given effect

        // Tag = item identifier + slot
        const activeEffects = {
            'dorios:venom_gauntlet_gauntlet': [
                { effect: 'poison', level: 1, condition: damageSource.cause != 'projectile', effectTime: 120 }
            ],
            'dorios:ice_claw_gauntlet': [
                { effect: 'slowness', level: 1, condition: damageSource.cause != 'projectile', effectTime: 120 }
            ],
            'dorios:venom_claw_gauntlet': [
                { effect: 'poison', level: 1, condition: damageSource.cause != 'projectile', effectTime: 120 }
            ],
            'dorios:frost_quiver_body': [
                { effect: 'slowness', level: 1, condition: damageSource.cause == 'projectile', effectTime: 120 }
            ],
            'dorios:venom_quiver_body': [
                { effect: 'poison', level: 1, condition: damageSource.cause == 'projectile', effectTime: 120 }
            ]
        };
        // Estos hacen cosas diferentes a efectos 
        if (attacker.hasTag('dorios:fire_gauntlet_gauntlet') && damageSource.cause != 'projectile') {
            hurtEntity.setOnFire(3)
        }
        if (attacker.hasTag('dorios:fire_claw_gauntlet') && damageSource.cause != 'projectile') {
            hurtEntity.setOnFire(3)
        }
        if (attacker.hasTag('dorios:strong_inferno_ring_witherring') || attacker.hasTag('dorios:blazing_amulet_amulet')) {
            hurtEntity.setOnFire(3)
        }
        if (attacker.hasTag('dorios:molten_quiver_body') && damageSource.cause == 'projectile') {
            hurtEntity.setOnFire(3)
        }
        // Life Steal Start
        let health = attacker.getComponent('minecraft:health').currentValue
        if (attacker.hasTag('dorios:blood_pact_archaiccharm')) {
            health += damage * 0.12
        }
        if (attacker.hasTag('dorios:bloodbound_amulet_amulet')) {
            health += damage * 0.06
        }
        if (attacker.hasTag('dorios:blood_pendant_necklace')) {
            health += damage * 0.02
        }
        if (attacker.hasTag('dorios:bloodgem_talisman')) {
            health += damage * 0.04
        }
        if (attacker.hasTag('dorios:bloodtide_chalice_charm')) {
            health += damage * 0.10
        }
        attacker.getComponent('minecraft:health').setCurrentValue(health)
        // Life Steal End

        if (attacker.hasTag('dorios:holy_cross_talisman') && undead.includes(hurtEntity?.typeId)) {
            hurtEntity.applyDamage(damage * 0.5)
        }
        if (attacker.hasTag('dorios:strong_echo_ring_witherring')) {
            system.runTimeout(() => {
                hurtEntity.applyDamage(damage * 0.25)
            }, 20)
        }
        if (attacker.hasTag('dorios:strong_breeze_ring_witherring')) {
            hurtEntity.dimension.spawnEntity('wind_charge_projectile', hurtEntity.location)
        }
        giveEffect(attacker, activeEffects, hurtEntity)
    }
    if (hurtEntity?.typeId == 'minecraft:player') {

        // Effects list
        // effect: is the name of the effect
        // condition: if it needs an external condition or even having another tag (for doing sets)
        // If the trinket doesnt need any conditions, write 1 or True
        // level: the level of the given effect

        // Tag = item identifier + slot
        const activeEffects = {
        }
        if (hurtEntity.hasTag('dorios:rush_of_fear_necklace') && !hurtEntity.hasTag('rush_of_fear_on')) {
            hurtEntity.addTag('rush_of_fear_on')
            abilities(hurtEntity)
            system.runTimeout(() => {
                hurtEntity.removeTag('rush_of_fear_on')
                abilities(hurtEntity)
            }, 40)
        }
        if (hurtEntity.hasTag('dorios:voodoo_doll')) {
            attacker?.applyDamage(damage * 0.1)
            let health = hurtEntity.getComponent('minecraft:health').currentValue
            hurtEntity.getComponent('minecraft:health').setCurrentValue(health + damage * 0.1)
        }
        if (hurtEntity.hasTag('dorios:strong_ender_ring_witherring') && Math.random() <= 0.2) {
            let health = hurtEntity.getComponent('minecraft:health').currentValue
            hurtEntity.getComponent('minecraft:health').setCurrentValue(health + damage)
        }
        // giveEffect(hurtEntity, activeEffects, attacker)
    }

})

world.afterEvents.entityDie.subscribe((e) => {
    const { deadEntity, damageSource } = e
    let attacker = damageSource?.damagingEntity
    if (attacker?.hasTag('dorios:bloodbound_emblem_body')) {
        attacker.addTag('bloodemblem_active')
        system.runTimeout(() => {
            attacker.removeTag('bloodemblem_active')
        }, 60)
    }
})


//////////////////////////////////////////////////////////////////////////////////////////////////// Funciones (Ignorar)

// Funcion de reparar
function repair(player) {
    let equippable = player.getComponent('equippable')
    let equipmentSet = ['Mainhand']
    if (player.hasTag('dorios:mender_pendant_necklace')) equipmentSet.push('Head', 'Chest', 'Legs', 'Feet', 'Offhand')
    for (let equipment of equipmentSet) {
        const item = equippable.getEquipment(equipment)
        if (item != undefined) {
            const durability = item.getComponent('minecraft:durability')
            if (item.hasComponent('minecraft:durability') && durability.damage != 0) {
                durability.damage = Math.max(durability.damage - 1)
                equippable.setEquipment(equipment, item)
            }
        }
    }
}

function giveEffect(player, tags, entity) {
    let effects = {};
    let effectTimes = {}; // Almacenar tiempos de cada efecto
    for (const [tag, effectList] of Object.entries(tags)) {
        if (!player.hasTag(tag)) continue;

        effectList.forEach(({ effect, condition, level, effectTime }) => {
            if (condition) {
                // Suma niveles correctamente y actualiza tiempos
                effects[effect] = (effects[effect] || 0) + level; // Suma niveles directamente
                effectTimes[effect] = Math.max(effectTimes[effect] || 0, effectTime);
            }
        });
    }

    // Manejo de efectos en conflicto
    const conflictingEffects = [
        { effect1: 'poison', effect2: 'regeneration' },
        { effect1: 'weakness', effect2: 'strength' },
        { effect1: 'mining_fatigue', effect2: 'haste' },
        { effect1: 'slowness', effect2: 'speed' }
    ];

    conflictingEffects.forEach(({ effect1, effect2 }) => {
        const level1 = effects[effect1] || 0;
        const level2 = effects[effect2] || 0;

        if (level1 > 0 && level2 > 0) {
            if (level1 === level2) {
                // Si los niveles son iguales, ambos se cancelan
                delete effects[effect1];
                delete effects[effect2];
                delete effectTimes[effect1];
                delete effectTimes[effect2];
            } else {
                // Mantiene el efecto más fuerte
                const strongerEffect = level1 > level2 ? effect1 : effect2;
                const weakerEffect = level1 > level2 ? effect2 : effect1;
                effects[strongerEffect] = Math.abs(level1 - level2);
                delete effects[weakerEffect];
                delete effectTimes[weakerEffect];
            }
        }
    });

    // Aplica los efectos al jugador con los tiempos correctos
    for (const [effectName, level] of Object.entries(effects)) {
        const time = effectTimes[effectName] || 0; // Tiempo correspondiente
        entity.addEffect(effectName, time, { amplifier: level - 1, showParticles: false }); // Amplificador comienza en 0
    }
}


const initialValues = {
    health: 20,
    speed: 0.1,
    attack: 1,
    waterSpeed: 0.02,
    lavaSpeed: 0.01,
    fallingD: 1,
    knockback: 0,
    attacksD: 1,
    defense: 1,
};

const minValues = {
    health: 2,
    speed: 0.05,
    attack: 1,
    waterSpeed: 0.002,
    lavaSpeed: 0.002,
    fallingD: 0,
    knockback: 0,
    attacksD: 0,
    defense: 0.25,
};

function abilities(source) {
    const stats = { ...initialValues };
    const tags = source.getTags();

    for (const tag of tags) {
        const baseTag = tag.slice(0, tag.lastIndexOf('_')); // Quitar sufijo del tag
        const trinket = trinkets.find(t => t.identifier === baseTag);
        if (trinket) {
            for (const [key, value] of Object.entries(trinket)) {
                if (key !== "identifier" && key !== "slot") {
                    stats[key] = (stats[key] ?? 0) + value;
                }
            }
        }
    }

    // Aplicar límites mínimos
    for (const [key, value] of Object.entries(stats)) {
        if (minValues[key] !== undefined && value < minValues[key]) {
            stats[key] = minValues[key];
        }
    }

    let tick = 0;

    for (const [key, value] of Object.entries(stats)) {
        system.runTimeout(() => {
            world.sendMessage(`minecraft:${key}${value}`);
            source.triggerEvent(`minecraft:${key}${value}`);
        }, tick);
        tick++; // siguiente evento se ejecuta un tick después
    }
}



export { trinkets, abilities }
