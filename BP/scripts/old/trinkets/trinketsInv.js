import { world, system, ItemStack } from '@minecraft/server'
import { trinkets, abilities } from 'trinkets/trinkets.js'

const slots = [
    { slot: 'head', index: 0 },
    { slot: 'body', index: 1 },
    { slot: 'feet', index: 2 },
    { slot: 'necklace', index: 3 },
    { slot: 'ring', index: 4 },
    { slot: 'charm', index: 5 },
    { slot: 'gauntlet', index: 7 },
    { slot: 'talisman', index: 6 },
    { slot: 'heartycharm', index: 8 },
    { slot: 'doll', index: 9 },
    { slot: 'witherring', index: 10 },
    { slot: 'archaiccharm', index: 11 },
    { slot: 'amulet', index: 12 }
]

function loadEntityInv(player, entity) {
    slots.forEach(slot => {
        player.getTags().forEach(tag => {
            let beforeChar = tag[tag.length - (slot.slot.length + 1)]
            if (tag.includes(slot.slot) && beforeChar == '_') {
                let entityInv = entity.getComponent('inventory').container
                if (!entityInv) return;
                let trinket = new ItemStack(tag.slice(0, tag.length - (slot.slot.length + 1)))
                entityInv.setItem(slot.index, trinket)
            }
        })
    })
}

function getInvEntity(player) {
    const entities = player.dimension.getEntities({
        tags: [player.id]
    })
    if (entities.length == 0) {
        return false;
    }
    return entities[0];
}

function summonInvEntity(player) {
    let entity = player.dimension.spawnEntity('dorios:trinket_manager', player.location)
    entity.addTag(`${player.id}`)
    entity.getComponent('minecraft:tameable').tame(player)
    entity.nameTag = "dorios trinkets"
}

function trinketToTag(trinket) {
    let id = trinket.identifier
    let slot = trinket.slot
    if (!trinket) return;
    let tag = id + "_" + slot
    return tag;
}

export { trinketToTag }

function trinketUse(player, trinket) {
    let slotInfo = slots.find(slot => slot.slot == trinket.slot)
    let eqquiped = false
    if (!slotInfo) return;
    player.getTags().forEach(tag => {
        if (tag.includes(slotInfo.slot) && !eqquiped) {
            eqquiped = true;
        }
    })
    if (eqquiped) {
        player.onScreenDisplay.setActionBar('§4You already have a trinket on that slot')
        player.playSound('random.break')
        return;
    } else {
        player.addTag(trinketToTag(trinket))
        player.runCommand(`clear @s ${trinket.identifier} 0 1`)
        player.playSound('armor.equip_leather')
        return;
    }
}

function trinketCheck(player, slot, slotIndex) {
    let trinketInv = player.dimension.getEntities({
        tags: [`${player.id}`]
    })[0]
    if (!trinketInv) return;
    let entityInv = trinketInv.getComponent('inventory').container
    let playerInv = player.getComponent('inventory').container
    if (!entityInv) return;
    let invSlot = entityInv.getSlot(slotIndex)
    let entityItem = invSlot.getItem()
    if (entityItem == undefined) {
        let tag = player.getTags().find(tag => tag.includes(slot))
        if (!tag) return;
        player.removeTag(tag)
        return;
    }
    let trinket = trinkets.find(trnkt => trnkt.identifier == invSlot.typeId)
    let item = new ItemStack(`${invSlot.typeId}`, invSlot.amount)
    if (trinket?.slot == slot) {
        if (!player.hasTag(trinketToTag(trinket))) {
            player.getTags().forEach(tag => {
                if (tag.endsWith(`_${slot}`)) {
                    if (tag != trinketToTag(trinket)) {
                        player.removeTag(tag)
                    }
                }
            })

            player.addTag(trinketToTag(trinket))
        } else {
            return;
        }
    } else {
        //If your inventory is full it returns the item
        if (trinket) {
            let trinketSlot = slots.find(slot => slot.slot == trinket.slot)
            invSlot = entityInv.getSlot(trinketSlot.index)
            let itemOnSlot = invSlot.getItem()
            if (itemOnSlot == undefined) {
                entityInv.moveItem(slotIndex, trinketSlot.index, entityInv)
            } else {
                entityInv.setItem(slotIndex)
                if (playerInv.emptySlotsCount == 0) {
                    player.dimension.spawnItem(item, player.location)
                } else {
                    playerInv.addItem(item)
                }
            }
            return;
        }
        item.setLore(invSlot.getLore())
        entityInv.setItem(slotIndex)
        if (playerInv.emptySlotsCount == 0) {
            player.dimension.spawnItem(item, player.location)
        } else {
            playerInv.addItem(item)
        }
    }
}

world.afterEvents.itemUse.subscribe(e => {
    const { itemStack, source } = e
    if (itemStack.typeId == "minecraft:enchanted_book") {
        let equip = source.getComponent('equippable');
        let enchant = itemStack?.getComponent("enchantable");
        const enchList = enchant?.getEnchantments();
        if (equip && enchant && enchList) {
            if (source.hasTag('arena:archaic_cursed_book_archaiccharm')) {
                if (source.level >= 7) {
                    let changed = false;
                    for (const e of enchList) {
                        let levelMax = e.type["maxLevel"]
                        const level = enchList[e.level]
                        if (e && e.level < levelMax) {
                            e.level += 1;
                            enchant.removeEnchantment(e.type)
                            enchant.addEnchantment(e);
                            source.addLevels(-7);
                            changed = true;
                            if (changed) {
                                equip.setEquipment('Mainhand', itemStack);
                            }
                        }
                    }
                }
            }
        }
    }
    let trinket = trinkets.find(trnkt => itemStack.typeId == trnkt.identifier)
    if (!trinket) return;
    trinketUse(source, trinket)
    abilities(source)
})



world.afterEvents.worldInitialize.subscribe(() => {
    world.getDimension('overworld').runCommandAsync('tickingarea add 0 0 0 0 0 0 dorios')
})

system.runInterval(() => {
    world.getPlayers().forEach(player => {
        let mainHand = player.getComponent('equippable').getEquipment('Mainhand')
        if (!mainHand) {
            const trinketInv = getInvEntity(player)
            if (!trinketInv) {
                return;
            } else {
                trinketInv.remove()
            }
            return;
        };
        let mainHandItem = mainHand.typeId
        if (mainHandItem != 'dorios:trinket_manager' && mainHandItem != 'dorios:scroll') {
            const trinketInv = getInvEntity(player)
            if (!trinketInv) {
                return;
            } else {
                trinketInv.remove()
            }
            return;
        } else {
            /////// Lock item when hold
            const mainHandSlot = player.selectedSlotIndex
            let hasAxolotl = player.hasTag('arena:poseidon_mask_head')
            system.runTimeout(() => {
                if (player.hasTag('arena:poseidon_mask_head') != hasAxolotl) {
                    player.triggerEvent('minecraft:breath_normal')
                }
                if (player.getComponent('equippable').getEquipment('Mainhand')?.typeId == mainHandItem) {
                    mainHand.lockMode = "slot"
                    player.getComponent('inventory').container.setItem(mainHandSlot, mainHand)
                } else {
                    mainHand.lockMode = "none"
                    player.getComponent('inventory').container.setItem(mainHandSlot, mainHand)
                    abilities(player)
                }
            }, 1)
            ///////

            const trinketInv = getInvEntity(player)
            if (!trinketInv) {
                summonInvEntity(player)
                return;
            }
            if (!trinketInv.getTags().includes('dorios:invLoaded')) {
                loadEntityInv(player, trinketInv)
                trinketInv.addTag('dorios:invLoaded')
            }
            let { x, y, z } = player.getHeadLocation()
            x += (player.getViewDirection().x * 0.5)
            y += (player.getViewDirection().y * 0.5)
            z += (player.getViewDirection().z * 0.5)
            trinketInv.teleport({ x, y, z }, { dimension: player.dimension })
        }
        for (let slot of slots) {
            trinketCheck(player, slot.slot, slot.index)
        }
    })
})

