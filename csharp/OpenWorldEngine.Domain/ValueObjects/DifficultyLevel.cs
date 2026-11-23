// ==============================================================================
// AETHELGARD - PURE C# CLEAN ARCHITECTURE GAME ENGINE
// Value Object: DifficultyLevel Specification & Mathematical Modifiers
// ==============================================================================

using System;
using Aethelgard.Core.Domain.Enums;

namespace Aethelgard.Core.Domain.ValueObjects;

/// <summary>
/// Value Object imutável que encapsula todas as regras matemáticas e modificadores
/// para os quatro níveis de dificuldade exigidos pelo projeto:
/// Fácil, Médio, Difícil e Hard Master Profissional.
/// </summary>
public sealed record DifficultyLevel
{
    public DifficultyTier Tier { get; }
    public string Name { get; }
    public string Description { get; }
    
    // Multiplicadores do Jogador
    public float PlayerMaxHealthMultiplier { get; }
    public float PlayerDamageMultiplier { get; }
    public float StaminaRecoveryRatePerSecond { get; }
    public float StaminaConsumptionRateMultiplier { get; }
    public bool AutoHealthRegenerationEnabled { get; }
    
    // Multiplicadores de Inimigo / Mundo
    public float EnemyMaxHealthMultiplier { get; }
    public float EnemyDamageMultiplier { get; }
    public float EnemyAggroRadiusMultiplier { get; }
    public float EnemyAttackSpeedMultiplier { get; }
    
    // Janelas de combate de precisão (em segundos)
    public float PerfectParryWindowSeconds { get; }
    public float DodgeInvulnerabilityWindowSeconds { get; }
    public bool AllowPermadeathThreat { get; }

    private DifficultyLevel(
        DifficultyTier tier,
        string name,
        string description,
        float playerMaxHealthMultiplier,
        float playerDamageMultiplier,
        float staminaRecoveryRatePerSecond,
        float staminaConsumptionRateMultiplier,
        bool autoHealthRegenerationEnabled,
        float enemyMaxHealthMultiplier,
        float enemyDamageMultiplier,
        float enemyAggroRadiusMultiplier,
        float enemyAttackSpeedMultiplier,
        float perfectParryWindowSeconds,
        float dodgeInvulnerabilityWindowSeconds,
        bool allowPermadeathThreat)
    {
        Tier = tier;
        Name = name;
        Description = description;
        PlayerMaxHealthMultiplier = playerMaxHealthMultiplier;
        PlayerDamageMultiplier = playerDamageMultiplier;
        StaminaRecoveryRatePerSecond = staminaRecoveryRatePerSecond;
        StaminaConsumptionRateMultiplier = staminaConsumptionRateMultiplier;
        AutoHealthRegenerationEnabled = autoHealthRegenerationEnabled;
        EnemyMaxHealthMultiplier = enemyMaxHealthMultiplier;
        EnemyDamageMultiplier = enemyDamageMultiplier;
        EnemyAggroRadiusMultiplier = enemyAggroRadiusMultiplier;
        EnemyAttackSpeedMultiplier = enemyAttackSpeedMultiplier;
        PerfectParryWindowSeconds = perfectParryWindowSeconds;
        DodgeInvulnerabilityWindowSeconds = dodgeInvulnerabilityWindowSeconds;
        AllowPermadeathThreat = allowPermadeathThreat;
    }

    /// <summary>
    /// Factory Method: Cria a especificação completa para o nível Fácil.
    /// </summary>
    public static DifficultyLevel CreateFacil() => new(
        tier: DifficultyTier.Facil,
        name: "Fácil (Aventureiro Iniciante)",
        description: "Foco na exploração e história. Recuperação passiva de vida, estamina generosa e janelas de esquiva amplas.",
        playerMaxHealthMultiplier: 2.0f,
        playerDamageMultiplier: 1.5f,
        staminaRecoveryRatePerSecond: 35.0f,
        staminaConsumptionRateMultiplier: 0.6f,
        autoHealthRegenerationEnabled: true,
        enemyMaxHealthMultiplier: 0.7f,
        enemyDamageMultiplier: 0.5f,
        enemyAggroRadiusMultiplier: 0.75f,
        enemyAttackSpeedMultiplier: 0.85f,
        perfectParryWindowSeconds: 0.50f,
        dodgeInvulnerabilityWindowSeconds: 0.65f,
        allowPermadeathThreat: false
    );

    /// <summary>
    /// Factory Method: Cria a especificação completa para o nível Médio.
    /// </summary>
    public static DifficultyLevel CreateMedio() => new(
        tier: DifficultyTier.Medio,
        name: "Médio (Guerreiro Veterano)",
        description: "Experiência padrão calculada. Equilíbrio de dano, consumo consciente de recursos e IA ativa.",
        playerMaxHealthMultiplier: 1.0f,
        playerDamageMultiplier: 1.0f,
        staminaRecoveryRatePerSecond: 25.0f,
        staminaConsumptionRateMultiplier: 1.0f,
        autoHealthRegenerationEnabled: false,
        enemyMaxHealthMultiplier: 1.0f,
        enemyDamageMultiplier: 1.0f,
        enemyAggroRadiusMultiplier: 1.0f,
        enemyAttackSpeedMultiplier: 1.0f,
        perfectParryWindowSeconds: 0.30f,
        dodgeInvulnerabilityWindowSeconds: 0.40f,
        allowPermadeathThreat: false
    );

    /// <summary>
    /// Factory Method: Cria a especificação completa para o nível Difícil.
    /// </summary>
    public static DifficultyLevel CreateDificil() => new(
        tier: DifficultyTier.Dificil,
        name: "Difícil (Comandante de Elite)",
        description: "Combate tático implacável. Inimigos atacam em bandos, punição severa a erros de posicionamento.",
        playerMaxHealthMultiplier: 0.8f,
        playerDamageMultiplier: 0.9f,
        staminaRecoveryRatePerSecond: 18.0f,
        staminaConsumptionRateMultiplier: 1.4f,
        autoHealthRegenerationEnabled: false,
        enemyMaxHealthMultiplier: 1.4f,
        enemyDamageMultiplier: 1.75f,
        enemyAggroRadiusMultiplier: 1.4f,
        enemyAttackSpeedMultiplier: 1.25f,
        perfectParryWindowSeconds: 0.16f,
        dodgeInvulnerabilityWindowSeconds: 0.25f,
        allowPermadeathThreat: false
    );

    /// <summary>
    /// Factory Method: Cria a especificação completa para o nível Hard Master Profissional.
    /// </summary>
    public static DifficultyLevel CreateHardMasterProfissional() => new(
        tier: DifficultyTier.HardMasterProfissional,
        name: "Hard Master Profissional (Engenharia Extrema)",
        description: "Apenas para mestres. Inimigos letais, estamina restrita, parry de 80ms, perigo de morte permanente.",
        playerMaxHealthMultiplier: 0.5f,
        playerDamageMultiplier: 0.75f,
        staminaRecoveryRatePerSecond: 12.0f,
        staminaConsumptionRateMultiplier: 2.0f,
        autoHealthRegenerationEnabled: false,
        enemyMaxHealthMultiplier: 2.2f,
        enemyDamageMultiplier: 2.6f,
        enemyAggroRadiusMultiplier: 2.0f,
        enemyAttackSpeedMultiplier: 1.5f,
        perfectParryWindowSeconds: 0.08f,
        dodgeInvulnerabilityWindowSeconds: 0.15f,
        allowPermadeathThreat: true
    );

    /// <summary>
    /// Obtenção via enum com validação total.
    /// </summary>
    public static DifficultyLevel FromTier(DifficultyTier tier) => tier switch
    {
        DifficultyTier.Facil => CreateFacil(),
        DifficultyTier.Medio => CreateMedio(),
        DifficultyTier.Dificil => CreateDificil(),
        DifficultyTier.HardMasterProfissional => CreateHardMasterProfissional(),
        _ => throw new ArgumentOutOfRangeException(nameof(tier), tier, "Nível de dificuldade não mapeado.")
    };
}
