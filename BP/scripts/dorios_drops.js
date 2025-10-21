import { world, ItemStack } from '@minecraft/server'

world.afterEvents.entityDie.subscribe(e => {
    const { deadEntity, damageSource } = e;

    const entityDrops = {
        'minecraft:zombie': [
            { item: 'dorios:rotten_heart', amount: 1, prob: 5, condition: 1 }
        ],
        'minecraft:witch': [
            { item: 'dorios:candy_heart', amount: 1, prob: 5, condition: 1 },
            { item: 'dorios:purity_blossom', amount: 1, prob: 5, condition: 1 }
        ],
        'minecraft:enderman': [
            { item: 'dorios:black_heart', amount: 1, prob: 5, condition: 1 }
        ],
        'minecraft:phantom': [
            { item: 'dorios:cloud_steps_boots', amount: 1, prob: 5, condition: 1 }
        ],
        'minecraft:strider': [
            { item: 'dorios:lava_waders', amount: 1, prob: 5, condition: 1 }
        ],
        'minecraft:wither': [
            { item: 'dorios:wither_heart', amount: 1, prob: 5, condition: 1 }
        ],
        'minecraft:rabbit': [
            { item: 'dorios:rabbit_rush', amount: 1, prob: 25, condition: 1 }
        ],
        'minecraft:vindicator': [
            { item: 'dorios:warrior_ring', amount: 1, prob: 5, condition: 1 }
        ],
        'minecraft:stray': [
            { item: 'dorios:frost_quiver', amount: 1, prob: 10, condition: 1 }
        ],
        // 'minecraft:skeleton': [
        //     { item: 'dorios:molten_quiver', amount: 1, prob: 5, condition: deadEntity?.dimension?.id == 'minecraft:nether' }
        // ],
        'minecraft:piglin_brute': [
            { item: 'dorios:strong_brute_ring', amount: 1, prob: 10, condition: 1 }
        ],
        'minecraft:shulker': [
            { item: 'dorios:strong_shulker_ring', amount: 1, prob: 10, condition: 1 }
        ],
        'minecraft:ender_dragon': [
            { item: 'dorios:dragon_heart', amount: 1, prob: 20, condition: 1 }
        ]
    };

    if (!damageSource.damagingEntity || damageSource.damagingEntity.typeId !== 'minecraft:player') return;
    const player = damageSource.damagingEntity;
    const drops = entityDrops[deadEntity.typeId];
    if (!drops) return;




    drops.forEach(drop => {
        if (!drop.condition) return;

        const randomChance = Math.random() * 100;
        if (randomChance <= drop.prob) {
            try {
                deadEntity.dimension.spawnItem(new ItemStack(drop.item, drop.amount), deadEntity.location);
            } catch {
                player.dimension.spawnItem(new ItemStack(drop.item, drop.amount), player.location);
            }
        }
    });
});