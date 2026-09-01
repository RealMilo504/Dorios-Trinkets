# Dorios' Trinkets — plano de expansão de slots, itens e efeitos

> Documento complementar ao [plano do RPG Core](./RPG_CORE_INTEGRATION_PLAN.md).
>
> Ideias abaixo são propostas de design; valores são ponto de partida para playtest,
> não balanceamento final.
>
> A direção de arte inicial está na
> [grade visual conceitual 16×16](./TRINKETS_ITEM_VISUAL_GRID.md).

## 1. Objetivo da expansão

A expansão deve preencher primeiro as categorias quase vazias, justificar os novos
slots `face` e `belt`, e testar o novo RPG Core com uma mistura saudável de:

- itens gerais, compostos apenas por modifiers agregados;
- itens dirigidos por eventos;
- itens condicionais de baixa frequência;
- poucos itens espaciais/de mutação de mundo, sempre orçados.

O objetivo não é apenas aumentar o número de JSONs. Cada slot precisa possuir uma
identidade de gameplay, fontes de obtenção diferentes e um limite de poder coerente.

## 2. Auditoria do catálogo-base

Antes da expansão, existiam 86 registros em `BP/scripts/register.js`, dos quais
sete eram auxiliares `*_tag`. O catálogo-base continha 79 trinkets. Belt, Doll,
Face e Hat já começaram a ser ampliados na branch `tmt`.

Na implementação atual da `tmt`, `belt`, `doll`, `face`, `hat`, `feet`,
`archaic charm`, `amulet` e `talisman` já atingiram as metas de conteúdo deste
documento. As quatro últimas categorias compartilham o sampler universal do
Trinkets para condições de terreno, horário e imobilidade.

| Índice atual | Categoria | Itens reais | Situação |
| ---: | --- | ---: | --- |
| 0 | `head` | 5 | dividido em 3 hat + 2 face na `tmt` |
| 1 | `body` | 6 | média |
| 2 | `feet` | 2 | crítica |
| 3 | `necklace` | 7 | saudável |
| 4 | `ring` | 6 | saudável |
| 5 | `charm` | 6 | saudável |
| 6 | `talisman` | 4 | baixa |
| 7 | `gauntlet` | 7 | saudável |
| 8 | `heartycharm` | 12 | cheia |
| 9 | `doll` | 1 | crítica |
| 10 | `witherring` | 18 | muito cheia |
| 11 | `archaiccharm` | 2 | crítica |
| 12 | `amulet` | 3 | baixa |
| 13 | `face` | 2 após migração | slot implantado e expandido |
| 14 | `belt` | 0 | slot implantado e expandido |

Itens a migrar imediatamente:

| Item | De | Para |
| --- | --- | --- |
| Abyssal Diver Helmet | head | hat |
| Broken Paladin Helmet | head | hat |
| Restored Paladin Helmet | head | hat |
| Night Vision Goggles | head | face |
| Night Vision Mask | head | face |

## 3. Identidade de cada slot

| Slot | Fantasia e função | Evitar |
| --- | --- | --- |
| `hat` | proteção, profissão, clima, magia de cabeça | efeitos puramente de visão que pertencem a face |
| `face` | percepção, respiração, mira, máscaras e reação a status | defesa geral de armadura sem identidade |
| `body` | quivers, emblems, cloak pins e attachments do torso | competir diretamente com hearty charms em vida |
| `belt` | utilidade, construção, ferramentas, munição e tradeoffs de carga | virar apenas outro ring de dano |
| `feet` | locomoção, terreno, queda, dash e trilhas | buffs de dano sem relação com movimento |
| `necklace` | bônus diretos e acessíveis de sustain/status | efeitos lendários que cabem em amulet |
| `amulet` | magia condicional, conversões de recurso e defesa rara | duplicar necklace com números maiores |
| `talisman` | ward, sorte, proteção de contexto e profissão | efeitos ofensivos universais sem condição |
| `charm` | utilidade simples e combinável | power budget de archaic charm |
| `archaic charm` | poder alto com condição, custo ou drawback | bonuses gratuitos permanentes |
| `hearty charm` | vida, cura, almas/corações | ocupar outras fantasias de slot |
| `doll` | proxy, maldição, fatal protection, retaliação e vínculo | modifier genérico sem personalidade |
| `gauntlet` | melee, elemento e ação manual | utilidade passiva sem relação com mãos |
| `ring.primary` | rings comuns/especializados | versões superiores já cobertas pelo secundário |
| `ring.secondary` | strong/heavy/wither rings e upgrades | receber ainda mais linhas de itens no primeiro ciclo |

## 4. Metas de preenchimento

Meta ao fim do programa de expansão (Waves 1A–3B):

| Categoria | Atual após split | Meta | Novos |
| --- | ---: | ---: | ---: |
| belt | 0 | 10 | 10 |
| doll | 1 | 9 | 8 |
| feet | 2 | 10 | 8 |
| archaic charm | 2 | 9 | 7 |
| amulet | 3 | 11 | 8 |
| talisman | 4 | 12 | 8 |
| face | 2 | 10 | 8 |
| hat | 3 | 10 | 7 |
| body | 6 | 8 | 2 |
| necklace | 7 | 9 | 2 |
| charm | 6 | 8 | 2 |
| gauntlet | 7 | 9 | 2 |

Não há meta de expansão imediata para hearty charms ou secondary rings; já são as
categorias mais cheias.

## 5. Classes de custo

- **G — Geral:** apenas modifier/snapshot. Sem polling ou query.
- **E — Evento:** executa por trigger indexado e cooldown/counter.
- **S — Sampled:** depende de estado contínuo amostrado sob demanda.
- **W — World:** busca entidades, varre/muda blocos ou cria jobs espaciais.

Regras de lançamento:

1. Onda 1 prioriza G e E.
2. S só entra quando watchers por interesse estiverem prontos.
3. W só entra depois do scheduler com budget e cancelamento.
4. Um item pode combinar classes; vale a classe mais cara.

## 6. Onda 1 — itens gerais e de baixo custo

### 6.1 Belt

| ID proposto | Nome | Custo | Papel e proposta inicial | Obtenção sugerida |
| --- | --- | --- | --- | --- |
| `dorios:adventurers_belt` | Lantern Belt | W | +20 mana e luz dinâmica enquanto equipado | craft de lantern + glowstone + copper |
| `dorios:ironbound_girdle` | Magnetic Girdle | W | atrai até 16 item entities num raio de 7 blocos | craft de Reinforced Belt + iron |
| `dorios:miners_tool_belt` | Miner's Tool Belt | G | +5% durability preserve; sem Haste implícito | mineshaft/craft |
| `dorios:tideforged_girdle` | Tideforged Girdle | G | +25% water speed | ocean ruins/drowned |
| `dorios:bloodbound_sash` | Bloodbound Sash | E | abate hostile restaura 1 hunger, cooldown 2 s; -2 max health | bastion/piglin brute |

### 6.2 Face

| ID proposto | Nome | Custo | Papel e proposta inicial | Obtenção sugerida |
| --- | --- | --- | --- | --- |
| `dorios:marksman_monocle` | Marksman's Monocle | G | +6% projectile damage e +3% ranged crit chance | craft; pillager/outpost |
| `dorios:plague_doctor_mask` | Plague Doctor Mask | G | immunity a poison/hunger, -2 health points | craft; witch drop |
| `dorios:ember_respirator` | Ember Respirator | E | reduz em 30% dano de fire, fire tick, lava e magma | craft; blaze/fortress |
| `dorios:copper_prospecting_lens` | Prospecting Lens | E | a cada 4 ores quebrados concede 1 XP | craft de copper/spyglass |

### 6.3 Hat

| ID proposto | Nome | Custo | Papel e proposta inicial | Obtenção sugerida |
| --- | --- | --- | --- | --- |
| `dorios:witchs_crooked_hat` | Witch's Crooked Hat | G | +30 mana e +2 mana regen/s | witch drop raro |
| `dorios:paladin_circlet` | Paladin Circlet | G | +4 max health e +5% damage reduction | ancient city/stronghold |
| `dorios:tideforged_crown` | Tideforged Crown | G | conduit power e +30% water speed | ocean monument |

### 6.4 Feet

| ID proposto | Nome | Custo | Papel e proposta inicial | Obtenção sugerida |
| --- | --- | --- | --- | --- |
| `dorios:featherstep_anklets` | Featherstep Anklets | G | +10% speed e 50% fall reduction | craft; mountain/End loot futuro |
| `dorios:tidewalker_fins` | Tidewalker Fins | G | +60% water speed, -10% ground speed | fishing/ocean ruins |
| `dorios:weighted_sabaton_charms` | Sabaton Weights | G | +6% reduction e +15% knockback resistance, -8% speed | armorer/craft |

### 6.5 Doll

| ID proposto | Nome | Custo | Papel e proposta inicial | Obtenção sugerida |
| --- | --- | --- | --- | --- |
| `dorios:stone_guardian_doll` | Stone Guardian Doll | E | hit melee retaliates 2 damage e concede +15% knockback resistance por 4 s | craft; trial chamber futuro; cooldown 8 s |
| `dorios:hollow_doll` | Hollow Doll | G | +35 mana e +2 mana regen, -4 max health | ancient city |
| `dorios:lucky_ragdoll` | Lucky Ragdoll | E | +3% bonus loot; proc qualificado pode consumir hunger como preço | mansion/village |

### 6.6 Archaic Charm

| ID proposto | Nome | Custo | Papel e proposta inicial | Obtenção sugerida |
| --- | --- | --- | --- | --- |
| `dorios:void_covenant` | Void Covenant | G | -10 max health, +12% damage e +6% crit chance | End city |
| `dorios:endless_eye` | Endless Eye | G | +8% crit chance e +5% evasion, -4 max health | ancient city/End |

### 6.7 Amulet

| ID proposto | Nome | Custo | Papel e proposta inicial | Obtenção sugerida |
| --- | --- | --- | --- | --- |
| `dorios:lapis_focus` | Lapis Focus | G | +40 mana e +2 mana regen/s | enchanting/craft |
| `dorios:geode_amulet` | Geode Amulet | G | +4 max health e +5% damage reduction | amethyst geode |
| `dorios:prismatic_aegis` | Prismatic Aegis | G | redução moderada de fire/frost/poison/lightning profiles | trial chamber/rare craft |

### 6.8 Talisman

| ID proposto | Nome | Custo | Papel e proposta inicial | Obtenção sugerida |
| --- | --- | --- | --- | --- |
| `dorios:wardstone` | Wardstone | G | +15% explosion resistance e +10% knockback resistance | craft; stronghold futuro |
| `dorios:hunters_fang` | Hunter's Fang | E | modifier condicional +8% damage contra hostile; não afeta players/allies | woodland mansion |
| `dorios:ocean_coin` | Ocean Coin | G | +20% water speed e pequena luck aquática | buried treasure |

### 6.9 Outras categorias

| ID proposto | Slot | Custo | Papel e proposta inicial |
| --- | --- | --- | --- |
| `dorios:travelers_cloak_pin` | body | E | primeiro projétil a cada 6 s sofre 25% de redução e concede Velocidade I por 12 s |
| `dorios:alchemists_cloak_pin` | body | G | +10% healing efficiency e +15 mana |
| `dorios:iron_locket` | necklace | G | +12% de redução contra projéteis e +8% knockback resistance |
| `dorios:emerald_chain` | necklace | G | Sorte I e +1 XP a cada cinco inimigos hostis derrotados |
| `dorios:wayfarers_knot` | charm | G | após 8 s sem atacar, o próximo golpe ativa um crítico real no StatsCore |
| `dorios:miners_token` | charm | G | minerar um minério concede Pressa I por 12 s |
| `dorios:duelist_wraps` | gauntlet | G | +2 de dano; contra-atacar o agressor em 3 s causa +20% de dano |
| `dorios:impact_glove` | gauntlet | G | lança o alvo de um golpe corpo a corpo; recarga de 4 s |

### 6.10 Modificadores canônicos da Onda 1

As descrições acima são fantasia; esta tabela é o primeiro contrato numérico. `add`
em um stat `fraction` usa decimal (`0.08 = 8%`), health usa points (`4 = 2` corações)
e multiplicador de dano usa `multiply_delta`, nunca `multiply` ambíguo ou
`damage.flat`. Caps vêm da
StatDefinition; `group` impede stacking acidental. Valores continuam sujeitos a
playtest, mas unidade/operação/channel não podem mudar sem migration.
Por legibilidade, paths de stat sem `:` nesta tabela são sufixos de `dorios:`;
`speed.ground`, por exemplo, é serializado como `dorios:speed.ground`.

| Item | Operações canônicas | Unit/channel/group |
| --- | --- | --- |
| Lantern Belt | `mana.max add 20`; `dynamic_light` | flat/resource; sampler global a cada 5 ticks; no máximo 1 light block próprio |
| Magnetic Girdle | `item_magnet radius 7 closest 16` | query limitada no sampler global a cada 5 ticks |
| Miner's Tool Belt | `durability.preserve add 0.05` | fraction; mining/tool; applicator obrigatório |
| Tideforged Girdle | `speed.water add 0.25` | fraction; aquatic |
| Bloodbound Sash | `health.max add -2`; `hostile_kill hunger add 1 cooldown 40` | health points/event/resource; bloodbound |
| Marksman's Monocle | `damage.projectile add 0.06`; `critical.ranged add 0.03` | fraction; somente `combat.projectile` |
| Plague Doctor Mask | immunities `minecraft:poison`, `minecraft:hunger`; `health.max add -2` | exact ID/set + health points |
| Ember Respirator | incoming damage `multiply 0.70` | profiles `fire`, `fire_tick`, `lava`, `magma` em `hurt.before` |
| Prospecting Lens | `ore_break counter 4`; `experience add 1` | evento de mineração; counter persistente por source |
| Witch's Crooked Hat | `mana.max add 30`; `mana.regen add 2` | flat/rate_per_second; resource |
| Paladin Circlet | `health.max add 4`; `damage.reduction add 0.05` | health points/fraction; sacred |
| Tideforged Crown | passive exact `minecraft:conduit_power`; `speed.water add 0.30` | effect ID + fraction; aquatic |
| Featherstep Anklets | `speed.ground add 0.10`; `fall.reduction add 0.50` | fraction; movement/fall cap |
| Tidewalker Fins | `speed.water add 0.60`; `speed.ground add -0.10` | fraction; aquatic/movement |
| Sabaton Weights | `damage.reduction add 0.06`; `knockback.resistance add 0.15`; `speed.ground add -0.08` | fraction; defensive/movement |
| Stone Guardian Doll | effect `dorios:stone_guardian_retort` | `combat.hurt.after`; attacker + temporary modifier; cooldown source |
| Hollow Doll | `mana.max add 35`; `mana.regen add 2`; `health.max add -4` | flat/rate/health points; cursed resource |
| Lucky Ragdoll | `loot.bonus_chance add 0.03` + `resource.consume` hunger no proc | fraction; compatible loot pools only |
| Void Covenant | `health.max add -10`; `damage.multiplier multiply_delta 0.12`; `critical.chance add 0.06` | points/fraction; archaic/critical |
| Endless Eye | `critical.chance add 0.08`; `damage.evasion add 0.05`; `health.max add -4` | fraction/points; archaic |
| Lapis Focus | `mana.max add 40`; `mana.regen add 2` | flat/rate_per_second; resource |
| Geode Amulet | `health.max add 4`; `damage.reduction add 0.05` | points/fraction; defensive |
| Prismatic Aegis | `damage.reduction add 0.08` para cada profile permitido | profiles `minecraft:fire`, `dorios:frost`, `minecraft:poison`, `dorios:lightning` |
| Wardstone | `damage.reduction add 0.15`; `knockback.resistance add 0.10` | profile `minecraft:explosion`; defensive |
| Hunter's Fang | `damage.multiplier multiply_delta 0.08` quando target category `hostile` | E conditional; combat PvE; não player |
| Ocean Coin | `speed.water add 0.20`; `luck add 1` | fraction/flat; aquatic loot channel |
| Traveler's Cloak Pin | `projectile.reduction add 0.25`; temporary `speed I` por 240 ticks | fraction/ticks; recarga de 120 ticks |
| Alchemist's Cloak Pin | `healing.efficiency add 0.10`; `mana.max add 15` | fraction/flat; healing/resource |
| Iron Locket | `projectile.reduction add 0.12`; `knockback.resistance add 0.08` | fraction; defesa específica |
| Emerald Chain | `luck add 1`; `xp flat add 1` a cada cinco abates hostis | flat/counter; loot/progression |
| Knot of Certainty | `critical.chance set 1.0` no próximo ataque após 160 ticks | StatsCore provider; crítico canônico |
| Miner's Token | temporary `haste I` por 240 ticks após quebrar minério | event/status; janela universal |
| Duelist Wraps | `damage.flat add 2`; `damage.multiplier add 0.20` no contra-ataque | flat/fraction; janela de 60 ticks |
| Impact Glove | knockback vertical `0.65` a cada 80 ticks | event/vector; controle melee |

Perfis elementais são registros, não aliases de damage causes por substring. Frost e
lightning só funcionam após `dorios:frost`/`dorios:lightning` possuírem applicator e
mapping; sem isso o item é rejeitado ou perde o modifier por fallback explicitamente
documentado.

## 7. Onda 2 — itens de efeito especial

### 7.1 Belt

| ID proposto | Nome | Classe | Trigger/efeito | Limites |
| --- | --- | --- | --- | --- |
| `dorios:toolwright_belt` | Toolwright Belt | E | a cada 12 blocos com ferramenta correta, repara 1 durability | counter por source; não repara item cheio |
| `dorios:soulcatcher_belt` | Soulcatcher Belt | E | kill recupera 8 mana | cooldown 60 ticks; hostile only |
| `dorios:hunters_bandolier` | Hunter's Bandolier | E | projectile hit aumenta dano; chance de recuperar munição | MVP aceita só `minecraft:arrow`; munição especial desabilitada |
| `dorios:builders_harness` | Builder's Harness | E | devolve um bloco simples a cada N placements | allowlist; exclui multipart, states complexos e block entities |
| `dorios:magma_cinch` | Magma Cinch | S | +40% lava speed e fire resistance somente em lava | watcher 5 ticks; transição, não loop de apply |

### 7.2 Face

| ID proposto | Nome | Classe | Trigger/efeito | Limites |
| --- | --- | --- | --- | --- |
| `dorios:echo_visor` | Echo Visor | E | projectile recebido marca o atirador; próximo hit ranged nele causa +10% | 6 s, um consumo e feedback sonoro |
| `dorios:mirror_mask` | Mirror Mask | E | 30% de chance de limpar um status negativo recém-recebido | allowlist; cooldown 100 ticks; não reflete |
| `dorios:veil_of_silence` | Veil of Silence | S | agachar por 3 s concede invisibility até acertar um ataque | sampler global de 5 ticks; remove ao desequipar |
| `dorios:ender_visor` | Ender Visor | E | após **dimension change**, próximo ranged hit causa +4 damage | carga expira em 600 ticks; não detecta teleporte genérico |

### 7.3 Hat

| ID proposto | Nome | Classe | Trigger/efeito | Limites |
| --- | --- | --- | --- | --- |
| `dorios:deepdelvers_cap` | Miner's Helmet | S | abaixo de Y48 ganha night vision e haste leve | watcher 20 ticks; Overworld only |
| `dorios:beekeepers_hat` | Beekeeper's Hat | E | poison immunity, -50% bee damage e honey bottle restaura +2 hunger | não promete pacificação das abelhas |
| `dorios:crown_of_last_light` | Crown of Last Light | E | golpe fatal deixa 1 health, Resistance II e Weakness I por 12 s | cooldown 2400 ticks; guard de correlação no mesmo hit |
| `dorios:stormcaller_hood` | Stormcaller Hood | S | durante thunder, projéteis causam +12% damage | clima em cache; sem lightning; diferencia o Stormbound Idol |

### 7.4 Feet

| ID proposto | Nome | Classe | Trigger/efeito | Limites |
| --- | --- | --- | --- | --- |
| `dorios:sandstrider_boots` | Sandstrider Boots | S | +35% speed em sand/red sand/soul sand | cell change + rescan lento se bloco mudar sob player parado |
| `dorios:rootwalker_sandals` | Rootwalker Sandals | S | velocidade em vegetação; anti-trample só com capability | watcher 10 ticks; fallback remove anti-trample |
| `dorios:frostwalker_soles` | Frostwalker Soles | W | caminho temporário de gelo | restore compare-and-swap por owner token; budget/journal |
| `dorios:shadowstep_greaves` | Shadowstep Greaves | S | após sprint contínuo, double-jump executa dash curto | edge input; cooldown |
| `dorios:slimebound_boots` | Slimebound Boots | E | queda forte reduz dano e converte parte em bounce | landing transition; cap vertical |

### 7.5 Doll

| ID proposto | Nome | Classe | Trigger/efeito | Limites |
| --- | --- | --- | --- | --- |
| `dorios:straw_effigy` | Straw Effigy | E | impede um golpe fatal e consome/quebra o doll | uso único; não stacka com phoenix/crown |
| `dorios:marionette_of_spite` | Marionette of Spite | E | status negativo recebido pode ser copiado ao atacante | allowlist e reflect depth 1 |
| `dorios:creeper_doll` | Creeper Doll | W | reduz explosão; kill pode causar explosão sem block damage | kills do próprio proc são inelegíveis; maxTargets/cooldown |
| `dorios:leech_doll` | Leech Doll | E | marca último atacante; bater nele aumenta lifesteal temporário | uma marca por source |
| `dorios:guardian_effigy` | Guardian Effigy | E | abaixo de 30% health concede absorption/resistance | cooldown; health threshold crossing |

### 7.6 Archaic Charm

| ID proposto | Nome | Classe | Trigger/efeito | Drawback/limite |
| --- | --- | --- | --- | --- |
| `dorios:phoenix_ash_sigil` | Phoenix Ash Sigil | E | ressurreição rara + fogo no atacante e breve fire form | sem busca em área; charge consumível; weakness |
| `dorios:chronoshard` | Chronoshard | E | parcela parte do dano nos próximos segundos | dívida persiste lifecycle; attribution e lethal policy explícitas |
| `dorios:worldroot_knot` | Worldroot Knot | S | parado acumula resistance/regen | delta/input com tolerância; movimento remove stacks |
| `dorios:stormbound_idol` | Stormbound Idol | W | críticos em tempestade chamam lightning | cooldown, one query, block fire policy |
| `dorios:gluttons_seal` | Glutton's Seal | E | comer com hunger cheia concede absorption | captura hunger pre-use e confirma deferred; reduz mana regen |

### 7.7 Amulet

| ID proposto | Nome | Classe | Trigger/efeito | Limites |
| --- | --- | --- | --- | --- |
| `dorios:moonstone_amulet` | Moonstone Amulet | S | crit chance e mana regen à noite | watcher 20 ticks |
| `dorios:sunstone_amulet` | Sunstone Amulet | S | health regen e ignite chance durante o dia/céu exposto | cache por cell + rescan; query de céu é a parte cara |
| `dorios:echoheart_amulet` | Echoheart Amulet | E | parte da cura recebida vira mana | cap por evento; não retroalimenta cura |
| `dorios:gravekeeper_amulet` | Gravekeeper Amulet | E | kills guardam até 3 souls; cair abaixo de 30% consome uma para curar | charges no source, persistem reload/unequip e expiram em 10 min |
| `dorios:tempest_heart_amulet` | Tempest Heart Amulet | S | dano recebido em chuva carrega retaliation elétrica | defesa reativa; distinto do talisman ranged |

### 7.8 Talisman

| ID proposto | Nome | Classe | Trigger/efeito | Limites |
| --- | --- | --- | --- | --- |
| `dorios:quarry_sigil` | Quarry Sigil | E | ore break tem pequena chance de bônus | exige drop registry/correlation exata; sem scan de entidades |
| `dorios:totem_of_momentum` | Totem of Momentum | E | hit streak aumenta attack até cap | timeout/target policy explícitos |
| `dorios:wayfinder_compass` | Wayfinder Compass | E | dimension change concede speed/resistance breves | não ativa em respawn na mesma dimensão |
| `dorios:stormglass_talisman` | Stormglass Talisman | S | ranged bonus durante chuva/tempestade | weather watcher compartilhado |
| `dorios:harvesters_token` | Harvester's Token | E | mature crop pode gerar semente extra | exige crop/drop registry; desabilita sem capability |

## 8. Itens gerais não equipáveis

Estes itens criam progressão e receitas sem adicionar listeners:

| ID proposto | Uso | Entrada | Aquisição inicial |
| --- | --- | --- | --- |
| `dorios:empty_belt` | base para belts comuns | Wave 0 | craft leather + string |
| `dorios:reinforced_belt` | base de belts raros/defensivos | Wave 1A | upgrade de Empty Belt + iron |
| `dorios:blank_mask` | base de face items | Wave 0 | craft paper/clay + string |
| `dorios:enchanted_visor_frame` | base de visors especiais | Wave 2A | craft Blank Mask + amethyst/copper |
| `dorios:porcelain_doll_core` | componente de dolls mágicas | Wave 1A | craft clay + quartz |
| `dorios:bound_doll_frame` | frame de dolls com vínculo | Wave 2A | Porcelain Core + soul material |
| `dorios:archaic_binding` | componente de archaic charms | Wave 3A | rare fragment pool + craft |
| `dorios:attunement_shard` | escolhe afinidade/tema sem RNG completo | Wave 3B | salvage + progression recipe |
| `dorios:trinket_fragment` | salvage de duplicatas | Wave 1B | salvage determinístico |
| `dorios:stat_inscription` | upgrade determinístico de modifier permitido | Wave 1B | fragment + enchanting recipe |
| `dorios:cleansing_thread` | troca maldição por custo menor e reduz tier/budget | Wave 3B | rare salvage/archaic recipe |
| `dorios:resonance_core` | recipes e set-attunement | Wave 3A | boss/rare pool com craft pity |

Cada material entra junto ou antes do primeiro consumidor; recipe, salvage/adapter e
teste de obtenção fazem parte do gate da wave indicada. `empty_belt` e `blank_mask`
entram com os slots para onboarding, antes dos itens lendários.

## 9. Bônus de conjunto

Set bonuses são calculados por `setCounts` quando o loadout muda; não precisam de
polling próprio.

### 9.1 Tideforged

- 2 peças: +water speed.
- 4 peças: conduit-like sustain, sem reaplicar efeito a cada tick.
- 6 peças: proc aquático com cooldown, por exemplo corrente que reduz knockback.
- Belt, Crown e Fins novos completam rotas de slot diferentes.

### 9.2 Bloodbound

- 2 peças: pequeno lifesteal.
- 4 peças: lifesteal cap maior com redução de max health.
- 6 peças: kill converte uma parte da cura excedente em absorption.
- `bloodbound_sash` troca lifesteal duplicado por sustento de fome em abates hostis,
  mantendo a penalidade de vida como identidade risco/recompensa.

### 9.3 Paladin/Sacred

- 2 peças: healing received.
- 3 peças: defensive track/ward.
- Set não deve exigir ocupar face; helmets continuam em hat.

### 9.4 Abyssal

- 2 peças: water speed.
- 4 peças: darkness/blindness protection e sustain aquático.
- Separar claramente Abyssal de Tideforged: Abyssal é sobrevivência em profundidade;
  Tideforged é mobilidade/ofensiva aquática.

## 10. Especificações prioritárias para o primeiro protótipo

### 10.1 Lantern Belt — prova de slot/world utility

Objetivo: validar `belt`, UI, recipe, equip transaction, modifier de mana e uma
utility de mundo dentro do sampler compartilhado e limitado.

```js
{
  id: "dorios:adventurers_belt",
  slots: ["dorios:belt"],
  modifiers: [
    { stat: "dorios:mana.max", operation: "add", value: 20 }
  ],
  effects: [
    { type: "dynamic_light", interval: 5, maxOwnedBlocks: 1 }
  ]
}
```

### 10.2 Marksman's Monocle — prova de `face`

Objetivo: validar a separação hat/face e canais ranged sem polling.

```js
{
  id: "dorios:marksman_monocle",
  slots: ["dorios:face"],
  modifiers: [
    {
      stat: "dorios:damage.projectile",
      operation: "add",
      value: 0.06
    },
    {
      stat: "dorios:critical.ranged",
      operation: "add",
      value: 0.03,
      channels: ["combat.projectile"]
    }
  ]
}
```

### 10.3 Toolwright Belt — prova de event/counter/source persistence

```js
{
  id: "dorios:toolwright_repair",
  trigger: "block.break.after",
  phase: "after",
  chance: 1,
  priority: 100,
  stacking: { group: "dorios:toolwright", mode: "replace" },
  maxTargets: 1,
  budgetClass: "E",
  fallback: "disable",
  cooldown: null,
  transaction: {
    mode: "all_or_nothing",
    sources: ["effect.source", "event.tool"]
  },
  when: {
    test: "block.correct_tool",
    op: "eq",
    value: true
  },
  actions: [
    {
      id: "increment",
      type: "counter.add",
      scope: "source",
      key: "toolwright",
      amount: 1
    },
    {
      id: "repair",
      type: "item.repair",
      target: "event.tool",
      amount: 1,
      when: { test: "counter.reached", key: "toolwright", value: 12 }
    },
    {
      type: "counter.reset",
      scope: "source",
      key: "toolwright",
      when: {
        test: "action.result",
        actionId: "repair",
        op: "eq",
        value: "applied"
      }
    }
  ]
}
```

Actions leem writes/resultados anteriores da mesma transação. `event.tool` inclui
typeId, UID, item revision e fingerprint; se a ferramenta mudou, o CAS falha e o
grupo faz rollback. Ferramenta cheia retorna `no_op`, preservando o counter em 11; só
`repair:applied` permite reset. O counter é `(sourceUid,"toolwright")` e não há
cooldown que descarte dois breaks válidos no mesmo tick.

### 10.4 Straw Effigy — prova de damage guard/cooldown

Requisitos:

- executar em `guard/cancel` no host;
- trigger somente se `wouldBeFatal`;
- cooldown por source UID, recomendado 10 minutos no primeiro teste;
- deixar health mínimo configurado;
- aplicar debuff/feedback visível;
- não stackar com Phoenix Ash/Crown of Last Light no mesmo hit;
- prioridade determinística entre proteções fatais.

As três proteções não são skins do mesmo efeito: Straw é consumível e impede o hit;
Crown é reutilizável, deixa o jogador em 1 health, concede resistance e aplica
`light_debt`; Phoenix consome charge rara, restaura health maior, dispara fogo sem
block damage e aplica weakness.

### 10.5 Sandstrider Boots — prova de watcher sob demanda

Requisitos:

- registrar interesse em `blockAtFeet` apenas quando equipado;
- verificar quando a cell muda e fazer rescan de segurança lento enquanto parado;
- emitir modifier temporário, não reaplicar componente todo tick;
- lista de blocos por tag/config;
- remover bônus no mesmo ciclo ao sair do terreno.

### 10.6 Frostwalker Soles — prova de job W

Requisitos:

- executar somente após mudança de cell;
- coletar posições com limite;
- processar no máximo o budget de blocos por tick;
- armazenar restore token/estado original;
- restaurar por compare-and-swap apenas se o bloco ainda for o temporário criado pelo
  mesmo source/job;
- não alterar containers, waterlogged structures ou claims protegidos;
- cancelar jobs se item/source mudar;
- não competir com Lava Waders no mesmo bloco;
- tratar chunk unload, fluxo de água, dimension change e mutação posterior por outro
  jogador sem restaurar por cima dela.

### 10.7 Contratos dos efeitos com estado

- **Status effects do Trinkets:** passam por um único aplicador com duração de
  240 ticks (12 s). Passivos são renovados a cada 100 ticks; condições contínuas
  apenas ligam/desligam tags auxiliares e solicitam uma atualização agregada.
- **Chronoshard:** dívida pertence ao source UID, sobrevive logout/reload/desequip e
  dimension change, mantém attribution/correlation e, no MVP,
  `deferredDamageCanKill:true`; o registro persistente inclui debtor actor ID,
  source owner/UID, attacker/correlation, outstanding e schedule. Transferir, destruir
  ou duplicar/quarantinar o charm não transfere nem perdoa a dívida do debtor; source
  ausente vira tombstone até o saldo terminar. Se uma tranche mata, a mesma death
  correlation fecha o ledger como `settled_by_debt`, zera outstanding e credita o
  attacker original. Outra causa de morte fecha como `superseded_by_death` — o custo
  já foi a morte. Nenhum saldo cruza respawn; `player.spawn` cancela schedule stale e
  mantém tombstone apenas para audit, impedindo loop pós-respawn.
- **Gravekeeper:** soul charge é estado do amulet, máximo três; trigger de consumo é
  threshold crossing pós-dano abaixo de 30% health. Persiste reload/unequip e expira
  após dez minutos segundo o clock persistente do host.
- **Glutton:** captura hunger/saturation em `item.use.before` e confirma o consumo em
  deferred after; outro alimento, cancelamento ou mudança de slot invalida o proc.
- **Worldroot:** usa delta de posição e input com epsilon, grace window e teleport
  reset; nunca igualdade exata de velocity.
- **Creeper Doll:** dano/kill do próprio `sourceEffectId` não realimenta o proc;
  explosão usa `breaksBlocks:false`, maxTargets e depth guard.
- **Frostwalker:** restore token contém dimension, position, prior permutation,
  temporary permutation, owner UID e deadline. Desequip/cancelamento troca o job para
  `restore_only`; TTL encerra criação nova, não apaga restauração. Chunk indisponível
  fica em journal durável/orphan audit até CAS restaurar ou provar que o bloco já não
  é o temporário do job.
- **Builder's Harness:** allowlist inicial inclui apenas blocos unitários sem block
  entity/estado especial. Doors, beds, crops, containers, redstone complexa e
  multipart ficam fora até adapter específico.
- **Hunter's Bandolier:** MVP recupera somente `minecraft:arrow`; tipped/spectral ou
  munição de addon exige codec/drop identity próprio.
- **Beekeeper's Hat/Veil:** capability ausente usa poison/bee-damage reduction e
  invisibility, respectivamente; nunca finge controlar AI targeting genérico.
- **Straw/Crown/Phoenix:** somente a source prioritária fica pre-armed/locked antes do
  combate. O `before` restricted apenas altera/cancela dano; consumo/charge/cooldown
  confirma deferred pela saga do Core. Crash entre ambos aplica `uncertain_spent`
  conservador, nunca proteção grátis. Sources não escolhidas não entram em cooldown.

## 11. Balanceamento

### 11.1 Budget por raridade

| Raridade | Budget sugerido |
| --- | --- |
| Common | um modifier pequeno ou tradeoff simples |
| Uncommon | dois modifiers pequenos ou um E leve |
| Rare | dois modifiers + E com cooldown |
| Epic | efeito de identidade + condição/custo |
| Legendary/Archaic | efeito forte, drawback real e cooldown/cap explícito |

### 11.2 Regras de stacking

- Damage reduction total usa cap global, não cap por item apenas.
- Evasion de fontes independentes usa `probability_union` ou regra documentada.
- Fatal protections pertencem ao mesmo stacking group e apenas uma ativa por hit.
- Status immunities formam set, mas não removem effects benéficos com nome parcial.
- Passive amplifiers usam max ou combinação explícita; não somam cegamente.
- Lifesteal, crit e bonus loot têm caps por canal.
- Drawbacks passam pelo mesmo snapshot e não podem ser ignorados por ordem de registro.
- Set bonus identifica item/source; tags auxiliares não contam como peças.

### 11.3 Tradeoffs úteis

- mobilidade aquática versus ground speed;
- lifesteal versus max health;
- defense versus speed;
- mana versus health;
- poder durante dia/noite versus neutralidade fora da janela;
- stationary defense versus mobilidade;
- fatal protection versus debuff/cooldown longo.

### 11.4 Anti-redundância

- Prospecting Lens = yield/percepção; Miner's Tool Belt = durabilidade; Miner's Token
  = velocidade acessível; Quarry Sigil = proc raro dependente de drop registry.
- Mirror Mask limpa um debuff próprio; Marionette o copia ao atacante com depth 1.
- Stormcaller Hood fortalece projéteis durante thunder; Stormbound Idol é o único
  que chama lightning.
- Tempest Heart Amulet é defesa reativa; Stormglass Talisman é offense ranged.
- Wayfarer's Knot substitui a segunda fantasia de rabbit, já coberta por Rabbit Rush.
- Dolls precisam de proxy/custo/retaliação; Hollow mantém um tradeoff amaldiçoado,
  Stone usa retort e Lucky cobra hunger.
- Cleansing Thread troca uma maldição por custo menor e reduz tier/budget; não preserva
  todo o bônus de um Archaic Charm gratuitamente.

## 12. Aquisição e loot

O loot atual faz uma rolagem independente por item e soma chances; adicionar dezenas
de registros inflaria baús e drops. Antes da expansão:

1. definir pools ponderados por estrutura/bioma/mob;
2. limitar quantidade de trinkets por container/evento;
3. selecionar categoria/raridade e depois item;
4. impedir que cada novo item aumente linearmente o volume total;
5. usar pity/guarantee apenas em estruturas raras e com tracking bounded;
6. separar craft, mob drop, structure loot, archaeology e salvage;
7. validar IDs namespaced e condições declarativas;
8. revisar o scan atual de estrutura de 13³ blocos antes de ampliar pools.

Distribuição sugerida:

| Fonte | Famílias |
| --- | --- |
| Craft comum | Adventurer, Tool Belt, Blank Mask, Anklets |
| Mineshaft/archaeology | Prospecting Lens, Quarry Sigil, Archaic Binding |
| Nether | Ember Respirator, Magma Cinch, Bloodbound |
| Ocean | Tideforged, Ocean Coin, Fins |
| Witch/swamp | Witch Hat, Plague Mask, Dolls |
| Trial chamber | Guardian Doll, Ironbound/defensive items |
| Ancient city/End | Archaic Charms, Endless Eye, Chronoshard |
| Boss/rare structure | Phoenix, Crown, Stormbound |

Matriz obrigatória antes de prometer cada fonte:

| Fonte proposta | Capability atual | Adapter requerido | Fallback aprovado |
| --- | --- | --- | --- |
| Recipe/craft | JSON nativo | recipe + unlock/catalog | permanece craft |
| Mob kill | Sim, morte causada por player | pool ponderado por mob/category | craft/salvage quando mob não existir |
| Desert pyramid/ruined portal/buried treasure/nether fortress/bastion/outpost | Heurística atual por chest/estrutura | substituir gradualmente por pool versionado | somente pools já suportados; não ampliar scan |
| Mineshaft/stronghold/ancient city/End city/swamp hut/mansion | Não confiável | loot-table build integration ou capability de estrutura | mob/craft/fragment; nunca adivinhar por 13³ scan |
| Ocean monument/ruins | Monument não é detectado de forma confiável | adapter de loot/encounter aquático | drowned, fishing suportado ou craft |
| Archaeology | Não | brush/archaeology loot adapter | recipe com shard/fragment |
| Fishing | Não | loot table/event correlation | drowned/ocean chest suportado |
| Villager/armorer | Não | trade table integration versionada | recipe/structure pool |
| Trial chamber/vault | Não | vault/loot capability específica | breeze/trial reward adapter quando disponível |
| Barrel/outro container | Só `minecraft:chest` | container adapter por typeId | chest suportado ou craft |

O injector atual cobre mob kill e chest, com heurísticas limitadas para seis famílias
de estrutura. A expansão não deve multiplicar scans de blocos; uma fonte sem adapter
fica desabilitada e usa o fallback da matriz. A chave atual de chest tracking também
omite dimension ID: coordenadas iguais em Overworld/Nether/End podem compartilhar
estado. Corrigir para `(dimensionId,x,y,z,containerType)` antes de qualquer pool novo.

`Quarry Sigil` e `Harvester's Token` só são classe E quando um registry/correlation
entrega o drop exato. Procurar item entities após o break seria W, sujeito a query
budget e ainda ambíguo; o MVP prefere desabilitar o proc a fazer esse scan.

Rotas executáveis da Wave 1A, usadas até adapters mais ricos existirem:

| Item | Rota habilitada no release | Rota temática futura |
| --- | --- | --- |
| Lantern Belt | craft lantern + glowstone + copper | — |
| Magnetic Girdle | craft Reinforced Belt + iron | stronghold/armorer adapter |
| Marksman's Monocle | pool suportado de pillager outpost | pillager captain challenge |
| Plague Doctor Mask | drop de witch por mob-kill adapter | swamp hut loot adapter |
| Witch's Crooked Hat | drop raro de witch | ritual/craft futuro |
| Featherstep Anklets | craft feather + leather + rabbit hide | mountain/End loot adapter |
| Stone Guardian Doll | craft Porcelain Doll Core + stone/iron | trial vault adapter |
| Lapis Focus | craft lapis + amethyst | enchanting progression futura |
| Wardstone | craft obsidian + ender eye | stronghold loot adapter |

O gate da Wave 1A usa a coluna habilitada; não aceita uma fonte marcada apenas como
“futura”.

## 13. Correções de conteúdo antes de novas waves

- Strong Abyssal Ring: lore fala Resistance, registro fornece Regeneration.
- Strong Jade Ring: lore promete immunity a poison, registro não fornece.
- Heavy Miner Ring: lore indica Haste II, definição resulta em Haste I.
- Abyssal Diver Helmet: lore promete visão clara sem mechanic correspondente.
- Dead Abyssal Orb: lore fala em respiração, mas só altera water speed.
- Miner Ring: lore menciona rendimento de minério, mas só aplica haste.
- Strong Ender Ring: lore promete evasão, mas fornece apenas attack.
- Obsidian Skull: comportamento em lava contradiz a proteção descrita.
- Holy Cross: corrigir `evocation_illager` para ID namespaced válido.
- Remover tradução duplicada de `item.dorios:scroll`.
- Revisar `repair_talis`: o ID diz talisman, mas ocupa necklace.

Cada correção precisa declarar se a lore ou o comportamento é a intenção canônica.

## 14. Pipeline de produção por item

Checklist obrigatório:

- [ ] ID e display name não colidem.
- [ ] Slot e item tags corretos.
- [ ] ItemDefinition schema válido.
- [ ] Units/channels/stacking/caps definidos.
- [ ] Effect trigger, phase, chance, cooldown e budget class definidos.
- [ ] Condições possuem fallback e não usam callback remoto.
- [ ] Recipe/drop/loot pertence a pool controlado.
- [ ] Texture, item_texture e creative catalog atualizados.
- [ ] `en_US`, `pt_BR`, `pt_PT`, `es_ES` e `es_MX` possuem nome/lore.
- [ ] Lore usa o comportamento real e valores formatados pela API.
- [ ] Teste equip/unequip/reload.
- [ ] Teste multiplayer e coexistência com item do mesmo stacking group.
- [ ] Métrica de custo não excede a classe declarada.
- [ ] Changelog e guide atualizados.

## 15. Ordem de lançamento recomendada

### Wave 0 — infraestrutura

- hat/face split;
- belt slot e assets vazios;
- inventory size 15;
- slot aliases e migrations;
- `empty_hat`, `empty_face`, `empty_belt` e decisão de substituir `empty_head`;
- wireframe 5x3, coordenadas por UI scale, controller focus e touch safe-area;
- sentinel interno separado do título localizado e teste de baú renomeado;
- atualização de `en_US`, `pt_BR`, `pt_PT`, `es_ES` e `es_MX`;
- escrow nativo durável ou form transacional DP, conforme backend aprovado;
- empty belt e blank mask;
- nenhuma ability nova.

### Wave 1A — prova geral

- Lantern Belt;
- Magnetic Girdle;
- Marksman's Monocle;
- Plague Doctor Mask;
- Witch's Crooked Hat;
- Featherstep Anklets;
- Stone Guardian Doll;
- Lapis Focus;
- Wardstone.

### Wave 1B — cobertura de categorias (25 equipáveis)

- todos os demais itens da seção 6, inclusive os poucos E condicionais;
- duas novas recipes por slot vazio;
- loot pools ponderados;
- correções de conteúdo legacy.

### Wave 2A — effects por evento

- Toolwright Belt;
- Soulcatcher Belt;
- Echo Visor;
- Straw Effigy;
- Leech Doll;
- Echoheart Amulet;
- Quarry Sigil;
- Wayfinder Compass.

### Wave 2B — sampled

- Magma Cinch;
- Miner's Helmet;
- Sandstrider Boots;
- Rootwalker Sandals;
- Moonstone Amulet;
- Sunstone Amulet;
- Worldroot Knot.

### Wave 2C — effects e lifecycle restantes

- Hunter's Bandolier;
- Builder's Harness;
- Mirror Mask;
- Veil of Silence;
- Ender Visor;
- Beekeeper's Hat;
- Crown of Last Light;
- Shadowstep Greaves;
- Slimebound Boots;
- Marionette of Spite;
- Guardian Effigy;
- Glutton's Seal.

### Wave 3A — world jobs/lendários

- Frostwalker Soles;
- Stormbound Idol;
- Stormcaller Hood;
- Phoenix Ash Sigil;
- Chronoshard;
- set bonuses de tier alto.

### Wave 3B — estado/correlação avançados

- Creeper Doll;
- Gravekeeper Amulet;
- Tempest Heart Amulet;
- Totem of Momentum;
- Stormglass Talisman;
- Harvester's Token.

As waves agora atribuem os 72 equipáveis: 34 na seção 6 (9 em 1A + 25 em 1B) e
38 na seção 7 (8 em 2A + 7 em 2B + 12 em 2C + 5 em 3A + 6 em 3B).

O cutover técnico tem gate separado: 79 itens legacy + Lantern Belt + Marksman's
Monocle. O primeiro release de conteúdo novo termina na Wave 1A. Completar os 72 é um
programa posterior e não bloqueia a integração StatsCore/DoriosLib.

Gates operacionais por wave:

| Wave | Gate adicional |
| --- | --- |
| 0 | backend/lease/UI crash-safe, 15 bindings, assets/locales/controller/touch |
| 1A | nove rotas habilitadas, modifiers/applicators e Stone retort testados |
| 1B | 25 itens + materiais/recipes/salvage; caps e loot inflation aprovados |
| 2A | action results, read-your-writes, multi-source CAS/journal e rollback |
| 2B | watcher interest/budget, transições e remoção imediata ao desequipar |
| 2C | cada capability/fallback testado; feature ausente não simula sucesso |
| 3A | jobs W/restore + dívida Chronoshard em death/respawn/logout/source transfer |
| 3B | persistência, transferência/destruição, logout/dimensão e correlação multiplayer |

## 16. Critérios de conclusão da expansão

### Onda adicional — relíquias de mobs e estruturas pouco usadas

- `dorios:ravager_horn_buckle`: drop de Ravager; prepara uma carga após correr.
- `dorios:spider_silk_mantle`: drop de Aranha e Aranha das Cavernas; prende o agressor.
- `dorios:huskbone_mask`: drop de Husk; imunidade a Fome e sustento contra mortos-vivos.
- `dorios:goatstep_anklets`: drop de Cabra; defesa contra impactos cinéticos.
- `dorios:hoglin_tusk_gauntlet`: drop de Hoglin; dano de abertura contra alvos saudáveis.
- `dorios:ghast_tear_locket`: drop de Ghast; reação defensiva contra fogo.
- `dorios:endermite_loop`: drop de Endermite; velocidade e chance crítica.
- `dorios:trial_champion_crown`: loot de Trial Chambers; recompensa três abates rápidos.
- `dorios:sculk_resonator`: loot de Ancient City; pulso sônico em vida crítica.
- `dorios:mansion_ward_amulet`: loot de Woodland Mansion; defesa sobrenatural.
- `dorios:stronghold_eye_charm`: loot de Stronghold; dano contra criaturas do End.
- `dorios:end_city_orb`: loot de End City; converte abates do End em mana.

Os doze itens não possuem receita. Sete usam drops de mobs e cinco usam estruturas
que ainda não participavam do detector de loot do addon.

### Onda adicional — relíquias de fontes subutilizadas

- `dorios:silverfish_scale_ring`: drop de Silverfish; defesa crescente quando cercado.
- `dorios:breeze_core_loop`: drop de Breeze; estabilidade e defesa enquanto está no ar.
- `dorios:ominous_key_ring`: loot de Trial Chambers; Chaves Ominosas carregam um golpe fortalecido.
- `dorios:phantom_membrane_mantle`: drop de Phantom; amortece uma queda e abre Queda Lenta.
- `dorios:armadillo_shield_brooch`: drop de Armadillo; bloqueio parcial de projéteis ao agachar.
- `dorios:lost_allay_bell`: loot de Pillager Outpost; converte experiência adquirida em mana.
- `dorios:desert_scarab_charm`: loot de Desert Pyramid; defesa e fuga após explosões.
- `dorios:packed_snow_doll`: loot de Igloo; invoca um Golem de Neve temporário em vida baixa.
- `dorios:shipwrecked_doll`: loot de Shipwreck; nega afogamento e impulsiona o portador.
- `dorios:wind_bracer`: drop de Breeze; fortalece golpes contra inimigos no ar.
- `dorios:cracked_bastion_medallion`: loot de Bastion; consome ouro para amortecer dano.
- `dorios:jungle_reliquary`: loot de Jungle Temple; nega periodicamente um projétil.

Os doze itens também não possuem receita. Cinco são obtidos de mobs ou de seus
recursos e sete pertencem a loot de estruturas, incluindo três novos detectores:
Igloo, Shipwreck e Jungle Temple.

- [x] Belt possui ao menos dez itens e papel predominantemente utilitário.
- [x] Hat e face possuem slots, identidades, catálogos e assets separados.
- [x] Doll, feet, archaic charm, amulet e talisman atingiram as metas mínimas.
- [x] Body, necklace, charm e gauntlet atingiram as metas mínimas.
- [x] Nenhuma nova categoria usa loop próprio por jogador.
- [ ] Todos os effects são indexados por trigger e declararam custo.
- [ ] Itens W passam pelo scheduler e budget.
- [ ] Loot total por estrutura não cresceu linearmente com a quantidade de itens.
- [x] Strings dos sets implementados correspondem ao runtime e suas linhas de lore
  têm no máximo 44 caracteres visíveis.
- [ ] Set bonuses recalculam apenas em loadout change.
- [ ] Progressão individual só foi habilitada depois da matriz de fidelidade do
  backend de loadout.
- [ ] Playtests cobrem early, mid e late game, singleplayer e multiplayer.
