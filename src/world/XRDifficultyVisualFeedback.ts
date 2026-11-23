import * as THREE from 'three';
import * as xb from 'xrblocks';
import { DifficultyTier, DifficultyConfig } from '../core/types.ts';
import { DifficultyLevel } from '../core/DifficultyLevel.ts';
import { GameStateManager } from '../core/GameStateManager.ts';
import { sound } from '../audio/SoundFx.ts';

/**
 * XRDifficultyVisualFeedback
 * A dedicated spatial 3D WebXR UI and visual feedback component that highlights
 * the currently selected difficulty tier with:
 * 1. A 3D spatial UICard with interactive buttons and live status in WebXR space.
 * 2. An animated glowing border frame in 3D world space.
 * 3. A 3D floating Celestial Emblem with kinetic icon spin/scale transitions.
 * 4. An expanding light shockwave ring emitted upon tier transitions.
 * 5. A reactive point light radiating the tier's unique signature aura color.
 */
export class XRDifficultyVisualFeedback extends xb.Script {
  public card!: xb.UICard;
  private stateManager: GameStateManager;
  private currentTier: DifficultyTier;

  // 3D Visual Feedback Elements
  private glowBorderFrame!: THREE.LineSegments;
  private auraLight!: THREE.PointLight;
  private emblemMesh!: THREE.Mesh;
  private emblemRingMesh!: THREE.Mesh;
  private shockwaveRing!: THREE.Mesh;

  // Transition & Animation Variables
  private transitionTimer: number = 0;
  private shockwaveActive: boolean = false;
  private shockwaveProgress: number = 0;
  private emblemBaseScale: number = 0.16;
  private currentEmblemScale: number = 0.16;
  private emblemSpinVelocity: number = 1.0;
  private pulsePhase: number = 0;

  // Button retained references for fast style updates
  private optionButtons: Map<DifficultyTier, { button: xb.UIButton; badge: xb.UIText; panel: xb.UIPanel }> = new Map();
  private statusText!: xb.UIText;
  private unsubscribeState?: () => void;

  constructor() {
    super();
    this.stateManager = GameStateManager.getInstance();
    this.currentTier = this.stateManager.getDifficulty().tier;
  }

  init() {
    this.build3DAuraAndEmblem();
    this.buildSpatialUICard();

    // Subscribe to state changes
    this.unsubscribeState = this.stateManager.subscribe((newState, prev) => {
      if (newState.currentDifficulty.tier !== this.currentTier) {
        this.triggerTierTransition(newState.currentDifficulty.tier);
      }
    });

    // Initial appearance sync
    this.updateVisualState(this.currentTier, false);
  }

  private build3DAuraAndEmblem(): void {
    const config = DifficultyLevel.fromTier(this.currentTier);
    const colorHex = this.getTierColorHex(this.currentTier);

    const posX = -4.8;
    const posY = 1.45;
    const posZ = -1.2;
    const rotY = 0.75;

    // 1. Reactive Point Light Aura
    this.auraLight = new THREE.PointLight(colorHex, 2.5, 4.0);
    this.auraLight.position.set(posX, posY + 0.6, posZ);
    this.add(this.auraLight);

    // 2. 3D Glowing Border Frame around the spatial card in world space
    const width = 0.88;
    const height = 0.72;
    const borderEdges = new THREE.EdgesGeometry(new THREE.PlaneGeometry(width, height));
    const borderMat = new THREE.LineBasicMaterial({
      color: colorHex,
      linewidth: 3,
      transparent: true,
      opacity: 0.85,
    });
    this.glowBorderFrame = new THREE.LineSegments(borderEdges, borderMat);
    this.glowBorderFrame.position.set(posX, posY, posZ - 0.01);
    this.glowBorderFrame.rotation.y = rotY;
    this.add(this.glowBorderFrame);

    // 3. 3D Floating Celestial Emblem atop the card (Performs the Icon Transition)
    const emblemGeo = new THREE.OctahedronGeometry(this.emblemBaseScale, 0);
    const emblemMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
      flatShading: true,
    });
    this.emblemMesh = new THREE.Mesh(emblemGeo, emblemMat);
    this.emblemMesh.position.set(posX, posY + 0.5, posZ);
    this.emblemMesh.rotation.y = rotY;
    this.add(this.emblemMesh);

    // Orbital celestial ring around the emblem
    const ringGeo = new THREE.TorusGeometry(this.emblemBaseScale * 1.5, 0.012, 12, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });
    this.emblemRingMesh = new THREE.Mesh(ringGeo, ringMat);
    this.emblemRingMesh.position.copy(this.emblemMesh.position);
    this.emblemRingMesh.rotation.x = Math.PI / 3;
    this.add(this.emblemRingMesh);

    // 4. Expanding Light Shockwave Ring (Triggers on tier selection)
    const shockwaveGeo = new THREE.RingGeometry(0.08, 0.12, 32);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    this.shockwaveRing = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    this.shockwaveRing.position.copy(this.emblemMesh.position);
    this.shockwaveRing.rotation.y = 0.45;
    this.add(this.shockwaveRing);
  }

  private buildSpatialUICard(): void {
    const diffs = [
      {
        tier: DifficultyTier.Facil,
        title: 'FÁCIL',
        icon: 'eco',
        summary: '200 HP · Regen +5/s · Parry 500ms',
        color: '#10b981',
      },
      {
        tier: DifficultyTier.Medio,
        title: 'MÉDIO',
        icon: 'shield',
        summary: '100 HP · Padrão Canônico · Parry 300ms',
        color: '#3b82f6',
      },
      {
        tier: DifficultyTier.Dificil,
        title: 'DIFÍCIL',
        icon: 'military_tech',
        summary: '80 HP · Inimigos +75% · Parry 160ms',
        color: '#f59e0b',
      },
      {
        tier: DifficultyTier.HardMasterProfissional,
        title: 'HARD MASTER',
        icon: 'warning',
        summary: '50 HP · Dano x2.6 · Parry 80ms · Permadeath',
        color: '#ef4444',
      },
    ];

    const buttonRows: xb.UIPanel[] = [];

    diffs.forEach(({ tier, title, icon, summary, color }) => {
      const isSelected = tier === this.currentTier;

      const badge = new xb.UIText({
        text: isSelected ? '✔ ATIVO' : 'SELECIONAR',
        style: {
          fontSize: 12,
          fontWeight: 'bold',
          color: isSelected ? '#ffffff' : color,
          backgroundColor: isSelected ? color : 'transparent',
          padding: 4,
          borderRadius: 6,
        },
      });

      const button = new xb.UIButton({
        label: title,
        icon,
        style: {
          width: 150,
          height: 44,
          borderRadius: 12,
          backgroundColor: isSelected ? color : 'rgba(255, 255, 255, 0.08)',
          borderColor: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.15)',
          borderWidth: isSelected ? 2 : 1,
        },
        onClick: () => {
          this.stateManager.setDifficulty(tier);
        },
      });

      const rowPanel = new xb.UIPanel({
        style: {
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 8,
          borderRadius: 14,
          backgroundColor: isSelected ? `${color}22` : 'rgba(255, 255, 255, 0.03)',
          borderColor: isSelected ? color : 'transparent',
          borderWidth: isSelected ? 1.5 : 0,
        },
        children: [
          button,
          new xb.UIPanel({
            style: { flexDirection: 'column', flexGrow: 1, paddingLeft: 12 },
            children: [
              new xb.UIText({
                text: summary,
                style: { fontSize: 13, color: '#cbd5e1' },
              }),
            ],
          }),
          badge,
        ],
      });

      this.optionButtons.set(tier, { button, badge, panel: rowPanel });
      buttonRows.push(rowPanel);
    });

    this.statusText = new xb.UIText({
      text: `Dificuldade Atual: ${DifficultyLevel.fromTier(this.currentTier).name}`,
      style: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        color: this.getTierColorStr(this.currentTier),
        paddingTop: 8,
      },
    });

    this.card = new xb.UICard({
      size: { width: 0.88, height: 'auto' },
      manipulation: true,
      edge: true,
      style: {
        flexDirection: 'column',
        gap: 10,
        padding: 20,
        backgroundColor: '#0c1322ee',
        borderRadius: 22,
        borderColor: this.getTierColorStr(this.currentTier),
        borderWidth: 2,
      },
      children: [
        new xb.UIPanel({
          style: {
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: 6,
          },
          children: [
            new xb.UIIcon({
              icon: 'tune',
              style: { width: 34, height: 34, color: this.getTierColorStr(this.currentTier) },
            }),
            new xb.UIPanel({
              style: { flexDirection: 'column', flexGrow: 1 },
              children: [
                new xb.UIText({
                  text: 'DIFICULDADE XR & FEEDBACK VISUAL',
                  style: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
                }),
                new xb.UIText({
                  text: 'Toque para selecionar no espaço 3D (Refletido no GameStateManager)',
                  style: { fontSize: 12, color: '#94a3b8' },
                }),
              ],
            }),
          ],
        }),
        ...buttonRows,
        this.statusText,
      ],
    });

    this.card.position.set(-4.8, 1.45, -1.2);
    this.card.rotation.y = 0.75;
    this.card.name = 'XR Difficulty Feedback Card';
    this.add(this.card);
  }

  public triggerTierTransition(newTier: DifficultyTier): void {
    this.currentTier = newTier;
    this.transitionTimer = 0.8;
    this.shockwaveActive = true;
    this.shockwaveProgress = 0;
    this.emblemSpinVelocity = 8.0; // Rapid energetic spin on transition
    this.currentEmblemScale = this.emblemBaseScale * 1.8; // Elastic pop

    sound.playVictoryChime();
    this.updateVisualState(newTier, true);
  }

  private updateVisualState(tier: DifficultyTier, animate: boolean): void {
    const config = DifficultyLevel.fromTier(tier);
    const colorHex = this.getTierColorHex(tier);
    const colorStr = this.getTierColorStr(tier);

    // Update 3D Light & Border Frame
    this.auraLight.color.setHex(colorHex);
    (this.glowBorderFrame.material as THREE.LineBasicMaterial).color.setHex(colorHex);

    // Update 3D Emblem Colors
    const emblemMat = this.emblemMesh.material as THREE.MeshStandardMaterial;
    emblemMat.color.setHex(colorHex);
    emblemMat.emissive.setHex(colorHex);
    (this.shockwaveRing.material as THREE.MeshBasicMaterial).color.setHex(colorHex);

    // Update Card Border
    this.card.style.borderColor = colorStr;

    // Update Status Text
    this.statusText.text = `Dificuldade Atual: ${config.name}`;
    this.statusText.style.color = colorStr;

    // Retained update on the buttons
    this.optionButtons.forEach(({ button, badge, panel }, t) => {
      const isSelected = t === tier;
      const tColor = this.getTierColorStr(t);

      button.style.backgroundColor = isSelected ? tColor : 'rgba(255, 255, 255, 0.08)';
      button.style.borderColor = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.15)';
      button.style.borderWidth = isSelected ? 2 : 1;

      badge.text = isSelected ? '✔ ATIVO' : 'SELECIONAR';
      badge.style.color = isSelected ? '#ffffff' : tColor;
      badge.style.backgroundColor = isSelected ? tColor : 'transparent';

      panel.style.backgroundColor = isSelected ? `${tColor}22` : 'rgba(255, 255, 255, 0.03)';
      panel.style.borderColor = isSelected ? tColor : 'transparent';
      panel.style.borderWidth = isSelected ? 1.5 : 0;
    });
  }

  update() {
    const dt = Math.min(xb.getDeltaTime() || 0.016, 0.05);
    this.pulsePhase += dt;

    // 1. Icon Transition: Smooth spring scale return (1.8 -> 1.0)
    if (this.currentEmblemScale > this.emblemBaseScale) {
      this.currentEmblemScale = THREE.MathUtils.lerp(this.currentEmblemScale, this.emblemBaseScale, dt * 6);
      this.emblemMesh.scale.setScalar(this.currentEmblemScale / this.emblemBaseScale);
    }

    // 2. Icon Transition: Decaying high-speed rotational spin
    this.emblemSpinVelocity = THREE.MathUtils.lerp(
      this.emblemSpinVelocity,
      this.currentTier === DifficultyTier.HardMasterProfissional ? 2.5 : 1.0,
      dt * 4
    );
    this.emblemMesh.rotation.y += this.emblemSpinVelocity * dt;
    this.emblemMesh.rotation.z += this.emblemSpinVelocity * 0.5 * dt;

    // Ring spins on opposite axis
    this.emblemRingMesh.rotation.z += dt * 1.5;
    this.emblemRingMesh.rotation.y += dt * 0.8;

    // 3. Glowing Border & Aura Light Pulsing
    const pulseSpeed = this.currentTier === DifficultyTier.HardMasterProfissional ? 6.0 : 3.0;
    const pulseRange = this.currentTier === DifficultyTier.HardMasterProfissional ? 1.2 : 0.6;
    const lightIntensity = 2.0 + Math.sin(this.pulsePhase * pulseSpeed) * pulseRange;
    this.auraLight.intensity = lightIntensity;

    const borderOpacity = 0.6 + Math.sin(this.pulsePhase * pulseSpeed) * 0.35;
    (this.glowBorderFrame.material as THREE.LineBasicMaterial).opacity = borderOpacity;

    // 4. Expanding Light Shockwave Ring Animation
    if (this.shockwaveActive) {
      this.shockwaveProgress += dt * 2.2;
      const ringScale = 1.0 + this.shockwaveProgress * 7.0;
      this.shockwaveRing.scale.set(ringScale, ringScale, 1.0);

      const ringOpacity = Math.max(0, 1.0 - this.shockwaveProgress);
      (this.shockwaveRing.material as THREE.MeshBasicMaterial).opacity = ringOpacity;

      if (ringOpacity <= 0) {
        this.shockwaveActive = false;
        (this.shockwaveRing.material as THREE.MeshBasicMaterial).opacity = 0;
      }
    }
  }

  private getTierColorHex(tier: DifficultyTier): number {
    switch (tier) {
      case DifficultyTier.Facil:
        return 0x10b981;
      case DifficultyTier.Medio:
        return 0x3b82f6;
      case DifficultyTier.Dificil:
        return 0xf59e0b;
      case DifficultyTier.HardMasterProfissional:
        return 0xef4444;
      default:
        return 0x3b82f6;
    }
  }

  private getTierColorStr(tier: DifficultyTier): string {
    switch (tier) {
      case DifficultyTier.Facil:
        return '#10b981';
      case DifficultyTier.Medio:
        return '#3b82f6';
      case DifficultyTier.Dificil:
        return '#f59e0b';
      case DifficultyTier.HardMasterProfissional:
        return '#ef4444';
      default:
        return '#3b82f6';
    }
  }

  dispose() {
    this.unsubscribeState?.();
    this.glowBorderFrame.geometry.dispose();
    (this.glowBorderFrame.material as THREE.Material).dispose();
    this.emblemMesh.geometry.dispose();
    (this.emblemMesh.material as THREE.Material).dispose();
    this.emblemRingMesh.geometry.dispose();
    (this.emblemRingMesh.material as THREE.Material).dispose();
    this.shockwaveRing.geometry.dispose();
    (this.shockwaveRing.material as THREE.Material).dispose();
  }
}
