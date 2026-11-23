import * as THREE from 'three';
import * as xb from 'xrblocks';
import { PlayerEntity } from './core/PlayerEntity.ts';
import { DifficultyLevel } from './core/DifficultyLevel.ts';
import { DifficultyTier, EnemyType } from './core/types.ts';
import { WORLD_PORTALS, WorldPortalDef } from './core/WorldPortals.ts';
import { TerrainAndCastle } from './world/TerrainAndCastle.ts';
import { CharacterModel } from './world/CharacterModel.ts';
import { PortalOrb } from './world/PortalOrb.ts';
import { EnemyModel } from './world/EnemyModel.ts';
import { EnemyEntity } from './core/EnemyEntity.ts';
import { HudOverlay } from './ui/HudOverlay.ts';
import { sound } from './audio/SoundFx.ts';
import { GameStateManager } from './core/GameStateManager.ts';
import { XRDifficultyVisualFeedback } from './world/XRDifficultyVisualFeedback.ts';
import { DifficultyHorizontalBar } from './ui/DifficultyHorizontalBar.ts';
import { firebaseService } from './services/firebaseService.ts';

class AethelgardOpenWorldGame extends xb.Script {
  private stateManager: GameStateManager = GameStateManager.getInstance();
  private player: PlayerEntity = new PlayerEntity('Herói de Aethelgard', GameStateManager.getInstance().getDifficulty());
  private currentPortal: WorldPortalDef = WORLD_PORTALS[0];

  private terrain!: TerrainAndCastle;
  private character!: CharacterModel;
  private portalOrbs: PortalOrb[] = [];
  private enemies: EnemyModel[] = [];
  private hud!: HudOverlay;
  private xrDifficultyFeedback!: XRDifficultyVisualFeedback;

  // Lighting & Hero Spotlight
  private hemiLight!: THREE.HemisphereLight;
  private dirLight!: THREE.DirectionalLight;
  private heroLight!: THREE.PointLight;

  // Controls, Physics & Camera Modes
  private keys: Record<string, boolean> = {};
  private playerPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 2);
  private playerVelocity: THREE.Vector3 = new THREE.Vector3();
  private playerRotationY: number = 0;

  private cameraModeIndex: number = 0;
  private cameraModes = [
    { name: 'Visão Épica (Imagem Principal)', offset: new THREE.Vector3(0.5, 1.75, 3.4), lookOffset: new THREE.Vector3(-0.35, 1.15, -1.4) },
    { name: 'Combate Central', offset: new THREE.Vector3(0, 2.0, 3.8), lookOffset: new THREE.Vector3(0, 1.1, -0.6) },
    { name: 'Foco no Herói (Close-Up)', offset: new THREE.Vector3(0.3, 1.3, 2.1), lookOffset: new THREE.Vector3(0, 1.1, 0) },
    { name: 'Visão Panorâmica Ampla', offset: new THREE.Vector3(0.8, 3.4, 6.0), lookOffset: new THREE.Vector3(-0.4, 1.0, -1.5) },
  ];
  private cameraOffset: THREE.Vector3 = new THREE.Vector3(0.5, 1.75, 3.4);

  // Raycasting for interaction with portals & enemies
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private hasRecordedDeathScore: boolean = false;

  init() {
    this.setupLighting();
    this.setupWorld();
    this.setupCharacter();
    this.setupPortals();
    this.setupEnemies();
    this.setupXRDifficultyFeedback();
    this.setupHud();
    this.setupInputListeners();
    this.initCloudSave();

    // Listen to difficulty changes emitted by the state manager
    this.stateManager.subscribe((newState, prev) => {
      if (newState.currentDifficulty.tier !== prev?.currentDifficulty.tier) {
        this.onDifficultyStateChanged(newState.currentDifficulty.tier);
      }
    });

    // Check query params for autostart / ultra-mode testability
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('difficulty')) {
      const diffParam = urlParams.get('difficulty');
      if (diffParam === '4' || diffParam === 'hardmaster') {
        this.stateManager.setDifficulty(DifficultyTier.HardMasterProfissional);
      } else if (diffParam === '1' || diffParam === 'facil') {
        this.stateManager.setDifficulty(DifficultyTier.Facil);
      }
    }
  }

  private async initCloudSave(): Promise<void> {
    try {
      const profile = await firebaseService.loadPlayerProgress();
      if (profile) {
        this.player.name = profile.playerName || this.player.name;
        this.player.level = Math.max(1, profile.level || 1);
        this.player.experience = profile.exp || 0;
        this.player.enemiesDefeated = profile.enemiesDefeated || 0;
        this.player.portalsVisited = profile.portalsTraversed || 0;
        this.player.combosExecuted = profile.combosExecuted || 0;
        this.player.parriesPerformed = profile.parriesPerformed || 0;
        this.hud.addCombatLog(`☁️ Perfil sincronizado com Firestore: <strong>${this.player.name}</strong> (Nv. ${this.player.level})`);
      } else {
        // Initial cloud save for new player
        await firebaseService.savePlayerProgress(this.player);
      }
    } catch (e) {
      console.warn('Firestore initial sync notice:', e);
    }
  }

  private setupLighting(): void {
    this.hemiLight = new THREE.HemisphereLight(
      this.currentPortal.skyColorHex,
      this.currentPortal.groundColorHex,
      1.8,
    );
    this.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    this.dirLight.position.set(15, 30, 20);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.add(this.dirLight);

    // Hero Spotlight: Accentuates the hero character with warm dynamic illumination
    this.heroLight = new THREE.PointLight(0xfffae0, 2.5, 7);
    this.heroLight.position.set(0, 2.2, 2.8);
    this.add(this.heroLight);
  }

  private setupWorld(): void {
    this.terrain = new TerrainAndCastle();
    this.add(this.terrain.group);
  }

  private setupCharacter(): void {
    this.character = new CharacterModel();
    this.character.group.position.copy(this.playerPosition);
    this.add(this.character.group);
  }

  private setupPortals(): void {
    WORLD_PORTALS.forEach((portalDef) => {
      const orb = new PortalOrb(portalDef);
      this.portalOrbs.push(orb);
      this.add(orb.group);
    });
  }

  private setupEnemies(): void {
    this.clearEnemies();

    const spawnData = [
      { type: EnemyType.GoblinBatedor, name: 'Goblin Espião', pos: new THREE.Vector3(-6.5, 0, -11) },
      { type: EnemyType.CavaleiroSombrio, name: 'Cavaleiro Renegado', pos: new THREE.Vector3(6.5, 0, -13) },
      { type: EnemyType.CavaleiroSombrio, name: 'Sentinela do Abismo', pos: new THREE.Vector3(0, 0, -20) },
      { type: EnemyType.GoblinBatedor, name: 'Goblin Emboscador', pos: new THREE.Vector3(-9.5, 0, -16) },
    ];

    spawnData.forEach(({ type, name, pos }) => {
      const entity = new EnemyEntity(name, type, this.player.difficulty);
      const enemyModel = new EnemyModel(entity, pos);
      this.enemies.push(enemyModel);
      this.add(enemyModel.group);
    });
  }

  private clearEnemies(): void {
    this.enemies.forEach((e) => this.remove(e.group));
    this.enemies = [];
  }

  private setupXRDifficultyFeedback(): void {
    this.xrDifficultyFeedback = new XRDifficultyVisualFeedback();
    this.add(this.xrDifficultyFeedback);
  }

  private setupHud(): void {
    this.hud = new HudOverlay(this.player, this.currentPortal, {
      onSelectDifficulty: (tier) => this.switchDifficulty(tier),
      onSelectPortal: (portal) => this.travelToPortal(portal),
      onPerformAttack: () => this.handlePlayerAttack(),
      onCastSpell: () => this.handlePlayerSpell(),
      onParry: () => this.handlePlayerParry(),
      onDodge: () => this.handlePlayerDodge(),
      onToggleInspector: () => {},
      onCycleCamera: () => this.cycleCameraMode(),
    });
  }

  private cycleCameraMode(): void {
    this.cameraModeIndex = (this.cameraModeIndex + 1) % this.cameraModes.length;
    const mode = this.cameraModes[this.cameraModeIndex];
    this.cameraOffset.copy(mode.offset);
    this.hud.addCombatLog(`🔍 Câmera: <strong>${mode.name}</strong>`);
  }

  private switchDifficulty(tier: DifficultyTier): void {
    this.stateManager.setDifficulty(tier);
  }

  private onDifficultyStateChanged(tier: DifficultyTier): void {
    const newDiff = DifficultyLevel.fromTier(tier);
    this.hasRecordedDeathScore = false;
    this.player.applyDifficulty(newDiff);
    this.hud.updateDifficultyBadge();
    this.hud.showDifficultyTransitionBanner(newDiff);
    this.xrDifficultyFeedback?.triggerTierTransition(tier);
    this.setupEnemies(); // Re-spawn enemies calibrated to the new difficulty multipliers
    sound.playVictoryChime();
    this.hud.addCombatLog(`⭐ Dificuldade alterada para: <strong>${newDiff.name}</strong>`);
  }

  private travelToPortal(portal: WorldPortalDef): void {
    this.currentPortal = portal;
    this.player.recordPortalTraversal();
    sound.playPortalWarp();

    // Re-theme ambient lights and fog
    this.hemiLight.color.setHex(portal.skyColorHex);
    this.hemiLight.groundColor.setHex(portal.groundColorHex);
    this.terrain.applyBiome(portal.groundColorHex, portal.treeColorHex, portal.particleColorHex);

    // Reset player position closer to castle path
    this.playerPosition.set(0, 0, 2);
    this.character.group.position.copy(this.playerPosition);

    this.hud.addCombatLog(`🌀 Portal atravessado: <strong>${portal.title}</strong>`);
    void firebaseService.savePlayerProgress(this.player);
  }

  private setupInputListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyQ') {
        this.handlePlayerSpell();
      } else if (e.code === 'KeyF') {
        this.handlePlayerParry();
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.handlePlayerDodge();
      } else if (e.code === 'KeyV') {
        this.hud.difficultyModal.toggle();
      } else if (e.code === 'KeyT') {
        this.hud.achieversModal.toggle();
      } else if (e.code === 'KeyC') {
        this.hud.toggleInspector();
      } else if (e.code === 'KeyZ') {
        this.cycleCameraMode();
      } else if (e.code === 'KeyH') {
        this.hud.togglePhotoMode();
      } else if (e.code === 'KeyE') {
        // Find nearest portal
        const nearest = this.portalOrbs.find(
          (o) => o.group.position.distanceTo(this.playerPosition) < 3.5,
        );
        if (nearest) this.travelToPortal(nearest.def);
      } else if (e.code === 'Digit1') {
        this.switchDifficulty(DifficultyTier.Facil);
      } else if (e.code === 'Digit2') {
        this.switchDifficulty(DifficultyTier.Medio);
      } else if (e.code === 'Digit3') {
        this.switchDifficulty(DifficultyTier.Dificil);
      } else if (e.code === 'Digit4') {
        this.switchDifficulty(DifficultyTier.HardMasterProfissional);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('pointerdown', (e) => {
      // If clicking inside HUD modal or controls, ignore 3D action
      if ((e.target as HTMLElement).closest('#aethelgard-hud')) return;
      this.handlePlayerAttack();
    });
  }

  private handlePlayerAttack(): void {
    const hitResult = this.player.performSwordSlash();
    this.character.triggerSwordSlash(this.player.comboStep);
    sound.playSwordSlash();

    if (hitResult.finalDamage <= 0) {
      this.hud.addCombatLog(`⚠️ ${hitResult.description}`);
      return;
    }

    // Check hit against nearby enemies in front of character
    let hitAny = false;
    this.enemies.forEach((enemyModel) => {
      if (!enemyModel.entity.isAlive) return;

      const dist = enemyModel.group.position.distanceTo(this.playerPosition);
      if (dist < 2.5) {
        hitAny = true;
        const dealt = enemyModel.entity.receiveDamage(hitResult.finalDamage);
        sound.playHitImpact();

        if (hitResult.didTargetStumble) {
          enemyModel.triggerStumble();
        }

        if (!enemyModel.entity.isAlive) {
          this.player.recordEnemyDefeated();
          sound.playVictoryChime();
          this.hud.addCombatLog(`💥 Inimigo <strong>${enemyModel.entity.name}</strong> derrotado! (+50 EXP)`);
          void firebaseService.savePlayerProgress(this.player);
        } else {
          this.hud.addCombatLog(`🗡️ Acertou ${enemyModel.entity.name} causando <strong>${dealt}</strong> de dano (Combo ${this.player.comboStep}/3).`);
        }
      }
    });

    if (!hitAny) {
      this.hud.addCombatLog(`🗡️ Golpe no ar (Combo ${this.player.comboStep}/3).`);
    }
  }

  private handlePlayerSpell(): void {
    const burstDamage = this.player.castArcaneBurst();
    if (burstDamage <= 0) {
      this.hud.addCombatLog('⚠️ Mana insuficiente para Magia Arcana.');
      return;
    }

    this.character.triggerArcaneBurst();
    sound.playArcaneBurst();

    let hitCount = 0;
    this.enemies.forEach((enemyModel) => {
      if (!enemyModel.entity.isAlive) return;
      const dist = enemyModel.group.position.distanceTo(this.playerPosition);
      if (dist < 6.0) {
        hitCount++;
        const dealt = enemyModel.entity.receiveDamage(burstDamage);
        enemyModel.triggerStumble();
        if (!enemyModel.entity.isAlive) {
          this.player.recordEnemyDefeated();
          void firebaseService.savePlayerProgress(this.player);
        }
      }
    });

    this.hud.addCombatLog(`🔮 Explosão Arcana atingiu ${hitCount} inimigos com ${Math.round(burstDamage)} de dano!`);
  }

  private handlePlayerParry(): void {
    const success = this.player.startParry();
    if (success) {
      sound.playParryClang();
      this.hud.addCombatLog('🛡️ Postura de Perfect Parry ativa (Janela: ' + Math.round(this.player.difficulty.perfectParryWindowSeconds * 1000) + 'ms)!');
    }
  }

  private handlePlayerDodge(): void {
    const success = this.player.executeDodge();
    if (success) {
      sound.playSwordSlash();
      this.hud.addCombatLog('💨 Esquiva tática realizada com invulnerabilidade!');
    }
  }

  onSelectStart(event: xb.SelectEvent) {
    // WebXR Pinch / Controller Trigger Attack
    this.handlePlayerAttack();
  }

  update() {
    const dt = Math.min(xb.getDeltaTime() || 0.016, 0.05);

    // Update Player Domain Entity Frame
    this.player.updateFrame(dt);

    // Movement calculation
    let moveX = 0;
    let moveZ = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
    if (this.keys['KeyA']) moveX -= 1;
    if (this.keys['KeyD']) moveX += 1;

    const isMoving = moveX !== 0 || moveZ !== 0;

    if (isMoving) {
      const moveVec = new THREE.Vector3(moveX, 0, moveZ).normalize();
      const moveSpeed = 4.2;
      this.playerPosition.x += moveVec.x * moveSpeed * dt;
      this.playerPosition.z += moveVec.z * moveSpeed * dt;

      // Keep inside bounds
      this.playerPosition.x = Math.max(-18, Math.min(18, this.playerPosition.x));
      this.playerPosition.z = Math.max(-28, Math.min(12, this.playerPosition.z));

      // Rotate character toward movement direction
      const targetAngle = Math.atan2(moveVec.x, moveVec.z);
      this.playerRotationY = THREE.MathUtils.lerp(this.playerRotationY, targetAngle, dt * 10);
    }

    this.character.group.position.copy(this.playerPosition);
    this.character.group.rotation.y = this.playerRotationY;
    this.character.updateAnimation(dt, isMoving);

    // Update Portals
    this.portalOrbs.forEach((orb) => orb.update(dt));

    // Update Terrain Particles
    this.terrain.updateParticles(dt);

    // Update Enemies & AI attacks
    const camPos = xb.core?.camera?.position || new THREE.Vector3(0, 3, 6);
    this.enemies.forEach((enemy) => {
      enemy.update(dt, this.playerPosition, camPos);

      // Enemy attack check
      if (enemy.entity.isAlive && enemy.entity.canAttack()) {
        const dist = enemy.group.position.distanceTo(this.playerPosition);
        if (dist <= 1.8) {
          const dmg = enemy.entity.executeAttack();
          const taken = this.player.receiveDamage(dmg);

          if (taken > 0) {
            sound.playHitImpact();
            this.hud.addCombatLog(`⚠️ ${enemy.entity.name} desferiu golpe causando <strong>${taken}</strong> de dano!`);

            if (!this.player.isAlive && !this.hasRecordedDeathScore) {
              this.hasRecordedDeathScore = true;
              sound.playHitImpact();
              this.hud.addCombatLog('💀 VOCÊ FOI DERROTADO! Conquista e pontuação gravadas no Firestore.');
              void firebaseService.submitAchieverScore(this.player);
              void firebaseService.savePlayerProgress(this.player);
              setTimeout(() => {
                this.hud.achieversModal.open();
              }, 1200);
            }
          } else {
            sound.playParryClang();
            this.hud.addCombatLog(`🛡️ Ataque de ${enemy.entity.name} bloqueado/esquivado com perfeição!`);
            enemy.triggerStumble();
          }
        }
      }
    });

    // Update HUD vitals
    this.hud.updateVitals(dt);

    // Update Hero Spotlight: keeps the hero character beautifully lit
    if (this.heroLight) {
      this.heroLight.position.set(
        this.playerPosition.x,
        this.playerPosition.y + 2.2,
        this.playerPosition.z + 0.8,
      );
    }

    // Camera follow (Third Person smooth lerp with mode-specific framing)
    if (xb.core?.camera) {
      const currentMode = this.cameraModes[this.cameraModeIndex];
      const idealCamPos = this.playerPosition.clone().add(this.cameraOffset);
      xb.core.camera.position.lerp(idealCamPos, dt * 6);
      const targetLook = this.playerPosition.clone().add(currentMode.lookOffset);
      xb.core.camera.lookAt(targetLook);
    }
  }

  dispose() {
    this.clearEnemies();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const options = new xb.Options();
  options.setAppTitle('Aethelgard - C# Clean Architecture XR');
  options.setAppDescription(
    'Mundo aberto com arquitetura limpa em C# puro, 4 dificuldades e combate em WebXR.'
  );
  xb.add(new AethelgardOpenWorldGame());
  xb.init(options);
  // Mount the horizontal 4-difficulty selector container directly above the main button
  DifficultyHorizontalBar.init();
});
