// ==============================================================================
// AETHELGARD - PURE C# CLEAN ARCHITECTURE GAME ENGINE
// Entity: EnemyEntity
// ==============================================================================

using System;
using Aethelgard.Core.Domain.Enums;
using Aethelgard.Core.Domain.ValueObjects;

namespace Aethelgard.Core.Domain.Entities;

public enum EnemyType
{
    GoblinBatedor,
    CavaleiroSombrio,
    GolemAncestral,
    AparicaoAstral
}

public sealed class EnemyEntity
{
    public Guid Id { get; }
    public string Name { get; private set; }
    public EnemyType Type { get; }
    public float MaxHealth { get; private set; }
    public float CurrentHealth { get; private set; }
    public float BaseAttackDamage { get; private set; }
    public float Armor { get; private set; }
    public float AggroRadius { get; private set; }
    public float AttackCooldownSeconds { get; private set; }
    public float CooldownRemaining { get; private set; }
    public bool IsEnraged { get; private set; }

    public bool IsAlive => CurrentHealth > 0f;

    public EnemyEntity(string name, EnemyType type, DifficultyLevel difficulty)
    {
        Id = Guid.NewGuid();
        Name = name;
        Type = type;

        float baseHp = type switch
        {
            EnemyType.GoblinBatedor => 45f,
            EnemyType.CavaleiroSombrio => 80f,
            EnemyType.GolemAncestral => 150f,
            EnemyType.AparicaoAstral => 65f,
            _ => 50f
        };

        float baseDmg = type switch
        {
            EnemyType.GoblinBatedor => 12f,
            EnemyType.CavaleiroSombrio => 22f,
            EnemyType.GolemAncestral => 35f,
            EnemyType.AparicaoAstral => 18f,
            _ => 15f
        };

        MaxHealth = MathF.Round(baseHp * difficulty.EnemyMaxHealthMultiplier, 1);
        CurrentHealth = MaxHealth;
        BaseAttackDamage = MathF.Round(baseDmg * difficulty.EnemyDamageMultiplier, 1);
        Armor = type == EnemyType.GolemAncestral ? 30f : 10f;
        AggroRadius = 15f * difficulty.EnemyAggroRadiusMultiplier;
        AttackCooldownSeconds = MathF.Max(0.8f, 2.0f / difficulty.EnemyAttackSpeedMultiplier);
        CooldownRemaining = 0f;
        IsEnraged = false;
    }

    public float ReceiveDamage(float incomingDamage)
    {
        if (!IsAlive) return 0f;

        float netDamage = CombatCalculations.CalculateMitigatedDamage(incomingDamage, Armor);
        CurrentHealth = MathF.Max(0f, CurrentHealth - netDamage);

        // Se estiver abaixo de 30% em Hard Master, entra em estado Enrage (Fúria)
        if (CurrentHealth > 0f && (CurrentHealth / MaxHealth) <= 0.3f && !IsEnraged)
        {
            IsEnraged = true;
            BaseAttackDamage *= 1.35f;
            AttackCooldownSeconds *= 0.75f;
        }

        return netDamage;
    }

    public bool CanAttack() => IsAlive && CooldownRemaining <= 0f;

    public float ExecuteAttack()
    {
        if (!CanAttack()) return 0f;
        CooldownRemaining = AttackCooldownSeconds;
        return BaseAttackDamage;
    }

    public void UpdateFrame(float dt)
    {
        if (CooldownRemaining > 0f)
        {
            CooldownRemaining = MathF.Max(0f, CooldownRemaining - dt);
        }
    }
}
