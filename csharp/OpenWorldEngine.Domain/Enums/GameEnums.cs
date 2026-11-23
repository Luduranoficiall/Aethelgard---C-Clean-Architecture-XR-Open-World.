// ==============================================================================
// AETHELGARD - PURE C# CLEAN ARCHITECTURE GAME ENGINE
// Senior Staff / Principal Game Engine Architecture
// Domain Layer: Core Entities, Value Objects, Domain Events & Invariants
// ==============================================================================

namespace Aethelgard.Core.Domain.Enums;

/// <summary>
/// Níveis de dificuldade do jogo, desenhados para balanceamento estrito e progressão.
/// </summary>
public enum DifficultyTier
{
    /// <summary>
    /// Modo acessível para exploração narrativa e aprendizado dos controles.
    /// </summary>
    Facil = 1,

    /// <summary>
    /// Experiência clássica e equilibrada com mecânicas completas ativas.
    /// </summary>
    Medio = 2,

    /// <summary>
    /// Desafio tático rigoroso com penalidades de estamina e IA ofensiva.
    /// </summary>
    Dificil = 3,

    /// <summary>
    /// Nível de engenharia extrema: agressão coordenada, janelas de parry milimétricas (80ms),
    /// alto dano e teste de perícia absoluta.
    /// </summary>
    HardMasterProfissional = 4
}

/// <summary>
/// Estado da máquina de combate do jogador e entidades hostis.
/// </summary>
public enum CombatState
{
    Idle,
    Moving,
    Attacking,
    CastingSpell,
    Parrying,
    Dodging,
    Stunned,
    Dead
}
