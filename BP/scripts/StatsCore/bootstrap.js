import { initializeBlessingGate, initializeCombatModule } from "./combat/index.js";
import { initializeMiningModule } from "./mining/index.js";
import { initializeArmorSupportModule } from "./support/armor.js";
import { initializeBootDashModule } from "./support/dash.js";
import { initializeElytraSupportModule } from "./support/elytra.js";
import { initializeStatsCoreRuntime } from "./runtime.js";
import { initializeStatsCoreScriptEvents } from "./scriptEvents.js";
import { initializeUtilityInteractionModule } from "./utility/index.js";
import { initializeEventDrivenStatsModule } from "./eventDriven/index.js";
import { initializeWindMiningElement } from "./elements/windMining.js";
import { initializeStatsCoreActionbarBridge } from "./shared/messages.js";
import { initializeStatsCoreEffects } from "./effects/index.js";

if (!globalThis.__doriosStatsCoreInitialized) {
    globalThis.__doriosStatsCoreInitialized = true;

    initializeStatsCoreRuntime();
    initializeStatsCoreActionbarBridge();
    initializeStatsCoreEffects();
    // Blessing decides first so a protected hit cannot reach damage bonuses,
    // defensive side effects, vanilla knockback, or delayed procs.
    initializeBlessingGate();
    initializeUtilityInteractionModule();
    initializeArmorSupportModule();
    initializeEventDrivenStatsModule();
    initializeWindMiningElement();
    initializeCombatModule();
    initializeMiningModule();
    initializeBootDashModule();
    initializeElytraSupportModule();
    initializeStatsCoreScriptEvents();

    // The physical Ascendant Refining Table remains an addon-level adapter;
    // StatsCore's own typed commands use the local refinement configuration.
}

