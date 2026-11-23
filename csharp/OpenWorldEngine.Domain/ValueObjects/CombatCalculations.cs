// ==============================================================================
// AETHELGARD - PURE C# CLEAN ARCHITECTURE GAME ENGINE
// Value Object & Pure Domain Logic: CombatCalculations
// Zero Allocation, High Performance, Deterministic Calculations
// ==============================================================================

using System;

namespace Aethelgard.Core.Domain.ValueObjects;

/// <summary>
/// Estrutura estática de cálculos puramente matemáticos de combate.
/// Livre de efeitos colaterais, determinística e facilmente testável.
/// </summary>
public static class CombatCalculations
{
    /// <summary>
    /// Fórmula de atenuação de dano baseada em Armadura (Mitigação assintótica hiperbólica padrão de RPG).
    /// DanoRecebido = DanoBase * (100 / (100 + Armadura))
    /// </summary>
    public static float CalculateMitigatedDamage(float incomingDamage, float targetArmor)
    {
        if (incomingDamage <= 0) return 0f;
        if (targetArmor < 0) targetArmor = 0f;

        float mitigationFactor = 100.0f / (100.0f + targetArmor);
        return MathF.Round(incomingDamage * mitigationFactor, 2);
    }

    /// <summary>
    /// Cálculo de dano de ataque considerando multiplicadores de dificuldade, crítico e combo.
    /// </summary>
    public static CombatHitResult ResolveAttack(
        float baseWeaponDamage,
        float attackerDamageMultiplier,
        int comboStep,
        bool isCritical,
        float targetArmor,
        bool isTargetParrying,
        float targetParryWindowRemaining)
    {
        if (baseWeaponDamage <= 0)
        {
            return new CombatHitResult(
                FinalDamage: 0f,
                IsParried: false,
                IsCritical: false,
                DidTargetStumble: false,
                Description: "Ataque sem dano base."
            );
        }

        // Se o alvo estiver em janela ativa de Perfect Parry
        if (isTargetParrying && targetParryWindowRemaining > 0f)
        {
            return new CombatHitResult(
                FinalDamage: 0f,
                IsParried: true,
                IsCritical: false,
                DidTargetStumble: true,
                Description: "Ataque repelido perfeitamente por Parry!"
            );
        }

        // Bônus de Combo (Passo 1: 1.0x, Passo 2: 1.25x, Passo 3: 1.6x)
        float comboMultiplier = comboStep switch
        {
            1 => 1.0f,
            2 => 1.25f,
            3 => 1.60f,
            _ => 1.0f
        };

        float critMultiplier = isCritical ? 2.0f : 1.0f;
        float rawDamage = baseWeaponDamage * attackerDamageMultiplier * comboMultiplier * critMultiplier;
        float finalDamage = CalculateMitigatedDamage(rawDamage, targetArmor);

        return new CombatHitResult(
            FinalDamage: MathF.Max(1.0f, finalDamage),
            IsParried: false,
            IsCritical: isCritical,
            DidTargetStumble: isCritical || comboStep == 3,
            Description: isCritical ? "Golpe Crítico Devastador!" : "Acerto Limpo."
        );
    }
}

/// <summary>
/// Resultado imutável do cálculo de um golpe de combate.
/// </summary>
public readonly record struct CombatHitResult(
    float FinalDamage,
    bool IsParried,
    bool IsCritical,
    bool DidTargetStumble,
    string Description
);
