# Aethelgard - Clean Architecture & Engine Specification (C# Puro)
### Nível: Principal / Senior Staff Game Engine Architect

Este documento formaliza a arquitetura do motor de jogo, decomposição em camadas limpas (Clean Architecture / DDD), detalhamento matemático dos 4 níveis de dificuldade e matriz de testes unitários.

---

## 1. Visão Geral da Arquitetura Limpa (Clean Architecture)

```
       +--------------------------------------------------------+
       |                  Enterprise Domain                     |
       |  - Enums (DifficultyTier, CombatState, EnemyType)       |
       |  - Value Objects (DifficultyLevel, CombatCalculations) |
       |  - Entities (PlayerEntity, EnemyEntity, WorldPortal)   |
       +---------------------------^----------------------------+
                                   |
       +---------------------------+----------------------------+
       |                  Application Layer                     |
       |  - Use Cases (ExecutePlayerAttack, ExecuteEnemyAttack) |
       |  - DTOs & Results (CombatActionResult, HitResult)      |
       +---------------------------^----------------------------+
                                   |
       +---------------------------+----------------------------+
       |             Infrastructure & Presentation              |
       |  - 3D WebXR World Simulator (Three.js + XR Blocks)     |
       |  - Procedural Audio Engine (Web Audio Synth)           |
       |  - Live Test Runner & Code Inspector Modal             |
       +--------------------------------------------------------+
```

### Princípios de Engenharia Aplicados:
1. **SOLID & Single Responsibility:** O domínio puro não depende de Three.js, WebGL ou bibliotecas de UI. Toda a matemática de combate é determinística e testável.
2. **Imutabilidade em Value Objects:** `DifficultyLevel` e `CombatHitResult` são registros imutáveis (`sealed record` e `readonly record struct`), eliminando mutações concorrentes acidentais.
3. **Zero-Allocation Hot Paths:** Fórmulas de mitigação de dano evitam alocação no heap (`struct` em vez de `class`), garantindo 60+ FPS constante em dispositivos XR sem pausas de Garbage Collection.

---

## 2. Especificação Rigorosa dos 4 Níveis de Dificuldade

| Métrica / Regra | Nível 1: Fácil | Nível 2: Médio | Nível 3: Difícil | Nível 4: Hard Master Profissional |
| :--- | :--- | :--- | :--- | :--- |
| **Vida Máx. do Jogador** | 200 HP (2.0x) | 100 HP (1.0x) | 80 HP (0.8x) | **50 HP (0.5x)** |
| **Dano do Jogador** | 1.5x Base | 1.0x Base | 0.9x Base | **0.75x Base** |
| **Dano dos Inimigos** | 0.5x Base | 1.0x Base | 1.75x Base | **2.6x Base (Letal)** |
| **Regen Passiva de Vida** | Sim (+5 HP/s) | Não | Não | **Não** |
| **Taxa de Gasto Estamina** | 0.6x (Muito Leve) | 1.0x (Padrão) | 1.4x (Pesada) | **2.0x (Extrema)** |
| **Janela de Parry Perfeito**| 500 ms (Generosa) | 300 ms (Equilibrada)| 160 ms (Apertada) | **80 ms (Milimétrica)** |
| **Janela de Esquiva (i-frames)**| 650 ms | 400 ms | 250 ms | **150 ms** |
| **Mecânica de Enrage** | Desativada | Desativada | Desativada | **Ativa com Inimigo < 30% HP** |
| **Risco de Permadeath** | Não | Não | Não | **Sim** |

---

## 3. Matriz de Testes Unitários

A suíte de testes unitários foi construída para validar:
- Curva hiperbólica de mitigação de armadura: $Mitigado = Dano \times \frac{100}{100 + Armadura}$.
- Interrupção de ataque e recompensa de estamina em **Perfect Parry**.
- Cadeia de combos (Passo 1 -> 2 -> 3 -> 1).
- Normalização de atributos vitais ao alternar dinamicamente entre dificuldades.
- Transições da máquina de estados do jogador (Idle -> Attacking -> Dodging -> Dead).
