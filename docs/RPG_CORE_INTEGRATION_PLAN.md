# Dorios RPG Core — plano de integração entre Trinkets, StatsCore e DoriosLib

> Status: arquitetura e planejamento; nenhuma fase de runtime está implementada por este documento.
>
> Branch de trabalho: `Kauziin/statscore-integration`
>
> Baseline do Trinkets: `v2.1.2` (`abe5428`)
>
> Data do levantamento: 2026-08-22
>
> Catálogo de conteúdo associado: [TRINKETS_CONTENT_EXPANSION_PLAN.md](./TRINKETS_CONTENT_EXPANSION_PLAN.md)
>
> Catálogo bruto de eventos existente: [core_events_plan.md](../BP/scripts/core_events_plan.md)

## 1. Resumo executivo

O novo RPG Core não deve ser uma cópia maior do `Core` atual do Dorios' Trinkets,
nem uma cópia literal do StatsCore do Ascendant Technology. A direção recomendada
é extrair dos dois sistemas um kernel reutilizável em `DoriosLib.rpg`, mantendo
conteúdo, balanceamento, máquinas, assets e integrações específicas nos addons que
os possuem.

O desenho separa quatro responsabilidades e parte de uma restrição central do
Bedrock: cada behavior pack executa em um runtime JavaScript isolado. Duas cópias da
DoriosLib não compartilham `Map`, callbacks, registries ou objetos `Entity`; o único
estado comum é o mundo/API e o transporte serializado.

1. **DoriosLib** contém schemas, builders, resolvers puros e as implementações
   reutilizáveis de cliente e host. A cópia de cada addon é local ao seu runtime.
2. **Dorios RPG Core** é o único host autoritativo dos listeners mundiais e da
   aplicação de stats, efeitos e progressão cross-pack.
3. **Dorios' Trinkets** fornece slots, loadout, UI, itens, loot e efeitos próprios.
4. **Ascendant Technology** fornece tiers, definições, refino e efeitos específicos
   que hoje vivem no StatsCore.

```text
Dorios' Trinkets ───────┐
Ascendant Technology ───┼─> DoriosLib.rpg/client ─> protocolo v1 (DTOs)
Outros addons ──────────┘                                  │
                                                           v
                                        Dorios RPG Core + DoriosLib.rpg/host
                                                           │
                       ┌───────────────────────────────────┼────────────────────┐
                       v                                   v                    v
                 actor snapshots                    event pipeline       persistence
                 e stat apply                       e effects             e migrations
```

O StatsCore continua sendo a referência madura para estado individual de
`ItemStack`, progressão, refino, cache e resolução. O sistema atual do Trinkets é
a referência para loadout de acessórios, stats agregados do jogador e conteúdo.
O novo core preserva as duas escalas em vez de misturá-las:

- **item snapshot**: estado e atributos de uma instância de item;
- **actor snapshot**: resultado agregado de todas as fontes equipadas;
- **event snapshot**: contexto imutável de um evento de combate, mineração, cura,
  movimento ou interação.

## 2. Objetivos e critérios de sucesso

### 2.1 Objetivos funcionais

- Permitir que qualquer addon publique stats, source descriptors, slots, condições,
  efeitos, progressões e referências de actions por API pública; código executável
  adicional exige plugin instalado no host.
- Aceitar novos campos sem editar um objeto global fixo como o `statsConfig` atual.
- Unificar armas, ferramentas, armaduras vanilla, trinkets e futuras fontes em uma
  única agregação determinística.
- Preservar progressão, refino, lore, dynamic properties e identidade individual
  de cada `ItemStack` equipado.
- Adicionar `belt` e separar `head` em `hat` e `face` sem quebrar os 13 slots atuais.
- Permitir condições e efeitos cross-pack sem serializar funções JavaScript.
- Expor compatibilidade temporária para as APIs, tags, script events e dynamic
  properties antigas.
- Manter conteúdo específico fora do kernel compartilhado.

### 2.2 Objetivos de desempenho

- Nenhum intervalo por jogador.
- No máximo um listener do host para cada sinal da Script API.
- Nenhum polling de ambiente para jogadores sem regras que dependam dele.
- No máximo uma recomputação por `(actor, revision, tick)`; uma mutação posterior no
  mesmo tick cria nova revisão e pode exigir novo resolve correto.
- Nenhuma escrita de dynamic property quando o valor serializado não mudou.
- Definições e condições normalizadas/compiladas uma vez no registro.
- Eventos consultam apenas regras indexadas para o trigger recebido.
- Ações de mundo pesadas respeitam orçamento de blocos, entidades e tempo por tick.
- Estado temporário possui expiração e limpeza bounded; Maps não crescem para sempre.

### 2.3 Não objetivos da primeira versão

- Tornar qualquer slot visual arbitrariamente extensível pela UI JSON do Minecraft.
- Executar callbacks JavaScript enviados por outro behavior pack.
- Migrar receitas, texturas e loot de todos os addons para a DoriosLib.
- Balancear definitivamente todos os itens durante a extração técnica.
- Persistir cada cooldown curto, marca ou partícula em dynamic properties.
- Corrigir por heurística silenciosa definições inválidas de terceiros.

## 3. Auditoria do estado atual

### 3.1 Dorios' Trinkets

| Área | Estado atual | Consequência |
| --- | --- | --- |
| Bootstrap | `main.js` importa `register.js`, `system.js` e todo o `Core` embutido | O addon já contém o antigo RPG Core, apesar do aviso de dependência externa |
| Slots | 13 índices fixos em código, entidade e UI | Não aceita `face`, `belt` ou extensões sem alterar três camadas |
| Equipamento | Trinkets são representados por tags do jogador | Duas instâncias do mesmo item não podem possuir estado independente |
| Persistência | Ao abrir, usa `new ItemStack(typeId)` | Lore, nome, enchantments, durabilidade, DPs e refino são perdidos |
| Stats | 19 campos hardcoded; apenas tags entram no cálculo | Equipamento físico prometido pelo guia não contribui |
| Snapshot | Quatro JSONs separados são escritos no jogador | Escritas e parses repetidos; sem revisão transacional |
| Runtime | Um `runInterval(..., 1)` por jogador mais um loop mundial por tick | Custo cresce mal e realiza block lookups desnecessários |
| Registro | `JSON.stringify` de objetos que podem conter callbacks | Funções `condition` desaparecem no transporte |
| Conflitos | Última definição vence silenciosamente | Addons podem sobrescrever dados uns dos outros |
| Damage | Listeners aplicam dano adicional e usam causes como guard | Há risco de recursão e dupla aplicação |

O catálogo possui 86 entradas, sendo 79 trinkets reais e sete registros auxiliares
`*_tag`. Os slots menos preenchidos são `doll` (1), `feet` (2),
`archaiccharm` (2), `amulet` (3) e `talisman` (4). `belt` ainda não existe.

### 3.2 StatsCore do Ascendant Technology

Pontos que devem ser preservados:

- API pública central em `StatsCore/API.js`;
- registro em `Map` e inferência de definições;
- estado individual no `ItemStack`;
- normalização de progressão, afinidade, branch, refino e abilities;
- cache de estado, contexto por tick e snapshot resolvido;
- escrita apenas quando a DP mudou;
- intenção de coalescer XP/feedback; o buffer RAM-only atual não é portado literalmente;
- runtime predominantemente orientado a eventos.

Pontos que não podem ser copiados literalmente:

- DPs e IDs presos ao namespace `utilitycraft:*`;
- slots limitados a mainhand, offhand e armadura vanilla;
- defaults, comandos, glyphs, drops e máquinas do Ascendant misturados à engine;
- bootstrap com side effects por import;
- múltiplos pipelines de `entityHurt` reconstruindo contexto semelhante;
- effects implementados por grandes cadeias `if (kind === ...)`;
- ausência de schema, owner, merge policy, migrations reais e testes públicos;
- ações de mundo sem orçamento comum.

Bugs do StatsCore a transformar em fixtures antes da migração:

1. migração legacy de Bonus Loot não incorpora corretamente os campos antigos;
2. pontos de atributo são lidos, mas não concedidos no gameplay;
3. bônus rolados de preservação aparecem em dados, mas não afetam a chance final;
4. Steel usa o fallback de crescimento de Titanium;
5. armor penetration não opera contra mobs/bosses como documentado;
6. chances misturam fração e porcentagem por heurística descontínua;
7. XP fracionário configurado é truncado;
8. o guard de dano de proc pode suprimir outro ataque legítimo ao mesmo alvo;
9. itens sem UID podem compartilhar cache `uninitialized:<typeId>`;
10. registros cross-pack sobrescrevem definições sem validação ou ack de erro.

### 3.3 Dorios-RPG-Core standalone

O repositório standalone ainda contém a implementação antiga com `DoriosAPI`,
globals e alterações de protótipos. O Trinkets embute uma cópia muito semelhante
em `BP/scripts/Core`. O standalone usa uma versão mais antiga da Script API e não
deve ser promovido como base técnica sem substituição do runtime.

### 3.4 DoriosLib

Não há repositório canônico de DoriosLib. Existem cópias físicas em vários addons:

- Trinkets e UtilityCraft: `2.1.0`;
- Ascendant: `2.0.0`;
- outros projetos possuem variantes próprias.

Antes do cutover deve existir uma fonte de verdade e um processo determinístico de
sincronização. O protótipo pode nascer nesta branch em
`BP/scripts/DoriosLib/rpg`, mas não será considerado concluído enquanto permanecer
apenas na cópia do Trinkets.

A recomendação formal é um repositório próprio da DoriosLib. Uma única source/release
gera pelo menos dois outputs: `shared+client` e `shared+host`. Cada output tem hash e
lock próprios; o suboutput `shared` também possui hash comparável entre eles. Não se
exige que client e host inteiros tenham bytes iguais. Commit de origem, versão e
provenance acompanham ambos. `config.js`, metadata e adapters do addon ficam fora dos
outputs canônicos; overlays só podem existir em diretórios de integração
explicitamente excluídos do checksum. Nenhum consumidor importa a raiz legada da
DoriosLib se ela ainda executar side effects de configuração: importa diretamente
`DoriosLib/rpg/shared`, `DoriosLib/rpg/client` ou `DoriosLib/rpg/host`.

Baseline recomendado para o primeiro build conjunto: `@minecraft/server` 2.8 e
`min_engine_version` 1.21.120 em Trinkets, Ascendant e RPG-Core, validados contra a
mesma versão estável do jogo. Hoje os projetos misturam Script API 2.2/2.8 e engines
1.21.0/1.21.80/1.21.120. Feature detection não resolve um export ausente em import
estático; compatibilidade com engines antigas exige outro artefato/build, nunca um
branch condicional dentro do mesmo módulo.

## 4. Decisões arquiteturais

Estas decisões são o baseline recomendado; mudar qualquer uma exige registrar uma
ADR e revisar migrations, protocolo e testes.

1. **Kernel na DoriosLib, conteúdo fora dela.** A biblioteca conhece contratos e
   mecanismos; não conhece Aetherium, Tideforged, Refining Table ou loot pools.
2. **Host mundial único e obrigatório.** Apenas o Dorios-RPG-Core instala o pipeline
   cross-pack e escreve estado canônico. Clientes não inicializam um segundo runtime
   e ficam inertes se o host estiver ausente ou incompatível.
3. **Lifecycle explícito.** Importar `DoriosLib.rpg` não assina eventos. Host e
   cliente exigem `initialize()` e oferecem `shutdown()` para testes/hot reload.
4. **Sem funções no protocolo.** Cross-pack aceita somente dados JSON-safe e IDs de
   conditions/actions instalados no host. Callbacks, providers, codecs e applicators
   são exclusivamente host-local; não existe callback "do mesmo bundle" remoto.
5. **Item, actor e evento são estados diferentes.** O actor snapshot é derivado;
   não substitui o estado persistente dos itens.
6. **Tags são apenas compatibilidade.** Elas não são fonte de verdade do loadout.
7. **Unidades são explícitas.** Uma chance usa `fraction` de 0 a 1; nunca há
   heurística em que `1` e `1.01` mudam de escala.
8. **Registro tem owner e versão.** Colisões não usam silenciosamente last-write-wins.
9. **Slots são registrados.** Índice físico, aliases, família, aceitação e provider
   são dados normalizados, não propriedades espalhadas.
10. **Snapshot é invalidado por revisão.** Não se percorrem todas as tags a cada tick.
11. **Efeitos são indexados por trigger.** Nenhum evento varre todas as definições.
12. **Actions pesadas são jobs orçados.** Uma ability nunca ganha direito a 343
    comandos ou centenas de block mutations no mesmo tick sem scheduler.
13. **Falha é isolada.** Uma definição ou handler externo inválido é rejeitado ou
    desativado sem derrubar o pipeline dos demais addons.
14. **Compatibilidade é temporária e observável.** Todo alias e adapter antigo tem
    warning, contador de uso e release de remoção planejado.
15. **Memória é isolada por behavior pack.** O registry canônico existe somente no
    host; registries/cache de clientes servem para build, validação e status local.
16. **Escritor único.** Equip, state DPs, progressão e registry mutations são
    transações do host. O cliente envia intenção com revisão e fingerprint esperados.
17. **Falha fechada.** Host ausente, dois hosts ou versão incompatível desabilitam
    aplicação e escrita; não há fallback silencioso para o runtime antigo.
18. **Ecossistema confiável, não autenticado.** `sourceAddon` pode ser forjado por
    outro pack. Namespaces, target filters e allowlists são políticas de confiança,
    não segurança criptográfica; o protocolo nunca transporta segredos.
19. **IDs têm gramática por tipo, sem aliases implícitos.** Stats usam
    `<namespace>:<dominio>.<nome_em_snake_case>` (`dorios:critical.chance`); IDs de
    item/slot/effect usam `<namespace>:<snake_case_path>` salvo subdomínio declarado.
    `addonId`, `ownerId` e `allowedNamespaces` são campos distintos e explicitamente
    mapeados.
20. **Definições e snapshots são imutáveis.** O host clona/valida e deep-freeze plain
    data no commit; Maps/Sets ficam privados atrás de accessors readonly. Nenhuma API
    entrega referência interna mutável.

Gramática congelada por registry:

| Tipo | Forma serializada | Exemplo |
| --- | --- | --- |
| Stat | `namespace:domain.path` | `dorios:damage.penetration` |
| Item/effect/track | `namespace:snake_case_path` | `dorios:toolwright_belt` |
| Slot | `namespace:path` com subslot pontuado permitido | `dorios:ring.secondary` |
| Action/condition custom | `namespace:snake_case_path` | `ascendant:operator_burst` |
| Built-in reservado | token pontuado sem namespace | `item.repair`, `counter.add` |

Validators são distintos por registry; não existe normalização que transforme
automaticamente underscore em ponto ou acrescente namespace ausente.

## 5. Limites de responsabilidade

| Componente | Pertence à DoriosLib | Pertence ao addon |
| --- | --- | --- |
| Stat registry, unidades e stacking | Sim | Registros adicionais |
| Item state envelope e migrations | Sim | Extensions namespaced |
| Progression math e transações | Sim | Curvas/tiers e fontes de XP |
| Slot registry e source provider API | Sim | Slots e UI visual do Trinkets |
| Event router e context schema | Sim | Regras e effects concretos |
| Condition compiler e actions básicas | Sim | Conditions/actions especializadas |
| Cooldowns e temporal state | Sim | Parâmetros de cada efeito |
| Lore composer cooperativo | Sim | Textos, glyphs e seções |
| ScriptEvent transport | Sim | Identidade/capabilities do addon |
| Refining roll primitives | Sim | Mesa, chips, ingots e recipes AT |
| Loot/drop engine genérico | Opcional, após o MVP | Pools e chances do Trinkets |
| Partículas, sons e modelos | Não | Addon de conteúdo |
| Comandos administrativos específicos | Não | Host ou addon proprietário |

Há três classes de extensão, que não podem ser confundidas:

| Classe | Pode conter função? | Onde executa | Exemplo |
| --- | --- | --- | --- |
| Built-in host-local | Sim | Dorios-RPG-Core | provider, codec, applicator, `before` action |
| Descriptor remoto | Não | Compilado pelo host | stat, item, slot, selector, effect declarativo |
| Notificação remota | Não no payload | addon proprietário, somente post/deferred | feedback ou integração não canônica |

O provider oficial de loadout do Trinkets e o provider vanilla ficam instalados no
host. O cliente Trinkets publica slots, itens, layout e conteúdo declarativo. Uma
extensão Ascendant que exige inferência ou callback pode ser pré-expandida em
selectors declarativos ou instalada como plugin local do host; não atravessa o
protocolo como JavaScript.

Plugins locais possuem caminho físico e release coordenado:

```text
Dorios-RPG-Core/BP/scripts/integrations/
  registry.js                 # matriz host-owned de owners/plugins/capabilities
  trinkets/                   # provider, escrow/form e actions não expressáveis
  ascendant/                  # inference/applicators/custom components AT
```

O Core oficial distribui esse superset de integrações suportadas; cada módulo é
feature-gated e fica no-op quando o addon cliente não está presente. Custom item
components de integrações suportadas são registrados incondicionalmente no startup,
antes de qualquer handshake. A matriz registra `pluginVersion`, range do Core/API,
owner, namespaces, required bundles e startup capabilities. Terceiros ficam limitados
a descriptors/built-ins/notificações deferred, salvo quando sua integração for
fisicamente adicionada a um build coordenado do Core. Testes usam o MCpack/world
empacotado com plugin presente, ausente e incompatível.

Um terceiro pode registrar custom component startup-only dentro do próprio addon,
desde que não instale um segundo RPG gameplay pipeline nem escreva estado canônico;
integração com o host continua por descriptors/intents post-deferred.

## 6. Estrutura proposta da DoriosLib

```text
BP/scripts/DoriosLib/rpg/
  shared/
    index.js                  # builders/resolvers puros, sem subscriptions
    constants.js             # versões, limites e IDs canônicos
    schema/                   # validação, normalização e migrations puras
    stats/                    # definitions, compile e aggregate
    items/                    # schemas de definition/state/snapshot
    conditions/               # AST e análise de custo/capability
    progression/              # curvas, fixed-point e transações puras
    protocol/                 # DTOs, canonical encoding e erros
  client/
    index.js                  # createClient; owner fica bound
    bundles.js                # build/validate/publicar descriptors
    transport.js              # hello/ready/retry/chunk/ack
    intents.js                # equip/query/invalidate/action DTOs
    cache.js                  # capabilities/status não canônicos
  host/
    index.js                  # createHost; único entrypoint de runtime
    bootstrap.js              # autoridade/host conflict antes dos listeners
    registry/                 # registry canônico, ownership e compile
    items/                    # state, codecs host-local e resolver
    slots/                    # registry e providers host-local
    loadout/                  # store, journal, CAS e recovery
    events/                   # router, temporal state e damage pipeline
    effects/                  # actions host-local, cooldowns e dispatch
    runtime/                  # scheduler, applicators e lifecycle
    transport/                # staging, atomic commit e action delivery
    lore/ feedback/ compat/ debug/
```

`shared`, `client` e `host` são entrypoints distintos. A raiz pode reexportar apenas
`shared`; ela não reexporta o host para impedir que um import inocente instale ou
mesmo carregue módulos com subscriptions. O artefato cliente não contém os módulos
host-only.

Os módulos não usam `globalThis` como registry público nem modificam prototypes.
Idempotência fica em instâncias/lifecycle module-local; isso não a torna cross-pack.

## 7. Superfície pública inicial

### 7.1 API pura

```js
import * as rpgShared from "./DoriosLib/rpg/shared/index.js";

const bundle = rpgShared.bundles.build({
  ownerId: "dorios_trinkets",
  definitions: [itemDefinition, slotDefinition]
});

const normalized = rpgShared.schema.validateBundle(bundle);
const itemSnapshot = rpgShared.items.resolve({ definition, state, context });
const actorSnapshot = rpgShared.stats.aggregate(sources, compiledRegistry);
```

A API pura não altera registry mundial. `ownerId` não precisa ser igual ao namespace:
o host mantém o mapping explícito `dorios_trinkets -> ["dorios"]`. Extensions usam
chaves completas como `dorios_trinkets:acquisition`, nunca objetos soltos por addon.

### 7.2 API de runtime

```js
import { createHost } from "./DoriosLib/rpg/host/index.js";

const host = createHost({
  addon: { id: "dorios_rpg_core", version: "1.0.0" },
  protocol: { min: 1, max: 1 },
  features: ["stats", "effects", "loadout", "progression"],
});

host.registerLocalProvider(provider); // callback permitido apenas aqui
host.registerLocalAction(action);
const start = await host.initialize({ settleTicks: 40, timeoutTicks: 200 });
host.status(); // { state, hostSessionId, registryEpoch, reason }
await host.shutdown();
```

```js
import { createClient } from "./DoriosLib/rpg/client/index.js";

const client = createClient({
  addon: {
    id: "dorios_trinkets",
    version: "3.0.0"
  },
  protocol: { min: 1, max: 1 },
});

client.registerBundle(bundle);
await client.initialize();
const ready = await client.ready({ timeoutTicks: 200 });
if (ready.ok) {
  await client.publish(); // owner é bound; não publica em nome de outro owner
  await client.waitUntilActive({ timeoutTicks: 400 });
}
```

`initialize()`/`shutdown()` são assíncronos e idempotentes. Chamadas duplicadas
compartilham a mesma Promise. `ready()` significa `transport_ready`: session/capability
negociada e host aceitando registration mesmo durante `syncing`; ele sempre resolve
com resultado ou timeout. `waitUntilActive()` espera o registry epoch que contém a
integração do cliente. Essa separação evita ready->publish->active deadlock.
`shutdown()` cancela retries, timers, assemblies, UI sessions, subscriptions e jobs antes
de resolver. `shutdown -> initialize` cria nova session/epoch. Estado `active`, não
um booleano ambíguo de "transport instalado", é o único que autoriza gameplay.

No host, gameplay local pode usar referências da Script API. No cliente, equip é uma
intenção assíncrona serializável; somente o host relê e remove o item:

```js
const selectedIdentity = client.items.identify(selected); // read-only de dorios:rpg_item/legacy
const result = await client.loadout.equip({
  actorId: player.id,
  slot: "dorios:belt",
  sourceSlot: player.selectedSlotIndex,
  expectedLoadoutRevision: 18,
  expectedItem: {
    typeId: selected.typeId,
    uid: selectedIdentity.uid,
    itemRevision: selectedIdentity.revision,
    fingerprint: selectedIdentity.fingerprint
  }
});

if (!result.ok) {
  // result.code, result.message, result.details
}
```

DTOs remotos nunca contêm `Entity`, `ItemStack`, `Map`, `Set` ou funções. Referências
usam entity ID, dimension ID, posição, tick, correlation ID, source UID/revision e
prazo. O host resolve novamente o alvo, rejeita entidade stale/dimensão divergente e
trata retry por idempotency key. Notificações ao owner são post/deferred, têm timeout
e ack; não podem cancelar evento nem escrever estado canônico.

## 8. Schema de stats extensível

Cada stat é um registro, não um campo hardcoded:

```js
{
  schemaVersion: 1,
  id: "dorios:critical.chance",
  unit: "fraction",
  defaultValue: 0,
  aggregate: "sum",
  clamp: { min: 0, max: 1 },
  channels: ["combat.outgoing"],
  display: {
    translationKey: "rpg.stat.dorios.critical_chance",
    format: "percent"
  }
}
```

### 8.1 Unidades mínimas

| Unit | Semântica | Exemplo |
| --- | --- | --- |
| `flat` | unidades de gameplay | `+4` health points |
| `fraction` | razão entre 0 e 1 quando capped | `0.15` = 15% |
| `multiplier` | multiplicador completo | `1.25` = 125% |
| `ticks` | duração absoluta em ticks | `100` = 5 s |
| `seconds` | valor convertido no compile | `5` |
| `count` | inteiro discreto | `2` extra jumps |
| `rate_per_second` | ganho por segundo | mana/health regen |

Nenhum helper tenta adivinhar se `5` é 5% ou 500%.

### 8.2 Operadores de agregação

| Operador | Uso |
| --- | --- |
| `sum` | dano flat, vida, velocidade aditiva |
| `multiply` | multiplicadores independentes |
| `multiply_delta` | delta explícito compilado para fator `1 + value` |
| `max` / `min` | melhor aura ou limitação dominante |
| `override` | maior prioridade, empate por owner/id |
| `probability_union` | chances independentes: `1 - Π(1-p)` |
| `unique_set` | imunidades, traits, tags |
| `stacked_list` | effects que preservam source UID |

Modificadores usam fases explícitas:

1. `base`;
2. `add`;
3. `multiply`;
4. `final_add`;
5. `final_multiply`;
6. clamp do stat e cap group.

Isso elimina ambiguidades como `attackMulti`, `critMulti` e `speed: 100`.
`multiply` recebe fator completo (`1.12`); `multiply_delta` recebe delta (`0.12`).

### 8.3 Compilação

Na API, IDs permanecem strings namespaced. No runtime, o registry atribui um
`statIndex` inteiro determinístico para uma revisão, ordenando IDs canônicos antes do
compile. O índice nunca é persistido nem enviado entre runtimes; cache compilado só é
reutilizado com o mesmo registry revision/hash. Modificadores numéricos frequentes
são compilados em arrays densos; campos raros/customizados permanecem em `Map`. O
actor snapshot público expõe getters por ID e só materializa um objeto completo para
UI/debug.

### 8.4 Catálogo canônico inicial

| Domínio | IDs iniciais |
| --- | --- |
| Vida/recursos | `dorios:health.max`, `dorios:health.regen`, `dorios:mana.max`, `dorios:mana.regen`, `dorios:mana.steal` |
| Dano | `dorios:damage.flat`, `dorios:damage.multiplier`, `dorios:damage.marked`, `dorios:damage.projectile`, `dorios:damage.elemental`, `dorios:damage.penetration` |
| Crítico | `dorios:critical.chance`, `dorios:critical.multiplier`, `dorios:critical.bonus` |
| Defesa | `dorios:damage.reduction`, `dorios:damage.evasion`, `dorios:knockback.resistance`, `dorios:thorns`, `dorios:healing.efficiency` |
| Sustain | `dorios:lifesteal`, `dorios:absorption.gain`, `dorios:healing.received` |
| Movimento | `dorios:speed.ground`, `dorios:speed.water`, `dorios:speed.lava`, `dorios:jump.extra`, `dorios:fall.reduction` |
| Mineração | `dorios:mining.speed`, `dorios:loot.bonus_chance`, `dorios:durability.preserve`, `dorios:yield.double`, `dorios:yield.triple` |
| Utilidade | `dorios:xp.gain`, `dorios:pickup.radius`, `dorios:cooldown.reduction`, `dorios:ability.power`, `dorios:luck` |

Campos futuros não exigem editar o agregador, desde que registrem unidade, operador e
clamp. Um stat sem applicator ainda aparece no snapshot, mas o audit reporta que ele
não produz efeito vanilla.

`dorios:damage.penetration` usa `fraction`, agrega/capa conforme a StatDefinition e
atua somente sobre `DefenseProfile` compatível. O adapter AT mapeia percent, per-level,
cap, boss scalar e boss cap campo a campo; nenhum leaf do resolver antigo pode sumir:
cada um termina em stat, effect ou extension AT deliberadamente preservada.

## 9. Mapeamento de stats legados

| Trinkets v2 | Canônico | Conversão |
| --- | --- | --- |
| `health` | `dorios:health.max` | health points, sem dividir internamente |
| `mana` | `dorios:mana.max` | flat |
| `attack` | `dorios:damage.flat` | flat |
| `attackMulti` | `dorios:damage.multiplier` | `1 + value/100` |
| `knockback` | `dorios:knockback.outgoing` | flat/adapter |
| `knockbackRes` | `dorios:knockback.resistance` | `value/100` |
| `damageReduction` | `dorios:damage.reduction` | `value/100` |
| `speed` | `dorios:speed.ground` | contribuição `value/100`; base 100 vira 1.0 |
| `waterSpeed` | `dorios:speed.water` | contribuição `value/100` |
| `lavaSpeed` | `dorios:speed.lava` | contribuição `value/100` |
| `healthRegen` | `dorios:health.regen` | rate/s |
| `lifeSteal` | `dorios:lifesteal` | `value/100` |
| `manaRegen` | `dorios:mana.regen` | rate/s |
| `manaSteal` | `dorios:mana.steal` | `value/100` |
| `critMulti` | `dorios:critical.multiplier` | confirmar semântica legacy; hoje `25` resulta em `1.25x` |
| `critChance` | `dorios:critical.chance` | `value/100` |
| `thorns` | `dorios:thorns` | `value/100` |
| `fireAspect` | effect `dorios:ignite_on_hit` | duração em segundos |
| `extraJumps` | `dorios:jump.extra` | count |
| `passives` | effects `status.passive` | ID normalizado, duração gerenciada |
| `actives` | effects `status.on_hit` | trigger explícito |
| `immunities` | unique set `status.immunity` | IDs namespaced |
| `armorPenetration`/equivalente AT | `dorios:damage.penetration` | fraction; channel/profile explícito |

StatsCore não mapeia todos os campos por cópia direta. Cada origem declara se fornece
um valor completo ou delta antes de entrar no agregador:

| Origem StatsCore | Forma legacy | Conversão canônica |
| --- | --- | --- |
| `attributes.damageMultiplier` resolvido | multiplicador completo | `set_base/full_multiplier` |
| `refinement.bonuses.damageMultiplier` | delta | `multiply_delta` |
| crit base resolvido | multiplicador completo | base de `dorios:critical.multiplier` |
| `critMultiplier`/`critDamageBonus` de refino | deltas | somar na fase declarada, depois compor |
| preservation/bonus loot | chance | fraction explícita pelo campo de origem |

Fixtures precisam cobrir cada campo, não apenas o snapshot final, para impedir soma
de um multiplicador completo como se fosse delta.

## 10. ItemDefinition, ItemState e snapshots

### 10.1 Definição declarativa

```js
{
  schemaVersion: 1,
  id: "dorios:toolwright_belt",
  slots: ["dorios:belt"],
  traits: ["dorios:accessory", "dorios:utility"],
  rarity: "uncommon",
  modifiers: [
    {
      stat: "dorios:durability.preserve",
      operation: "add",
      value: 0.04
    }
  ],
  effects: [
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
  ],
  progression: {
    enabled: false
  },
  extensions: {
    "dorios_trinkets:acquisition": {
      kind: "crafting"
    }
  }
}
```

Campos desconhecidos fora de `extensions` são rejeitados no modo strict. Extensions
são preservadas, quota-limited e nunca executadas implicitamente.
Definição remota não escolhe owner: o host carimba `bundle.ownerId`. Se um adapter
legacy ainda trouxer `definition.owner`, ele deve coincidir exatamente ou o bundle
inteiro é rejeitado.

O resolver do StatsCore também exige expressões de progressão declarativas, não só
modificadores constantes. O MVP suporta uma AST numérica limitada e compilável:

```js
{
  stat: "dorios:damage.multiplier",
  operation: "multiply",
  value: {
    base: 1.0,
    track: { id: "ascendant:offensive", perLevel: 0.0125 },
    allocation: { key: "ascendant:damage", perPoint: 0.01 },
    affinity: { id: "ascendant:steel", scalar: 1.1 },
    boss: { scalar: 0.5, cap: 1.35 },
    cap: { min: 1.0, max: 1.75 },
    when: { test: "item.refinement.active", op: "eq", value: true }
  }
}
```

A AST cobre `base`, track/per-level, allocation/per-point, cap, affinity, branch,
`refined`, boss scalar e unlock gates. Regras que ainda não couberem nela exigem um
resolver host-local instalado no RPG-Core. Inferência dinâmica do Ascendant usa
selectors declarativos sobre `typeId`, tags e componentes conhecidos, ou é
pré-expandida para IDs concretos no build; uma função de inferência não é remota.
Custom item components que dependem de `beforeEvents.startup` pertencem a uma lane de
bootstrap declarada no manifest e não podem surgir tardiamente após um register ack.

### 10.2 Estado persistente do item

```js
{
  schema: 1,
  uid: "rpg:...",
  rev: 12,
  tracks: {
    "ascendant:offensive": { xpMilli: 120000, level: 3 },
    "ascendant:defensive": { xpMilli: 40000, level: 1 },
    "ascendant:mining": { xpMilli: 310000, level: 5 },
    "ascendant:utility": { xpMilli: 0, level: 1 }
  },
  refined: true,
  attributeAllocations: {
    "ascendant:damage": 2
  },
  affinity: "dorios:mining",
  branch: "dorios:utility",
  refinement: {
    schema: 1,
    grade: "ascendant:steel",
    quality: 0.72,
    qualityRange: { min: 0.65, max: 0.80 },
    spentXpMilli: 250000,
    rerolls: 1,
    chip: { id: "ascendant:precision_chip", label: "Precision" },
    ingot: { id: "ascendant:steel_ingot", amount: 2 },
    bonuses: {
      damageMultiplier: 0.08,
      extraDamage: 0,
      flatDamageBonus: 0,
      critChance: 0.03,
      critMultiplier: 0,
      critDamageBonus: 0,
      penetration: 0.05,
      lifesteal: 0,
      elementalChance: 0,
      elementalDamage: 0,
      elemental: {
        id: "",
        label: "",
        chance: 0,
        damage: 0,
        damageScale: 0,
        durationTicks: 0,
        amplifier: 0,
        seconds: 0,
        quality: 0
      },
      damageReduction: 0,
      negateAllDamageChance: 0,
      bonusLootChance: 0,
      durabilitySaveChance: 0,
      durabilityPreserveChance: 0
    }
  },
  abilities: {
    uniqueUnlocked: true,
    advancedUnlocked: false,
    operatorMode: "crushy",
    appliedAbilities: {
      "ascendant:operator": 2
    },
    abilityTargets: {}
  },
  extensions: {
    "ascendant:state": {},
    "dorios_trinkets:state": {},
    "ascendant:legacy_raw": {}
  }
}
```

Regras:

- uma DP canônica `dorios:rpg_item` para novos itens;
- `rev` incrementa somente em mutação real;
- mutações usam `read -> clone -> validate -> commit`;
- unknown extensions são preservadas;
- defaults de quota: 24 KiB UTF-8 no envelope canônico, 4 KiB por owner em
  extensions, profundidade 16, 256 keys e 2 KiB por string; o smoke test pode apenas
  reduzir esses valores para ficar abaixo do limite real da plataforma;
- cooldowns curtos, marks e streaks ficam em memória;
- migrations são sequenciais e idempotentes;
- propriedades `utilitycraft:statscore_*` permanecem em dual-read por duas versões;
- `refined` é um gate explícito e nunca é inferido pela presença do payload;
- `attributeAllocations` preserva aliases/chaves atuais; earning, allocate, cap e
  refund são transações próprias, não uma Map inerte;
- `spentXp` legacy inteiro migra para `spentXpMilli = spentXp * 1000`;
- `chipId/chipLabel` migra para `chip.{id,label}` e `ingotId/ingotAmount` para
  `ingot.{id,amount}` sem perder label/quantidade;
- `uniqueUnlocked`/`advancedUnlocked` permanecem booleanos, `operatorMode` preserva
  `crushy|silky|greedy` (inclusive default `crushy`), `appliedAbilities` é mapa
  `abilityId -> level` e `abilityTargets` preserva arrays normalizados por ability;
- cada leaf de `bonuses`/`elemental` acima possui mapping/fixture; sentinels
  `bonusDropChance` e `oreBonusChance` só migram pela regra aprovada de Bonus Loot;
- lore signature antiga migra para metadata do composer ou é preservada intacta;
- qualquer campo desconhecido fica em extension/quarantine raw, nunca é descartado;
- se raw + canônico exceder quota, a migração é bloqueada mantendo todas as DPs
  legacy intactas; quarantine nunca é truncada para forçar commit;
- itens stateful começam com `amount === 1`; split/clone/creative copy exigem nova
  identidade e uma política explícita para copiar ou zerar progressão;
- UIDs clonados são quarantined antes de qualquer merge de XP, e a resolução considera
  simultaneamente journal, inventário, loadout e mirror.

Estado do jogador (`feedbackStyle`, `insightBridge`) e estado mundial
(`statscore_enabled`) possuem schemas/migrations separados do `ItemStack`. O gate de
migração inclui fixtures desses três escopos e de todas as dez DPs legacy.

### 10.3 Item snapshot

Resultado imutável/cacheável da combinação:

- definição registrada;
- estado persistente;
- progression levels e attribute allocations;
- afinidade/branch;
- refino;
- abilities liberadas;
- modifiers e effects resolvidos.

### 10.4 Actor snapshot

Resultado agregado das fontes ativas:

```js
{
  actorId: "...",
  registryRevision: 31,
  loadoutRevision: 18,
  stats: ReadonlyStatVector,
  getEffects(triggerId) {}, // retorna FrozenArray/cópia readonly
  hasImmunity(effectId) {},
  traits: Object.freeze(["dorios:accessory"]),
  setCounts: Object.freeze({ "dorios:tideforged": 3 })
}
```

`Map`/`Set` mutáveis permanecem privados. `Object.freeze(new Map())` não impede
`.set()`, portanto nenhuma coleção interna cruza a API. DTO remoto usa arrays/records
congelados; API local expõe accessors e iteráveis readonly/cópias.

Source tracing completo é criado apenas em debug/UI detalhada. O caminho quente
mantém índices e source UID mínimos.

### 10.5 Event snapshot

Todo trigger usa um contexto normalizado e imutável:

```js
{
  id: "combat.hurt.before",
  tick: 1234,
  phase: "before",
  actor,
  target,
  sourceItem,
  tool, // block events: immutable identity + UID/rev/fingerprint
  projectile,
  damage: { base, current, cause, correlationId },
  block,
  dimension,
  capabilities
}
```

Campos indisponíveis não são inventados; `capabilities` permite fallback explícito.

## 11. Slots e loadout

### 11.1 Layout físico compatível

Índices antigos não serão reordenados. `face` e `belt` entram no fim:

| Índice | Slot canônico | Alias legacy | Família |
| ---: | --- | --- | --- |
| 0 | `dorios:hat` | `head` | headwear |
| 1 | `dorios:body` | `body` | wearable |
| 2 | `dorios:feet` | `feet` | wearable |
| 3 | `dorios:necklace` | `necklace` | jewelry |
| 4 | `dorios:ring.primary` | `ring` | ring |
| 5 | `dorios:charm.primary` | `charm` | charm |
| 6 | `dorios:talisman` | `talisman` | relic |
| 7 | `dorios:gauntlet` | `gauntlet` | hand |
| 8 | `dorios:hearty_charm` | `heartycharm` | heart |
| 9 | `dorios:doll` | `doll` | doll |
| 10 | `dorios:ring.secondary` | `witherring`, `heavy_ring` | ring |
| 11 | `dorios:charm.archaic` | `archaiccharm` | charm |
| 12 | `dorios:amulet` | `amulet` | jewelry |
| 13 | `dorios:face` | — | headwear |
| 14 | `dorios:belt` | — | waist |

Aliases são resolvidos pelo registry, mas não aparecem como células adicionais na
iteração. Isso evita validar o mesmo índice duas vezes.

### 11.2 Migração de `head`

| Item atual | Novo slot |
| --- | --- |
| `dorios:abyssal_diver_helmet` | `dorios:hat` |
| `dorios:broken_paladin_helmet` | `dorios:hat` |
| `dorios:restored_paladin_helmet` | `dorios:hat` |
| `dorios:night_vision_goggles` | `dorios:face` |
| `dorios:night_vision_mask` | `dorios:face` |

O alias genérico `head -> hat` existe para terceiros, mas os cinco itens oficiais
recebem mapeamento explícito. Não se tenta inferir por nome depois da migração.

### 11.3 SlotDefinition

```js
{
  id: "dorios:belt",
  provider: "dorios:trinket_loadout",
  physicalIndex: 14,
  family: "waist",
  capacity: 1,
  accepts: {
    any: [
      { itemTag: "dorios:slot/belt" },
      { definitionSlot: "dorios:belt" }
    ]
  },
  ui: { page: "official", order: 14 }
}
```

A UI JSON continua estática. Slots oficiais aparecem no container visual; futuras
extensões usam posições reservadas em uma grade 18/27 ou uma página/form adicional.
O registry de runtime não promete criar controles JSON dinamicamente.

O registry rejeita no commit:

- dois slots canônicos no mesmo `(provider, physicalIndex)`;
- alias que colide com ID canônico de outro owner;
- mudança de índice após save existente sem migration declarada;
- `capacity > 1` em uma única célula sem layout/provider capaz de representá-la;
- owner fora do mapping de namespaces permitido.

### 11.4 Source provider

StatsCore deixa de depender diretamente de `EntityEquippableComponent`:

```js
{
  providerId: "dorios:trinket_loadout",
  getRevision(actor) {},
  listSources(actor) {},
  persist({
    actor,
    slotId,
    transactionId,
    expected: {
      providerRevision,
      typeId,
      uid,
      itemRevision,
      fingerprint
    },
    previousSource,
    nextSource
  }) {},
  invalidate(actor, reason) {}
}
```

Essa interface existe apenas dentro do host. `persist` é compare-and-swap: trocar por
outro item do mesmo `typeId` continua falhando se UID, item revision, fingerprint ou
provider revision mudou. Um cliente remoto registra apenas um `ProviderDescriptor`
referenciando um provider que já está instalado no host.

Providers iniciais:

- `minecraft:equippable`: mainhand, offhand e armor;
- `dorios:trinket_loadout`: os 15 slots oficiais;
- providers futuros de classe, skill tree, aura ou máquina.

### 11.5 Persistência real do loadout

O loadout canônico começa no schema 1 — não existe schema canônico anterior — e usa
shards por slot desde o início, com um pequeno manifest de revisão. Isso evita
parse/write amplification de um JSON monolítico. A ADR-004 escolhe e mede um destes
backends antes da Fase de loadout:

1. escrow nativo persistente, mantendo os `ItemStack`s reais em container protegido;
2. shards de DP com codec estrito para um conjunto declarado de facets.

O primeiro é preferido se os testes de unload, dimensão, morte, limpeza de entidade e
ownership forem confiáveis. Se o codec for escolhido, ele promete round-trip lossless
somente para a superfície explicitamente suportada, nunca para qualquer ItemStack.

O codec base preserva, quando aplicável:

- `typeId` e amount;
- nameTag e lore;
- dynamic properties enumeráveis com tipo preservado (`string`, `number`, `boolean`
  e `Vector3` quando exposto);
- durability;
- enchantments suportados;
- `canDestroy`, `canPlaceOn`, lock mode e demais facets somente quando a API-alvo os
  expuser e houver fixture;
- dados registrados por codecs host-local de addons.

Dados/facets não serializáveis produzem erro antes de remover a origem; nunca são
descartados silenciosamente. Codecs remotos não são aceitos. Progressão permanece
desligada até a matriz de fidelidade passar por tipo/facet e pelo backend escolhido.

### 11.6 Transação de equip/unequip

1. resolver slot/definição e reler a origem pelo host;
2. validar aceitação, conflito, facets e CAS completo;
3. produzir/validar payload+fingerprint ou validar capacidade/ownership do escrow,
   sem mover ainda;
4. escrever e confirmar journal durável
   `{txId, phase:"prepared", from, to, payload/hash, expectedUid,
   expectedItemRevision, expectedProviderRevision}`;
5. reler revisão e só então remover da origem ou mover para escrow;
6. persistir `phase:"origin_removed"`;
7. gravar destino/shard, manifest e nova revisão;
8. persistir `phase:"destination_written"`;
9. invalidar actor snapshot e reconciliar a UI session;
10. marcar `committed`, emitir `loadout.changed` e espelhar tag legacy temporária;
11. confirmar commit e só então limpar journal/escrow.

No recovery, cada phase é idempotente e resolvida por payload hash, UID e revisões. O
mesmo UID em journal, inventário, shard e UI session/escrow nunca é duplicado por preferência
arbitrária: uma tabela de precedência e quarantine resolve o conflito. Overflow vai
para mailbox/claim persistente; drop no mundo não é exatamente-once e não é fallback
automático. Crash injection testa cada fronteira numerada.

Progressão individual de trinkets fica desabilitada até a matriz de fidelidade do
backend passar para DPs, lore, enchantments, facets expostos e crash recovery.

### 11.7 UI e sessão transacional

O caminho de UI é fechado pela ADR do backend; não existe container staging “livre”:

- **backend escrow nativo:** o container persistente é o armazenamento canônico dos
  stacks reais. Entidade/ownership, journal de sessão e lease
  `(actorId, clientSessionId, entityId)` são persistidos e confirmados **antes** de
  abrir a chest screen. Um drag move entre inventário e escrow duráveis; crash logo
  após o drag ainda deixa o stack em um dos dois containers, e recovery reconcilia
  UID/slot. O watcher só invalida/revisa, não é a garantia de durabilidade.
- **backend DP+codec:** movimentação nativa direta é desativada. Equip/unequip ocorre
  apenas pelo form/API transacional que consegue persistir journal antes de remover a
  origem; o chest pode ser read-only visual ou não abrir.

Há um único lease writer por actor; segunda abertura concorrente é rejeitada. Close,
disconnect, death, host conflict ou lease expiry passa por commit/rollback idempotente.
Nenhuma entidade escrow é removida enquanto possuir item/journal. Um watcher
compartilhado roda só com sessões abertas; `trinkets_inv` órfãs entram em audit/recovery
no world load.

Wireframe lógico de 15 células (a binding mantém o `physicalIndex`, não a ordem da
grade):

| Linha/coluna | 0 | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- | --- |
| 0 | Hat (0) | Face (13) | Body (1) | Feet (2) | Belt (14) |
| 1 | Necklace (3) | Ring I (4) | Ring II (10) | Gauntlet (7) | Amulet (12) |
| 2 | Charm (5) | Hearty (8) | Archaic (11) | Talisman (6) | Doll (9) |

Wave 0 fecha coordenadas em cada UI scale, assets `empty_hat`, `empty_face` e
`empty_belt`, política para `empty_head`, cinco idiomas, foco row-major de
controller/teclado e safe area/touch. O título interno usa sentinel não confundível,
separado do label localizado; um baú renomeado nunca ativa a tela. Se o override JSON
não carregar, um form de fallback permite equip/unequip sem esconder o inventário.

### 11.8 Semântica de morte e lifecycle

O default oficial é `deathPolicy: "retain"`: trinkets continuam equipados e não
dependem de `keepInventory`. `binding` pode impedir unequip, mas não duplica item;
futuras policies `drop`/`mailbox` exigem transação própria e não entram no MVP. Morte,
respawn, dimension change, leave e host restart sempre encerram ou recuperam a UI session
antes de reativar efeitos.

## 12. Conditions e effects declarativos

### 12.1 AST de condição

```js
{
  all: [
    { test: "actor.health.percent", op: "lte", value: 0.5 },
    { test: "actor.state.in_water", op: "eq", value: true },
    {
      any: [
        { test: "target.category", op: "eq", value: "hostile" },
        { test: "target.category", op: "eq", value: "boss" }
      ]
    },
    { not: { test: "cooldown.active", key: "dorios:example" } }
  ]
}
```

Operadores MVP: `eq`, `neq`, `lt`, `lte`, `gt`, `gte`, `in`, `contains`,
`has_tag`, `has_trait`, `matches_id` e `between`.

O compilador:

- valida types e IDs;
- resolve tests para índices/handlers;
- calcula dependências do evento e de polling;
- rejeita funções em bundles remotos;
- produz custo estimado e feature mask;
- cria predicate sem alocar objetos no caminho quente.

### 12.2 Triggers canônicos MVP

| Família | Triggers iniciais |
| --- | --- |
| Combate | `combat.hurt.before`, `combat.hurt.after`, `combat.kill.after`, `combat.death.after` |
| Projétil | `projectile.hit.entity`, `projectile.hit.block`, `item.charge.start/complete/stop` |
| Mineração/construção | `block.break.before/after`, `block.place.before/after` |
| Item | `item.use.before/after`, `item.use_on.before`, `item.pickup.after` |
| Cura/status | `health.heal.before/after`, `effect.add.before/after` quando suportado |
| Movimento/input | `input.jump`, `input.sneak`, `movement.land`, `movement.dimension_change` |
| Lifecycle | `player.spawn`, `player.leave`, `world.load` |
| Loadout | `loadout.changed`, `item.state.changed`, `registry.changed` |

`block.trample.before` é capability opcional/derivada; se a API-alvo não oferecer
cancelamento confiável, Rootwalker mantém apenas a parte de movimento e audita o
fallback. Nenhuma wave promete cancelamento sem o contract test correspondente.

O catálogo de 430 linhas permanece como backlog. Um item só pode usar um trigger
após o contrato declarar payload, fase, cancelamento, fallback e custo.

### 12.3 Pipeline determinístico de dano

Um único listener resolve actor/target uma vez e passa pelas fases abaixo. A ADR-003
deve congelar as fórmulas antes do kernel, inclusive como armor vanilla vira um
`DefenseProfile` observável:

1. `guard/cancel`;
2. `incoming-pre`;
3. `outgoing-flat`;
4. `outgoing-multiply`;
5. `critical`;
6. resolver `DefenseProfile` do player, mob ou boss;
7. aplicar penetration ao profile, com cap e channels explícitos;
8. calcular mitigation efetiva uma única vez;
9. `finalize` e clamp;
10. `post` effects;
11. `feedback/progression`.

Não se reconstrói "dano não mitigado" por heurística depois do fato. Se uma versão da
Script API não expuser defesa suficiente, o capability declara qual profile parcial
existe e penetration usa fallback documentado. Fixtures distintas cobrem player,
mob, boss, armor vanilla e mitigation customizada.

Cada dano derivado recebe `correlationId`, `parentId`, `sourceEffectId` e depth.
Reentrância ignora apenas o proc correlacionado, não todos os ataques ao mesmo alvo.

`before` roda em restricted execution: pode ajustar/cancelar o evento, mas não grava
DP, consome ItemStack nem muta gameplay. Portanto fatal protection segue duas lanes:

1. dano originado pelo próprio Core pode reservar/confirmar estado em execução normal
   antes de chamar `applyDamage`;
2. dano nativo usa saga **pre-armed**. Em execução normal, o host escolhe uma única
   source por prioridade e persiste `guardReservation {token, sourceUid/rev,
   hostSessionId, kind, state:"armed"}`. A source fica locked para transferência. No
   `before`, o handler somente lê o cache da reservation, altera damage/cancel e marca
   `{token,correlation}` em RAM. No próximo tick, uma action deferred confirma
   consumo/charge/cooldown e fecha o journal.

Não há exatamente-once perfeito entre restricted callback e persistência. Para evitar
proteção gratuita, uma reservation `armed` de sessão encerrada sem shutdown limpo vira
`uncertain_spent`: consome o item/charge ou inicia cooldown conservadoramente. Isso pode
custar uma proteção não usada após crash abrupto, tradeoff explícito e auditável. Em
shutdown limpo, reservation não usada é liberada/rearmada na sessão nova. Sem token
`armed`, o guard não ativa; UI/feedback distingue `arming`, `ready` e `cooldown`.

Somente actions marcadas `restrictedSafe` podem executar no `before`, e elas só mutam
o objeto de evento/estado efêmero permitido. Toda DP, inventário, efeito, som, partícula
ou mundo fica post/deferred. Crash injection cobre armar, cancelar, confirmar e
recovery `uncertain_spent`.

### 12.4 Actions built-in

- `damage.modify`, `damage.apply`;
- `health.heal`, `health.absorb`;
- `effect.add`, `effect.remove`;
- `fire.set`;
- `knockback.apply`;
- `item.repair`, `item.damage`;
- `resource.add`, `resource.consume`;
- `progression.grant`;
- `counter.add/reset`;
- `modifier.add_temporary`;
- `particle.spawn`, `sound.play`;
- `item.give` com pool explicitamente autorizado;
- `job.blocks` para operações orçadas.

Built-ins usam a gramática reservada (`item.repair`, `counter.add`); actions custom
usam ID namespaced. Todas declaram se podem executar em `before`, `after` ou job. Uma
action customizada enviada por outro pack não pode cancelar before-events: o
round-trip por ScriptEvent só é permitido em fase post/deferred. Efeitos que exigem
cancelamento devem usar uma action built-in instalada no host.

Actions `before` possuem orçamento síncrono global por evento e por tick. Elas nunca
são deferred: excesso é rejeitado no compile ou ignorado de forma determinística com
audit, conforme a criticidade. Somente actions `after`/world viram jobs. O limite é
global, não multiplicado por cada uma das 15 sources.

Cada action retorna `applied`, `no_op`, `skipped` ou `failed`. `when` por action é AST
normal e enxerga writes/resultados anteriores do mesmo grupo. Counters declaram scope;
para Toolwright, a chave efetiva é `(sourceUid,"toolwright")`. Um grupo
`all_or_nothing` faz CAS de todas as sources, persiste journal antes do primeiro write
e só confirma counters quando todos os writes `applied` esperados confirmam. `no_op`
por ferramenta cheia ou `failed` por troca de mainhand aborta/rollback; não reseta nem
consome o 12º progresso. Não há cooldown de um tick, portanto breaks válidos no mesmo
tick são serializados pelo source revision em vez de descartados.

### 12.5 Chance, cooldown e stacking

Todo effect declara:

- `chance` em fraction;
- `cooldown`: `null` significa nenhum; quando objeto, `scope` é `source`, `actor`,
  `target`, `actor_target` ou `world`;
- `stacking.group` e mode: `refresh`, `extend`, `add`, `max`, `replace`;
- `priority` e phase;
- `maxTargets`;
- `budgetClass`;
- fallback quando capability/evento não existe.

Cooldown guarda `expiresAtTick`; nenhum contador é decrementado por tick.

### 12.6 Conditions contínuas

Watchers são agrupados por cadência:

- **1 tick**: somente input/transição que não possui evento e enquanto a regra está ativa;
- **5 ticks**: movimento fino e contato ambiental;
- **10 ticks**: posição/bloco imediato;
- **20 ticks**: tempo, clima, biome e auras lentas;
- **40+ ticks**: manutenção e limpeza.

O scheduler mantém bitmasks por jogador. Sem regra interessada em lava, nenhum
`getBlock` de cabeça/pés é executado. Watchers comparam estado anterior e emitem
transições (`landed`, `started_sprinting`) apenas quando há mudança.

Temporal state curto pode ser volátil; obrigações que não podem ser apagadas por
logout/crash são duráveis. Delayed damage do Chronoshard, fatal-protection consumption,
loadout/action journals e restore tokens de mundo possuem schema, owner/debtor e
recovery próprios — nunca dependem só de `Map` em RAM.

## 13. Progressão, refino e lore

### 13.1 Tracks registráveis

Tracks do adapter inicial: `ascendant:offensive`, `ascendant:defensive`,
`ascendant:mining` e `ascendant:utility`. Todo track é namespaced e declara curva,
level cap, fontes de XP e actions declarativas de level-up; hook com função exige
plugin host-local.

XP usa inteiro fixed-point (`xpMilli`) para preservar valores como `1.5` e `3.2`
sem acumular erro de float. Ganhos do mesmo item/tick são coalescidos e persistidos:

- no fim do tick quando o item será devolvido a um slot;
- em level-up;
- ao atingir threshold configurado;
- em player leave/world shutdown quando possível;
- antes de troca/remoção da source.

O buffer nunca depende apenas de uma chave UID sem validar a instância/source atual.

### 13.2 Refino

A DoriosLib contém:

- schema e normalização de refinement;
- roll determinístico/injetável para testes;
- quality/grade/bonus primitives;
- transactions de aplicação;
- ability unlock state.

Ascendant mantém:

- chips, ingots e Runic Cores;
- fórmulas, limites e chances de sua Refining Table;
- recipes, UI, glyphs e comandos;
- abilities e effects específicos.

Trinkets simples usam `progression.enabled: false` e
`refinement.required: false`. Itens futuros podem optar por progressão após a
persistência real do loadout estar validada.

### 13.3 Lore composer

Lore não é fonte de verdade. O composer gerencia seções por owner:

```text
[Dorios RPG Core]
[Ascendant Stats]
[Reinforcement]
[Outro addon]
```

Cada seção possui marker estável, order e signature. Atualizar StatsCore não apaga
Reinforcement nem lore externa. O adapter reconhece markers antigos durante a
migração.

## 14. Protocolo cross-pack v1

### 14.1 Autoridade

O MVP usa autoridade explícita: Dorios-RPG-Core é dependência obrigatória de manifest
de cada cliente. A recomendação é preservar o UUID existente do BP Core,
`1b5a8b40-fc9c-4128-81c7-27c45093d016`, após confirmar que ele representa o pacote
que será substituído. O manifest representa uma versão concreta de dependency; ranges
de protocolo/capability são negociados no handshake, não fingidos no manifest. UUID,
versão e upgrade path ficam congelados por ADR/teste. O build standalone usa UUID
distinto e, portanto, não satisfaz a dependency dos clientes oficiais.

A garantia primária de um pacote host é o loader + UUID estável. ScriptEvent não prova
ausência de outro runtime; ele fornece uma kill-switch defensiva com state machine:

| Estado host | Pode escrever/aplicar? | Transição principal |
| --- | --- | --- |
| `new` | Não | `initialize -> discovering` |
| `discovering` | Não | heartbeat candidate durante `settleTicks` |
| `syncing` | Não | transport_ready; aceita bundles e aguarda closure selecionada |
| `active` | Sim | registry epoch completo e barriers satisfeitas |
| `conflict` | Não | outra hostSession detectada em qualquer momento |
| `shutdown` | Não | cancelou jobs/retries/subscriptions/UI sessions |

Dois candidates na janela entram em `conflict` antes do gameplay. Um host tardio pode
ser detectado depois de atividade anterior; nesse caso a transição para `conflict`
fecha atomicamente o writer gate antes do próximo handler, cancela jobs e torna
listeners restantes no-op. Isso é best-effort, não substitui o loader. Heartbeats
continuam durante `active` para detectar o caso tardio.

Dependency ausente/versão de pack incompatível é erro de ativação da plataforma — o
client script pode nem carregar. Dependency carregada, mas handshake/protocolo
ausente, expirado ou conflitante, produz client `inactive` com diagnóstico bounded.
Nenhum caso volta ao Core legacy.

### 14.2 Eventos de transporte

O transporte usa um ID de discovery/framing estável, `dorios:rpg_transport`; o campo
`messageType` distingue `hello`, `ready`, `capabilities`, `bundle.chunk`,
`bundle.ack`, `unregister`, `invalidate`, `query`, `response`, `intent`, `intent.ack`,
`action`, `action.ack`, `cutover.barrier` e `cutover.ack`. Um futuro major negocia no
envelope ou usa outro transport ID somente se o framing ficar incompatível. Os
eventos `_v1` antigos permanecem apenas em compat adapters.

### 14.3 Envelope

```js
{
  messageType: "bundle.chunk",
  protocol: { min: 1, max: 1, selected: 1 },
  capabilitySchemaVersion: 1,
  payloadSchemaVersion: 1,
  sourceAddon: "dorios_trinkets",
  ownerId: "dorios_trinkets",
  targetAddon: "dorios_rpg_core",
  targetHostSessionId: "host:...",
  sourceVersion: "3.0.0",
  clientSessionId: "client:...",
  requestId: "...",
  bundleId: "dorios_trinkets:main",
  revision: 4,
  activationGroup: "dorios_official:gameplay_v1",
  requires: [
    { ownerId: "dorios_rpg_core", bundleId: "dorios_rpg_core:stats", minRevision: 1 }
  ],
  chunk: {
    index: 0,
    count: 3,
    decodedBytes: 5376,
    finalFrameUtf8Bytes: 7480
  },
  payloadEncoding: "base64-canonical-json-utf8",
  payloadHash: "sha256:...",
  payloadFragmentBase64: "..."
}
```

Ack:

```js
{
  messageType: "bundle.ack",
  protocolVersion: 1,
  sourceAddon: "dorios_rpg_core",
  targetAddon: "dorios_trinkets",
  clientSessionId: "client:...",
  hostSessionId: "host:...",
  requestId: "...",
  bundleId: "dorios_trinkets:main",
  revision: 4,
  payloadHash: "sha256:...",
  staged: false,
  committed: false,
  errors: [
    { id: "example:bad", code: "UNKNOWN_STAT", path: "modifiers[0].stat" }
  ],
  registryRevision: 31,
  registryEpoch: 7,
  capabilitiesHash: "sha256:..."
}
```

### 14.4 Regras do protocolo

- hello/ready é bidirecional e periódico, não depende de observar o `worldLoad` uma
  única vez; cliente usa backoff bounded até o host ficar ready;
- host restart muda `hostSessionId`; clientes descartam acks antigos e republicam
  todos os bundles para a sessão nova; a mesma revision/hash é aceita numa sessão
  host vazia;
- request/ack é filtrado por source, target, client session, host session, request,
  bundle revision e hash;
- retries são idempotentes; bundle commit deduplica por
  `(ownerId, bundleId, revision, payloadHash)`;
- chunks ficam em staging bounded, aceitam ordem arbitrária, expiram por timeout e só
  são parseados/validados após a montagem completa;
- JSON é canonicalizado, convertido em bytes UTF-8, hasheado e só então codificado em
  base64; fragmentação corta base64, nunca codepoint UTF-8;
- quota de frame mede o envelope ScriptEvent final em bytes UTF-8, após base64,
  escaping e overhead. Unicode, aspas e backslashes pertencem às fixtures;
- bundle é atômico: um erro gera `committed:false` e zero definições alteradas. Não há
  ack parcialmente accepted;
- quotas medem bytes UTF-8 totais/por chunk, número máximo de chunks, assemblies
  simultâneos, extensions e nós de AST; número de definitions é limite secundário;
- IDs precisam pertencer ao owner ou declarar override autorizado;
- colisão exige reject, merge explícito ou prioridade permitida;
- mesma revision com hash diferente gera `REVISION_REUSE`; revision menor gera
  `ROLLBACK_DENIED`. Rollback só existe por operação administrativa host-local;
- clients armazenam capability matrix e não publicam features incompatíveis;
- host não executa unknown actions/conditions;
- intent/action DTO inclui idempotency key, issued tick, deadline, correlation,
  expected UID/revision e references serializáveis; alvo stale gera erro, não retry
  infinito;
- erros são visíveis por audit e não apenas `console.warn` genérico.

O framing/chunking vale igualmente para bundle, capabilities, query, response, intent
e action. Em request client->host existe `targetHostSessionId`; `hostSessionId` aparece
como origem em mensagens host->client, nunca ambos com semântica duplicada.

### 14.5 Dependências e barreira de ativação

Bundles podem ser divididos por categoria, portanto cada um declara `requires` e
`activationGroup`. O host executa duas passagens: valida/stage estrutural de cada
bundle; depois link/compile da closure completa. Uma closure só troca o registry
ativo por commit atômico de novo `registryEpoch`. Referência ausente deixa
`staged:true, committed:false`; ciclo ou incompatibilidade rejeita toda a closure.

A configuração host-owned lista os bundles oficiais obrigatórios por integração. O
host fica `syncing` — writers e appliers fechados — durante startup/restart até receber
a closure mínima ou expirar com erro. Um addon opcional pode entrar em epoch posterior
sem invalidar o conjunto obrigatório, mas toda a closure dele ativa junta. Testes
cobrem ordem invertida com dependência real, missing/cycle, restart antes do último
bundle e query durante `syncing`.

Seleção de participantes não exige introspecção impossível dos BPs instalados:

1. bundles base do Core são sempre obrigatórios;
2. durante `settleTicks`, cada client `hello` bound adiciona somente sua integração e
   seus `requiredBundles` ao startup activation set;
3. superset de plugins físicos não torna addon ausente obrigatório;
4. client que chega depois do settle forma closure opcional para epoch posterior;
5. participante anunciado que não completa a closure até deadline fica
   `integration_inactive`/quarantined, enquanto integrações completas podem ativar;
6. apenas Core base ou integração marcada host-side `requiredForWorld:true` mantém o
   host inteiro fail-closed quando incompleta.

Assim Core+Ascendant não espera Trinkets ausente. `ready()` é transport readiness em
`syncing`; após publicar, cada cliente usa `waitUntilActive()` para seu integration
epoch. O audit distingue timeout de transport, bundle e activation.

### 14.6 Ownership host-owned

`integrations/registry.js` é a fonte autoritativa build-time para
`ownerId -> addonIds, namespaces, capabilities, plugins, requiredBundles`. O
`ownerId` do envelope precisa coincidir com a session bound; `allowedNamespaces`
declarado pelo cliente, se existir por compatibilidade, é apenas claim e precisa ser
subconjunto exato da policy host. Definições remotas recebem owner do bundle.

Para terceiros sem entrada oficial, a policy limitada exige namespace igual ao
owner normalizado, proíbe override e concede apenas descriptors/built-ins. Como o
transporte não autentica BP, isso continua sendo uma trust policy, nunca barreira de
segurança contra pack malicioso.

`sourceAddon` não autentica o remetente. O host trabalha num ecossistema de packs
confiáveis, nega override cross-owner por padrão e filtra target/session. Nenhum dado
secreto ou autorização externa depende desse campo.

O ack antigo `dorios:stat_data_registered` e
`utilitycraft:register_statscore` ficam em adapters, com warnings e sem acesso a
recursos novos não representáveis no schema antigo.

## 15. Desempenho e orçamento

### 15.1 Modelo de invalidação

Actor snapshot é identificado por:

```text
(registryRevision, loadoutRevision, providerRevisions, transientModifierRevision)
```

Eventos que invalidam:

- equip/unequip/move;
- troca em slot vanilla detectada por evento;
- mutação de item state;
- registro/unregister;
- modifier temporário criado/expirado;
- mudança de condição que altera contribuição contínua.

Invalidações da mesma revisão no mesmo tick são coalescidas. Se loadout/item/registry
mudar novamente antes de um `hurt.before`, correctness vence o limite: a nova revisão
é resolvida antes do dano, nunca se devolve snapshot stale apenas para manter a quota.

### 15.2 Índices

- `trigger -> effects[]`;
- `statIndex -> modifiers[]` no compile;
- `itemId -> definition`;
- `slotId -> source`;
- `entityId -> actor cache`;
- `watcherCadence -> interested actors`;
- `setId -> equipped count`;
- `expiresTick -> transient entries` por buckets/timing wheel.

### 15.3 Guardrails iniciais

| Operação | Limite padrão |
| --- | ---: |
| Recompute de actor | 1 por `(ator, revisão, tick)` |
| Payload de transporte | quota por bytes UTF-8 e máximo de chunks medidos |
| Conditions por effect | 32 nós de AST |
| Actions síncronas `before` | 16 por evento, budget global; nunca defer |
| Effects `after` | 32 por evento antes de job/defer permitido |
| Targets de área | 16 |
| Block mutations por job/tick | 64 |
| Entity queries pesadas | 2 globais por evento/tick; candidate sets reutilizados |
| Profundidade de dano derivado | 4 |
| DPs escritas por item/tick | 1 envelope |
| Polling ambiental idle | 0 |

Valores são configuráveis pelo host, mas aumentar exige benchmark.

O query planner deduplica `(dimension, shape, filter)` e entrega o mesmo candidate set
às effects interessadas. Ao esgotar o hard cap, action `before` é rejeitada/skip
determinístico; action post/W pode ser deferred. A quota nunca multiplica por proc.

Caches usam tetos globais e por ator, LRU/TTL e cleanup em leave/despawn. Baseline a
validar no harness: até 8.192 item snapshots, 256 actor entries e 16 MiB estimados
para caches RPG em 50 jogadores; jamais 128 entradas multiplicadas por cada definição.

### 15.4 Classes de custo de conteúdo

- **G**: modificador agregado; zero listener próprio.
- **E**: effect acionado por evento nativo/indexado.
- **S**: estado amostrado em cadência declarada.
- **W**: ação espacial/mutação de mundo, sempre job orçado.

O catálogo de itens marca essas classes para evitar que uma expansão de conteúdo
reintroduza loops globais.

### 15.5 Métricas

Counters opcionais por addon/effect:

- registry accepts/rejects/conflicts;
- actor cache hit/miss/recompute;
- item state reads/parses/writes/no-op writes;
- effects evaluated/activated/cooldown-blocked;
- condition watcher count por cadência;
- entity queries, blocks visited/mutated e jobs deferred;
- damage recursion blocked;
- migration success/failure;
- protocolo retry/timeout/duplicate.

Comandos do host devem expor resumo, top custos e audit de um jogador/item sem
enviar spam contínuo.

Metas iniciais no hardware de referência, medidas como tempo do host por tick:

| Cenário | p95 | p99 | Limite adicional |
| --- | ---: | ---: | --- |
| 20 players idle, 15 slots | <= 1 ms | <= 2 ms | zero block query idle |
| 50 players idle, 15 slots | <= 2 ms | <= 4 ms | zero DP write sem mudança |
| stress de combate/mineração sem W | <= 5 ms | <= 10 ms | sem fila crescente |
| jobs W | <= 2 ms/tick | <= 4 ms/tick | fairness round-robin e deadline |

O benchmark também registra DP reads/parses/writes, bytes/cache, queries, tempo máximo
de job e starvation. Se a plataforma não expuser tempo de CPU confiável, o harness
usa elapsed amostrado e regressão relativa contra baseline, mantendo contadores como
gate absoluto.

## 16. Migrações e compatibilidade

### 16.1 Estratégia de leitura/escrita

1. Escolher source of truth pelo feature mode, não apenas pelo campo existente.
2. Em `legacy`/`shadow`, reler legacy como autoridade, normalizar e rederivar a cópia
   canônica para diff; mudanças legacy posteriores continuam visíveis.
3. Em `new_apply`, tornar canônico autoridade e desabilitar todos os writers legacy
   antes da primeira mutação.
4. Em `new_only`, manter adapters legacy somente para audit/export administrativo.
5. Se ambos mudaram desde a revisão-base, bloquear/quarantinar e exigir resolução
   determinística; nunca escolher silenciosamente o JSON mais novo.
6. Não escrever durante uma inspeção read-only.
7. Preservar dados legacy/raw por pelo menos duas versões.
8. Marcar migration version/result e oferecer auditor.
9. Remover dados antigos somente por ferramenta administrativa/release posterior.

### 16.2 Trinkets v2

- Ler tags de IDs conhecidos apenas na primeira migração.
- Resolver `head` pela tabela explícita hat/face.
- Resolver duplicatas por slot de forma determinística.
- Recriar apenas trinkets estáticos legacy; registrar que não havia estado preservável.
- Manter tags como shadow por uma versão, atualizadas somente em loadout change.
- Substituir registros auxiliares `*_tag` por modifiers temporários/conditions.
- Migrar quatro `dorios:playerData.*` para snapshot derivado; não copiá-los como
  fonte permanente.
- Manter `dorios:register_stat_data` como adapter read-only de compatibilidade.

### 16.3 StatsCore v3

- Ler todas as DPs `utilitycraft:statscore_*`.
- Preservar UID, tracks namespaced, `refined`, affinity, branch,
  `attributeAllocations`, refinement completo e todas as flags/targets de abilities.
- Corrigir Bonus Loot por migration explícita e fixture.
- Converter chances sem heurística, de acordo com o campo de origem.
- Preservar lore antiga até o composer assumir a seção.
- Converter `spentXp` para `spentXpMilli` sem alterar reserva por fator 1.000.
- Migrar `feedbackStyle`, `insightBridge`, `statscore_enabled` e lore signature nos
  respectivos schemas de player/world/metadata.
- Guardar raw/quarantine para unknown fields e payload corrompido recuperável.
- `ATCore/StatsCore/API.js` vira shim da nova API.
- Refining Table, Reinforcement e commands migram antes de remover imports internos.
- Dual-read por duas versões; new-write canônico após cutover.

### 16.4 Aplicação de atributos vanilla

O override atual de `minecraft:player` contém centenas de groups/events para health,
knockback resistance e damage reduction. O novo `StatApplicator` deve aplicar apenas
valores alterados e escolher, por capability:

1. componente/propriedade nativa quando seguro;
2. pipeline do RPG Core para damage/mitigation;
3. adapter de component groups somente durante compatibilidade.

Remover o override exige teste conjunto com addons que também alteram
`minecraft:player`; não é uma troca mecânica.

O applicator mantém last-applied por stat/source revision e faz delta/rollback, não
reescreve valor absoluto sem ownership. A matriz de cutover cobre:

- max health e current health com policy explícita `preserve_ratio` ou `clamp_only`;
- speed, knockback resistance, regen e seus caps vanilla;
- remoção imediata da source e rollback/no-op quando outro addon mudou o mesmo alvo;
- morte/respawn/dimension e reconnect;
- coexistência com outro addon de player component;
- falha no meio do apply e restauração para o último estado confirmado.

`new_apply` não remove o override antigo antes de essa matriz passar em singleplayer e
multiplayer. O ticket StatApplicator é gate próprio, não detalhe implícito do router.

### 16.5 Feature flags de cutover

```text
legacy       -> runtime antigo aplica; novo apenas registra/mede
shadow       -> ambos calculam; antigo aplica; diff é registrado
new_apply    -> novo aplica; antigo calcula apenas fixtures selecionadas
new_only     -> bootstrap antigo desativado
```

Nunca permitir que antigo e novo apliquem dano/effects simultaneamente.

Em `shadow`, cada writer legacy adaptado emite `invalidate` com actor/source UID e
revision/fingerprint após DP, tag ou equip mutation. Como segurança temporária, o host
recalcula fingerprint das fontes legacy nos eventos relevantes antes de usar cache;
esse custo desaparece em `new_apply`. Teste obrigatório: aquecer snapshot, alterar DP
legacy no mesmo item/slot e verificar que o próximo diff e `hurt.before` veem a mudança.

Entrar em `new_apply` exige barrier por hostSession/registryEpoch: todos os runtimes
legacy conhecidos pela integração confirmam `writers_disabled` e `appliers_disabled`.
Até todos os acks chegarem, o host permanece `syncing`/fail-closed. Timeout não força
ativação. O barrier também cobre jobs já enfileirados e intervals antigos.

Shadow compara dois oráculos: `legacy_equivalence` e `approved_corrected_behavior`.
Bonus Loot, preservation, Steel growth, penetration, attribute allocation e XP
fracionário entram num **expected delta ledger** aprovado; zero divergência significa
zero diferença fora desse ledger, não reproduzir bugs conhecidos.

## 17. Plano de implementação por fases

### Fase 0 — ADRs bloqueadores, fonte e baseline

- escolher repositório canônico, artifact layout, overlays permitidos e drift hash;
- congelar Script API 2.8/min engine 1.21.120 ou aprovar builds separados;
- congelar também `@minecraft/server-ui`, BP/RP min engine, Bridge targetVersion,
  format versions, custom-component startup e dependency UUID/version;
- ADR host/provider: runtime isolado, host obrigatório, UUID/dependency e fail-closed;
- ADR identidade: `addonId`, `ownerId`, namespaces, UID/split/clone e immutability;
- ADR damage: fórmulas, DefenseProfile, penetration e expected deltas;
- ADR state/storage: schema completo, shards, escrow nativo versus codec e journal;
- ADR cutover: source of truth por feature mode;
- congelar fixtures dos 79 trinkets e inventory do StatsCore.

Gate: todos os ADRs acima têm decisão testável; cada consumidor corresponde ao output
client/host correto da mesma release, o `sharedHash` coincide e o CI detecta
drift/config acidental. MCPacks/worlds completos passam smoke install com host+client,
dependency ausente e versão de pack incompatível.

### Fase 1 — Harness, fixtures raw e schemas

- testes Node para `rpg/shared` sem importar Minecraft;
- builders/validators com paths e error codes;
- fixtures das dez DPs StatsCore em v0-v3, corruptas, unknown fields, `refined=false`
  com payload e cada shape de refinement/ability;
- fixtures player/world de feedback, Insight e `statscore_enabled`;
- fixtures Trinkets de tags, slots duplicados e todos os bugs conhecidos;
- dois oráculos: equivalência legacy e comportamento corrigido/expected delta ledger;
- benchmark sintético e Minecraft de 1/20/50 jogadores.

Gate: schemas rejeitam function/NaN/ID inválido/quota; fixtures raw round-trip sem
perda e importar entrypoints shared/API não instala subscription.

### Fase 2 — Host/client skeleton e protocolo atômico

- entrypoints físicos `shared`, `client` e `host`;
- manifest dependency obrigatório e bootstrap de autoridade antes de gameplay;
- state machine/heartbeat/settle/late-conflict e lifecycle async idempotente;
- hello/ready periódico, session epoch, capability negotiation e backoff;
- base64 framing medido no envelope, chunk/hash/timeout/retry e commit atômico;
- `requires`/activation groups, two-pass link e registry epoch barrier;
- registry de ownership/plugins host-owned, target/session filters e fail-closed;
- intents/actions post-deferred com DTO, ack, deadline e idempotência;
- nenhum event router de gameplay ainda.

Gate: missed worldLoad, ordem de chunks, host restart, duas sessões de host, spoof de
target, versões mistas e bundle inválido terminam deterministicamente sem registro
parcial nem writer ativo indevido; transport_ready/publicação/active não entra em
deadlock e addon ausente não entra no activation set.

### Fase 3 — Kernel de registry, stats e expressions

- stat/item/slot registries imutáveis com aliases, revisions e ownership;
- compile determinístico para índices revision-scoped;
- modifier phases, operadores, caps e units;
- AST numérica para track/allocation/refined/affinity/boss/unlock;
- selectors declarativos e ports host-local;
- item/actor resolver puro e source tracing opcional.

Gate: agregação, full multiplier versus delta, caps/stacking/probability union e ordem
independente de registro passam com plain graphs congelados e coleções privadas.

### Fase 4 — State, progressão, atributos e migrations

- `dorios:rpg_item` completo e schemas separados de player/world;
- `refined`, tracks namespaced, allocations, refinement, abilities e raw quarantine;
- fixed-point XP/spent XP e buffer source-aware;
- attribute registry, earning, allocation, caps, refund e UI/command adapter;
- transaction API/no-op writes e migrations sequenciais;
- cache LRU/TTL com teto global e limpeza de entity IDs.

Gate: migrations são idempotentes; todas as fixtures preservam estado; item trocado
por outro do mesmo typeId não recebe trabalho deferred; split/clone/UID duplicado
segue a policy aprovada.

### Fase 5 — Slots, providers, storage e loadout

- providers vanilla e Trinkets instalados no host;
- CAS por actor/slot/provider revision/UID/item revision/fingerprint;
- backend da ADR-004, shards, state-machine journal e mailbox exactly-once;
- `hat`, `face`, `belt`, inventory size 15 e regras de colisão;
- UI escrow/form, lease, sentinel, wireframe, foco/touch/localização e fallback;
- death policy, reload/dimension/restart e orphan audit.

Gate: crash injection em cada phase de equip/unequip/open/close não perde nem duplica
facets suportadas; 79 fixture stacks legacy + Lantern Belt + Marksman's Monocle
usam os 15 índices sem reordenar saves.

### Fase 6 — Event router, scheduler e damage

- um router host-local por sinal da Script API;
- EventContext, phases, interest index e correlation graph;
- damage pipeline/DefenseProfile aprovados na ADR-003;
- StatApplicator delta/rollback para health/speed/knockback/regen;
- cooldown scopes, watchers sob demanda e jobs com fairness/budgets;
- métricas p95/p99, DP/cache/query e startup lane de custom components.

Gate: idle não consulta blocos; `before` nunca é deferred; player/mob/boss/armor
fixtures de penetration e a matriz StatApplicator passam; dois addons não instalam
dano duplicado.

### Fase 7 — Conditions/effects MVP

- AST `all/any/not/test` e compiler de capability/custo;
- conditions de actor, target, item, block e evento;
- actions host-local essenciais e notificação remota somente post/deferred;
- status passives/actives/immunities com ID exato;
- temporal windows/counters, fallback e audit.

Gate: efeitos simples do Trinkets são equivalentes sem `*_tag`; action stale/expirada
e recursão correlacionada possuem fixtures.

### Fase 8 — Extração do StatsCore genérico

- portar registry/state/resolver/progression/lore usando os contratos novos;
- corrigir os dez bugs pelo expected delta ledger;
- unificar combat/support/event-driven no router;
- portar inferência como selectors ou plugin host-local AT;
- aplicar budgets a explosion/lightning/operator;
- manter tiers, mining e conteúdo AT fora do kernel.

Gate: fixtures legacy passam no oracle correto e deltas aprovados passam no oracle
corrigido; nenhum import da API instala runtime por side effect.

### Fase 9 — Adapter Ascendant

- registrar tiers/defaults/selectors e instalar plugin host-local quando necessário;
- adaptar Refining Table, Reinforcement, armor component, commands e Insight;
- manter shim `StatsCore/API.js` import-safe;
- validar custom component registration no startup;
- shadow metrics em mundos reais.

Gate: **Ascendant + Dorios-RPG-Core**, sem Trinkets, funciona em fail-closed correto;
depois Ascendant + Core + Trinkets funciona sem side effects duplicados.

### Fase 10 — Migração do Trinkets

- quebrar `register.js` em bundles JSON-safe por categoria;
- migrar stats/passives/actives/immunities e os 79 itens;
- converter `system.js` em effects declarativos/actions host-local aprovadas;
- remover intervalos por jogador e tags auxiliares;
- migrar loot/drop para adapters com capabilities;
- corrigir lore/definições e bugs listados neste plano.

Gate: 79 itens equipam/desequipam/recarregam sem perda e o Core embutido pode ser
desativado; Lantern Belt e Marksman's Monocle provam os slots novos.

### Fase 11 — Shadow e cutover

- `legacy -> shadow -> new_apply -> new_only` com source of truth por mode;
- diff de snapshots, dano, progressão e loadout;
- auditor/migration conflict quarantine;
- manifests obrigatórios antes de `new_apply`;
- desativar Core embutido e bootstrap StatsCore antigo.

Gate: nenhuma divergência fora do expected delta ledger; metas p95/p99 e contadores
passam; host ausente/duplicado permanece inerte sem fallback.

### Fase 12 — Primeiro release de slots/conteúdo

- Wave 0 de UI/assets e Wave 1A do catálogo;
- nove itens iniciais com recipes/loot/texturas/cinco idiomas;
- primeiro G, depois E; nenhum S/W necessário para liberar a integração.

Gate: os nove itens da Wave 1A passam produção, balance e multiplayer.

### Fase 13 — Programa de expansão do Trinkets

- executar Waves 1B, 2A, 2B, 2C, 3A e 3B;
- set bonuses por `setCounts` derivados;
- progressão individual somente após fidelidade do backend;
- introduzir S depois dos watchers e W depois do scheduler profiling.

Gate separado: cada wave passa seu gate operacional no
[plano de conteúdo](./TRINKETS_CONTENT_EXPANSION_PLAN.md), depois as metas completas
são cumpridas. Os 72 novos equipáveis nunca bloqueiam o cutover técnico do RPG-Core.

## 18. Matriz de migração por arquivo

| Origem | Destino/ação |
| --- | --- |
| `Core/config.js` | stat/slot registries, compat adapter e host config |
| `Core/stats_manager.js` | `rpg/stats/aggregate`, actor cache e UI presenter |
| `Core/update_stats.js` | event invalidation + scheduler compartilhado |
| `Core/active_abilities.js` | damage pipeline e effects/actions |
| `Core/trinkets_inv.js` | provider/loadout transactions + UI adapter |
| `system.js` | bundles declarativos + actions especializadas |
| `register.js` | bundles por categoria, JSON-safe |
| `Core/loot_injector.js` | plugin Trinkets; só primitives genéricas após perfil próprio |
| `StatsCore/core/registry.js` | `rpg/items/definitions` com owner/schema |
| `StatsCore/core/state.js` | `rpg/items/state` + compat v3 |
| `StatsCore/attributes/resolve.js` | item resolver e stat vector |
| `StatsCore/progression/*` | progression genérica/fixed-point |
| `StatsCore/combat/*` | plugin + event pipeline |
| `StatsCore/support/*` | vanilla provider + plugin AT |
| `StatsCore/mining/*` | mechanics genéricas + conteúdo AT separado |
| `StatsCore/eventDriven/*` | indexed effects/temporal state |
| `StatsCore/defaults.js` | permanece plugin Ascendant |
| `StatsCore/commands.js` | permanece adapter Ascendant/host debug |
| `Dorios-RPG-Core/DoriosAPI/*` | removido; consumers migram para DoriosLib |

## 19. Validação mínima

### 19.1 Unit tests puros

- validação/normalização de todos os schemas;
- unidades e conversões legacy;
- operadores e ordem de modifier phases;
- item/actor resolve;
- state transaction e no-op write;
- migration v1/v2/v3 e unknown extensions;
- state quota abaixo/acima do limite sem truncar legacy/quarantine;
- condition AST e feature masks;
- cooldown scopes e timing buckets;
- XP fixed-point, curves e level-up;
- conflict/owner/priority rules;
- registry/snapshots imutáveis por API e índice determinístico por revisão;
- expressions de track/allocation/refined/affinity/boss/cap;
- full multiplier versus delta do StatsCore;
- todas as gramáticas/exemplos de ID como fixtures do registry correto;
- action result/read-your-writes/all-or-nothing multi-source rollback;
- protocol chunk/retry/idempotência, canonical UTF-8/hash e commit atômico;
- entrypoints `shared`/API importados sem subscription.

### 19.2 Integração Minecraft

- mainhand + armor + 15 slots de trinket;
- dois itens de mesmo typeId com UIDs diferentes;
- item com lore, enchantment, durability e DPs no loadout;
- equip com inventário cheio e recovery após reload;
- crash após cada phase do journal, incluindo mailbox/claim;
- UI escrow/form open/move/close, crash imediatamente após drag, lease concorrente,
  falso título, fallback e entidade órfã;
- troca de item dentro de `system.run` deferred;
- troca por item diferente e por outro item do mesmo typeId antes do deferred;
- split/clone/creative copy e UID duplicado de item stateful;
- player leave/dimension/death;
- hurt antes/depois, cancelamento e dano derivado;
- fatal guard pre-arm, restricted callback, deferred commit, clean restart e crash
  `uncertain_spent`;
- Chronoshard tranche fatal, outra death cause, respawn sem loop e source ausente;
- projectile ownership e troca de arma;
- efeito/passivo removido imediatamente ao desequipar;
- immunity sem dados e payload corrompido;
- extra jump por borda de input;
- registro de dois addons com ordem invertida;
- host ausente, dois hosts, versão incompatível e ack atrasado;
- dependency ausente/incompatível no loader versus handshake ausente em runtime;
- lifecycle duplicate initialize, shutdown/reinitialize, shutdown durante publish e
  late-host conflict após active;
- transport_ready -> publish -> active sem deadlock;
- Core+Ascendant sem Trinkets, hello sem closure completa e cliente pós-settle;
- cliente que perdeu worldLoad, host restart e republish de bundles;
- chunks fora de ordem/perdidos/duplicados, Unicode/escaping e response multiframe;
- same-revision/different-hash, rollback negado e bundle parcialmente inválido;
- bundle dependency invertida, ausente/cíclica e restart antes da closure;
- quota de bytes UTF-8, target spoofado e sessões client/host antigas;
- action remota expirada, entidade stale e retry idempotente;
- plugin host-local presente/ausente/incompatível no packaged world;
- shadow legacy mutation invalida cache e new_apply barrier desliga writers/jobs;
- StatApplicator max health/speed/knockback/regen/remove/rollback/coexistência;
- Dorios-RPG-Core + Ascendant + Trinkets + Insight simultâneos.

### 19.3 Stress/performance

- 1/20/50 jogadores idle;
- todos com 15 slots ocupados;
- recomputação simultânea de loadout;
- explosão com muitos blocos e jogadores;
- lightning em área densa;
- Operator 7x7x7 dividido em jobs;
- múltiplos effects de área no mesmo tick;
- 1.000 cooldowns expirando;
- churn de registry em dev;
- payloads perto da quota;
- assemblies incompletos até memory/timeout cap;
- cache churn com teto global e cleanup após entity leave;
- fairness de jobs entre addons e deadlines;
- p95/p99, DP reads/parses/writes, bytes estimados de cache e tempo máximo de job.

## 20. Correções obrigatórias antes do cutover do Trinkets

1. Remover `rush_of_fear_tag` quando o timer termina e ao desequipar.
2. Impedir duplicação no caminho de `condition` falsa.
3. Substituir guard de damage cause por correlation/reentrancy.
4. Detectar borda de jump input para extra jumps.
5. Remover/encerrar passivos imediatamente ao perder a source.
6. Normalizar retorno de immunities como array/Set vazio.
7. Proteger parse de dados legacy corrompidos.
8. Aplicar equipamento real como source ou remover a promessa do guide durante a transição.
9. Corrigir Strong Abyssal, Strong Jade, Heavy Miner, Abyssal Diver, Dead Abyssal,
   Miner Ring, Strong Ender, Obsidian Skull e o namespace do Holy Cross.
10. Remover a tradução duplicada de `dorios:scroll`.
11. Impedir `loadEntityInv()` de sobrescrever silenciosamente o mesmo índice ao ler
    múltiplos IDs legacy.
12. Só atualizar `expectedTags` depois de confirmar o move; item ejetado não pode
    manter efeito por um tick.
13. Substituir roteamento por título exato por sentinel e teste de falso positivo.
14. Trocar `effectType.includes(effect)` por comparação exata de ID normalizado.
15. Aplicar tolerância no Idle Bloom; velocidade/jitter não usa igualdade exata.
16. Incluir dimension ID na chave de tracking de baús.
17. Auditar/limpar `trinkets_inv` órfã e nunca tratar entidade visual descartável
    como storage confirmado.
18. Substituir `tag.endsWith("_tag")` por metadata auxiliar explícita e namespaced.
19. Resolver a mesma UID encontrada no journal, inventário, loadout e escrow/session sem
    preferência silenciosa.

Essas correções devem ganhar testes; não devem ser escondidas dentro de uma migração
grande sem fixture de regressão.

## 21. Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Drift entre cópias da DoriosLib | Source única, output-specific hashes e shared hash no CI |
| Dois hosts ativos | UUID/loader como garantia; settle + late-heartbeat kill-switch defensiva |
| Host ausente/incompatível | Loader rejeita dependency; handshake inválido deixa runtime inerte |
| Perda/duplicação de item | Backend aprovado, journal durável, mailbox e crash injection |
| Payload cross-pack inválido | Schema strict, quotas e ack com path/code |
| Mod externo conflita com ID | Owner namespace, reject default e override autorizado |
| Before-event customizado não cruza pack | Actions built-in no host; custom apenas post/deferred |
| Regressão de balanceamento | Fixtures + shadow diff antes de new_apply |
| Dano recursivo | Correlation graph e depth limit |
| Polling cresce com conteúdo | Feature masks, cadências e classes de custo |
| Jobs pesados congelam tick | Block/entity budgets e continuação cancelável |
| Estado legacy corrompido | Parse seguro, quarantine e recovery command |
| API Script 2.2 vs 2.8 | Bump coordenado 2.8/engine 1.21.120 ou builds separados |
| UI externa não extensível | 15 slots oficiais + página reservada futura |
| Source spoofado | Trust policy/target filtering; sem promessa de autenticação |
| Cache cresce com catálogo | Tetos globais, LRU/TTL e cleanup por lifecycle |

## 22. Versionamento e releases

- DoriosLib com `rpg` e mudanças de contrato: recomendação `3.0.0`.
- Protocolo cross-pack: versão independente `1`.
- Item state schema: versão independente `1`.
- Loadout schema: versão `1`; tags/typeId antigos não eram o mesmo schema canônico.
- ItemDefinition schema: versão independente `1`.

Uma versão da DoriosLib não implica apagar schemas antigos. Support matrix deve listar:

```text
DoriosLib 3.x -> protocol 1, item state 1, loadout 1, definition 1
```

Deprecations aparecem no changelog com primeira versão, replacement e versão mínima
de remoção.

## 23. Definition of Done do programa

- [ ] Existe fonte canônica da DoriosLib e drift check.
- [ ] `DoriosLib.rpg` é import-safe e tem lifecycle explícito.
- [ ] Dorios-RPG-Core é o único host cross-pack.
- [ ] Clients declaram manifest dependency e ficam inertes sem host compatível.
- [ ] Host só entra em `active` após settle, bundle closure e cutover barriers.
- [ ] Plugins oficiais Trinkets/Ascendant estão fisicamente empacotados e versionados.
- [ ] Providers/codecs/callbacks existem apenas host-local; bundles são DTOs puros.
- [ ] Registro é versionado, correlacionado, idempotente e validado.
- [ ] Ownership/namespaces vêm de policy host-owned; bundle não escolhe owner efetivo.
- [ ] Stats são extensíveis por registry e unidades são inequívocas.
- [ ] Item, actor e event snapshots estão separados.
- [ ] Loadout preserva todos os facets declarados/verificados, rejeita os demais e
  possui recovery transacional durável.
- [ ] `hat`, `face` e `belt` funcionam com os índices definidos.
- [ ] Os 79 trinkets atuais migraram sem perda funcional não documentada.
- [ ] StatsCore legacy preserva UID, `refined`, tracks/XP, allocations, refino
  completo, abilities, player/world settings e lore.
- [ ] Attribute earning/allocation/cap/refund funciona ou a feature permanece
  explicitamente desabilitada; pontos não ficam silenciosamente inertes.
- [ ] O pipeline possui um listener por evento e não duplica dano/effects.
- [ ] Actions multi-source possuem result/CAS/journal/rollback determinísticos.
- [ ] Idle players não executam polling ambiental.
- [ ] Ações espaciais respeitam orçamento.
- [ ] Unit, integration, migration e stress tests passam.
- [ ] Shadow metrics não mostram divergências críticas.
- [ ] Adapters legacy possuem cronograma de remoção.
- [ ] Guides, API inventory, typings, changelog e exemplos foram atualizados.

## 24. Próximos tickets recomendados

1. ADR-001: escolher a fonte canônica da DoriosLib.
2. ADR-002: host obrigatório, UUID, isolamento, providers e fail-closed.
3. ADR-003: fechar crítico, DefenseProfile, penetration e damage order.
4. ADR-004: escolher escrow/codec, shards, journal e matriz de fidelidade.
5. ADR-005: IDs/owners/namespaces, UID split/clone e immutability.
6. ADR-006: source of truth por feature flag e expected delta ledger.
7. TEST-001: fixtures dos 79 trinkets.
8. TEST-002: fixtures raw StatsCore item/player/world e bugs conhecidos.
9. CORE-001: host authority/bootstrap + manifest dependency.
10. CORE-002: integration plugin registry, packaging e owner policy.
11. LIB-001: shared schemas/error model/immutable registry.
12. LIB-002: transport v1, framing, bundle closure e activation barrier.
13. LIB-003: stat registry/expressions/compile/aggregate.
14. LIB-004: item state/progression/attribute allocations/migrations.
15. LIB-005: slot/provider CAS e loadout backend.
16. LIB-006: event router/scheduler/metrics.
17. LIB-007: condition/effect registries e action transactions.
18. LIB-008: StatApplicator delta/rollback/coexistence matrix.
19. TRINKETS-001: UI 15 slots, hat/face/belt e escrow/form lease.
20. TRINKETS-002: loadout journal/recovery/mailbox.
21. TRINKETS-003: converter registros para bundles JSON-safe.
22. AT-001: API shim/import-safe e port do resolver.
23. AT-002: adapters da Refining Table/Reinforcement/allocations.
24. TEST-003: packaged-world/MCpack manifest e plugin matrix.
25. PERF-001: benchmark p95/p99, DP/cache/query e jobs.
