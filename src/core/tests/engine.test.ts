import test from 'node:test';
import assert from 'node:assert/strict';
import { DifficultyTier, CombatState, EnemyType } from '../types.ts';
import { DifficultyLevel } from '../DifficultyLevel.ts';
import { CombatCalculations } from '../CombatCalculations.ts';
import { PlayerEntity } from '../PlayerEntity.ts';
import { EnemyEntity } from '../EnemyEntity.ts';
import { GameStateManager } from '../GameStateManager.ts';

test('DifficultyLevel: Facil specifications match design invariants', () => {
  const facil = DifficultyLevel.fromTier(DifficultyTier.Facil);
  assert.equal(facil.playerMaxHealthMultiplier, 2.0);
  assert.equal(facil.autoHealthRegenerationEnabled, true);
  assert.equal(facil.enemyDamageMultiplier, 0.5);
  assert.equal(facil.perfectParryWindowSeconds, 0.5);
  assert.equal(facil.allowPermadeathThreat, false);
});

test('DifficultyLevel: Medio specifications match standard baseline', () => {
  const medio = DifficultyLevel.fromTier(DifficultyTier.Medio);
  assert.equal(medio.playerMaxHealthMultiplier, 1.0);
  assert.equal(medio.autoHealthRegenerationEnabled, false);
  assert.equal(medio.enemyDamageMultiplier, 1.0);
  assert.equal(medio.perfectParryWindowSeconds, 0.3);
});

test('DifficultyLevel: Dificil tightens combat timings and boosts enemies', () => {
  const dificil = DifficultyLevel.fromTier(DifficultyTier.Dificil);
  assert.equal(dificil.playerMaxHealthMultiplier, 0.8);
  assert.equal(dificil.enemyDamageMultiplier, 1.75);
  assert.equal(dificil.perfectParryWindowSeconds, 0.16);
  assert.equal(dificil.staminaConsumptionRateMultiplier, 1.4);
});

test('DifficultyLevel: HardMasterProfissional enforces extreme constraints', () => {
  const hm = DifficultyLevel.fromTier(DifficultyTier.HardMasterProfissional);
  assert.equal(hm.playerMaxHealthMultiplier, 0.5); // 50 HP baseline
  assert.equal(hm.enemyDamageMultiplier, 2.6);
  assert.equal(hm.staminaConsumptionRateMultiplier, 2.0);
  assert.equal(hm.perfectParryWindowSeconds, 0.08); // 80ms
  assert.equal(hm.allowPermadeathThreat, true);
});

test('CombatCalculations: Armor mitigation curve behaves asymptotically', () => {
  assert.equal(CombatCalculations.calculateMitigatedDamage(100, 0), 100);
  assert.equal(CombatCalculations.calculateMitigatedDamage(100, 100), 50);
  assert.equal(CombatCalculations.calculateMitigatedDamage(100, 300), 25);
  assert.equal(CombatCalculations.calculateMitigatedDamage(0, 50), 0);
  assert.equal(CombatCalculations.calculateMitigatedDamage(-50, 50), 0);
});

test('CombatCalculations: Active parry negates all damage and causes target stumble', () => {
  const hit = CombatCalculations.resolveAttack(40, 1.0, 1, false, 0, true, 0.1);
  assert.equal(hit.finalDamage, 0);
  assert.equal(hit.isParried, true);
  assert.equal(hit.didTargetStumble, true);
});

test('PlayerEntity: Health scales accurately upon difficulty application', () => {
  const player = new PlayerEntity('Arthur', DifficultyLevel.Facil);
  assert.equal(player.maxHealth, 200);
  assert.equal(player.currentHealth, 200);

  player.applyDifficulty(DifficultyLevel.HardMasterProfissional);
  assert.equal(player.maxHealth, 50);
  assert.equal(player.currentHealth, 50);
});

test('PlayerEntity: Sword attack consumes stamina and cycles 3-hit combo', () => {
  const player = new PlayerEntity('Arthur', DifficultyLevel.Medio);
  const initialStamina = player.currentStamina;

  const hit1 = player.PerformOrExecuteSlash();
  assert.equal(player.comboStep, 1);
  assert.ok(player.currentStamina < initialStamina);

  const hit2 = player.PerformOrExecuteSlash();
  assert.equal(player.comboStep, 2);

  const hit3 = player.PerformOrExecuteSlash();
  assert.equal(player.comboStep, 3);
  assert.equal(hit3.didTargetStumble, true); // 3rd hit knocks target back

  player.PerformOrExecuteSlash();
  assert.equal(player.comboStep, 1); // Loops back
});

test('PlayerEntity: Dodge grants invulnerability frames', () => {
  const player = new PlayerEntity('Arthur', DifficultyLevel.Medio);
  player.executeDodge();
  assert.equal(player.state, CombatState.Dodging);
  assert.ok(player.dodgeInvulnerabilityRemaining > 0);

  // Incoming damage while dodging should be completely negated (0)
  const damageTaken = player.receiveDamage(80);
  assert.equal(damageTaken, 0);
  assert.equal(player.currentHealth, player.maxHealth);
});

test('EnemyEntity: Enrages below 30% health in combat', () => {
  const enemy = new EnemyEntity('Goblin', EnemyType.GoblinBatedor, DifficultyLevel.Medio);
  const initialDamage = enemy.baseAttackDamage;

  // Deal heavy damage leaving enemy below 30% HP (accounting for 10 armor mitigation)
  enemy.receiveDamage(enemy.maxHealth * 0.85);
  assert.ok(enemy.isAlive);
  assert.equal(enemy.isEnraged, true);
  assert.ok(enemy.baseAttackDamage > initialDamage);
});

test('GameStateManager: Singleton state manager updates difficulty and notifies subscribers', () => {
  GameStateManager.resetInstance();
  const stateManager = GameStateManager.getInstance();

  assert.equal(stateManager.getDifficulty().tier, DifficultyTier.Medio);

  let notified = false;
  let receivedTier: DifficultyTier | null = null;
  const unsubscribe = stateManager.subscribe((newState: any) => {
    notified = true;
    receivedTier = newState.currentDifficulty.tier;
  });

  stateManager.setDifficulty(DifficultyTier.HardMasterProfissional);
  assert.equal(notified, true);
  assert.equal(receivedTier, DifficultyTier.HardMasterProfissional);
  assert.equal(stateManager.getDifficulty().tier, DifficultyTier.HardMasterProfissional);

  // Clean up
  unsubscribe();
  stateManager.setDifficulty(DifficultyTier.Facil);
  assert.equal(stateManager.getDifficulty().tier, DifficultyTier.Facil);
});

// Helper alias on prototype for test readability
declare module '../PlayerEntity.ts' {
  interface PlayerEntity {
    PerformOrExecuteSlash(isCrit?: boolean): any;
  }
}
PlayerEntity.prototype.PerformOrExecuteSlash = function (isCrit: boolean = false) {
  return this.performSwordSlash(isCrit);
};
