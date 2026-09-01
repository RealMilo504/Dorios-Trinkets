export const categoryDescriptions = Object.freeze({
  hat: "Chapéus e capacetes oferecem proteção, percepção e vantagens condicionais sem ocupar o slot de rosto.",
  body: "Acessórios de corpo reúnem aljavas, emblemas e broches com respostas defensivas ou ofensivas.",
  feet: "Calçados alteram mobilidade, terreno e dano de queda.",
  necklace: "Colares fornecem atributos diretos, sustentação e utilidades acessíveis.",
  ring: "Anéis concedem bônus compactos que podem ser combinados com um anel secundário.",
  charm: "Encantos são utilitários simples e combináveis para exploração, defesa ou coleta.",
  talisman: "Talismãs recompensam situações específicas de combate, viagem e coleta.",
  gauntlet: "Manoplas modificam golpes corpo a corpo e ações executadas com as mãos.",
  heartycharm: "Amuletos de saúde ampliam vida, regeneração e resistências relacionadas à sobrevivência.",
  doll: "Bonecos reagem a dano, morte e efeitos negativos com mecanismos defensivos ou de retaliação.",
  witherring: "Anéis secundários são versões mais poderosas e especializadas para o segundo slot de anel.",
  archaiccharm: "Amuletos arcanos oferecem poderes excepcionais acompanhados de condições, custos ou riscos.",
  amulet: "Amuletos concentram magia condicional, conversões de recurso e defesas raras.",
  face: "Máscaras e visores alteram percepção, projéteis e respostas a efeitos hostis.",
  belt: "Cintos são utilitários de exploração, coleta, construção e manutenção de equipamento.",
});

const detail = (description, options = {}) => ({ description, ...options });

export const itemDetails = Object.freeze({
  bloodbound_emblem: detail("Converte a morte de um inimigo em um breve surto de força.", {
    buffs: ["Força I por 12 segundos após matar uma entidade."],
    special: ["O efeito é renovado por cada abate realizado pelo portador."],
  }),
  frost_quiver: detail("Imbui projéteis com frio incapacitante.", {
    special: ["Projéteis que acertam uma entidade aplicam Lentidão I por 12 segundos."],
  }),
  molten_quiver: detail("Imbui projéteis com fogo persistente.", {
    special: ["Projéteis que acertam uma entidade a incendeiam por 5 segundos."],
  }),
  venom_quiver: detail("Reveste projéteis com veneno.", {
    special: ["Projéteis que acertam uma entidade aplicam Veneno I por 12 segundos."],
  }),
  idle_bloom: detail("Floresce quando o portador permanece imóvel.", {
    buffs: ["Regeneração II enquanto a condição está ativa."],
    special: ["Ativa após 3 segundos sem se mover e desativa quando o portador volta a se mover."],
  }),
  tideforged_carapace: detail("Endurece o corpo do portador nas profundezas.", {
    buffs: ["Resistência I enquanto estiver dentro da água."],
  }),
  travelers_cloak_pin: detail("Amortece projéteis e converte o impacto em movimento.", {
    buffs: ["Reduz em 25% o dano do projétil bloqueado.", "Velocidade I por 12 segundos após o bloqueio."],
    special: ["Pode bloquear o primeiro projétil recebido a cada 6 segundos."],
  }),
  alchemists_cloak_pin: detail("Amplifica qualquer cura recebida pelo portador.", {
    buffs: ["Aumenta em 10% toda cura recebida."],
  }),
  iron_locket: detail("Protege contra projéteis e ajuda o portador a manter sua posição.", {
    buffs: ["Reduz em 12% todo dano de projétil recebido."],
  }),
  emerald_chain: detail("Transforma uma sequência de vitórias em experiência.", {
    special: ["Concede 1 ponto de experiência a cada 5 inimigos hostis derrotados."],
  }),
  mender_pendant: detail("Restaura continuamente a durabilidade do equipamento usado.", {
    special: ["Repara 1 ponto de durabilidade por segundo na mão principal, mão secundária e peças de armadura equipadas."],
  }),
  repair_talis: detail("Concentra seu poder de reparo no item empunhado.", {
    special: ["Repara 1 ponto de durabilidade por segundo no item da mão principal."],
  }),
  rush_of_fear: detail("Converte o susto de receber dano em uma fuga explosiva.", {
    buffs: ["Concede 100% de velocidade terrestre adicional por 3 segundos após sofrer dano."],
  }),
  obsidian_skull: detail("Mantém uma proteção ígnea enquanto o portador não está totalmente submerso em lava.", {
    buffs: ["Resistência ao Fogo I enquanto a condição está ativa."],
    special: ["A proteção é suspensa ao ficar totalmente submerso em lava; o efeito já aplicado pode permanecer por até 12 segundos."],
  }),
  wayfarers_knot: detail("Armazena certeza suficiente para forçar um golpe crítico real.", {
    buffs: ["100% de chance crítica no golpe preparado."],
    special: ["O próximo ataque corpo a corpo ou projétil é processado como crítico pelo StatsCore; recarga de 8 segundos após ativar."],
  }),
  miners_token: detail("Acelera o ritmo de mineração depois que um veio é encontrado.", {
    buffs: ["Pressa I por 12 segundos."],
    special: ["Ativa ao quebrar qualquer minério no modo Sobrevivência."],
  }),
  wardstone: detail("Ancora o portador contra explosões e repulsão.", {
    buffs: ["Reduz em 15% o dano de explosões de blocos e entidades."],
  }),
  hunters_fang: detail("Torna os ataques mais letais contra criaturas naturalmente hostis.", {
    buffs: ["Aumenta em 8% o dano causado a inimigos hostis."],
  }),
  quarry_sigil: detail("Extrai uma pequena parcela adicional de minério.", {
    special: ["Ao quebrar minério no modo Sobrevivência, possui 8% de chance de gerar uma unidade adicional do recurso correspondente."],
  }),
  totem_of_momentum: detail("Acumula dano ao manter pressão sobre o mesmo alvo.", {
    buffs: ["Concede 2% de dano adicional por acúmulo, até 10%."],
    special: ["Cada golpe corpo a corpo ou projétil renova a janela de 3 segundos; trocar de alvo reinicia os acúmulos."],
  }),
  wayfinder_compass: detail("Protege o viajante ao atravessar dimensões.", {
    buffs: ["Velocidade I e Resistência I por 12 segundos após mudar de dimensão."],
  }),
  stormglass_talisman: detail("Fortalece projéteis durante chuva e tempestade.", {
    buffs: ["Aumenta em 10% o dano de projéteis quando o clima não está limpo."],
  }),
  harvesters_token: detail("Recupera sementes de plantações completamente maduras.", {
    special: ["Possui 25% de chance de gerar uma semente adicional ao colher trigo, cenoura, batata ou beterraba madura no modo Sobrevivência."],
  }),
  holy_cross: detail("Fere mortos-vivos com energia sagrada adicional.", {
    buffs: ["Causa 50% do dano original como dano adicional contra mortos-vivos."],
  }),
  duelist_wraps: detail("Recompensa respostas rápidas contra o agressor correto.", {
    buffs: ["O contra-ataque causa 20% de dano adicional."],
    special: ["Após sofrer dano corpo a corpo, atacar o mesmo agressor em até 3 segundos consome a janela de contra-ataque."],
  }),
  impact_glove: detail("Usa um pistão compacto para lançar inimigos atingidos.", {
    special: ["Um golpe corpo a corpo lança o alvo para longe e para cima; recarga de 4 segundos."],
  }),
  lucky_ragdoll: detail("Troca fome por uma segunda chance de obter trinkets em baús.", {
    buffs: ["Adiciona 3 pontos percentuais à chance de loot de trinkets quando a rolagem normal falha."],
    debuffs: ["Consome 1 ponto de fome sempre que o bônus produz o item."],
  }),
  stone_guardian_doll: detail("Responde a golpes corpo a corpo com pedra e estabilidade.", {
    buffs: ["Concede 15% de resistência à repulsão por 4 segundos após ativar."],
    special: ["Ao sofrer um golpe corpo a corpo, devolve 2 de dano ao agressor; recarga de 8 segundos."],
  }),
  straw_effigy: detail("Desfaz-se para impedir que um único golpe mate o portador.", {
    buffs: ["Concede Absorção II e Resistência II por 12 segundos após ativar."],
    special: ["Limita o golpe fatal para deixar ao menos 1 ponto de vida e consome a efígie equipada."],
  }),
  marionette_of_spite: detail("Pode devolver ao último agressor um efeito negativo recebido.", {
    special: ["Possui 35% de chance de refletir cegueira, escuridão, fome, náusea, veneno, lentidão, fraqueza, fadiga ou definhamento; recarga de 5 segundos e contato válido por 5 segundos."],
  }),
  creeper_doll: detail("Amortece explosões e pode fazer inimigos derrotados explodirem.", {
    buffs: ["Reduz em 30% o dano de explosões recebido."],
    special: ["Ao matar um inimigo hostil, possui 12% de chance de criar uma explosão de poder 2 sem quebrar blocos; recarga de 10 segundos."],
  }),
  leech_doll: detail("Marca quem feriu o portador e recompensa a vingança.", {
    buffs: ["Concede 8% de roubo de vida por 5 segundos ao retaliar contra o alvo marcado."],
    special: ["O agressor permanece marcado por 6 segundos; o bônus é consumido ao acertá-lo."],
  }),
  guardian_effigy: detail("Ergue uma proteção quando a vida cruza um limite perigoso.", {
    buffs: ["Concede Absorção II e Resistência I por 12 segundos."],
    special: ["Ativa ao cair de mais de 30% para 30% ou menos da vida máxima; recarga de 30 segundos."],
  }),
  strong_breeze_ring: detail("Golpes corpo a corpo levantam o alvo com uma rajada.", {
    special: ["Cada golpe corpo a corpo aplica repulsão na direção do ataque e lança o alvo para cima."],
  }),
  strong_echo_ring: detail("Faz cada golpe ressoar uma segunda vez.", {
    buffs: ["Repete 25% do dano original após 1 segundo."],
  }),
  strong_celestial_ring: detail("Combina saltos adicionais com uma descida controlada.", {
    buffs: ["Queda Lenta I enquanto estiver agachado."],
  }),
  abyssal_essence: detail("Amplifica o corpo do portador dentro da água.", {
    buffs: ["Força I enquanto estiver dentro da água."],
  }),
  endless_eye: detail("Sacrifica vitalidade em troca de percepção crítica e evasão absoluta ocasional.", {
    buffs: ["Possui 5% de chance de cancelar completamente qualquer golpe recebido."],
  }),
  blood_pact: detail("Troca uma grande parcela da vida máxima por roubo de vida, mas rejeita qualquer regeneração sobrenatural."),
  phoenix_ash_sigil: detail("Queima sua última brasa para negar um golpe fatal.", {
    buffs: ["Restaura a vida para pelo menos 6 pontos e concede Resistência ao Fogo I por 12 segundos."],
    debuffs: ["Aplica Fraqueza I por 12 segundos após ativar."],
    special: ["Impede o golpe fatal, consome o selo equipado e incendeia o agressor por 4 segundos."],
  }),
  chronoshard: detail("Adia parte do dano sem eliminá-lo.", {
    special: ["Recebe imediatamente 70% do dano; os 30% restantes retornam como dano mágico em três parcelas iguais, uma por segundo."],
  }),
  worldroot_knot: detail("Enraíza o portador quando ele permanece imóvel.", {
    buffs: ["Regeneração I e Resistência I enquanto a raiz está ativa."],
    special: ["Ativa após 3 segundos praticamente sem movimento e desativa ao mover-se ou saltar."],
  }),
  stormbound_idol: detail("Pode invocar um raio sobre o alvo durante uma tempestade.", {
    special: ["Em clima de trovão, ataques corpo a corpo ou projéteis usam a chance crítica do portador, limitada entre 5% e 50%, para invocar um raio; recarga de 10 segundos."],
  }),
  gluttons_seal: detail("Transforma alimento excedente em proteção temporária.", {
    buffs: ["Concede Absorção II por 12 segundos ao concluir uma refeição com a fome cheia."],
  }),
  abyssal_sun_amulet: detail("Regenera o portador enquanto ele explora a água.", {
    buffs: ["Regeneração I enquanto estiver dentro da água."],
  }),
  prismatic_aegis: detail("Dissipa uma parcela de diferentes fontes elementais e mágicas.", {
    buffs: ["Reduz em 8% dano de fogo, lava, magma, congelamento, raio e magia."],
  }),
  moonstone_amulet: detail("Desperta durante a noite.", {
    buffs: ["Durante a noite, concede 5% de chance crítica e 2 de regeneração de mana por segundo."],
  }),
  sunstone_amulet: detail("Desperta sob o céu aberto durante o dia.", {
    buffs: ["Regeneração I enquanto estiver no mundo normal, sob céu aberto e durante o dia."],
    special: ["Enquanto ativo, ataques possuem 15% de chance de incendiar o alvo por 3 segundos."],
  }),
  echoheart_amulet: detail("Converte parte da cura recebida em energia arcana.", {
    buffs: ["Restaura mana equivalente a 30% da cura recebida, limitada a 6 de mana por evento."],
  }),
  gravekeeper_amulet: detail("Armazena almas hostis para salvar o portador em estado crítico.", {
    buffs: ["Consome uma alma para curar 6 pontos de vida ao cruzar para 30% ou menos da vida máxima."],
    special: ["Armazena até 3 almas de inimigos hostis; todas expiram 10 minutos após a captura mais recente."],
  }),
  tempest_heart_amulet: detail("Retalia contra agressores durante chuva ou tempestade.", {
    special: ["Ao sofrer dano sob clima não limpo, causa 3 de dano elétrico ao agressor; recarga de 5 segundos."],
  }),
  deepdelvers_cap: detail("Auxilia mineração nas camadas profundas do mundo normal.", {
    buffs: ["Visão Noturna I e Pressa I enquanto estiver abaixo de Y=48 no mundo normal."],
  }),
  beekeepers_hat: detail("Protege contra abelhas e melhora o valor nutritivo do mel.", {
    buffs: ["Reduz em 50% o dano causado por abelhas.", "Beber uma garrafa de mel restaura 2 pontos adicionais de fome."],
  }),
  crown_of_last_light: detail("Impede periodicamente que um golpe fatal apague a última luz do portador.", {
    buffs: ["Concede Resistência II por 12 segundos após ativar."],
    debuffs: ["Aplica Fraqueza I por 12 segundos após ativar."],
    special: ["Limita um golpe fatal para deixar ao menos 1 ponto de vida; recarga de 120 segundos."],
  }),
  stormcaller_hood: detail("Guia projéteis durante tempestades com trovões.", {
    buffs: ["Aumenta em 12% o dano de projéteis durante clima de trovão."],
  }),
  ember_respirator: detail("Filtra calor intenso antes que ele alcance o portador.", {
    buffs: ["Reduz em 30% dano de fogo, fogo contínuo, lava e magma."],
  }),
  copper_prospecting_lens: detail("Registra minérios quebrados e recompensa prospecção constante.", {
    special: ["Concede 1 ponto de experiência a cada 4 minérios quebrados no modo Sobrevivência."],
  }),
  echo_visor: detail("Marca o atirador de um projétil para um disparo de resposta.", {
    buffs: ["O projétil de resposta causa 10% de dano adicional."],
    special: ["Ao receber dano de projétil, marca o atirador por 6 segundos; o próximo projétil contra ele consome a marca."],
  }),
  mirror_mask: detail("Pode quebrar um efeito negativo assim que ele é aplicado.", {
    special: ["Possui 30% de chance de remover cegueira, escuridão, fome, náusea, veneno, lentidão, fraqueza, fadiga ou definhamento; recarga de 5 segundos."],
  }),
  veil_of_silence: detail("Oculta o portador depois que ele permanece agachado em silêncio.", {
    buffs: ["Invisibilidade I enquanto o véu permanece ativo."],
    special: ["Ativa após 3 segundos agachado; atacar remove a invisibilidade e bloqueia nova ativação até o portador parar de agachar."],
  }),
  ender_visor: detail("Carrega um disparo com energia dimensional após uma travessia.", {
    buffs: ["O próximo projétil causa 4 de dano adicional."],
    special: ["A carga surge ao mudar de dimensão, dura 30 segundos e é consumida pelo próximo projétil."],
  }),
  lava_waders: detail("Solidifica temporariamente a superfície da lava para sustentar o portador.", {
    special: ["Cria uma passagem em torno dos pés e à frente do jogador e aplica impulso vertical quando ele está dentro da lava."],
  }),
  featherstep_anklets: detail("Amortece quedas sem eliminar o bônus permanente de mobilidade.", {
    buffs: ["Reduz em 50% o dano de queda."],
  }),
  sandstrider_boots: detail("Acelera o portador sobre terrenos arenosos.", {
    buffs: ["Concede 35% de velocidade terrestre adicional sobre areia, areia vermelha e areia das almas."],
  }),
  rootwalker_sandals: detail("Acelera o portador sobre solos vivos e enraizados.", {
    buffs: ["Concede 25% de velocidade terrestre adicional sobre grama, musgo, lama, micélio, podzol e terra enraizada."],
  }),
  frostwalker_soles: detail("Congela uma pequena área de água sob os pés.", {
    special: ["Enquanto estiver no chão, transforma água em uma área de até 3×3 de gelo fosco e restaura os blocos após 4 segundos."],
  }),
  shadowstep_greaves: detail("Converte uma corrida sustentada e um salto em avanço rápido.", {
    special: ["Após correr por cerca de 1,5 segundo, saltar executa um avanço na direção da visão; recarga de 3 segundos."],
  }),
  slimebound_boots: detail("Absorve impactos de queda e devolve parte da força como quique.", {
    buffs: ["Reduz em 65% o dano de queda."],
    special: ["Quedas que causariam ao menos 4 de dano lançam o portador para cima; a altura do quique cresce com o dano original."],
  }),
  adventurers_belt: detail("Carrega uma lanterna dinâmica e uma reserva arcana.", {
    special: ["Cria e move um bloco de luz nível 15 na posição da cabeça enquanto houver ar no local, removendo a luz anterior ao se deslocar ou desequipar."],
  }),
  ironbound_girdle: detail("Atrai itens abandonados para perto do portador.", {
    special: ["Puxa até 16 entidades de item em um raio de 7 blocos."],
  }),
  miners_tool_belt: detail("Ajuda ferramentas de mineração a conservar durabilidade.", {
    special: ["Ao gastar durabilidade com picareta, machado, pá, enxada ou tesoura, usa a chance de preservação do portador para reparar imediatamente o desgaste; este cinto adiciona 5%."],
  }),
  bloodbound_sash: detail("Alimenta o portador com inimigos derrotados em troca de vitalidade máxima.", {
    buffs: ["Restaura 1 ponto de fome ao matar um inimigo hostil; recarga de 2 segundos."],
  }),
  toolwright_belt: detail("Repara a ferramenta conforme ela conclui trabalhos.", {
    special: ["A cada 12 blocos quebrados com uma ferramenta reconhecida, repara 1 ponto de durabilidade da ferramenta na mão principal."],
  }),
  soulcatcher_belt: detail("Converte a morte de inimigos hostis em mana.", {
    buffs: ["Restaura 8 de mana ao matar um inimigo hostil; recarga de 3 segundos."],
  }),
  hunters_bandolier: detail("Fortalece projéteis e ocasionalmente recupera flechas usadas.", {
    special: ["Ao acertar uma entidade com uma flecha, possui 20% de chance de devolver uma flecha ao inventário."],
  }),
  builders_harness: detail("Recupera parte dos materiais usados em construções simples.", {
    special: ["A cada 12 blocos de construção reconhecidos colocados no modo Sobrevivência, devolve uma unidade do bloco ao jogador."],
  }),
  magma_cinch: detail("Adapta o portador ao movimento e ao calor da lava.", {
    buffs: ["Resistência ao Fogo I enquanto estiver tocando lava."],
  }),
  ravager_horn_buckle: detail("Converte uma corrida sustentada em uma carga brutal.", {
    buffs: ["A carga causa 20% de dano adicional."],
    special: ["Correr por 1,5 segundo prepara a carga por 3 segundos; o próximo golpe corpo a corpo lança o alvo e inicia uma recarga de 6 segundos."],
  }),
  spider_silk_mantle: detail("Prende o agressor que golpeia o portador de perto.", {
    special: ["Ao sofrer dano corpo a corpo, aplica Lentidão II ao agressor por 12 segundos; recarga de 5 segundos."],
  }),
  huskbone_mask: detail("Converte a morte de mortos-vivos em alimento.", {
    buffs: ["Restaura 1 ponto de fome ao matar um morto-vivo; recarga de 2 segundos."],
  }),
  trial_champion_crown: detail("Recompensa sequências rápidas de vitórias contra inimigos.", {
    buffs: ["Concede Força I e Resistência I por 12 segundos."],
    special: ["Ativa ao matar 3 inimigos hostis dentro de uma janela renovável de 10 segundos."],
  }),
  goatstep_anklets: detail("Firma o corpo contra quedas, colisões e ataques de investida.", {
    buffs: ["Reduz em 35% dano de queda, colisão com parede e ataque de aríete."],
  }),
  hoglin_tusk_gauntlet: detail("Abre o combate com força adicional contra alvos ainda saudáveis.", {
    buffs: ["Golpes corpo a corpo causam 15% de dano adicional contra alvos com 80% ou mais de vida."],
  }),
  sculk_resonator: detail("Libera um pulso sônico quando a vida do portador se torna crítica.", {
    special: ["Ao cruzar para 30% ou menos da vida máxima, causa 4 de dano sônico a até 6 inimigos hostis em um raio de 6 blocos; recarga de 20 segundos."],
  }),
  mansion_ward_amulet: detail("Dissipa ataques sobrenaturais antes que alcancem o portador.", {
    buffs: ["Reduz em 20% dano mágico, sônico e de definhamento."],
  }),
  endermite_loop: detail("Aumenta permanentemente a velocidade e a precisão crítica do portador."),
  stronghold_eye_charm: detail("Reconhece criaturas ligadas ao End e expõe suas fraquezas.", {
    buffs: ["Aumenta em 12% o dano contra Enderman, Endermite, Shulker e Dragão do End."],
  }),
  ghast_tear_locket: detail("Reage ao calor, apagando chamas e iniciando a recuperação.", {
    buffs: ["Reduz em 25% o dano ígneo que ativa o medalhão e concede Regeneração I por 12 segundos."],
    special: ["Extingue o portador ao receber dano de fogo, fogo contínuo, lava ou magma; recarga de 15 segundos."],
  }),
  end_city_orb: detail("Converte essências de criaturas do End em energia arcana.", {
    buffs: ["Restaura 8 de mana ao matar Enderman, Endermite, Shulker ou Dragão do End; recarga de 3 segundos."],
  }),
  silverfish_scale_ring: detail("Endurece quando o portador está cercado por criaturas hostis.", {
    buffs: ["Reduz em 2% o dano recebido por inimigo hostil em um raio de 5 blocos, até 10%."],
  }),
  breeze_core_loop: detail("Firma o corpo do portador enquanto ele está no ar.", {
    buffs: ["Reduz em 15% o dano recebido enquanto estiver no ar."],
  }),
  ominous_key_ring: detail("Absorve a ameaça de uma chave ominosa recém-coletada.", {
    buffs: ["A carga aumenta em 35% o dano do próximo golpe corpo a corpo."],
    special: ["Coletar uma Chave Ominosa enquanto o anel está equipado armazena uma carga, consumida pelo próximo golpe corpo a corpo."],
  }),
  phantom_membrane_mantle: detail("Abre suas asas para amortecer uma queda severa.", {
    buffs: ["Reduz em 60% o dano de queda e concede Queda Lenta I por 12 segundos."],
    special: ["A proteção contra queda possui recarga de 15 segundos."],
  }),
  armadillo_shield_brooch: detail("Fecha-se contra disparos enquanto o portador se protege.", {
    buffs: ["Reduz em 35% o dano de projéteis enquanto o portador estiver agachado."],
  }),
  lost_allay_bell: detail("Transforma experiência recém-adquirida em energia arcana.", {
    buffs: ["Restaura 1 de mana para cada 3 pontos de experiência adquiridos enquanto estiver equipado."],
  }),
  desert_scarab_charm: detail("Ajuda o portador a sobreviver e escapar de armadilhas explosivas.", {
    buffs: ["Reduz em 35% o dano de explosões e concede Velocidade I por 12 segundos ao ser atingido."],
    special: ["A Velocidade possui recarga de 10 segundos; a redução permanece ativa."],
  }),
  packed_snow_doll: detail("Chama um defensor temporário quando a vida do portador enfraquece.", {
    special: ["Ao cruzar para menos de 50% da vida máxima, invoca um Golem de Neve por 7 segundos; recarga de 30 segundos."],
  }),
  shipwrecked_doll: detail("Recusa-se a deixar o portador afundar quando seu ar acaba.", {
    special: ["Nega um golpe de afogamento, concede Respiração Aquática I por 12 segundos e impulsiona o portador para cima; recarga de 20 segundos."],
  }),
  wind_bracer: detail("Golpeia inimigos antes que eles consigam aterrissar.", {
    buffs: ["Golpes corpo a corpo causam 20% de dano adicional contra alvos no ar."],
  }),
  cracked_bastion_medallion: detail("Compra proteção imediata usando o ouro carregado pelo portador.", {
    buffs: ["Reduz em 40% o próximo dano recebido quando há uma Barra de Ouro disponível."],
    debuffs: ["Consome 1 Barra de Ouro ao ativar."],
    special: ["A proteção automática possui recarga de 10 segundos."],
  }),
  jungle_reliquary: detail("Desvia o primeiro disparo que alcança seu portador.", {
    special: ["Nega completamente um golpe de projétil; recarga de 20 segundos."],
  }),
});
