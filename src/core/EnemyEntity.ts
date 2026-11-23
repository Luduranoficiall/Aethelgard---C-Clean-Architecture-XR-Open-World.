import { CombatCalculations } from './CombatCalculations.ts';
import { DifficultyConfig, EnemyType } from './types.ts';

export class EnemyEntity {
  public id: string;
  public name: string;
  public type: EnemyType;
  public maxHealth: number;
  public currentHealth: number;
  public baseAttackDamage: number;
  public armor: number;
  public aggroRadius: number;
  public attackCooldown: number;
  public cooldownRemaining: number = 0;
  public isEnraged: boolean = false;

  constructor(name: string, type: EnemyType, difficulty: DifficultyConfig) {
    this.id = Math.random().toString(36).substring(2, 9);
    this.name = name;
    this.type = type;

    let baseHp = 50;
    let baseDmg = 15;

    switch (type) {
      case EnemyType.GoblinBatedor:
        baseHp = 45;
        baseDmg = 12;
        break;
      case EnemyType.CavaleiroSombrio:
        baseHp = 80;
        baseDmg = 22;
        break;
      case EnemyType.GolemAncestral:
        baseHp = 150;
        baseDmg = 35;
        break;
      case EnemyType.AparicaoAstral:
        baseHp = 65;
        baseDmg = 18;
        break;
    }

    this.maxHealth = Math.round(baseHp * difficulty.enemyMaxHealthMultiplier);
    this.currentHealth = this.maxHealth;
    this.baseAttackDamage = Math.round(baseDmg * difficulty.enemyDamageMultiplier * 10) / 10;
    this.armor = type === EnemyType.GolemAncestral ? 30 : 10;
    this.aggroRadius = 15 * difficulty.enemyAggroRadiusMultiplier;
    this.attackCooldown = Math.max(0.8, 2.0 / difficulty.enemyAttackSpeedMultiplier);
  }

  public get isAlive(): boolean {
    return this.currentHealth > 0;
  }

  public receiveDamage(incomingDamage: number): number {
    if (!this.isAlive) return 0;
    const netDamage = CombatCalculations.calculateMitigatedDamage(incomingDamage, this.armor);
    this.currentHealth = Math.max(0, this.currentHealth - netDamage);

    if (this.currentHealth > 0 && this.currentHealth / this.maxHealth <= 0.3 && !this.isEnraged) {
      this.isEnraged = true;
      this.baseAttackDamage = Math.round(this.baseAttackDamage * 1.35 * 10) / 10;
      this.attackCooldown *= 0.75;
    }

    return netDamage;
  }

  public canAttack(): boolean {
    return this.isAlive && this.cooldownRemaining <= 0;
  }

  public executeAttack(): number {
    if (!this.canAttack()) return 0;
    this.cooldownRemaining = this.attackCooldown;
    return this.baseAttackDamage;
  }

  public updateFrame(dt: number): void {
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
    }
  }
}
