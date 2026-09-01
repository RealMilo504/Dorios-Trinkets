import { access, readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const errors = [];
const expect = (condition, message) => { if (!condition) errors.push(message); };

function parseJsonc(source) {
  const withoutBlocks = source.replace(/\/\*[\s\S]*?\*\//gu, "");
  const withoutLines = withoutBlocks.replace(/(^|\s)\/\/.*$/gmu, "$1");
  return JSON.parse(withoutLines);
}

async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(path));
    else output.push(path);
  }
  return output;
}

const jsonFiles = [
  ...(await walk(resolve("BP"))),
  ...(await walk(resolve("RP"))),
].filter(path => path.endsWith(".json"));
for (const path of jsonFiles) {
  try { parseJsonc(await readFile(path, "utf8")); }
  catch (error) { errors.push(`JSON inválido: ${path}: ${error.message}`); }
}

const craftedIds = [
  "alchemists_cloak_pin", "duelist_wraps", "emerald_chain", "impact_glove",
  "iron_locket", "miners_token", "travelers_cloak_pin", "wayfarers_knot",
];
const underusedIds = [
  "armadillo_shield_brooch", "breeze_core_loop", "cracked_bastion_medallion",
  "desert_scarab_charm", "jungle_reliquary", "lost_allay_bell",
  "ominous_key_ring", "packed_snow_doll", "phantom_membrane_mantle",
  "shipwrecked_doll", "silverfish_scale_ring", "wind_bracer",
];
const rareIds = [
  "end_city_orb", "endermite_loop", "ghast_tear_locket", "goatstep_anklets",
  "hoglin_tusk_gauntlet", "huskbone_mask", "mansion_ward_amulet",
  "ravager_horn_buckle", "sculk_resonator", "spider_silk_mantle",
  "stronghold_eye_charm", "trial_champion_crown",
  ...underusedIds,
];
const checkedIds = [...craftedIds, ...rareIds];
const registerSource = await readFile(resolve("BP", "scripts", "register.js"), "utf8");
const registeredIds = [...registerSource.matchAll(/^ {8}"dorios:([^"]+)":\s*\{([\s\S]*?)(?=^ {8}"dorios:|^ {4}\},?)/gmu)]
  .filter(match => /\btrinket:\s*"[^"]+"/u.test(match[2]))
  .map(match => match[1]);
const atlas = JSON.parse(await readFile(resolve("RP", "textures", "item_texture.json"), "utf8"));
const catalog = JSON.parse(await readFile(resolve("BP", "item_catalog", "crafting_item_catalog.json"), "utf8"));
const catalogIds = catalog["minecraft:crafting_items_catalog"].categories
  .flatMap(category => category.groups)
  .flatMap(group => group.items);
const catalogSet = new Set(catalogIds);

for (const id of checkedIds) {
  expect(registerSource.includes(`"dorios:${id}": {`), `${id}: registro ausente`);
  expect(catalogSet.has(`dorios:${id}`), `${id}: catálogo ausente`);
  expect(Boolean(atlas.texture_data[`dorios_${id}`]), `${id}: atlas ausente`);
  try { await access(resolve("RP", "textures", "items", `${id}.png`)); }
  catch { errors.push(`${id}: PNG ausente`); }
}
for (const id of craftedIds) {
  try {
    const recipe = JSON.parse(await readFile(resolve("BP", "recipes", `${id}.json`), "utf8"));
    expect(recipe["minecraft:recipe_shapeless"]?.result?.item === `dorios:${id}`, `${id}: receita inválida`);
  } catch { errors.push(`${id}: receita ausente`); }
}
for (const id of rareIds) {
  const match = registerSource.match(new RegExp(`"dorios:${id}": \\{([\\s\\S]*?)(?=^ {8}"dorios:|^ {4}\\},?)`, "mu"));
  expect(/\b(drops|loot):/u.test(match?.[1] ?? ""), `${id}: fonte de drop/loot ausente`);
}
for (const id of underusedIds) {
  try {
    const png = await readFile(resolve("RP", "textures", "items", `${id}.png`));
    expect(png.toString("ascii", 1, 4) === "PNG", `${id}: assinatura PNG inválida`);
    expect(png.readUInt32BE(16) === 16 && png.readUInt32BE(20) === 16, `${id}: textura não possui 16x16 pixels`);
  } catch {
    errors.push(`${id}: não foi possível validar as dimensões da textura`);
  }
}

expect(catalogSet.size === catalogIds.length, "O catálogo contém itens duplicados.");
for (const category of catalog["minecraft:crafting_items_catalog"].categories) {
  const groupNames = category.groups.map(group => group.group_identifier.name);
  expect(groupNames.join("\0") === [...groupNames].sort((a, b) => a.localeCompare(b)).join("\0"), `${category.category_name}: grupos fora de ordem`);
  for (const group of category.groups) {
    expect(group.items.join("\0") === [...group.items].sort((a, b) => a.localeCompare(b)).join("\0"), `${group.group_identifier.name}: itens fora de ordem`);
  }
}

const localeTypeLabels = {
  en_US: ["Buff:", "Debuff:", "Ability:", "Reduction:"],
  es_ES: ["Mejora:", "Desventaja:", "Habilidad:", "Reducción:"],
  es_MX: ["Mejora:", "Desventaja:", "Habilidad:", "Reducción:"],
  pt_BR: ["Buff:", "Debuff:", "Habilidade:", "Redução:"],
  pt_PT: ["Buff:", "Debuff:", "Habilidade:", "Redução:"],
};
for (const locale of Object.keys(localeTypeLabels)) {
  const source = await readFile(resolve("RP", "texts", `${locale}.lang`), "utf8");
  for (const id of checkedIds) {
    expect(source.includes(`item.dorios:${id}=`), `${locale}: tradução de ${id} ausente`);
  }
  for (const id of rareIds) {
    const line = source.split(/\r?\n/u).find(value => value.startsWith(`item.dorios:${id}=`)) ?? "";
    for (const label of localeTypeLabels[locale]) {
      expect(line.split(label).length - 1 <= 1, `${locale}/${id}: mais de uma linha do tipo ${label}`);
    }
  }
}

const categoryDocs = (await readdir(resolve("docs", "categories")))
  .filter(name => name.endsWith(".md") && name !== "README.md");
expect(categoryDocs.length === 15, `Esperados 15 documentos de categoria; encontrados ${categoryDocs.length}.`);
const documentedIds = [];
for (const name of categoryDocs) {
  const source = await readFile(resolve("docs", "categories", name), "utf8");
  expect(!source.split(/\r?\n/u).some(line => line.startsWith("|")), `${name}: contém tabela Markdown`);
  expect(/^# .+\n\n.+\n\n---$/mu.test(source), `${name}: cabeçalho ou descrição de categoria inválido`);
  expect(!/^## /mu.test(source), `${name}: ainda usa subtítulos por item`);
  expect(!/[\uE000-\uF8FF]/u.test(source), `${name}: contém emojis de fonte privada`);
  const matches = [...source.matchAll(/^- \*\*.+\*\* \*\(dorios:([^\)]+)\)\*$/gmu)];
  documentedIds.push(...matches.map(match => match[1]));
  expect(matches.length > 0, `${name}: nenhum trinket na formatação nova`);
  expect(!source.includes("efeito não documentado"), `${name}: contém efeito não documentado`);
}
expect(new Set(documentedIds).size === documentedIds.length, "Os documentos repetem um ou mais trinkets.");
expect(new Set(registeredIds).size === registeredIds.length, "O registro repete um ou mais trinkets.");
expect([...new Set(registeredIds)].sort().join("\0") === [...new Set(documentedIds)].sort().join("\0"), "Os documentos não correspondem exatamente aos trinkets registrados.");

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`OK: ${jsonFiles.length} JSONs, ${catalogIds.length} itens de catálogo e ${documentedIds.length} trinkets registrados/documentados.`);
}
