export enum DifficultyTier {
  Facil = 1,
  Medio = 2,
  Dificil = 3,
  HardMasterProfissional = 4,
}

export enum CombatState {
  Idle = 'Idle',
  Moving = 'Moving',
  Attacking = 'Attacking',
  CastingSpell = 'CastingSpell',
  Parrying = 'Parrying',
  Dodging = 'Dodging',
  Stunned = 'Stunned',
  Dead = 'Dead',
}

export enum EnemyType {
  GoblinBatedor = 'Goblin Batedor',
  CavaleiroSombrio = 'Cavaleiro Sombrio',
  GolemAncestral = 'Golem Ancestral',
  AparicaoAstral = 'Aparição Astral',
}

export interface DifficultyConfig {
  tier: DifficultyTier;
  name: string;
  badge: string;
  description: string;
  playerMaxHealthMultiplier: number;
  playerDamageMultiplier: number;
  staminaRecoveryRatePerSecond: number;
  staminaConsumptionRateMultiplier: number;
  autoHealthRegenerationEnabled: boolean;
  enemyMaxHealthMultiplier: number;
  enemyDamageMultiplier: number;
  enemyAggroRadiusMultiplier: number;
  enemyAttackSpeedMultiplier: number;
  perfectParryWindowSeconds: number;
  dodgeInvulnerabilityWindowSeconds: number;
  allowPermadeathThreat: boolean;
}

export interface CombatHitResult {
  finalDamage: number;
  isParried: boolean;
  isCritical: boolean;
  didTargetStumble: boolean;
  description: string;
}
