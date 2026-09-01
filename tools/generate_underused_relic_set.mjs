import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const items = [
  ["silverfish_scale_ring", "rings", "rings"],
  ["breeze_core_loop", "rings", "rings"],
  ["ominous_key_ring", "rings", "rings"],
  ["phantom_membrane_mantle", "body", "body"],
  ["armadillo_shield_brooch", "body", "body"],
  ["lost_allay_bell", "charms", "charms"],
  ["desert_scarab_charm", "charms", "charms"],
  ["packed_snow_doll", "dolls", "dolls"],
  ["shipwrecked_doll", "dolls", "dolls"],
  ["wind_bracer", "gauntlet", "gauntlets"],
  ["cracked_bastion_medallion", "necklaces", "necklaces"],
  ["jungle_reliquary", "archaic_charms", "archaic_charms"],
];

const localizations = {
  pt_BR: {
    silverfish_scale_ring: ["Anel de Escamas de Traça", "Anel", "Endurece quando inimigos o cercam.", "§9Redução: +2% por inimigo | Máx. 10%"],
    breeze_core_loop: ["Elo do Núcleo da Brisa", "Anel", "Firma o corpo enquanto flutua.", "§aBuff: +12% resistência à repulsão", "§9Redução: 15% dano enquanto no ar"],
    ominous_key_ring: ["Anel da Chave Sinistra", "Anel", "Absorve a ameaça de chaves ominosas.", "§aBuff: +35% próximo ataque corpo a corpo", "§bHabilidade: Coletar Chave Ominosa carrega"],
    phantom_membrane_mantle: ["Manto de Membrana Fantasma", "Corpo", "Abre as asas depois de uma queda severa.", "§9Redução: 60% dano de queda", "§bHabilidade: Queda Lenta | Recarga 15s"],
    armadillo_shield_brooch: ["Broche de Escudo de Tatu", "Corpo", "Fecha-se contra disparos ao se agachar.", "§9Redução: 35% projéteis agachado"],
    lost_allay_bell: ["Sino Perdido do Allay", "Encanto", "Transforma experiência em energia arcana.", "§bHabilidade: +1 Mana a cada 3 XP"],
    desert_scarab_charm: ["Escaravelho do Templo", "Encanto", "Ajuda seu portador a fugir de armadilhas.", "§9Redução: 35% explosões", "§bHabilidade: Velocidade I | Recarga 10s"],
    packed_snow_doll: ["Boneco de Neve Compactado", "Boneco", "Chama um defensor quando a vida enfraquece.", "§bHabilidade: Golem de Neve | <50%/30s"],
    shipwrecked_doll: ["Boneco Náufrago", "Boneco", "Recusa-se a deixar seu portador afundar.", "§9Redução: Nega dano de afogamento", "§bHabilidade: Respiração e impulso | 20s"],
    wind_bracer: ["Braçadeira dos Ventos", "Manopla", "Golpeia inimigos antes que aterrizem.", "§aBuff: +20% dano contra alvos no ar"],
    cracked_bastion_medallion: ["Medalhão do Bastião Partido", "Colar", "Compra proteção com o ouro do portador.", "§cDebuff: -1 Barra de Ouro por ativação", "§9Redução: 40% do próximo dano", "§bHabilidade: Proteção automática | 10s"],
    jungle_reliquary: ["Relicário da Selva", "Amuleto Arcano", "Desvia o primeiro disparo de uma armadilha.", "§9Redução: Nega 1 projétil", "§bHabilidade: Recarga 20s"],
  },
  en_US: {
    silverfish_scale_ring: ["Silverfish Scale Ring", "Ring", "Hardens when enemies surround its wearer.", "§9Reduction: +2% per enemy | Max. 10%"],
    breeze_core_loop: ["Breeze Core Loop", "Ring", "Braces the body while it floats.", "§aBuff: +12% knockback resistance", "§9Reduction: 15% damage while airborne"],
    ominous_key_ring: ["Ominous Key Ring", "Ring", "Absorbs the threat within ominous keys.", "§aBuff: +35% next melee attack", "§bAbility: Picking up an Ominous Key charges"],
    phantom_membrane_mantle: ["Phantom Membrane Mantle", "Body", "Spreads its wings after a severe fall.", "§9Reduction: 60% fall damage", "§bAbility: Slow Falling | 15s cooldown"],
    armadillo_shield_brooch: ["Armadillo Shield Brooch", "Body", "Closes against shots while crouching.", "§9Reduction: 35% projectiles crouching"],
    lost_allay_bell: ["Lost Allay Bell", "Charm", "Turns experience into arcane energy.", "§bAbility: +1 Mana per 3 XP"],
    desert_scarab_charm: ["Desert Temple Scarab", "Charm", "Helps its wearer escape ancient traps.", "§9Reduction: 35% explosions", "§bAbility: Speed I | 10s cooldown"],
    packed_snow_doll: ["Packed Snow Doll", "Doll", "Calls a defender when health weakens.", "§bAbility: Snow Golem | <50%/30s"],
    shipwrecked_doll: ["Shipwrecked Doll", "Doll", "Refuses to let its wearer sink.", "§9Reduction: Negates drowning damage", "§bAbility: Breathing and impulse | 20s"],
    wind_bracer: ["Wind Bracer", "Gauntlet", "Strikes enemies before they can land.", "§aBuff: +20% damage against airborne foes"],
    cracked_bastion_medallion: ["Cracked Bastion Medallion", "Necklace", "Buys protection with its wearer's gold.", "§cDebuff: -1 Gold Ingot per activation", "§9Reduction: 40% of the next damage", "§bAbility: Automatic protection | 10s"],
    jungle_reliquary: ["Jungle Reliquary", "Archaic Charm", "Deflects the first shot from a trap.", "§9Reduction: Negates 1 projectile", "§bAbility: 20s cooldown"],
  },
  es_ES: {
    silverfish_scale_ring: ["Anillo de Escamas de Lepisma", "Anillo", "Se endurece cuando lo rodean enemigos.", "§9Reducción: +2% por enemigo | Máx. 10%"],
    breeze_core_loop: ["Aro del Núcleo de Brisa", "Anillo", "Afirma el cuerpo mientras flota.", "§aMejora: +12% resistencia al empuje", "§9Reducción: 15% daño en el aire"],
    ominous_key_ring: ["Anillo de Llave Siniestra", "Anillo", "Absorbe la amenaza de llaves ominosas.", "§aMejora: +35% próximo ataque cuerpo a cuerpo", "§bHabilidad: Recoger Llave Ominosa carga"],
    phantom_membrane_mantle: ["Manto de Membrana de Fantasma", "Cuerpo", "Abre sus alas tras una caída severa.", "§9Reducción: 60% daño de caída", "§bHabilidad: Caída Lenta | Recarga 15s"],
    armadillo_shield_brooch: ["Broche de Escudo de Armadillo", "Cuerpo", "Se cierra ante disparos al agacharse.", "§9Reducción: 35% proyectiles agachado"],
    lost_allay_bell: ["Campana Perdida de Allay", "Dije", "Convierte experiencia en energía arcana.", "§bHabilidad: +1 Maná cada 3 XP"],
    desert_scarab_charm: ["Escarabajo del Templo", "Dije", "Ayuda a escapar de trampas antiguas.", "§9Reducción: 35% explosiones", "§bHabilidad: Velocidad I | Recarga 10s"],
    packed_snow_doll: ["Muñeco de Nieve Compactado", "Muñeco", "Llama a un defensor al debilitarse.", "§bHabilidad: Gólem de Nieve | <50%/30s"],
    shipwrecked_doll: ["Muñeco Náufrago", "Muñeco", "Se niega a dejar hundir a su portador.", "§9Reducción: Niega daño por ahogamiento", "§bHabilidad: Respiración e impulso | 20s"],
    wind_bracer: ["Brazal de los Vientos", "Guantelete", "Golpea enemigos antes de que aterricen.", "§aMejora: +20% daño contra objetivos en el aire"],
    cracked_bastion_medallion: ["Medallón del Bastión Agrietado", "Collar", "Compra protección con el oro del portador.", "§cDesventaja: -1 Lingote de Oro por uso", "§9Reducción: 40% del próximo daño", "§bHabilidad: Protección automática | 10s"],
    jungle_reliquary: ["Relicario de la Selva", "Amuleto Arcano", "Desvía el primer disparo de una trampa.", "§9Reducción: Niega 1 proyectil", "§bHabilidad: Recarga 20s"],
  },
};
localizations.pt_PT = localizations.pt_BR;
localizations.es_MX = localizations.es_ES;

for (const [id, directory] of items) {
  const itemPath = resolve("BP", "items", directory, `${id}.json`);
  await mkdir(dirname(itemPath), { recursive: true });
  await writeFile(itemPath, `${JSON.stringify({
    format_version: "1.20.80",
    "minecraft:item": {
      description: { identifier: `dorios:${id}`, menu_category: { category: "equipment" } },
      components: { "minecraft:icon": `dorios_${id}`, "minecraft:max_stack_size": 1 },
    },
  }, null, 2)}\n`);
  await copyFile(
    resolve("docs", "assets", "underused-relic-wave", "icons", `${id}.png`),
    resolve("RP", "textures", "items", `${id}.png`),
  );
}

const atlasPath = resolve("RP", "textures", "item_texture.json");
const atlas = JSON.parse(await readFile(atlasPath, "utf8"));
for (const [id] of items) atlas.texture_data[`dorios_${id}`] = { textures: `textures/items/${id}` };
atlas.texture_data = Object.fromEntries(Object.entries(atlas.texture_data).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(atlasPath, `${JSON.stringify(atlas, null, "\t")}\n`);

const catalogPath = resolve("BP", "item_catalog", "crafting_item_catalog.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const groups = catalog["minecraft:crafting_items_catalog"].categories.flatMap(category => category.groups);
for (const [id, , groupName] of items) {
  const group = groups.find(candidate => candidate.group_identifier.name === `dorios:itemGroup.name.${groupName}`);
  if (!group) throw new Error(`Catalog group not found: ${groupName}`);
  if (!group.items.includes(`dorios:${id}`)) group.items.push(`dorios:${id}`);
}
for (const category of catalog["minecraft:crafting_items_catalog"].categories) {
  for (const group of category.groups) group.items.sort((a, b) => a.localeCompare(b));
  category.groups.sort((a, b) => a.group_identifier.name.localeCompare(b.group_identifier.name));
}
await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

for (const [localeName, entries] of Object.entries(localizations)) {
  const localePath = resolve("RP", "texts", `${localeName}.lang`);
  const lines = (await readFile(localePath, "utf8")).split(/\r?\n/u).filter(line =>
    !items.some(([id]) => line.startsWith(`item.dorios:${id}=`))
  );
  for (const [id] of items) {
    const [name, slot, lore, ...effects] = entries[id];
    lines.push(`item.dorios:${id}=${name} \\n§6Slot: §e${slot} \\n§6Nível: §bAscendente \\n§f${lore} \\n${effects.join(" \\n")}`);
  }
  await writeFile(localePath, `${lines.join("\n").replace(/\n+$/u, "")}\n`);
}

console.log(`Generated ${items.length} underused-source trinkets.`);
