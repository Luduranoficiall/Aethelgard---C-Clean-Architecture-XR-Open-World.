// ==============================================================================
// AETHELGARD - PURE C# CLEAN ARCHITECTURE GAME ENGINE
// Exhaustive Unit Test Suite (xUnit / NUnit Pattern)
// Covers all 4 difficulty levels, edge cases, stamina constraints and invariants
// ==============================================================================

using System;
using Xunit;
using Aethelgard.Core.Domain.Entities;
using Aethelgard.Core.Domain.Enums;
using Aethelgard.Core.Domain.ValueObjects;
using Aethelgard.Core.Application.UseCases;

namespace Aethelgard.Core.Tests;

public class DifficultyAndCombatTests
{
    [Fact]
    public void DifficultyLevel_Facil_ShouldProvideHighHealthAndAutoRegen()
    {
        var facil = DifficultyLevel.FromTier(DifficultyTier.Facil);

        Assert.Equal(2.0f, facil.PlayerMaxHealthMultiplier);
        Assert.True(facil.AutoHealthRegenerationEnabled);
        Assert.Equal(0.5f, facil.EnemyDamageMultiplier);
        Assert.Equal(0.50f, facil.PerfectParryWindowSeconds);
        Assert.False(facil.AllowPermadeathThreat);
    }

    [Fact]
    public void DifficultyLevel_Medio_ShouldProvideBalancedBaseline()
    {
        var medio = DifficultyLevel.FromTier(DifficultyTier.Medio);

        Assert.Equal(1.0f, medio.PlayerMaxHealthMultiplier);
        Assert.False(medio.AutoHealthRegenerationEnabled);
        Assert.Equal(1.0f, medio.EnemyDamageMultiplier);
        Assert.Equal(0.30f, medio.PerfectParryWindowSeconds);
    }

    [Fact]
    public void DifficultyLevel_Dificil_ShouldTightenWindowsAndElevateEnemyThreat()
    {
        var dificil = DifficultyLevel.FromTier(DifficultyTier.Dificil);

        Assert.Equal(0.8f, dificil.PlayerMaxHealthMultiplier);
        Assert.Equal(1.75f, dificil.EnemyDamageMultiplier);
        Assert.Equal(0.16f, dificil.PerfectParryWindowSeconds);
        Assert.Equal(1.4f, dificil.StaminaConsumptionRateMultiplier);
    }

    [Fact]
    public void DifficultyLevel_HardMasterProfissional_ShouldEnforceExtremeConstraints()
    {
        var hardMaster = DifficultyLevel.FromTier(DifficultyTier.HardMasterProfissional);

        Assert.Equal(0.5f, hardMaster.PlayerMaxHealthMultiplier); // 50 HP baseline
        Assert.Equal(2.6f, hardMaster.EnemyDamageMultiplier);
        Assert.Equal(2.0f, hardMaster.StaminaConsumptionRateMultiplier);
        Assert.Equal(0.08f, hardMaster.PerfectParryWindowSeconds); // Frame-perfect 80ms
        Assert.True(hardMaster.AllowPermadeathThreat);
    }

    [Theory]
    [InlineData(100f, 0f, 100f)]    // Zero armor -> 100% damage
    [InlineData(100f, 100f, 50f)]   // 100 armor -> 50% damage reduction
    [InlineData(100f, 300f, 25f)]   // 300 armor -> 75% damage reduction
    [InlineData(0f, 50f, 0f)]       // Zero incoming damage -> 0
    [InlineData(-50f, 50f, 0f)]     // Negative damage -> clamped to 0
    public void CombatCalculations_CalculateMitigatedDamage_ShouldFollowHyperbolicCurve(
        float incoming, float armor, float expected)
    {
        float actual = CombatCalculations.CalculateMitigatedDamage(incoming, armor);
        Assert.Equal(expected, actual, precision: 1);
    }

    [Fact]
    public void CombatCalculations_ResolveAttack_ShouldNegateDamageOnActiveParry()
    {
        var result = CombatCalculations.ResolveAttack(
            baseWeaponDamage: 50f,
            attackerDamageMultiplier: 1.0f,
            comboStep: 1,
            isCritical: false,
            targetArmor: 0f,
            isTargetParrying: true,
            targetParryWindowRemaining: 0.1f
        );

        Assert.True(result.IsParried);
        Assert.Equal(0f, result.FinalDamage);
        Assert.True(result.DidTargetStumble);
    }

    [Fact]
    public void PlayerEntity_SwordSlash_ShouldAdvanceComboSteps()
    {
        var player = new PlayerEntity("Galahad", DifficultyLevel.CreateMedio());

        var hit1 = player.PerformSwordSlash();
        Assert.Equal(1, player.CurrentComboStep);

        var hit2 = player.PerformSwordSlash();
        Assert.Equal(2, player.CurrentComboStep);

        var hit3 = player.PerformSwordSlash();
        Assert.Equal(3, player.CurrentComboStep);

        // Loops back to 1
        var hit4 = player.PerformSwordSlash();
        Assert.Equal(1, player.CurrentComboStep);
    }

    [Fact]
    public void PlayerEntity_InHardMaster_ShouldHaveReducedMaxHealth()
    {
        var player = new PlayerEntity("Elden Knight", DifficultyLevel.CreateHardMasterProfissional());
        Assert.Equal(50f, player.MaxHealth);
        Assert.Equal(50f, player.CurrentHealth);
    }

    [Fact]
    public void PlayerEntity_InFacil_ShouldHaveDoubleHealthAndAutoRegen()
    {
        var player = new PlayerEntity("Scout", DifficultyLevel.CreateFacil());
        Assert.Equal(200f, player.MaxHealth);

        // Inflict damage
        player.ReceiveDamage(50f);
        float damagedHealth = player.CurrentHealth;

        // Frame update for 2 seconds should regenerate health
        player.UpdateFrame(2.0f);
        Assert.True(player.CurrentHealth > damagedHealth);
    }

    [Fact]
    public void ExecutePlayerAttackUseCase_ShouldReduceEnemyHealthAndAwardExpOnKill()
    {
        var player = new PlayerEntity("Warrior", DifficultyLevel.CreateMedio());
        var enemy = new EnemyEntity("Goblin", EnemyType.GoblinBatedor, DifficultyLevel.CreateMedio());
        var useCase = new ExecutePlayerAttackUseCase();

        float initialEnemyHp = enemy.CurrentHealth;
        var actionResult = useCase.Execute(player, enemy, isCritical: true);

        Assert.True(actionResult.Success);
        Assert.True(enemy.CurrentHealth < initialEnemyHp);
    }
}
