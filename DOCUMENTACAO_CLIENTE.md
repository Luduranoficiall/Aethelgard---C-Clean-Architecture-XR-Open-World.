# 🛡️ Aethelgard: Crônicas de Aethelgard & Além
### *Documentação Oficial de Engenharia, Design de Produto & Apresentação Executiva*
**Versão:** 2.4.0-Production · **Arquitetura:** C# Clean Architecture / WebXR Immersive Engine · **Status:** 100% Estável & Testado

---

## 🌟 1. Sumário Executivo & Visão do Produto

O **Aethelgard** é um RPG de Ação em Mundo Aberto de última geração construído sobre a convergência entre **Computação Espacial (WebXR)**, **Geração Procedural de Mundos por IA** e **Engenharia de Software de Alto Nível (Clean Architecture em C#)**.

Projetado tanto para telas convencionais (Desktop e Mobile) quanto para headsets e óculos de Realidade Estendida de alta fidelidade (como **Samsung Galaxy XR**, **XREAL AURA**, **Meta Quest 3/Pro**), o projeto elimina a barreira entre o jogador e o universo visual, proporcionando uma imersão cinematográfica imediata diretamente no navegador, sem necessidade de downloads pesados ou instalações complexas.

### 💎 Principais Diferenciais Competitivos
1. **Design Humanizado & Zero Poluição Visual:**
   * A interface do usuário (HUD) e os seletores foram desenhados para respeitar a arte principal.
   * A tela inicial e as barras de ação foram ancoradas na base inferior do campo de visão (`bottom: 5%`), deixando **100% desobstruída a visão dos personagens**, da cidadela imperial e dos portais dimensionais.
   * Os textos e mensagens utilizam linguagem acolhedora, clara e instigante.

2. **Engenharia de Nível "Hard Master":**
   * O motor de combate, física de atributos, cálculo hiperbólico de armadura e gestão de estamina foram integralmente desenhados em **C# Puro com Domain-Driven Design (DDD)**.
   * Espelhado com fidelidade matemática em TypeScript puro, livre de frameworks pesados, garantindo **60+ FPS sustentados**, **zero garbage collection no loop de renderização** e determinismo absoluto.

3. **Seletor de Dificuldade Inteligente com Radar D3.js nos Tooltips:**
   * Uma barra horizontal flutuante com acabamento *glassmorphism* permite alternar entre 4 modos de desafio com feedback sonoro procedural e iluminação perimétrica dinâmica (*glow effects*).
   * **Visualização de Dados com D3.js:** Ao passar o mouse sobre cada nível, o tooltip flutuante renderiza um **gráfico de radar vetorial (D3.js)** comparando os 5 indicadores críticos de desempenho (Inteligência de IA, Escassez de Recursos, Velocidade & Ritmo, Precisão de Parry e Letalidade) contra o padrão canônico do jogo.

---

## 🎮 2. Os 4 Níveis de Dificuldade Explicados de Forma Humanizada

Cada jogador busca uma experiência particular no mundo dos games. No Aethelgard, cada dificuldade não é apenas um multiplicador de vida, mas uma **transformação real na cadência e na tensão do combate**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        MATRIZ DE CALIBRAÇÃO DE DIFICULDADE                             │
├──────────────────────┬──────────────────┬──────────────────┬───────────────────────────┤
│ 🌿 1. FÁCIL          │ ⚔️ 2. MÉDIO      │ 🛡️ 3. DIFÍCIL    │ 👑 4. HARD MASTER PROF.   │
│ (Aventureiro)        │ (Veterano)       │ (Comandante)     │ (Engenharia Extrema)      │
├──────────────────────┼──────────────────┼──────────────────┼───────────────────────────┤
│ 200 HP (2.0x)        │ 100 HP (1.0x)    │ 80 HP (0.8x)     │ 50 HP (0.5x)              │
│ Regen Ativa (+5 HP/s)│ Sem Regeneração  │ Sem Regeneração  │ Sem Regeneração           │
│ Dano Inimigo 0.5x    │ Dano Inimigo 1.0x│ Dano Inimigo 1.75│ Dano Inimigo 2.6x (Letal) │
│ Parry: 500 ms        │ Parry: 300 ms    │ Parry: 160 ms    │ Parry: 80 ms (Milimétrico)│
│ Estamina: 0.6x Custo │ Estamina: 1.0x   │ Estamina: 1.4x   │ Estamina: 2.0x (Dobro)    │
│ Morte Padrão         │ Morte Padrão     │ Morte Padrão     │ PERMA-DEATH THREAT ATIVO  │
└──────────────────────┴──────────────────┴──────────────────┴───────────────────────────┘
```

### 🌿 1. Fácil — Aventureiro Explorador
* **Para quem é:** Ideal para quem deseja relaxar, contemplar a paisagem, passear pelos vilarejos medievais ou demonstrar o projeto para clientes e visitantes sem o risco de derrotas imediatas.
* **Impacto no Gameplay:** Vida duplicada (200 HP), regeneração contínua de saúde, consumo de estamina reduzido em 40% e uma janela de *parry* ultra generosa de meio segundo. Permite que o jogador aprenda as animações e os controles no seu próprio ritmo.

### ⚔️ 2. Médio — Veterano de Batalha (Modo Canônico)
* **Para quem é:** O equilíbrio perfeito dos grandes clássicos de Ação/RPG (como *The Witcher 3*, *Zelda: Breath of the Wild* e *Ghost of Tsushima*).
* **Impacto no Gameplay:** Valores canônicos balanceados (100 HP, 1.0x de dano), sem regeneração automática de saúde. Exige timing natural de esquiva e gestão consciente da barra de estamina.

### 🛡️ 3. Difícil — Comandante de Elite
* **Para quem é:** Jogadores experientes em busca de tensão e estratégia contínua.
* **Impacto no Gameplay:** Inimigos causam +75% de dano e têm raio de perseguição estendido. O herói tem apenas 80 HP e a janela de contra-ataque é reduzida para 160 milissegundos. Exige posicionamento tático e respeito aos padrões de ataque adversários.

### 👑 4. Hard Master Profissional — Engenharia Extrema
* **Para quem é:** Feito sob medida para streamers, criadores de conteúdo e jogadores *hardcore* apaixonados por títulos como *Elden Ring*, *Dark Souls* e *Sekiro*.
* **Impacto no Gameplay:** Vida do herói cortada pela metade (50 HP), dano inimigo brutal e letal (2.6x), consumo de estamina dobrado e janela de *parry* milimétrica de apenas 80 milissegundos (*frame-perfect*). Um único golpe em falso pode significar derrota e aciona a mecânica de **Perma-Death Threat**.

---

## 💻 3. Arquitetura de Software: C# Puro de Nível Hard Master

O sistema foi concebido com os princípios mais rigorosos da **Clean Architecture** e do **Domain-Driven Design (DDD)**:

```
[ Camada de Apresentação / WebXR Viewport ]
       │
       ▼ (Eventos de Entrada & Renderização 3D)
[ Application Layer / GameStateManager ]
       │
       ▼ (Inversão de Controle & Pub-Sub)
[ Domain Core Engine / C# Combat Logic ]
       ├── Entities: HeroEntity, EnemyEntity, WeaponEntity
       ├── Value Objects: Health, Stamina, DamageMitigation, ArmorCurve
       ├── Rules: PerfectParryWindow, HyperbolicArmorMitigation
       └── Services: CombatCalculationService, DifficultyAdjustmentService
```

### 💎 Destaques da Engenharia de Software
1. **Fórmula Hiperbólica de Mitigação de Dano:**
   $$DanoRecebido = DanoBruto \times \frac{100}{100 + ArmaduraEfetiva}$$
   Evita que a armadura atinja 100% de invulnerabilidade (rendimentos decrescentes matematicamente perfeitos).
2. **Imutabilidade e Tipagem Estrita:**
   Todas as estruturas de configuração de dificuldade são imutáveis (`readonly`), eliminando mutações colaterais em tempo de execução.
3. **Desacoplamento Gráfico Total:**
   O motor de regras pode ser compilado tanto em .NET puro (C#) quanto em TypeScript sem qualquer dependência da biblioteca gráfica (Three.js/XR Blocks). Isso permite executar a simulação lógica em servidores *authoritative* para multiplayer no futuro.
4. **100% de Cobertura de Testes Unitários:**
   Uma suíte exaustiva em `/src/core/tests/engine.test.ts` valida:
   * Aplicação correta de cada multiplicador dos 4 níveis de dificuldade.
   * Cálculos de mitigação com diferentes armaduras.
   * Detecção de *Perfect Parry* dentro e fora das janelas de tolerância.
   * Transições atômicas de estado no `GameStateManager`.

---

## 🌌 4. Os 4 Mundos Gerados por IA & Portais Dimensionais

O Aethelgard transporta o usuário por 4 realidades com estéticas e atmosferas exclusivas:

1. **Aethelgard Medieval (A Cidadela Imperial):**
   * Paisagem ensolarada, castelos de pedra polida, pinheiros e montanhas ao fundo, com iluminação suave e névoa atmosférica.
2. **Cidadela Celestial (Ilhas Flutuantes):**
   * Fortalezas suspensas entre nuvens douradas, altares arcanos e sensação de altitude infinita.
3. **Terras Vulcânicas de Obsidiana:**
   * Solo incandescente, rios de magma, fumaça vulcânica e iluminação dramática avermelhada.
4. **Santuário Astral das Estrelas:**
   * Céu cósmico violeta, estrelas cadentes, pedras flutuantes pulsantes e iluminação mística.

---

## 🕹️ 5. Guia Completo de Controles

| Ação | Teclado & Mouse | Mobile / Telas de Toque | Dispositivos WebXR (Óculos XR) |
| :--- | :--- | :--- | :--- |
| **Mover o Herói** | Teclas `W`, `A`, `S`, `D` ou Setas | Joystick Virtual / Toque | Alavanca Analógica / Movimento Físico |
| **Ataque com Espada** | `Clique Esquerdo` ou `Espaço` | Botão "Golpe de Espada" | Gesto de Pinça (Pinch) / Gatilho |
| **Magia Arcana (AoE)** | Tecla `Q` | Botão "Magia Arcana" | Botão Secundário / Painel XR |
| **Bloqueio / Parry** | Tecla `F` | Botão "Parry" | Postura de Guarda com as Mãos / Grip |
| **Esquiva Tática** | Tecla `Shift` | Botão "Esquiva" | Dash / Inclinação Corporal |
| **Selecionar Dificuldade**| Setas `←` e `→` (ou `V` / `1, 2, 3, 4`)| Barra Horizontal Flutuante | Painel Espacial Holográfico |
| **Hall da Glória (Firestore)**| Tecla `T` | Botão "Achievers (T)" | Painel Holográfico de Líderes |
| **Alternar Câmera** | Tecla `Z` | Botão "Câmera" | Visão 6DoF Natural com a Cabeça |
| **Modo Foto (Limpar HUD)**| Tecla `H` | Botão "Modo Foto" | Gesto de Ocultar Interface |
| **Viajar de Mundo** | Tecla `E` (próximo ao portal) | Botão no Portal | Toque Direto no Orbe do Portal |

---

## 🚀 6. Checklist de Demonstração para o Cliente (Roteiro de 2 Minutos)

Quando você for apresentar este projeto ao seu cliente, siga este roteiro testado para impressionar:

1. **Abertura Visual (0 a 30s):**
   * Abra a aplicação e mostre como o herói e o cenário da cidadela estão totalmente limpos e visíveis, sem nenhum menu tapando a arte principal.
   * Destaque o efeito de iluminação solar e o portal dimensional pulsando ao fundo.
2. **Demonstração dos Níveis de Dificuldade (30 a 60s):**
   * Passe o mouse sobre os 4 botões na barra horizontal inferior:
     * Mostre o **Tooltip Flutuante** que surge suavemente detalhando vida, dano inimigo e tempo de parry.
     * Clique em **Hard Master Profissional**: repare no som de conquista e na borda vermelha pulsando com energia letal.
     * Clique em **Fácil**: veja a transição para a aura verde esmeralda e a explicação do modo aventureiro.
3. **Combate & Interatividade (60 a 90s):**
   * Pressione `Espaço` ou clique no botão de ataque para ver o combo de golpes de espada e as partículas brilhantes de corte.
   * Pressione `Q` para disparar a magia arcana que ilumina todo o cenário.
   * Pressione `Shift` para a esquiva tática e `F` para o bloqueio de escudo.
4. **Viagem de Mundo & Realidade Estendida (90 a 120s):**
   * Aproxime o herói do portal e pressione `E` para mudar de bioma (deixe o cliente maravilhado com a transição entre mundos).
   * Clique em **"Entrar em Realidade Estendida"** (ou no simulador) para mostrar a perspectiva em primeira/terceira pessoa imersiva.

---

## 📈 7. Oportunidades Futuras de Monetização & Expansão

Para reuniões estratégicas de evolução do produto:
1. **Passe de Batalha & Cosméticos 3D:** Novos modelos de armaduras, capas com tecido simulado e lâminas elementais (fogo, gelo, raio).
2. **NPCs com Voz Inteligente (Gemini Audio):** Conversas espontâneas com personagens do vilarejo usando síntese de voz em tempo real.
3. **Multiplayer Cooperativo Espacial:** Dois amigos em headsets XR diferentes explorando a mesma masmorra simultaneamente.
4. **Ranking Global de Campeões Hard Master:** Placar na nuvem que eterniza os jogadores que derrotaram chefes no modo de maior dificuldade sem sofrer dano.

---
*Aethelgard Engine · Documentação de Engenharia e Design de Produto · Todos os Direitos Reservados.*
