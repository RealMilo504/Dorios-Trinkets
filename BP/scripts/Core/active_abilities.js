import { system, world } from '@minecraft/server'
import { getStatCategory } from './stats_manager.js'
import { manaBarFrames } from './config.js'
import { applyUniversalTrinketEffect } from './update_stats.js'


const activesEffectHandlers = {
    fireAspect: (entity, value) => {
        entity.setOnFire(value);
    },
    knockback: (entity, value, attacker) => {
        if (!attacker?.getViewDirection) return;

        const dir = attacker.getViewDirection(); // Vector con x, y, z
        entity.applyKnockback?.(
            {
                x: dir.x * value,
                z: dir.z * value
            },
            dir.y * value
        );
    },
    manaSteal: (_entity, value, attacker, stats) => {
        let manaScore = world.scoreboard.getObjective('dorios:mana');
        let mana = manaScore.getScore(attacker.scoreboardIdentity) || 0;
        const maxMana = stats.mana;
        const regen = Math.min((value / 100) * maxMana, maxMana - mana)
        mana += regen
        manaScore.setScore(attacker.scoreboardIdentity, mana);

        const percentage = mana / maxMana;
        const frameIndex = Math.floor(percentage * (manaBarFrames.length - 1));
        const bar = manaBarFrames[frameIndex];
        if (attacker.getGameMode() != 'creative') {
            attacker.onScreenDisplay.setActionBar(`                         ${bar}`);
        }
    }
};

world.afterEvents.entityHurt.subscribe(e => {
    const { hurtEntity, damageSource, damage } = e
    const { damagingProjectile, damagingEntity, cause } = damageSource

    // Damage emitted by this handler must not re-enter the stat pipeline.
    if (cause == 'thorns' || cause == 'override') return

    if (damagingEntity?.typeId == 'minecraft:player') {
        const player = damagingEntity
        const actives = getStatCategory(player, 'actives');
        if (actives) {
            applyActiveStatusEffects(hurtEntity, actives);
        }

        const stats = getStatCategory(player, 'stats')
        const context = { cause, damage, damagingProjectile }
        if (stats) {
            applystatsEffects(hurtEntity, stats, player, context)
        }

    }

    if (hurtEntity?.typeId == 'minecraft:player') {
        const player = hurtEntity
        const stats = getStatCategory(player, 'stats');
        if (stats) {
            if (stats.thorns <= 0) return
            damagingEntity?.applyDamage((stats.thorns / 100) * damage, {
                damagingEntity: hurtEntity,
                cause: 'thorns'
            })
        }
    }
})


function applyActiveStatusEffects(entity, actives) {
    for (const [effectName, level] of Object.entries(actives)) {
        try {
            applyUniversalTrinketEffect(entity, effectName, level - 1)
        } catch (e) {
            console.warn(`[Dorios RPG Core] Error applying active effect '${effectName}':`, e);
        }
    }
}

function applystatsEffects(entity, stats, attacker, context) {
    for (const [effectName, value] of Object.entries(stats)) {
        if (value <= 0) continue
        // try {
        const handler = activesEffectHandlers[effectName];
        if (handler) {
            handler(entity, value, attacker, stats, context);
        }
        // } catch (e) {
        //     console.warn(`[Dorios RPG Core] Error applying stats effect '${effectName}':`, e);
        // }
    }
}
