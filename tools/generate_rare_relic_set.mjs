import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const items = [
  ["ravager_horn_buckle", "belts", 73, "belts"],
  ["spider_silk_mantle", "body", 74, "body"],
  ["huskbone_mask", "face", 75, "facewear"],
  ["trial_champion_crown", "hats", 76, "hats"],
  ["goatstep_anklets", "feet", 77, "feet"],
  ["hoglin_tusk_gauntlet", "gauntlet", 78, "gauntlets"],
  ["sculk_resonator", "archaic_charms", 79, "archaic_charms"],
  ["mansion_ward_amulet", "amulets", 80, "amulets"],
  ["endermite_loop", "rings", 81, "rings"],
  ["stronghold_eye_charm", "charms", 82, "charms"],
  ["ghast_tear_locket", "necklaces", 83, "necklaces"],
  ["end_city_orb", "talismans", 84, "talismans"],
];

const localizations = {
  pt_BR: {
    ravager_horn_buckle: ["Fivela de Chifre de Devastador", "Cinto", "Converte uma corrida em uma carga brutal.", "§aBuff: +20% dano na investida", "§bHabilidade: Carga 1,5s/6s | Repulsão"],
    spider_silk_mantle: ["Manto de Seda de Aranha", "Corpo", "Prende quem golpeia seu portador.", "§bHabilidade: Lentidão II | Recarga 5s"],
    huskbone_mask: ["Máscara de Ossos de Husk", "Rosto", "Alimenta-se da energia de mortos-vivos.", "§aBuff: Imunidade a Fome", "§bHabilidade: +1 Fome/morto-vivo | 2s"],
    trial_champion_crown: ["Coroa do Campeão das Provações", "Chapéu", "Recompensa sequências rápidas de vitórias.", "§aBuff: Força I | Resistência I", "§bHabilidade: 3 abates em 10s"],
    goatstep_anklets: ["Tornozeleiras do Passo da Cabra", "Calçados", "Firma o corpo contra impactos cinéticos.", "§aBuff: +10% resistência à repulsão", "§9Redução: 35% dano cinético"],
    hoglin_tusk_gauntlet: ["Manopla de Presa de Hoglin", "Manopla", "Abre combates com uma investida cruel.", "§aBuff: +1 dano | +15% contra vida alta"],
    sculk_resonator: ["Ressonador de Sculk", "Amuleto Arcano", "Libera um pulso quando a vida fica crítica.", "§cDebuff: -2 corações máximos", "§bHabilidade: Pulso 4/6m | <30%/20s"],
    mansion_ward_amulet: ["Amuleto de Proteção da Mansão", "Amuleto", "Dissipa maldições e ataques sobrenaturais.", "§aBuff: +20 Mana", "§9Redução: 20% magia e sônico"],
    endermite_loop: ["Elo de Endermite", "Anel", "Carrega a inquietação do vazio entre mundos.", "§aBuff: +6% crítico | +5% velocidade"],
    stronghold_eye_charm: ["Olho do Portal da Fortaleza", "Encanto", "Reconhece criaturas ligadas ao End.", "§aBuff: +12% dano contra seres do End"],
    ghast_tear_locket: ["Medalhão de Lágrima de Ghast", "Colar", "Apaga chamas e inicia a recuperação.", "§aBuff: +1 coração | Regeneração I", "§9Redução: 25% dano ígneo", "§bHabilidade: Extingue fogo | 15s"],
    end_city_orb: ["Orbe da Cidade do End", "Talismã", "Converte essências do End em energia arcana.", "§bHabilidade: +8 Mana/ser do End | 3s"],
  },
  en_US: {
    ravager_horn_buckle: ["Ravager Horn Buckle", "Belt", "Turns a sprint into a brutal charge.", "§aBuff: +20% charge damage", "§bAbility: Charge 1.5s/6s | Knockback"],
    spider_silk_mantle: ["Spider-Silk Mantle", "Body", "Entangles anyone who strikes its wearer.", "§bAbility: Slowness II | 5s cooldown"],
    huskbone_mask: ["Huskbone Mask", "Face", "Feeds on the energy of the undead.", "§aBuff: Immunity to Hunger", "§bAbility: +1 Hunger/undead | 2s"],
    trial_champion_crown: ["Trial Champion Crown", "Hat", "Rewards quick chains of victories.", "§aBuff: Strength I | Resistance I", "§bAbility: 3 kills within 10s"],
    goatstep_anklets: ["Goatstep Anklets", "Feet", "Braces the body against kinetic impacts.", "§aBuff: +10% knockback resistance", "§9Reduction: 35% kinetic damage"],
    hoglin_tusk_gauntlet: ["Hoglin Tusk Gauntlet", "Gauntlet", "Opens combat with a cruel charge.", "§aBuff: +1 damage | +15% vs high health"],
    sculk_resonator: ["Sculk Resonator", "Archaic Charm", "Releases a pulse when health turns critical.", "§cDebuff: -2 maximum hearts", "§bAbility: 4 damage/6m | <30%/20s"],
    mansion_ward_amulet: ["Mansion Ward Amulet", "Amulet", "Dissipates curses and unnatural attacks.", "§aBuff: +20 Mana", "§9Reduction: 20% magic and sonic"],
    endermite_loop: ["Endermite Loop", "Ring", "Carries the restlessness between worlds.", "§aBuff: +6% critical | +5% speed"],
    stronghold_eye_charm: ["Stronghold Portal Eye", "Charm", "Recognizes creatures bound to the End.", "§aBuff: +12% damage against End beings"],
    ghast_tear_locket: ["Ghast Tear Locket", "Necklace", "Extinguishes flames and begins recovery.", "§aBuff: +1 heart | Regeneration I", "§9Reduction: 25% fire damage", "§bAbility: Extinguishes fire | 15s"],
    end_city_orb: ["End City Orb", "Talisman", "Turns End essence into arcane energy.", "§bAbility: +8 Mana/End being | 3s"],
  },
  es_ES: {
    ravager_horn_buckle: ["Hebilla de Cuerno de Devastador", "Cinturón", "Convierte una carrera en una carga brutal.", "§aMejora: +20% daño en la carga", "§bHabilidad: Carga 1,5s/6s | Empuje"],
    spider_silk_mantle: ["Manto de Seda de Araña", "Cuerpo", "Atrapa a quien golpea a su portador.", "§bHabilidad: Lentitud II | Recarga 5s"],
    huskbone_mask: ["Máscara de Huesos de Zombi Momificado", "Rostro", "Se alimenta de la energía de los no muertos.", "§aMejora: Inmunidad al Hambre", "§bHabilidad: +1 Hambre/no muerto | 2s"],
    trial_champion_crown: ["Corona del Campeón de Pruebas", "Sombrero", "Premia cadenas rápidas de victorias.", "§aMejora: Fuerza I | Resistencia I", "§bHabilidad: 3 bajas en 10s"],
    goatstep_anklets: ["Tobilleras de Paso de Cabra", "Calzado", "Afirma el cuerpo contra impactos cinéticos.", "§aMejora: +10% resistencia al empuje", "§9Reducción: 35% daño cinético"],
    hoglin_tusk_gauntlet: ["Guantelete de Colmillo de Hoglin", "Guantelete", "Abre el combate con una carga cruel.", "§aMejora: +1 daño | +15% contra vida alta"],
    sculk_resonator: ["Resonador de Sculk", "Amuleto Arcano", "Libera un pulso cuando la vida es crítica.", "§cDesventaja: -2 corazones máximos", "§bHabilidad: Pulso 4/6m | <30%/20s"],
    mansion_ward_amulet: ["Amuleto Protector de la Mansión", "Amuleto", "Disipa maldiciones y ataques sobrenaturales.", "§aMejora: +20 Maná", "§9Reducción: 20% magia y sónico"],
    endermite_loop: ["Aro de Endermite", "Anillo", "Porta la inquietud del vacío entre mundos.", "§aMejora: +6% crítico | +5% velocidad"],
    stronghold_eye_charm: ["Ojo del Portal de la Fortaleza", "Dije", "Reconoce criaturas ligadas al End.", "§aMejora: +12% daño contra seres del End"],
    ghast_tear_locket: ["Medallón de Lágrima de Ghast", "Collar", "Apaga las llamas e inicia la recuperación.", "§aMejora: +1 corazón | Regeneración I", "§9Reducción: 25% daño de fuego", "§bHabilidad: Extingue fuego | 15s"],
    end_city_orb: ["Orbe de la Ciudad del End", "Talismán", "Convierte esencia del End en energía arcana.", "§bHabilidad: +8 Maná/ser del End | 3s"],
  },
};
localizations.pt_PT = localizations.pt_BR;
localizations.es_MX = localizations.es_ES;

for (const [id, directory, spriteIndex] of items) {
  const itemPath = resolve("BP", "items", directory, `${id}.json`);
  await mkdir(dirname(itemPath), { recursive: true });
  await writeFile(itemPath, `${JSON.stringify({
    format_version: "1.20.80",
    "minecraft:item": {
      description: { identifier: `dorios:${id}`, menu_category: { category: "equipment" } },
      components: { "minecraft:icon": `dorios_${id}`, "minecraft:max_stack_size": 1 },
    },
  }, null, 2)}\n`);

  const column = spriteIndex - 72;
  const spriteName = `item_${String(spriteIndex).padStart(3, "0")}_r07_c${String(column).padStart(2, "0")}.png`;
  await copyFile(
    resolve("docs", "assets", "trinkets-item-visual-grid", "trinkets_simplified", "simplified", spriteName),
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
for (const [id, , , groupName] of items) {
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
