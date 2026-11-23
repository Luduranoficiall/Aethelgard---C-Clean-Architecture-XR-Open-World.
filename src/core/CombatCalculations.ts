import { CombatHitResult } from './types.ts';

export class CombatCalculations {
  /**
   * Fórmula hiperbólica de mitigação de dano por armadura:
   * DanoMitigado = DanoBruto * (100 / (100 + Armadura))
   */
  public static calculateMitigatedDamage(incomingDamage: number, targetArmor: number): number {
    if (incomingDamage <= 0) return 0;
    const safeArmor = Math.max(0, targetArmor);
    const factor = 100 / (100 + safeArmor);
    return Math.round(incomingDamage * factor * 10) / 10;
  }

  public static resolveAttack(
    baseWeaponDamage: number,
    attackerDamageMultiplier: number,
    comboStep: number,
    isCritical: boolean,
    targetArmor: number,
    isTargetParrying: boolean,
    targetParryWindowRemaining: number,
  ): CombatHitResult {
    if (baseWeaponDamage <= 0) {
      return {
        finalDamage: 0,
        isParried: false,
        isCritical: false,
        didTargetStumble: false,
        description: 'Ataque sem dano base.',
      };
    }

    if (isTargetParrying && targetParryWindowRemaining > 0) {
      return {
        finalDamage: 0,
        isParried: true,
        isCritical: false,
        didTargetStumble: true,
        description: 'Ataque repelido por Parry perfeito!',
      };
    }

    const comboMultiplier = comboStep === 1 ? 1.0 : comboStep === 2 ? 1.25 : comboStep === 3 ? 1.6 : 1.0;
    const critMultiplier = isCritical ? 2.0 : 1.0;
    const rawDamage = baseWeaponDamage * attackerDamageMultiplier * comboMultiplier * critMultiplier;
    const finalDamage = Math.max(1, this.calculateMitigatedDamage(rawDamage, targetArmor));

    return {
      finalDamage,
      isParried: false,
      isCritical,
      didTargetStumble: isCritical || comboStep === 3,
      description: isCritical ? 'Golpe Crítico Devastador!' : 'Acerto Limpo.',
    };
  }
}
