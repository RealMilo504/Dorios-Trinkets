import { system, ItemStack, world } from "@minecraft/server";
import {
  changeItemAmount,
  getEquipment,
  isPlayerTracking,
  startPlayerTracking,
  stopPlayerTracking,
} from "../DoriosLib/entity/index.js";
import { data, getCompatibleTrinketSlotKeys, slots } from "./config.js";
import { getStatCategory, displayStats, updatePlayerStats } from "./stats_manager.js";

const trinketEntities = new Map();
const menuStates = new Map();
const orphanCheckedPlayers = new Set();
const MENU_VALIDATION_INTERVAL = 4;
let trinketSlotEntries;

function getTrinketSlotEntries() {
  if (!trinketSlotEntries) {
    trinketSlotEntries = Object.freeze(Object.entries(slots));
  }
  return trinketSlotEntries;
}

function getEntrySlotKeys(entry) {
  return getCompatibleTrinketSlotKeys(entry?.trinket);
}

function getEntrySlotIndices(entry) {
  return getEntrySlotKeys(entry).map(slotName => slots[slotName]);
}

function findAvailableEntrySlot(container, entry) {
  for (const index of getEntrySlotIndices(entry)) {
    if (!container.getItem(index)) return index;
  }
  return undefined;
}

function allocateTaggedSlots(player) {
  const occupied = new Set();
  for (const tag of player.getTags()) {
    if (isAuxiliaryTag(tag)) continue;
    const entry = data[tag];
    if (!entry?.trinket) continue;
    const index = getEntrySlotIndices(entry).find(candidate => !occupied.has(candidate));
    if (index !== undefined) occupied.add(index);
  }
  return occupied;
}

const TRACKING_OPTIONS = Object.freeze({
  anchor: "head",
  viewOffset: 0.5,
  velocityFactor: 5,
  offset: { x: 0, y: -0.5, z: 0 },
});

function isAuxiliaryTag(tag) {
  return tag.endsWith("_tag");
}

world.afterEvents.itemUse.subscribe((e) => {
  if (e.itemStack.typeId == "dorios:stats_scroll") displayStats(e.source);
  if (e.itemStack.typeId == "dorios:recover_scroll") unequipAllTrinkets(e.source);
  tryEquipTrinket(e.source, e.itemStack);
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  menuStates.delete(playerId);
  orphanCheckedPlayers.delete(playerId);
  const entity = trinketEntities.get(playerId);
  if (!entity) return;

  stopPlayerTracking(entity);
  trinketEntities.delete(playerId);
  if (entity.isValid) entity.remove();
});

export function trinketTick(player) {
  const tick = system.currentTick;
  const playerId = player.id;
  const mainHand = getEquipment(player, "Mainhand");
  if (!mainHand || mainHand?.typeId != "dorios:scroll") {
    const menuState = menuStates.get(playerId);
    const cachedEntity = trinketEntities.get(playerId);

    // Capture the last UI transaction before removing its backing entity.
    if (menuState && cachedEntity?.isValid) {
      validateTrinketSlots(player, cachedEntity);
    }
    closeMenuState(player);

    // Recover stale entities once per player session, not once per tick.
    const searchForOrphan = !orphanCheckedPlayers.has(playerId);
    orphanCheckedPlayers.add(playerId);
    removeInvEntity(player, searchForOrphan);
    return;
  }

  orphanCheckedPlayers.add(playerId);
  const mainHandSlot = player.selectedSlotIndex;
  let menuState = menuStates.get(playerId);
  if (!menuState || menuState.slot !== mainHandSlot) {
    closeMenuState(player);
    menuState = { slot: mainHandSlot, lastValidationTick: -MENU_VALIDATION_INTERVAL };
    menuStates.set(playerId, menuState);

    // Lock only on the open transition instead of rewriting the stack every tick.
    system.runTimeout(() => {
      if (!player.isValid || player.selectedSlotIndex !== mainHandSlot) return;
      setScrollLock(player, mainHandSlot, "slot");
    }, 1);
  }

  const trinketInv = getOrCreateInvEntity(player);
  if (!trinketInv.getTags().includes("dorios:trinket_loaded")) {
    loadEntityInv(player, trinketInv);
    trinketInv.addTag("dorios:trinket_loaded");
  }

  if (tick - menuState.lastValidationTick >= MENU_VALIDATION_INTERVAL) {
    menuState.lastValidationTick = tick;
    validateTrinketSlots(player, trinketInv);
  }
}

function closeMenuState(player) {
  const state = menuStates.get(player.id);
  if (!state) return;
  setScrollLock(player, state.slot, "none");
  menuStates.delete(player.id);
}

function setScrollLock(player, slotIndex, lockMode) {
  const container = player.getComponent("inventory")?.container;
  const scroll = container?.getItem(slotIndex);
  if (!scroll || scroll.typeId !== "dorios:scroll") return;
  scroll.lockMode = lockMode;
  container.setItem(slotIndex, scroll);
}

function loadEntityInv(player, entity) {
  const container = entity.getComponent("inventory")?.container;
  if (!container) return;

  const tags = player.getTags();

  for (const tag of tags) {
    const entry = data[tag];
    if (!entry?.trinket) continue;
    if (isAuxiliaryTag(tag)) continue; // Evitar cargar tags auxiliares

    let item;
    try {
      item = new ItemStack(tag);
    } catch {
      continue;
    } // Si el item no existe, saltar

    const index = findAvailableEntrySlot(container, entry);
    if (index === undefined) {
      returnItemToPlayer(player, item);
      player.removeTag(tag);
      continue;
    }

    container.setItem(index, item);
  }
}

function returnItemToPlayer(player, item) {
  const inventory = player.getComponent("inventory")?.container;
  try {
    const remainder = inventory?.addItem(item);
    if (remainder) player.dimension.spawnItem(remainder, player.location);
    else if (!inventory) player.dimension.spawnItem(item, player.location);
  } catch {
    try { player.dimension.spawnItem(item, player.location); } catch { }
  }
}

function validateTrinketSlots(player, entity) {
  const container = entity.getComponent("inventory")?.container;
  const playerInv = player.getComponent("inventory")?.container;
  if (!container || !playerInv) return;

  const currentTags = new Set(player.getTags());
  const expectedTags = new Set();
  let loadoutChanged = false;

  for (const [_slotName, index] of getTrinketSlotEntries()) {
    const slot = container.getSlot(index);
    const item = slot?.getItem();
    if (!item) continue;

    const id = item.typeId;
    const entry = data[id];

    const isTrinket = entry?.trinket;
    const passesCondition = entry?.condition != undefined ? entry.condition(player) : true;
    // Si no está en data, no es trinket, o falla condición → quitarlo
    if (!entry || !isTrinket || !passesCondition) {
      container.setItem(index);
      loadoutChanged = true;
      if (playerInv.emptySlotsCount > 0) {
        playerInv.addItem(item);
      } else {
        player.dimension.spawnItem(item, player.location);
      }
      continue;
    }

    const compatibleIndices = getEntrySlotIndices(entry);

    // Numbered family slots are valid destinations for the same item type.
    // An item is moved only when it is outside every compatible slot.
    if (!compatibleIndices.includes(index)) {
      const correctIndex = compatibleIndices.find(candidate => !container.getItem(candidate));

      if (correctIndex !== undefined) {
        container.moveItem(index, correctIndex, container);
        loadoutChanged = true;
      } else {
        container.setItem(index);
        loadoutChanged = true;
        if (playerInv.emptySlotsCount > 0) {
          playerInv.addItem(item);
        } else {
          player.dimension.spawnItem(item, player.location);
        }
        continue;
      }
    }
    expectedTags.add(id);
    // Agregar el tag si aún no lo tiene
    if (!currentTags.has(id)) {
      player.addTag(id);
      loadoutChanged = true;
    }
  }

  // Quitar tags de trinkets que ya no están o que fallan su condición
  for (const tag of currentTags) {
    if (isAuxiliaryTag(tag)) continue;

    const entry = data[tag];
    if (!entry?.trinket) continue;

    const condition = typeof entry.condition === "function" ? entry.condition(player) : true;
    if (!expectedTags.has(tag) || !condition) {
      player.removeTag(tag);
      loadoutChanged = true;
    }
  }

  if (loadoutChanged) clearGlobalImmuneEffects(player);
}

function summonInvEntity(player) {
  const entity = player.dimension.spawnEntity("dorios:trinkets_inv", player.location);
  entity.addTag(`${player.id}`);
  entity.getComponent("minecraft:tameable").tame(player);
  entity.nameTag = "Dorios Trinkets";
  return trackInvEntity(player, entity);
}

function getOrCreateInvEntity(player) {
  const cached = trinketEntities.get(player.id);
  if (cached?.isValid) {
    if (!isPlayerTracking(cached)) startPlayerTracking(cached, player, TRACKING_OPTIONS);
    return cached;
  }

  if (cached) stopPlayerTracking(cached);
  trinketEntities.delete(player.id);
  const existing = player.dimension.getEntities({
    tags: [player.id],
    type: "dorios:trinkets_inv",
  })[0];
  return existing ? trackInvEntity(player, existing) : summonInvEntity(player);
}

/**
 * Permanently consumes an equipped trinket without materializing another copy.
 * Equipped trinkets are persisted by player tag; the backing inventory entity
 * only exists while the trinket menu is open.
 */
export function consumeEquippedTrinket(player, itemId) {
  const entry = data[itemId];
  if (!player?.isValid || !entry?.trinket || !player.hasTag(itemId)) return false;

  const entity = trinketEntities.get(player.id);
  const container = entity?.isValid
    ? entity.getComponent("inventory")?.container
    : undefined;
  const slotIndex = getEntrySlotIndices(entry).find(index => container?.getItem(index)?.typeId === itemId);
  const equippedStack = slotIndex === undefined ? undefined : container?.getItem(slotIndex);

  if (equippedStack?.typeId === itemId) container.setItem(slotIndex);
  player.removeTag(itemId);
  clearGlobalImmuneEffects(player);
  updatePlayerStats(player);
  return true;
}

function trackInvEntity(player, entity) {
  trinketEntities.set(player.id, entity);
  startPlayerTracking(entity, player, TRACKING_OPTIONS);
  return entity;
}

function removeInvEntity(player, searchForOrphan = false) {
  const cached = trinketEntities.get(player.id);
  const entity = cached?.isValid
    ? cached
    : searchForOrphan ? player.dimension.getEntities({
      tags: [player.id],
      type: "dorios:trinkets_inv",
    })[0] : undefined;

  trinketEntities.delete(player.id);
  if (cached && cached !== entity) stopPlayerTracking(cached);
  if (!entity) return;
  stopPlayerTracking(entity);
  if (entity.isValid) entity.remove();
}

function tryEquipTrinket(player, item) {
  const id = item?.typeId;
  if (!id || !data[id]) return;

  const entry = data[id];
  if (!entry?.trinket || player.hasTag(id)) return;

  // Si hay una condición y no se cumple, tratar como si el slot estuviera lleno
  if (typeof entry.condition === "function" && !entry.condition(player)) {
    // Cancelar equipamiento y devolver el ítem
    const inv = player.getComponent("inventory")?.container;
    if (inv?.emptySlotsCount > 0) {
      inv.addItem(item);
    } else {
      player.dimension.spawnItem(item, player.location);
    }
    return;
  }

  const occupiedSlots = allocateTaggedSlots(player);
  const availableSlot = getEntrySlotIndices(entry).find(index => !occupiedSlots.has(index));
  if (availableSlot === undefined) return;

  // Todo ok, se equipa
  player.addTag(id);
  clearTrinketImmuneEffects(player, entry);
  changeItemAmount(player, {
    slot: player.selectedSlotIndex,
    amount: -1,
  });
}

/**
 * Elimina efectos activos del jugador si coinciden con alguna inmunidad registrada.
 * @param {Entity} player - Entidad jugador.
 */
export function clearGlobalImmuneEffects(player) {
  if (!player || player.typeId !== "minecraft:player") return;

  const immunities = getStatCategory(player, "immunities");
  if (!Array.isArray(immunities)) return;

  const effects = player.getEffects();
  if (!effects) return;

  for (const effect of effects) {
    const effectName = effect.typeId.replace("minecraft:", ""); // ej: "poison"

    // Buscar si el nombre base está en la lista de inmunidades (case-insensitive)
    if (immunities.some((im) => im.toLowerCase() === effectName.toLowerCase())) {
      try {
        player.removeEffect(effect.typeId);
      } catch (e) {
        console.warn(`[Dorios RPG Core] Failed to remove effect '${effect.typeId}':`, e);
      }
    }
  }
}

/**
 * Elimina efectos del jugador que coincidan con las inmunidades de un trinket específico.
 *
 * @param {Entity} player - El jugador objetivo.
 * @param {object} entry - Objeto del trinket con propiedad `.immunities` como array de strings.
 */
function clearTrinketImmuneEffects(player, entry) {
  if (!player || player.typeId !== "minecraft:player") return;
  if (!Array.isArray(entry.immunities)) return;

  const effects = player.getEffects();
  if (!effects) return;

  for (const effect of effects) {
    const effectName = effect.typeId.replace("minecraft:", "");
    if (entry.immunities.some((im) => im.toLowerCase() === effectName.toLowerCase())) {
      player.removeEffect(effect.typeId);
    }
  }
}

function unequipAllTrinkets(player) {
  const tags = player.getTags();
  const inv = player.getComponent("inventory")?.container;
  if (!inv) return;

  for (const tag of tags) {
    if (isAuxiliaryTag(tag)) continue;

    const entry = data[tag];
    if (!entry?.trinket) continue;

    let item;
    try {
      item = new ItemStack(tag);
    } catch {
      continue;
    }

    if (inv.emptySlotsCount > 0) {
      inv.addItem(item);
    } else {
      player.dimension.spawnItem(item, player.location);
    }

    player.removeTag(tag);
  }
}
