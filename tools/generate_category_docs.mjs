import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { categoryDescriptions, itemDetails } from "./category_doc_details.mjs";

const categories = [
  ["hat", "Chapéus e Capacetes", "hat.md"],
  ["body", "Acessórios de Corpo", "body.md"],
  ["feet", "Calçados", "feet.md"],
  ["necklace", "Colares", "necklace.md"],
  ["ring", "Anéis", "ring.md"],
  ["charm", "Encantos", "charm.md"],
  ["talisman", "Talismãs", "talisman.md"],
  ["gauntlet", "Manoplas", "gauntlet.md"],
  ["heartycharm", "Amuletos de Saúde", "hearty-charm.md"],
  ["doll", "Bonecos", "doll.md"],
  ["witherring", "Anéis Secundários", "secondary-ring.md"],
  ["archaiccharm", "Amuletos Arcanos", "archaic-charm.md"],
  ["amulet", "Amuletos", "amulet.md"],
  ["face", "Máscaras e Visores", "face.md"],
  ["belt", "Cintos", "belt.md"],
];

const statFormatters = Object.freeze({
  health: value => value > 0
    ? `Aumenta a vida máxima em ${value} pontos (${formatNumber(value / 2)} ${Math.abs(value) === 2 ? "coração" : "corações"}).`
    : `Reduz a vida máxima em ${Math.abs(value)} pontos (${formatNumber(Math.abs(value) / 2)} ${Math.abs(value) === 2 ? "coração" : "corações"}).`,
  attack: value => `${signed(value)} de dano base.`,
  attackMulti: value => `${signedPercent(value)} de dano multiplicativo.`,
  critChance: value => `${signedPercent(value)} de chance crítica.`,
  critMulti: value => `${signedPercent(value)} de multiplicador crítico.`,
  lifeSteal: value => `${signedPercent(value)} de roubo de vida.`,
  damageReduction: value => `${signedPercent(value)} de redução de dano geral.`,
  knockbackRes: value => `${signedPercent(value)} de resistência à repulsão.`,
  speed: value => `${signedPercent(value)} de velocidade terrestre.`,
  waterSpeed: value => `${signedPercent(value)} de velocidade de nado.`,
  lavaSpeed: value => `${signedPercent(value)} de velocidade na lava.`,
  projectileDamage: value => `${signedPercent(value)} de dano de projéteis.`,
  rangedCritChance: value => `${signedPercent(value)} de chance crítica com projéteis.`,
  durabilityPreserve: value => `${signedPercent(value)} de chance de preservar durabilidade de ferramentas.`,
  mana: value => `${signed(value)} de mana máxima.`,
  manaRegen: value => `${signed(value)} de regeneração de mana por segundo.`,
  thorns: value => `Reflete ${formatNumber(value)}% do dano recebido.`,
  fireAspect: value => `Ataques incendeiam o alvo por ${formatNumber(value)} segundos.`,
  extraJumps: value => `${signed(value)} ${Math.abs(value) === 1 ? "salto adicional" : "saltos adicionais"} no ar.`,
});

const effectNames = Object.freeze({
  absorption: "Absorção", blindness: "Cegueira", conduit_power: "Poder do Conduto",
  darkness: "Escuridão", fatal_poison: "Veneno Fatal", fire_resistance: "Resistência ao Fogo",
  haste: "Pressa", hunger: "Fome", invisibility: "Invisibilidade", levitation: "Levitação",
  mining_fatigue: "Fadiga de Mineração", nausea: "Náusea", night_vision: "Visão Noturna",
  poison: "Veneno", regeneration: "Regeneração", resistance: "Resistência",
  slow_falling: "Queda Lenta", slowness: "Lentidão", speed: "Velocidade", strength: "Força",
  village_hero: "Herói da Aldeia", water_breathing: "Respiração Aquática",
  weakness: "Fraqueza", wither: "Definhamento",
});
const harmfulEffects = new Set([
  "blindness", "darkness", "fatal_poison", "hunger", "levitation", "mining_fatigue",
  "nausea", "poison", "slowness", "weakness", "wither",
]);
const beneficialEffects = new Set([
  "absorption", "conduit_power", "fire_resistance", "haste", "invisibility",
  "night_vision", "regeneration", "resistance", "slow_falling", "speed", "strength",
  "village_hero", "water_breathing",
]);

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}
function signed(value) {
  return `${value >= 0 ? "+" : "−"}${formatNumber(Math.abs(value))}`;
}
function signedPercent(value) {
  return `${value >= 0 ? "+" : "−"}${formatNumber(Math.abs(value))}%`;
}
function roman(value) {
  const levels = ["I", "II", "III", "IV", "V"];
  return levels[Math.max(1, Math.floor(value)) - 1] ?? String(value);
}
function displayEffect(id) {
  return effectNames[id] ?? id.replaceAll("_", " ");
}
function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function extractObject(block, property) {
  const match = new RegExp(`\\b${property}:\\s*\\{`, "u").exec(block);
  if (!match) return {};
  const opening = block.indexOf("{", match.index);
  let depth = 0;
  for (let index = opening; index < block.length; index += 1) {
    if (block[index] === "{") depth += 1;
    else if (block[index] === "}") depth -= 1;
    if (depth !== 0) continue;
    const source = block.slice(opening + 1, index);
    const fields = {};
    for (const field of source.matchAll(/^\s*([A-Za-z_][A-Za-z0-9_]*):\s*(-?\d+(?:\.\d+)?)\s*,?\s*$/gmu)) {
      fields[field[1]] = Number(field[2]);
    }
    return fields;
  }
  return {};
}

function extractImmunities(block) {
  const source = block.match(/\bimmunities:\s*\[([^\]]*)\]/u)?.[1] ?? "";
  return [...source.matchAll(/["']([^"']+)["']/gu)].map(match => match[1].toLowerCase());
}

function readAutomaticMechanics(block) {
  const buffs = [];
  const debuffs = [];
  const special = [];
  for (const [stat, value] of Object.entries(extractObject(block, "stats"))) {
    if (value === 0) continue;
    const text = statFormatters[stat]?.(value) ?? `${signed(value)} em ${stat.replaceAll("_", " ")}.`;
    (value > 0 ? buffs : debuffs).push(text);
  }
  for (const [effect, level] of Object.entries(extractObject(block, "passives"))) {
    const text = `${displayEffect(effect)} ${roman(level)} enquanto estiver equipado.`;
    (harmfulEffects.has(effect) ? debuffs : buffs).push(text);
  }
  for (const [effect, level] of Object.entries(extractObject(block, "actives"))) {
    special.push(`Ataques aplicam ${displayEffect(effect)} ${roman(level)} ao alvo por 12 segundos.`);
  }
  for (const immunity of extractImmunities(block)) {
    if (beneficialEffects.has(immunity)) debuffs.push(`Impede o portador de receber ${displayEffect(immunity)}.`);
    else buffs.push(`Imunidade a ${displayEffect(immunity)}.`);
  }
  return { buffs, debuffs, special };
}

const registerSource = await readFile(resolve("BP", "scripts", "register.js"), "utf8");
const registerLines = registerSource.split(/\r?\n/u);
const registered = [];
for (let index = 0; index < registerLines.length; index += 1) {
  const match = registerLines[index].match(/^ {8}"dorios:([^"]+)":\s*\{/u);
  if (!match) continue;
  let end = index + 1;
  while (end < registerLines.length
    && !/^ {8}"dorios:[^"]+":\s*\{/u.test(registerLines[end])
    && !/^ {4}\},?\s*$/u.test(registerLines[end])) end += 1;
  const block = registerLines.slice(index, end).join("\n");
  const slot = block.match(/\btrinket:\s*"([^"]+)"/u)?.[1];
  if (slot) registered.push({ id: match[1], slot, block });
}

const localeSource = await readFile(resolve("RP", "texts", "pt_BR.lang"), "utf8");
const locale = new Map();
for (const line of localeSource.split(/\r?\n/u)) {
  const match = line.match(/^item\.dorios:([^=]+)=(.*)$/u);
  if (match) locale.set(match[1], match[2]);
}
function clean(value) {
  return value.replace(/§./gu, "").trim();
}
function readLore(id) {
  const rawValue = locale.get(id);
  if (!rawValue) return { name: id.replaceAll("_", " "), description: "Descrição ainda não localizada." };
  const segments = rawValue.split(/\s*\\n\s*/u).filter(Boolean);
  const name = clean(segments.shift() ?? id);
  const description = segments.filter(segment => /^§f/u.test(segment)).map(clean).join(" ");
  return { name, description: description || "Trinket sem descrição narrativa cadastrada." };
}

const docsDir = resolve("docs", "categories");
await mkdir(docsDir, { recursive: true });
const indexLines = [
  "# Categorias de Trinkets", "",
  "Referência funcional dos trinkets disponíveis, organizada por slot.", "", "---", "",
];
const warnings = [];
for (const [slot, title, fileName] of categories) {
  const entries = registered
    .filter(entry => entry.slot === slot)
    .map(entry => {
      const lore = readLore(entry.id);
      const automatic = readAutomaticMechanics(entry.block);
      const details = itemDetails[entry.id] ?? {};
      return {
        ...entry,
        name: lore.name,
        description: details.description ?? lore.description,
        buffs: unique([...automatic.buffs, ...(details.buffs ?? [])]),
        debuffs: unique([...automatic.debuffs, ...(details.debuffs ?? [])]),
        special: unique([...automatic.special, ...(details.special ?? [])]),
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));

  const lines = [`# ${title}`, "", categoryDescriptions[slot], "", "---", ""];
  for (const entry of entries) {
    if (!locale.has(entry.id)) warnings.push(`${entry.id}: tradução pt_BR ausente`);
    if (entry.buffs.length + entry.debuffs.length + entry.special.length === 0) {
      warnings.push(`${entry.id}: mecânica documentada ausente`);
    }
    lines.push(`- **${entry.name}** *(dorios:${entry.id})*`, `  - Lore/Descrição: ${entry.description}`);
    if (entry.buffs.length > 0) lines.push(`  - Buffs: ${entry.buffs.join(" ")}`);
    if (entry.debuffs.length > 0) lines.push(`  - Debuffs: ${entry.debuffs.join(" ")}`);
    if (entry.special.length > 0) lines.push(`  - Comportamento especial: ${entry.special.join(" ")}`);
    lines.push("");
  }
  await writeFile(resolve(docsDir, fileName), `${lines.join("\n").trimEnd()}\n`);
  indexLines.push(`- [${title}](./${fileName}) — ${entries.length} trinkets.`);
}
await writeFile(resolve(docsDir, "README.md"), `${indexLines.join("\n")}\n`);
console.log(`Generated ${categories.length} category documents for ${registered.length} trinkets.`);
if (warnings.length > 0) {
  console.error(`Documentation warnings (${warnings.length}):\n${warnings.join("\n")}`);
  process.exitCode = 1;
}
