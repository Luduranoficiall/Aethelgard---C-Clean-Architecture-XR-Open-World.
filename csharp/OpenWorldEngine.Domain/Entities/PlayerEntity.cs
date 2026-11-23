// ==============================================================================
// AETHELGARD - PURE C# CLEAN ARCHITECTURE GAME ENGINE
// Entity: PlayerEntity (Aggregate Root)
// Enforces Domain Invariants, State Transitions and Difficulty Modifiers
// ==============================================================================

using System;
using Aethelgard.Core.Domain.Enums;
using Aethelgard.Core.Domain.ValueObjects;

namespace Aethelgard.Core.Domain.Entities;

public sealed class PlayerEntity
{
    public Guid Id { get; }
    public string Name { get; private set; }
    public DifficultyLevel CurrentDifficulty { get; private set; }

    // Atributos Vitais
    public float MaxHealth { get; private set; }
    public float CurrentHealth { get; private set; }
    public float MaxStamina { get; private set; }
    public float CurrentStamina { get; private set; }
    public float MaxMana { get; private set; }
    public float CurrentMana { get; private set; }
    public float ArmorRating { get; private set; }
    public float BaseWeaponAttack { get; private set; }

    // Estados e Temporizadores
    public CombatState State { get; private set; }
    public int CurrentComboStep { get; private set; }
    public float ParryWindowRemaining { get; private set; }
    public float DodgeInvulnerabilityRemaining { get; private set; }
    public int Level { get; private set; }
    public int ExperiencePoints { get; private set; }
    public int PortalsTraversedCount { get; private set; }
    public int EnemiesDefeatedCount { get; private set; }

    public bool IsAlive => CurrentHealth > 0f;

    public PlayerEntity(string name, DifficultyLevel difficulty)
    {
        Id = Guid.NewGuid();
        Name = string.IsNullOrWhiteSpace(name) ? "Herói de Aethelgard" : name.Trim();
        Level = 1;
        ExperiencePoints = 0;
        PortalsTraversedCount = 0;
        EnemiesDefeatedCount = 0;
        State = CombatState.Idle;
        CurrentComboStep = 0;

        ApplyDifficulty(difficulty);
    }

    /// <summary>
    /// Aplica o nível de dificuldade recalculando limites e normalizando pontos vitais.
    /// </summary>
    public void ApplyDifficulty(DifficultyLevel difficulty)
    {
        CurrentDifficulty = difficulty ?? throw new ArgumentNullException(nameof(difficulty));

        const float BaseRawHealth = 100f;
        const float BaseRawStamina = 100f;
        const float BaseRawMana = 100f;

        MaxHealth = MathF.Round(BaseRawHealth * difficulty.PlayerMaxHealthMultiplier, 1);
        MaxStamina = BaseRawStamina;
        MaxMana = BaseRawMana;

        ArmorRating = 20f;
        BaseWeaponAttack = 25f;

        CurrentHealth = MaxHealth;
        CurrentStamina = MaxStamina;
        CurrentMana = MaxMana;
    }

    /// <summary>
    /// Executa um golpe de espada consumindo estamina e avançando o combo (1 -> 2 -> 3).
    /// </summary>
    public CombatHitResult PerformSwordSlash(bool isCritical = false)
    {
        if (!IsAlive) throw new InvalidOperationException("Personagem derrotado não pode atacar.");

        float staminaCost = 15f * CurrentDifficulty.StaminaConsumptionRateMultiplier;
        if (CurrentStamina < staminaCost)
        {
            // Em Hard Master, tentar atacar sem estamina causa desequilíbrio (Stumble)
            if (CurrentDifficulty.Tier == DifficultyTier.HardMasterProfissional)
            {
                State = CombatState.Stunned;
            }
            return new CombatHitResult(0f, false, false, true, "Estamina esgotada para desferir o golpe!");
        }

        CurrentStamina -= staminaCost;
        CurrentComboStep = (CurrentComboStep % 3) + 1;
        State = CombatState.Attacking;

        return CombatCalculations.ResolveAttack(
            baseWeaponDamage: BaseWeaponAttack,
            attackerDamageMultiplier: CurrentDifficulty.PlayerDamageMultiplier,
            comboStep: CurrentComboStep,
            isCritical: isCritical,
            targetArmor: 10f,
            isTargetParrying: false,
            targetParryWindowRemaining: 0f
        );
    }

    /// <summary>
    /// Dispara magia arcana em área (Burst), consumindo mana.
    /// </summary>
    public float CastArcaneBurst()
    {
        if (!IsAlive) throw new InvalidOperationException("Personagem derrotado não pode conjurar magias.");

        const float ManaCost = 35f;
        if (CurrentMana < ManaCost) return 0f;

        CurrentMana -= ManaCost;
        State = CombatState.CastingSpell;

        return 50f * CurrentDifficulty.PlayerDamageMultiplier;
    }

    /// <summary>
    /// Inicia manobra defensiva de Parry de alta precisão.
    /// </summary>
    public void StartParry()
    {
        if (!IsAlive || CurrentStamina < 10f) return;

        CurrentStamina -= 10f * CurrentDifficulty.StaminaConsumptionRateMultiplier;
        ParryWindowRemaining = CurrentDifficulty.PerfectParryWindowSeconds;
        State = CombatState.Parrying;
    }

    /// <summary>
    /// Executa esquiva tática (Dodge Roll).
    /// </summary>
    public void ExecuteDodge()
    {
        if (!IsAlive || CurrentStamina < 20f) return;

        CurrentStamina -= 20f * CurrentDifficulty.StaminaConsumptionRateMultiplier;
        DodgeInvulnerabilityRemaining = CurrentDifficulty.DodgeInvulnerabilityWindowSeconds;
        State = CombatState.Dodging;
    }

    /// <summary>
    /// Recebe dano com tratamento de invulnerabilidade e parry.
    /// </summary>
    public float ReceiveDamage(float incomingDamage)
    {
        if (!IsAlive || incomingDamage <= 0f) return 0f;

        // Se esquivando dentro da janela de invulnerabilidade
        if (State == CombatState.Dodging && DodgeInvulnerabilityRemaining > 0f)
        {
            return 0f;
        }

        // Se em parry ativo
        if (State == CombatState.Parrying && ParryWindowRemaining > 0f)
        {
            // Parry perfeito: regenera 15 de estamina como recompensa técnica
            CurrentStamina = MathF.Min(MaxStamina, CurrentStamina + 15f);
            return 0f;
        }

        float netDamage = CombatCalculations.CalculateMitigatedDamage(incomingDamage, ArmorRating);
        CurrentHealth = MathF.Max(0f, CurrentHealth - netDamage);

        if (CurrentHealth <= 0f)
        {
            State = CombatState.Dead;
        }

        return netDamage;
    }

    /// <summary>
    /// Atualização de quadro (Delta Time em segundos) para regeneração e temporizadores.
    /// </summary>
    public void UpdateFrame(float deltaTimeSeconds)
    {
        if (!IsAlive || deltaTimeSeconds <= 0f) return;

        // Atualização dos temporizadores de precisão
        if (ParryWindowRemaining > 0f)
        {
            ParryWindowRemaining = MathF.Max(0f, ParryWindowRemaining - deltaTimeSeconds);
            if (ParryWindowRemaining <= 0f && State == CombatState.Parrying)
            {
                State = CombatState.Idle;
            }
        }

        if (DodgeInvulnerabilityRemaining > 0f)
        {
            DodgeInvulnerabilityRemaining = MathF.Max(0f, DodgeInvulnerabilityRemaining - deltaTimeSeconds);
            if (DodgeInvulnerabilityRemaining <= 0f && State == CombatState.Dodging)
            {
                State = CombatState.Idle;
            }
        }

        // Regeneração de Estamina
        CurrentStamina = MathF.Min(
            MaxStamina,
            CurrentStamina + (CurrentDifficulty.StaminaRecoveryRatePerSecond * deltaTimeSeconds)
        );

        // Regeneração de Mana
        CurrentMana = MathF.Min(MaxMana, CurrentMana + (10f * deltaTimeSeconds));

        // Regeneração passiva de Vida (Apenas ativada no nível Fácil)
        if (CurrentDifficulty.AutoHealthRegenerationEnabled && CurrentHealth < MaxHealth)
        {
            CurrentHealth = MathF.Min(MaxHealth, CurrentHealth + (5f * deltaTimeSeconds));
        }
    }

    public void RecordPortalTraversal() => PortalsTraversedCount++;
    public void RecordEnemyDefeated(int exp = 50)
    {
        EnemiesDefeatedCount++;
        ExperiencePoints += exp;
        if (ExperiencePoints >= Level * 100)
        {
            Level++;
            BaseWeaponAttack += 4f;
            CurrentHealth = MaxHealth;
        }
    }
}
