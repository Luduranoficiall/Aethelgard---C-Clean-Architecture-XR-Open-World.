import { DifficultyConfig, DifficultyTier } from './types.ts';

export class DifficultyLevel {
  public static readonly Facil: DifficultyConfig = {
    tier: DifficultyTier.Facil,
    name: 'Fácil (Aventureiro)',
    badge: 'FÁCIL',
    description: 'Modo acessível. Vida dobrada (+100%), regeneração passiva de vida, estamina generosa e janela de parry de 500ms.',
    playerMaxHealthMultiplier: 2.0,
    playerDamageMultiplier: 1.5,
    staminaRecoveryRatePerSecond: 35.0,
    staminaConsumptionRateMultiplier: 0.6,
    autoHealthRegenerationEnabled: true,
    enemyMaxHealthMultiplier: 0.7,
    enemyDamageMultiplier: 0.5,
    enemyAggroRadiusMultiplier: 0.75,
    enemyAttackSpeedMultiplier: 0.85,
    perfectParryWindowSeconds: 0.5,
    dodgeInvulnerabilityWindowSeconds: 0.65,
    allowPermadeathThreat: false,
  };

  public static readonly Medio: DifficultyConfig = {
    tier: DifficultyTier.Medio,
    name: 'Médio (Veterano)',
    badge: 'MÉDIO',
    description: 'Experiência equilibrada. Valores canônicos de combate, sem regeneração passiva de vida e janela de parry de 300ms.',
    playerMaxHealthMultiplier: 1.0,
    playerDamageMultiplier: 1.0,
    staminaRecoveryRatePerSecond: 25.0,
    staminaConsumptionRateMultiplier: 1.0,
    autoHealthRegenerationEnabled: false,
    enemyMaxHealthMultiplier: 1.0,
    enemyDamageMultiplier: 1.0,
    enemyAggroRadiusMultiplier: 1.0,
    enemyAttackSpeedMultiplier: 1.0,
    perfectParryWindowSeconds: 0.3,
    dodgeInvulnerabilityWindowSeconds: 0.4,
    allowPermadeathThreat: false,
  };

  public static readonly Dificil: DifficultyConfig = {
    tier: DifficultyTier.Dificil,
    name: 'Difícil (Comandante)',
    badge: 'DIFÍCIL',
    description: 'Desafio rigoroso. Inimigos atacam em bandos coordenados (+75% dano), gasto de estamina aumentado e parry de 160ms.',
    playerMaxHealthMultiplier: 0.8,
    playerDamageMultiplier: 0.9,
    staminaRecoveryRatePerSecond: 18.0,
    staminaConsumptionRateMultiplier: 1.4,
    autoHealthRegenerationEnabled: false,
    enemyMaxHealthMultiplier: 1.4,
    enemyDamageMultiplier: 1.75,
    enemyAggroRadiusMultiplier: 1.4,
    enemyAttackSpeedMultiplier: 1.25,
    perfectParryWindowSeconds: 0.16,
    dodgeInvulnerabilityWindowSeconds: 0.25,
    allowPermadeathThreat: false,
  };

  public static readonly HardMasterProfissional: DifficultyConfig = {
    tier: DifficultyTier.HardMasterProfissional,
    name: 'Hard Master Profissional',
    badge: 'HARD MASTER',
    description: 'Nível Engenharia Extrema. Vida reduzida pela metade (50 HP), dano inimigo x2.6, janela de parry milimétrica de 80ms e perigo letal.',
    playerMaxHealthMultiplier: 0.5,
    playerDamageMultiplier: 0.75,
    staminaRecoveryRatePerSecond: 12.0,
    staminaConsumptionRateMultiplier: 2.0,
    autoHealthRegenerationEnabled: false,
    enemyMaxHealthMultiplier: 2.2,
    enemyDamageMultiplier: 2.6,
    enemyAggroRadiusMultiplier: 2.0,
    enemyAttackSpeedMultiplier: 1.5,
    perfectParryWindowSeconds: 0.08,
    dodgeInvulnerabilityWindowSeconds: 0.15,
    allowPermadeathThreat: true,
  };

  public static fromTier(tier: DifficultyTier): DifficultyConfig {
    switch (tier) {
      case DifficultyTier.Facil:
        return DifficultyLevel.Facil;
      case DifficultyTier.Medio:
        return DifficultyLevel.Medio;
      case DifficultyTier.Dificil:
        return DifficultyLevel.Dificil;
      case DifficultyTier.HardMasterProfissional:
        return DifficultyLevel.HardMasterProfissional;
      default:
        return DifficultyLevel.Medio;
    }
  }

  public static getAll(): DifficultyConfig[] {
    return [
      DifficultyLevel.Facil,
      DifficultyLevel.Medio,
      DifficultyLevel.Dificil,
      DifficultyLevel.HardMasterProfissional,
    ];
  }
}
