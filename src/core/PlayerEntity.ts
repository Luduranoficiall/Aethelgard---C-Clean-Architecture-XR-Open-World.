import { CombatCalculations } from './CombatCalculations.ts';
import { DifficultyLevel } from './DifficultyLevel.ts';
import { CombatHitResult, CombatState, DifficultyConfig } from './types.ts';

export class PlayerEntity {
  public name: string;
  public difficulty: DifficultyConfig;

  // Atributos Vitais
  public maxHealth: number = 100;
  public currentHealth: number = 100;
  public maxStamina: number = 100;
  public currentStamina: number = 100;
  public maxMana: number = 100;
  public currentMana: number = 100;
  public armor: number = 20;
  public baseAttack: number = 25;

  // Estados
  public state: CombatState = CombatState.Idle;
  public comboStep: number = 0;
  public parryWindowRemaining: number = 0;
  public dodgeInvulnerabilityRemaining: number = 0;
  public level: number = 1;
  public experience: number = 0;
  public portalsVisited: number = 0;
  public enemiesDefeated: number = 0;
  public combosExecuted: number = 0;
  public parriesPerformed: number = 0;
  public survivalSeconds: number = 0;

  constructor(name: string = 'Herói de Aethelgard', difficulty: DifficultyConfig = DifficultyLevel.Medio) {
    this.name = name;
    this.difficulty = difficulty;
    this.applyDifficulty(difficulty);
  }

  public get isAlive(): boolean {
    return this.currentHealth > 0;
  }

  public applyDifficulty(difficulty: DifficultyConfig): void {
    this.difficulty = difficulty;
    const baseHealth = 100;
    this.maxHealth = Math.round(baseHealth * difficulty.playerMaxHealthMultiplier);
    this.currentHealth = this.maxHealth;
    this.maxStamina = 100;
    this.currentStamina = this.maxStamina;
    this.maxMana = 100;
    this.currentMana = this.maxMana;
    this.armor = 20;
    this.baseAttack = 25;
    this.state = CombatState.Idle;
    this.comboStep = 0;
  }

  public performSwordSlash(isCritical: boolean = false): CombatHitResult {
    if (!this.isAlive) {
      return {
        finalDamage: 0,
        isParried: false,
        isCritical: false,
        didTargetStumble: false,
        description: 'Jogador derrotado.',
      };
    }

    const staminaCost = 15 * this.difficulty.staminaConsumptionRateMultiplier;
    if (this.currentStamina < staminaCost) {
      if (this.difficulty.tier === 4) {
        this.state = CombatState.Stunned;
      }
      return {
        finalDamage: 0,
        isParried: false,
        isCritical: false,
        didTargetStumble: true,
        description: 'Estamina esgotada para golpear!',
      };
    }

    this.currentStamina -= staminaCost;
    this.comboStep = (this.comboStep % 3) + 1;
    this.combosExecuted++;
    this.state = CombatState.Attacking;

    return CombatCalculations.resolveAttack(
      this.baseAttack,
      this.difficulty.playerDamageMultiplier,
      this.comboStep,
      isCritical,
      10, // Armadura padrão de alvo
      false,
      0,
    );
  }

  public castArcaneBurst(): number {
    if (!this.isAlive) return 0;
    const manaCost = 35;
    if (this.currentMana < manaCost) return 0;

    this.currentMana -= manaCost;
    this.state = CombatState.CastingSpell;
    return 55 * this.difficulty.playerDamageMultiplier;
  }

  public startParry(): boolean {
    if (!this.isAlive || this.currentStamina < 10) return false;
    this.currentStamina -= 10 * this.difficulty.staminaConsumptionRateMultiplier;
    this.parryWindowRemaining = this.difficulty.perfectParryWindowSeconds;
    this.state = CombatState.Parrying;
    return true;
  }

  public executeDodge(): boolean {
    if (!this.isAlive || this.currentStamina < 20) return false;
    this.currentStamina -= 20 * this.difficulty.staminaConsumptionRateMultiplier;
    this.dodgeInvulnerabilityRemaining = this.difficulty.dodgeInvulnerabilityWindowSeconds;
    this.state = CombatState.Dodging;
    return true;
  }

  public receiveDamage(incomingDamage: number): number {
    if (!this.isAlive || incomingDamage <= 0) return 0;

    // Se estiver em janela de esquiva
    if (this.state === CombatState.Dodging && this.dodgeInvulnerabilityRemaining > 0) {
      return 0;
    }

    // Se estiver em parry perfeito
    if (this.state === CombatState.Parrying && this.parryWindowRemaining > 0) {
      this.currentStamina = Math.min(this.maxStamina, this.currentStamina + 15);
      this.parriesPerformed++;
      return 0;
    }

    const netDamage = CombatCalculations.calculateMitigatedDamage(incomingDamage, this.armor);
    this.currentHealth = Math.max(0, this.currentHealth - netDamage);

    if (this.currentHealth <= 0) {
      this.state = CombatState.Dead;
    }

    return netDamage;
  }

  public updateFrame(dt: number): void {
    if (!this.isAlive || dt <= 0) return;
    this.survivalSeconds += dt;

    if (this.parryWindowRemaining > 0) {
      this.parryWindowRemaining = Math.max(0, this.parryWindowRemaining - dt);
      if (this.parryWindowRemaining === 0 && this.state === CombatState.Parrying) {
        this.state = CombatState.Idle;
      }
    }

    if (this.dodgeInvulnerabilityRemaining > 0) {
      this.dodgeInvulnerabilityRemaining = Math.max(0, this.dodgeInvulnerabilityRemaining - dt);
      if (this.dodgeInvulnerabilityRemaining === 0 && this.state === CombatState.Dodging) {
        this.state = CombatState.Idle;
      }
    }

    // Regeneração de estamina
    this.currentStamina = Math.min(
      this.maxStamina,
      this.currentStamina + this.difficulty.staminaRecoveryRatePerSecond * dt,
    );

    // Regeneração de mana
    this.currentMana = Math.min(this.maxMana, this.currentMana + 10 * dt);

    // Regeneração de vida passiva no Fácil
    if (this.difficulty.autoHealthRegenerationEnabled && this.currentHealth < this.maxHealth) {
      this.currentHealth = Math.min(this.maxHealth, this.currentHealth + 5 * dt);
    }
  }

  public recordEnemyDefeated(exp: number = 50): void {
    this.enemiesDefeated++;
    this.experience += exp;
    if (this.experience >= this.level * 100) {
      this.level++;
      this.baseAttack += 4;
      this.currentHealth = this.maxHealth;
    }
  }

  public recordPortalTraversal(): void {
    this.portalsVisited++;
  }
}
