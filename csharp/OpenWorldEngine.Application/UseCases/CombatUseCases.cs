// ==============================================================================
// AETHELGARD - PURE C# CLEAN ARCHITECTURE GAME ENGINE
// Application Layer: Use Cases & Orchestration
// ==============================================================================

using System;
using Aethelgard.Core.Domain.Entities;
using Aethelgard.Core.Domain.Enums;
using Aethelgard.Core.Domain.ValueObjects;

namespace Aethelgard.Core.Application.UseCases;

public sealed class ExecutePlayerAttackUseCase
{
    public CombatActionResult Execute(PlayerEntity player, EnemyEntity target, bool isCritical = false)
    {
        ArgumentNullException.ThrowIfNull(player);
        ArgumentNullException.ThrowIfNull(target);

        if (!player.IsAlive)
            return new CombatActionResult(false, 0f, "Jogador já está morto.");

        if (!target.IsAlive)
            return new CombatActionResult(false, 0f, "Inimigo já foi derrotado.");

        var hitResult = player.PerformSwordSlash(isCritical);

        if (hitResult.FinalDamage <= 0f)
        {
            return new CombatActionResult(false, 0f, hitResult.Description);
        }

        float damageDealt = target.ReceiveDamage(hitResult.FinalDamage);

        if (!target.IsAlive)
        {
            player.RecordEnemyDefeated();
        }

        return new CombatActionResult(true, damageDealt, $"{hitResult.Description} Dano causado: {damageDealt:F1}");
    }
}

public sealed class ExecuteEnemyAttackUseCase
{
    public CombatActionResult Execute(EnemyEntity enemy, PlayerEntity player)
    {
        ArgumentNullException.ThrowIfNull(enemy);
        ArgumentNullException.ThrowIfNull(player);

        if (!enemy.CanAttack())
            return new CombatActionResult(false, 0f, "Inimigo em tempo de recarga.");

        float attackDamage = enemy.ExecuteAttack();
        float damageTaken = player.ReceiveDamage(attackDamage);

        return new CombatActionResult(
            Success: true,
            Damage: damageTaken,
            Message: damageTaken > 0f ? $"Inimigo golpeou causando {damageTaken:F1} de dano!" : "Golpe do inimigo defendido ou esquivado!"
        );
    }
}

public readonly record struct CombatActionResult(
    bool Success,
    float Damage,
    string Message
);
