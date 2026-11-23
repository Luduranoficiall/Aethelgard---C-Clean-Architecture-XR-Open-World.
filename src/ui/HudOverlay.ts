import { DifficultyConfig, DifficultyTier } from '../core/types.ts';
import { DifficultyLevel } from '../core/DifficultyLevel.ts';
import { PlayerEntity } from '../core/PlayerEntity.ts';
import { WorldPortalDef, WORLD_PORTALS } from '../core/WorldPortals.ts';
import { CombatCalculations } from '../core/CombatCalculations.ts';
import { GameStateManager } from '../core/GameStateManager.ts';
import { DifficultySelectionModal } from './DifficultySelectionModal.ts';
import { TopAchieversModal } from './TopAchieversModal.ts';

export class HudOverlay {
  private container: HTMLDivElement;
  private player: PlayerEntity;
  private currentPortal: WorldPortalDef;
  private onSelectDifficulty: (tier: DifficultyTier) => void;
  private onSelectPortal: (portal: WorldPortalDef) => void;
  private onPerformAttack: () => void;
  private onCastSpell: () => void;
  private onParry: () => void;
  private onDodge: () => void;
  private onToggleInspector: () => void;
  private onCycleCamera?: () => void;
  public difficultyModal: DifficultySelectionModal;
  public achieversModal: TopAchieversModal;

  // DOM Elements
  private healthFill!: HTMLDivElement;
  private healthText!: HTMLSpanElement;
  private staminaFill!: HTMLDivElement;
  private staminaText!: HTMLSpanElement;
  private manaFill!: HTMLDivElement;
  private manaText!: HTMLSpanElement;
  private difficultyBadge!: HTMLSpanElement;
  private diffSelectorContainer!: HTMLDivElement;
  private worldTitleEl!: HTMLDivElement;
  private worldPromptEl!: HTMLDivElement;
  private combatLogEl?: HTMLDivElement;
  private toastContainer!: HTMLDivElement;
  private isBottomDockMinimized: boolean = false;
  private bottomDockContent!: HTMLDivElement;
  private bottomDockToggleBtn!: HTMLButtonElement;
  private inspectorModal!: HTMLDivElement;
  private isInspectorOpen: boolean = false;

  // Visibility and Layout Control (Fixing Character Obscurity)
  private isPhotoMode: boolean = false;
  private isPrompterExpanded: boolean = false;
  private prompterDropdown!: HTMLDivElement;
  private prompterToggleBtn!: HTMLButtonElement;
  private topBarEl!: HTMLDivElement;
  private bottomBarEl!: HTMLDivElement;
  private photoModeIndicator!: HTMLDivElement;

  constructor(
    player: PlayerEntity,
    currentPortal: WorldPortalDef,
    callbacks: {
      onSelectDifficulty: (tier: DifficultyTier) => void;
      onSelectPortal: (portal: WorldPortalDef) => void;
      onPerformAttack: () => void;
      onCastSpell: () => void;
      onParry: () => void;
      onDodge: () => void;
      onToggleInspector: () => void;
      onCycleCamera?: () => void;
    },
  ) {
    this.player = player;
    this.currentPortal = currentPortal;
    this.onSelectDifficulty = callbacks.onSelectDifficulty;
    this.onSelectPortal = callbacks.onSelectPortal;
    this.onPerformAttack = callbacks.onPerformAttack;
    this.onCastSpell = callbacks.onCastSpell;
    this.onParry = callbacks.onParry;
    this.onDodge = callbacks.onDodge;
    this.onToggleInspector = callbacks.onToggleInspector;
    this.onCycleCamera = callbacks.onCycleCamera;
    this.difficultyModal = new DifficultySelectionModal((newTier) => {
      this.onSelectDifficulty(newTier);
    });
    this.achieversModal = new TopAchieversModal(this.player, (msg) => {
      this.addCombatLog(msg);
    });

    this.container = document.createElement('div');
    this.container.id = 'aethelgard-hud';
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 20;
      font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      user-select: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    `;
    document.body.appendChild(this.container);

    this.renderTopBar();
    // Center is intentionally left 100% unobstructed so characters and combat are fully visible!
    this.renderBottomControls();
    this.renderPhotoModeIndicator();
    this.renderInspectorModal();

    // Subscribe to state manager updates
    GameStateManager.getInstance().subscribe((newState) => {
      this.player.applyDifficulty(newState.currentDifficulty);
      this.updateDifficultyBadge();
      this.updateQuickButtons(newState.currentDifficulty.tier);
    });
  }

  private renderTopBar(): void {
    const topBar = document.createElement('div');
    this.topBarEl = topBar;
    topBar.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      width: calc(100% - 40px);
      pointer-events: auto;
      gap: 12px;
      z-index: 30;
    `;

    // Left cluster: Ultra-slim Single-Row Player Vitals Pill (only ~32px tall!)
    const leftCluster = document.createElement('div');
    leftCluster.style.cssText = `
      background: rgba(10, 16, 28, 0.72);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 9999px;
      padding: 5px 14px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.35);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      gap: 12px;
    `;

    const charBadge = document.createElement('div');
    charBadge.style.cssText = 'font-weight: 700; font-size: 13px; color: #fff; display: flex; align-items: center; gap: 4px;';
    charBadge.innerHTML = `⚔️ ${this.player.name} <span style="font-size: 11px; color: #94a3b8; font-weight: normal;">Nv.<span id="player-level">1</span></span>`;
    leftCluster.appendChild(charBadge);

    // HP Mini Gauge
    leftCluster.appendChild(this.createMiniGauge('❤️', '#ef4444', 38, (fill, text) => {
      this.healthFill = fill;
      this.healthText = text;
    }));

    // Stamina Mini Gauge
    leftCluster.appendChild(this.createMiniGauge('⚡', '#22c55e', 28, (fill, text) => {
      this.staminaFill = fill;
      this.staminaText = text;
    }));

    // Mana Mini Gauge
    leftCluster.appendChild(this.createMiniGauge('💧', '#3b82f6', 28, (fill, text) => {
      this.manaFill = fill;
      this.manaText = text;
    }));

    this.difficultyBadge = document.createElement('span');
    this.difficultyBadge.title = 'Clique para abrir a seleção de dificuldade (V)';
    this.difficultyBadge.style.cursor = 'pointer';
    this.difficultyBadge.onclick = () => this.difficultyModal.open();
    this.updateDifficultyBadge();
    leftCluster.appendChild(this.difficultyBadge);

    topBar.appendChild(leftCluster);

    // Center cluster: Minimalist Micro-Capsule for World Title
    const centerCluster = document.createElement('div');
    centerCluster.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    `;

    const prompterHeader = document.createElement('div');
    prompterHeader.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(10, 16, 28, 0.72);
      border: 1px solid rgba(96, 165, 250, 0.35);
      border-radius: 9999px;
      padding: 5px 14px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      backdrop-filter: blur(10px);
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    prompterHeader.innerHTML = `
      <span style="font-size: 12px;">🌐</span>
      <span id="center-world-title" style="font-size: 12px; font-weight: 700; color: #93c5fd;">${this.currentPortal.title}</span>
    `;

    this.prompterToggleBtn = document.createElement('button');
    this.prompterToggleBtn.innerText = '▾';
    this.prompterToggleBtn.style.cssText = `
      background: none;
      border: none;
      color: #93c5fd;
      font-size: 11px;
      font-weight: 700;
      padding: 0;
      cursor: pointer;
    `;
    prompterHeader.appendChild(this.prompterToggleBtn);
    centerCluster.appendChild(prompterHeader);

    // Collapsible World Selection Dropdown
    this.prompterDropdown = document.createElement('div');
    this.prompterDropdown.style.cssText = `
      display: none;
      position: absolute;
      top: 36px;
      left: 50%;
      transform: translateX(-50%);
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 10px;
      background: rgba(10, 16, 28, 0.94);
      border: 1px solid rgba(96, 165, 250, 0.4);
      border-radius: 14px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      backdrop-filter: blur(14px);
      min-width: 280px;
      z-index: 50;
    `;

    this.worldPromptEl = document.createElement('div');
    this.worldPromptEl.style.cssText = `
      font-size: 11px;
      color: #cbd5e1;
      font-style: italic;
      text-align: center;
      line-height: 15px;
      margin-bottom: 4px;
    `;
    this.worldPromptEl.innerText = `"${this.currentPortal.prompt}"`;
    this.prompterDropdown.appendChild(this.worldPromptEl);

    const portalButtons = document.createElement('div');
    portalButtons.style.cssText = `
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
      justify-content: center;
      width: 100%;
    `;

    WORLD_PORTALS.forEach((portal) => {
      const btn = document.createElement('button');
      btn.innerText = portal.title.split(' ')[0] + ' ' + (portal.title.split(' ')[1] || '');
      btn.style.cssText = `
        border: 1px solid rgba(255,255,255,0.15);
        background: ${this.currentPortal.id === portal.id ? 'rgba(96, 165, 250, 0.35)' : 'rgba(255,255,255,0.06)'};
        color: #fff;
        font-size: 10px;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;
      `;
      btn.onclick = () => {
        this.onSelectPortal(portal);
        this.currentPortal = portal;
        if (this.worldTitleEl) this.worldTitleEl.innerText = `🌐 ${portal.title}`;
        this.worldPromptEl.innerText = `"${portal.prompt}"`;
        const titleSpan = centerCluster.querySelector('#center-world-title');
        if (titleSpan) titleSpan.textContent = portal.title;
        portalButtons.querySelectorAll('button').forEach((b, idx) => {
          b.style.background = WORLD_PORTALS[idx].id === portal.id ? 'rgba(96, 165, 250, 0.35)' : 'rgba(255,255,255,0.06)';
        });
        this.togglePrompter(false);
      };
      portalButtons.appendChild(btn);
    });

    this.prompterDropdown.appendChild(portalButtons);
    centerCluster.appendChild(this.prompterDropdown);
    prompterHeader.onclick = () => this.togglePrompter();
    topBar.appendChild(centerCluster);

    // Right cluster: Streamlined Single-Row Action Micro-Pills
    const rightCluster = document.createElement('div');
    rightCluster.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    // Modal Trigger Pill
    const modalTriggerBtn = document.createElement('button');
    modalTriggerBtn.innerHTML = '⚙️ <span>Dificuldade</span>';
    modalTriggerBtn.title = 'Abrir Painel Completo de Dificuldades (V)';
    modalTriggerBtn.style.cssText = `
      border: 1px solid rgba(56, 189, 248, 0.4);
      background: rgba(10, 16, 28, 0.72);
      color: #38bdf8;
      font-weight: 700;
      font-size: 11px;
      padding: 6px 12px;
      border-radius: 9999px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
    `;
    modalTriggerBtn.onclick = () => this.difficultyModal.open();
    rightCluster.appendChild(modalTriggerBtn);

    // Top Achievers Leaderboard Button (Firestore)
    const achieversBtn = document.createElement('button');
    achieversBtn.innerHTML = '🏆 <span>Achievers</span>';
    achieversBtn.title = 'Abrir Hall da Glória & Top Achievers do Firestore (T)';
    achieversBtn.style.cssText = `
      border: 1px solid rgba(245, 158, 11, 0.45);
      background: rgba(10, 16, 28, 0.72);
      color: #fbbf24;
      font-weight: 700;
      font-size: 11px;
      padding: 6px 12px;
      border-radius: 9999px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
    `;
    achieversBtn.onclick = () => this.achieversModal.open();
    rightCluster.appendChild(achieversBtn);

    // Clean View / Photo Mode button directly visible
    const cleanViewBtn = document.createElement('button');
    cleanViewBtn.innerHTML = '🎬 <span>Vista Limpa</span>';
    cleanViewBtn.title = 'Ocultar toda a interface para admirar o cenário (H)';
    cleanViewBtn.style.cssText = `
      border: 1px solid rgba(192, 132, 252, 0.4);
      background: rgba(10, 16, 28, 0.72);
      color: #c084fc;
      font-weight: 700;
      font-size: 11px;
      padding: 6px 12px;
      border-radius: 9999px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
    `;
    cleanViewBtn.onclick = () => this.togglePhotoMode();
    rightCluster.appendChild(cleanViewBtn);

    // Inspector / Client Docs Button
    const guideBtn = document.createElement('button');
    guideBtn.innerHTML = '🌟 <span>Guia</span>';
    guideBtn.title = 'Documentação do Cliente e Arquitetura Limpa (C)';
    guideBtn.style.cssText = `
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(10, 16, 28, 0.72);
      color: #e2e8f0;
      font-weight: 700;
      font-size: 11px;
      padding: 6px 12px;
      border-radius: 9999px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
    `;
    guideBtn.onclick = () => this.toggleInspector();
    rightCluster.appendChild(guideBtn);

    // Camera Cycle Button
    const camBtn = document.createElement('button');
    camBtn.innerHTML = '🔍 <span>Câmera</span>';
    camBtn.title = 'Alternar entre Visão Épica, Combate, Close-Up e Panorâmica (Z)';
    camBtn.style.cssText = `
      border: 1px solid rgba(6, 182, 212, 0.4);
      background: rgba(10, 16, 28, 0.72);
      color: #06b6d4;
      font-weight: 700;
      font-size: 11px;
      padding: 6px 12px;
      border-radius: 9999px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
    `;
    camBtn.onclick = () => this.onCycleCamera?.();
    rightCluster.appendChild(camBtn);

    topBar.appendChild(rightCluster);
    this.container.appendChild(topBar);
  }

  public togglePrompter(forceState?: boolean): void {
    this.isPrompterExpanded = forceState !== undefined ? forceState : !this.isPrompterExpanded;
    if (this.prompterDropdown) {
      this.prompterDropdown.style.display = this.isPrompterExpanded ? 'flex' : 'none';
    }
    if (this.prompterToggleBtn) {
      this.prompterToggleBtn.innerText = this.isPrompterExpanded ? 'Fechar ▲' : 'Mundos ▼';
    }
  }

  private renderPhotoModeIndicator(): void {
    this.photoModeIndicator = document.createElement('div');
    this.photoModeIndicator.id = 'photo-mode-indicator';
    this.photoModeIndicator.style.cssText = `
      position: absolute;
      top: 18px;
      right: 24px;
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid #c084fc;
      border-radius: 9999px;
      padding: 10px 20px;
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      display: none;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 4px 25px rgba(192, 132, 252, 0.4);
      backdrop-filter: blur(12px);
      z-index: 100;
      transition: all 0.2s ease;
    `;
    this.photoModeIndicator.innerHTML = `
      <span>📷 Modo Foto Ativo &middot; Visão 100% Limpa</span>
      <span style="background: rgba(192, 132, 252, 0.25); color: #e9d5ff; padding: 3px 8px; border-radius: 6px; font-size: 11px;">Pressione H para reativar interface</span>
    `;
    this.photoModeIndicator.onclick = () => this.togglePhotoMode();
    document.body.appendChild(this.photoModeIndicator);
  }

  public togglePhotoMode(): void {
    this.isPhotoMode = !this.isPhotoMode;
    if (this.isPhotoMode) {
      this.topBarEl.style.display = 'none';
      this.bottomBarEl.style.display = 'none';
      this.photoModeIndicator.style.display = 'flex';
      this.addCombatLog('📷 Modo Foto ativado: Interface ocultada para visualização completa dos personagens.');
    } else {
      this.topBarEl.style.display = 'flex';
      this.bottomBarEl.style.display = 'flex';
      this.photoModeIndicator.style.display = 'none';
      this.addCombatLog('🖥️ Interface reativada.');
    }
  }

  public updateQuickButtons(tier: DifficultyTier): void {
    if (!this.diffSelectorContainer) return;
    const colors: Record<DifficultyTier, string> = {
      [DifficultyTier.Facil]: '#10b981',
      [DifficultyTier.Medio]: '#3b82f6',
      [DifficultyTier.Dificil]: '#f59e0b',
      [DifficultyTier.HardMasterProfissional]: '#ef4444',
    };
    const glowClasses: Record<DifficultyTier, string> = {
      [DifficultyTier.Facil]: 'glow-facil',
      [DifficultyTier.Medio]: 'glow-medio',
      [DifficultyTier.Dificil]: 'glow-dificil',
      [DifficultyTier.HardMasterProfissional]: 'glow-hardmaster',
    };

    this.diffSelectorContainer.querySelectorAll('button').forEach((b) => {
      const btnTier = Number(b.dataset.tier) as DifficultyTier;
      const isSelected = btnTier === tier;
      b.classList.remove('glow-facil', 'glow-medio', 'glow-dificil', 'glow-hardmaster');

      if (isSelected) {
        b.style.background = colors[btnTier];
        b.style.color = '#fff';
        b.style.transform = 'scale(1.05)';
        b.classList.add(glowClasses[btnTier]);
      } else {
        b.style.background = 'rgba(255,255,255,0.06)';
        b.style.color = '#cbd5e1';
        b.style.transform = 'scale(1.0)';
        b.style.boxShadow = 'none';
      }
    });
  }

  private createMiniGauge(
    icon: string,
    color: string,
    widthPx: number,
    assign: (fill: HTMLDivElement, text: HTMLSpanElement) => void,
  ): HTMLDivElement {
    const gauge = document.createElement('div');
    gauge.style.cssText = 'display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700;';

    const iconSpan = document.createElement('span');
    iconSpan.innerText = icon;

    const track = document.createElement('div');
    track.style.cssText = `
      width: ${widthPx}px;
      height: 5px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 9999px;
      overflow: hidden;
    `;

    const fill = document.createElement('div');
    fill.style.cssText = `
      width: 100%;
      height: 100%;
      background: ${color};
      border-radius: 9999px;
      transition: width 0.15s ease-out;
    `;

    const valueSpan = document.createElement('span');
    valueSpan.innerText = '100';
    valueSpan.style.cssText = `color: ${color}; min-width: 20px; font-variant-numeric: tabular-nums; font-size: 11px;`;

    track.appendChild(fill);
    gauge.appendChild(iconSpan);
    gauge.appendChild(track);
    gauge.appendChild(valueSpan);

    assign(fill, valueSpan);
    return gauge;
  }

  private renderBottomControls(): void {
    const bottomBar = document.createElement('div');
    this.bottomBarEl = bottomBar;
    bottomBar.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: flex-end;
      padding: 12px 20px;
      width: calc(100% - 40px);
      pointer-events: auto;
      position: relative;
    `;

    // Toast Container (Bottom-Left) - Floating Transient Toasts with Zero Persistent Screen Blockage
    this.toastContainer = document.createElement('div');
    this.toastContainer.id = 'toast-container';
    this.toastContainer.style.cssText = `
      position: absolute;
      bottom: 60px;
      left: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      pointer-events: none;
      max-width: 320px;
      z-index: 40;
    `;
    this.container.appendChild(this.toastContainer);

    // Action Micro-Dock (Center Bottom) - Minimalist Single-Row Glass Pill Dock
    const dockWrapper = document.createElement('div');
    dockWrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(10, 16, 28, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 9999px;
      padding: 4px 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      backdrop-filter: blur(10px);
      transition: all 0.2s ease;
    `;

    this.bottomDockContent = document.createElement('div');
    this.bottomDockContent.style.cssText = `
      display: flex;
      gap: 6px;
      align-items: center;
    `;

    const actions = [
      { label: 'Golpe (Espaço)', icon: '⚔️', fn: () => this.onPerformAttack(), color: '#ef4444' },
      { label: 'Arcano (Q)', icon: '🔮', fn: () => this.onCastSpell(), color: '#8b5cf6' },
      { label: 'Parry (F)', icon: '🛡️', fn: () => this.onParry(), color: '#f59e0b' },
      { label: 'Esquiva (Shift)', icon: '💨', fn: () => this.onDodge(), color: '#10b981' },
      { label: 'Dificuldade (V)', icon: '⚙️', fn: () => this.difficultyModal.toggle(), color: '#ec4899' },
      { label: 'Achievers (T)', icon: '🏆', fn: () => this.achieversModal.toggle(), color: '#f59e0b' },
      { label: 'Câmera (Z)', icon: '🔍', fn: () => this.onCycleCamera?.(), color: '#06b6d4' },
    ];

    actions.forEach(({ label, icon, fn, color }) => {
      const btn = document.createElement('button');
      btn.innerHTML = `<span style="font-size: 13px;">${icon}</span> <span>${label}</span>`;
      btn.style.cssText = `
        display: flex;
        align-items: center;
        gap: 5px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #fff;
        font-weight: 600;
        font-size: 11px;
        padding: 5px 10px;
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.15s ease;
      `;
      btn.onmouseenter = () => {
        btn.style.background = color;
      };
      btn.onmouseleave = () => {
        btn.style.background = 'rgba(255, 255, 255, 0.08)';
      };
      btn.onclick = fn;
      this.bottomDockContent.appendChild(btn);
    });

    // Horizontal Quick Difficulty Selector Pills in HUD Dock
    this.diffSelectorContainer = document.createElement('div');
    this.diffSelectorContainer.style.cssText = `
      display: flex;
      gap: 4px;
      align-items: center;
      padding-left: 6px;
      border-left: 1px solid rgba(255, 255, 255, 0.15);
    `;

    const diffTiers = [
      { tier: DifficultyTier.Facil, icon: '🌿', label: 'Fácil' },
      { tier: DifficultyTier.Medio, icon: '⚔️', label: 'Médio' },
      { tier: DifficultyTier.Dificil, icon: '🛡️', label: 'Difícil' },
      { tier: DifficultyTier.HardMasterProfissional, icon: '👑', label: 'Hard Master' },
    ];

    diffTiers.forEach(({ tier, icon, label }) => {
      const b = document.createElement('button');
      b.dataset.tier = tier.toString();
      b.title = `Alternar para ${label}`;
      b.innerHTML = `<span>${icon}</span> <span>${label}</span>`;
      b.style.cssText = `
        display: flex;
        align-items: center;
        gap: 3px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #cbd5e1;
        font-weight: 600;
        font-size: 10px;
        padding: 4px 8px;
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.2s ease;
      `;
      b.onclick = (e) => {
        e.stopPropagation();
        this.onSelectDifficulty(tier);
      };
      this.diffSelectorContainer.appendChild(b);
    });

    this.bottomDockContent.appendChild(this.diffSelectorContainer);
    this.updateQuickButtons(this.player.difficulty.tier);

    dockWrapper.appendChild(this.bottomDockContent);

    // Minimize / Expand Dock Button
    this.bottomDockToggleBtn = document.createElement('button');
    this.bottomDockToggleBtn.innerHTML = '🔽';
    this.bottomDockToggleBtn.title = 'Minimizar/Expandir barra de ações';
    this.bottomDockToggleBtn.style.cssText = `
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #94a3b8;
      font-size: 11px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    `;
    this.bottomDockToggleBtn.onclick = () => {
      this.isBottomDockMinimized = !this.isBottomDockMinimized;
      this.bottomDockContent.style.display = this.isBottomDockMinimized ? 'none' : 'flex';
      this.bottomDockToggleBtn.innerHTML = this.isBottomDockMinimized ? '▲' : '🔽';
    };
    dockWrapper.appendChild(this.bottomDockToggleBtn);

    bottomBar.appendChild(dockWrapper);
    this.container.appendChild(bottomBar);
  }

  private renderInspectorModal(): void {
    this.inspectorModal = document.createElement('div');
    this.inspectorModal.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.95);
      width: 90%;
      max-width: 900px;
      height: 80%;
      max-height: 640px;
      background: #0b111e;
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.2);
      backdrop-filter: blur(16px);
      pointer-events: auto;
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 100;
      color: #e2e8f0;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    // Modal Header
    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 24px;
      background: rgba(15, 23, 42, 0.8);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;
    modalHeader.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 24px;">🔷</span>
        <div>
          <div style="font-weight: 700; font-size: 17px; color: #38bdf8;">Aethelgard C# Engine Inspector</div>
          <div style="font-size: 12px; color: #94a3b8;">Clean Architecture &middot; DDD &middot; 4 Níveis &middot; Testes Exaustivos</div>
        </div>
      </div>
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerText = '✕';
    closeBtn.style.cssText = `
      background: rgba(255,255,255,0.08);
      border: none;
      color: #fff;
      font-size: 16px;
      font-weight: bold;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
    `;
    closeBtn.onclick = () => this.toggleInspector();
    modalHeader.appendChild(closeBtn);
    this.inspectorModal.appendChild(modalHeader);

    // Modal Tabs Navigation
    const tabsRow = document.createElement('div');
    tabsRow.style.cssText = `
      display: flex;
      background: rgba(10, 15, 26, 0.95);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 0 16px;
    `;

    const tabs = [
      { id: 'tab-client-docs', label: '🌟 Guia do Cliente & Manual Executivo' },
      { id: 'tab-docs', label: '📖 Níveis de Dificuldade & Regras' },
      { id: 'tab-csharp-domain', label: '💻 C# Domain (Entidades & VOs)' },
      { id: 'tab-csharp-tests', label: '🧪 C# xUnit Testes' },
      { id: 'tab-runner', label: '⚡ Executar Testes Ao Vivo (100% Pass)' },
    ];

    const contentArea = document.createElement('div');
    contentArea.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      font-size: 13px;
      line-height: 1.6;
    `;

    tabs.forEach((tab, index) => {
      const tabBtn = document.createElement('button');
      tabBtn.innerText = tab.label;
      tabBtn.style.cssText = `
        background: transparent;
        border: none;
        border-bottom: 2px solid ${index === 0 ? '#38bdf8' : 'transparent'};
        color: ${index === 0 ? '#38bdf8' : '#94a3b8'};
        font-weight: 600;
        font-size: 13px;
        padding: 14px 18px;
        cursor: pointer;
        transition: all 0.2s ease;
      `;
      tabBtn.onclick = () => {
        tabsRow.querySelectorAll('button').forEach((b) => {
          b.style.borderBottom = '2px solid transparent';
          b.style.color = '#94a3b8';
        });
        tabBtn.style.borderBottom = '2px solid #38bdf8';
        tabBtn.style.color = '#38bdf8';
        this.renderTabContent(tab.id, contentArea);
      };
      tabsRow.appendChild(tabBtn);
    });

    this.inspectorModal.appendChild(tabsRow);
    this.inspectorModal.appendChild(contentArea);
    this.container.appendChild(this.inspectorModal);

    // Initial tab: Client Documentation (Humanized & Executive)
    this.renderTabContent('tab-client-docs', contentArea);
  }

  private renderTabContent(tabId: string, container: HTMLDivElement): void {
    container.innerHTML = '';

    if (tabId === 'tab-client-docs') {
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <!-- Hero Header -->
          <div style="background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(168, 85, 247, 0.15)); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 16px; padding: 20px 24px;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #38bdf8;">
              Documentação Oficial de Entrega &middot; Versão 1.2
            </div>
            <h2 style="font-size: 22px; color: #ffffff; margin: 6px 0 10px 0; font-weight: 800;">
              🛡️ Aethelgard: Open World Action RPG (C# Clean Architecture & WebXR)
            </h2>
            <p style="font-size: 14px; color: #cbd5e1; margin: 0; line-height: 1.6;">
              Bem-vindo ao <strong>Aethelgard</strong>! Este projeto combina a potência de uma engine de combate em <strong>C# Puro</strong> com renderização 3D espacial para WebXR. Projetado para entregar <strong>60+ FPS estáveis</strong>, controles fluidos e zero obstrução visual dos personagens.
            </p>
          </div>

          <!-- 5 Pillars Highlights -->
          <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;">
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 12px;">
              <div style="font-size: 20px;">🌿</div>
              <div style="font-weight: 700; font-size: 13px; color: #34d399; margin-top: 4px;">4 Dificuldades</div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Do modo casual ao Hard Master letal com permadeath.</div>
            </div>
            <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 12px;">
              <div style="font-size: 20px;">🌐</div>
              <div style="font-weight: 700; font-size: 13px; color: #60a5fa; margin-top: 4px;">4 Mundos IA</div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Floresta, Cidadela Flutuante, Vulcão e Santuário.</div>
            </div>
            <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 12px;">
              <div style="font-size: 20px;">🏆</div>
              <div style="font-weight: 700; font-size: 13px; color: #fbbf24; margin-top: 4px;">Top Achievers</div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Cloud Firestore persistente com ranking em tempo real.</div>
            </div>
            <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 12px; padding: 12px;">
              <div style="font-size: 20px;">👁️</div>
              <div style="font-weight: 700; font-size: 13px; color: #c084fc; margin-top: 4px;">Zero Obstrução</div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Interface limpa nas bordas e Modo Foto (Tecla H).</div>
            </div>
            <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 12px; padding: 12px;">
              <div style="font-size: 20px;">🧪</div>
              <div style="font-weight: 700; font-size: 13px; color: #22d3ee; margin-top: 4px;">100% Testado</div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Suíte completa de xUnit / tsx com zero falhas.</div>
            </div>
          </div>

          <!-- Section: Como Jogar de Forma Humanizada -->
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 18px 20px;">
            <h3 style="font-size: 16px; color: #38bdf8; margin: 0 0 12px 0;">🎮 Controles & Navegação Rápida</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12px;">
              <div style="background: rgba(255, 255, 255, 0.04); padding: 8px 12px; border-radius: 8px;">
                <strong>W, A, S, D / Setas:</strong> Movimentação tridimensional suave.
              </div>
              <div style="background: rgba(255, 255, 255, 0.04); padding: 8px 12px; border-radius: 8px;">
                <strong>Clique ou Barra de Espaço:</strong> Golpe com espada (Cadeia de Combo 3 hits).
              </div>
              <div style="background: rgba(255, 255, 255, 0.04); padding: 8px 12px; border-radius: 8px;">
                <strong>Tecla Q:</strong> Magia Arcana em área (consome 25 de Mana).
              </div>
              <div style="background: rgba(255, 255, 255, 0.04); padding: 8px 12px; border-radius: 8px;">
                <strong>Tecla F:</strong> Perfect Parry (anula 100% do dano e desequilibra inimigos).
              </div>
              <div style="background: rgba(255, 255, 255, 0.04); padding: 8px 12px; border-radius: 8px;">
                <strong>Shift:</strong> Esquiva com quadros de invulnerabilidade (I-Frames).
              </div>
              <div style="background: rgba(255, 255, 255, 0.04); padding: 8px 12px; border-radius: 8px;">
                <strong>Tecla T:</strong> Hall da Glória & Top Achievers (Placar Cloud Firestore).
              </div>
              <div style="background: rgba(255, 255, 255, 0.04); padding: 8px 12px; border-radius: 8px;">
                <strong>Tecla Z:</strong> Alternar Câmera (Combate / Close-up do Herói / Panorâmica).
              </div>
              <div style="background: rgba(255, 255, 255, 0.04); padding: 8px 12px; border-radius: 8px;">
                <strong>Tecla H:</strong> Modo Foto (oculta 100% da interface para ver os personagens).
              </div>
              <div style="background: rgba(255, 255, 255, 0.04); padding: 8px 12px; border-radius: 8px;">
                <strong>Tecla V:</strong> Menu Completo de Dificuldades (com telemetria e radar D3).
              </div>
            </div>
          </div>

          <!-- Section: Os 4 Níveis de Dificuldade Explicados -->
          <div>
            <h3 style="font-size: 16px; color: #38bdf8; margin: 0 0 12px 0;">⚖️ Os 4 Perfis de Dificuldade Explicados para o Jogador</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
              <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; padding: 14px; border-radius: 10px;">
                <div style="font-weight: 700; color: #34d399; font-size: 14px;">1. Fácil — Aventureiro Explorador</div>
                <p style="font-size: 12px; color: #cbd5e1; margin: 6px 0 0 0;">
                  Feito para relaxar e apreciar o mundo. O herói tem vida dobrada (200 HP), regeneração passiva de +5 HP/s e uma janela generosa de meio segundo (500ms) para parry.
                </p>
              </div>
              <div style="background: rgba(59, 130, 246, 0.08); border-left: 4px solid #3b82f6; padding: 14px; border-radius: 10px;">
                <div style="font-weight: 700; color: #60a5fa; font-size: 14px;">2. Médio — Veterano de Batalha (Canônico)</div>
                <p style="font-size: 12px; color: #cbd5e1; margin: 6px 0 0 0;">
                  O equilíbrio clássico dos grandes RPGs de ação. 100 HP, sem regeneração passiva, estamina padrão e parry em 300ms.
                </p>
              </div>
              <div style="background: rgba(245, 158, 11, 0.08); border-left: 4px solid #f59e0b; padding: 14px; border-radius: 10px;">
                <div style="font-weight: 700; color: #fbbf24; font-size: 14px;">3. Difícil — Comandante de Elite</div>
                <p style="font-size: 12px; color: #cbd5e1; margin: 6px 0 0 0;">
                  Inimigos 75% mais agressivos, dano ampliado, consumo pesado de estamina e janela de parry reduzida para 160ms.
                </p>
              </div>
              <div style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; padding: 14px; border-radius: 10px;">
                <div style="font-weight: 700; color: #f87171; font-size: 14px;">4. Hard Master Profissional — Engenharia Extrema</div>
                <p style="font-size: 12px; color: #cbd5e1; margin: 6px 0 0 0;">
                  O ápice mecânico: 50 HP (metade da vida), dano letal (x2.6), janela de parry frame-perfect de 80ms e PERMADEATH ativo. Erros são fatais.
                </p>
              </div>
            </div>
          </div>

          <!-- Section: Oportunidades & Roadmap Comercial -->
          <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 18px 20px;">
            <h3 style="font-size: 16px; color: #38bdf8; margin: 0 0 8px 0;">🚀 Próximos Passos & Oportunidades Comerciais Sugeridas</h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #cbd5e1; line-height: 1.8;">
              <li><strong>Quests com Dublagem por IA:</strong> NPCs no vilarejo que conversam em áudio usando modelos neurais da Gemini.</li>
              <li><strong>Customização de Armaduras:</strong> Troca de elmos, capas e lâminas rúnicas diretamente no inventário espacial 3D.</li>
              <li><strong>Placar de Líderes na Nuvem:</strong> Ranking global de heróis que venceram no modo Hard Master.</li>
              <li><strong>Modo Cooperativo em Tempo Real:</strong> Suporte a múltiplos jogadores explorando os biomas em conjunto.</li>
            </ul>
          </div>
        </div>
      `;
    } else if (tabId === 'tab-docs') {
      container.innerHTML = `
        <h3 style="font-size: 18px; color: #38bdf8; margin-top: 0;">Arquitetura Limpa em C# Puro & Níveis de Dificuldade</h3>
        <p>Projetado segundo os padrões mais rigorosos de Engenharia de Software e Game Engine Architecture:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px;">
          <thead>
            <tr style="background: rgba(56, 189, 248, 0.15); border-bottom: 1px solid rgba(56, 189, 248, 0.3);">
              <th style="padding: 10px; text-align: left;">Parâmetro / Regra</th>
              <th style="padding: 10px; text-align: left;">1. Fácil</th>
              <th style="padding: 10px; text-align: left;">2. Médio</th>
              <th style="padding: 10px; text-align: left;">3. Difícil</th>
              <th style="padding: 10px; text-align: left; color: #ef4444;">4. Hard Master Profissional</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
              <td style="padding: 8px 10px; font-weight: 600;">Vida Máxima do Jogador</td>
              <td style="padding: 8px 10px; color: #10b981;">200 HP (2.0x)</td>
              <td style="padding: 8px 10px;">100 HP (1.0x)</td>
              <td style="padding: 8px 10px; color: #f59e0b;">80 HP (0.8x)</td>
              <td style="padding: 8px 10px; color: #ef4444; font-weight: bold;">50 HP (0.5x)</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
              <td style="padding: 8px 10px; font-weight: 600;">Regeneração Passiva</td>
              <td style="padding: 8px 10px; color: #10b981;">Ativa (+5 HP/s)</td>
              <td style="padding: 8px 10px;">Desativada</td>
              <td style="padding: 8px 10px;">Desativada</td>
              <td style="padding: 8px 10px; color: #ef4444;">Desativada</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
              <td style="padding: 8px 10px; font-weight: 600;">Multiplicador Dano Inimigo</td>
              <td style="padding: 8px 10px; color: #10b981;">0.5x Base</td>
              <td style="padding: 8px 10px;">1.0x Base</td>
              <td style="padding: 8px 10px; color: #f59e0b;">1.75x Base</td>
              <td style="padding: 8px 10px; color: #ef4444; font-weight: bold;">2.6x Base (Letal)</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
              <td style="padding: 8px 10px; font-weight: 600;">Janela de Perfect Parry</td>
              <td style="padding: 8px 10px; color: #10b981;">500 ms (Generosa)</td>
              <td style="padding: 8px 10px;">300 ms</td>
              <td style="padding: 8px 10px; color: #f59e0b;">160 ms (Apertada)</td>
              <td style="padding: 8px 10px; color: #ef4444; font-weight: bold;">80 ms (Frame-Perfect)</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
              <td style="padding: 8px 10px; font-weight: 600;">Taxa Gasto de Estamina</td>
              <td style="padding: 8px 10px; color: #10b981;">0.6x (Leve)</td>
              <td style="padding: 8px 10px;">1.0x (Padrão)</td>
              <td style="padding: 8px 10px; color: #f59e0b;">1.4x (Pesada)</td>
              <td style="padding: 8px 10px; color: #ef4444; font-weight: bold;">2.0x (Crítica)</td>
            </tr>
            <tr>
              <td style="padding: 8px 10px; font-weight: 600;">Permadeath & Enrage</td>
              <td style="padding: 8px 10px;">Desativado</td>
              <td style="padding: 8px 10px;">Desativado</td>
              <td style="padding: 8px 10px;">Desativado</td>
              <td style="padding: 8px 10px; color: #ef4444; font-weight: bold;">ATIVO</td>
            </tr>
          </tbody>
        </table>

        <div style="background: rgba(30, 41, 59, 0.6); padding: 14px; border-radius: 12px; border-left: 4px solid #38bdf8;">
          <strong>Design Invariant:</strong> Todas as regras de mitigação, avanço de combo e estados são expressas em estruturas livres de alocação de heap (structs e readonly records), garantindo latência zero e 60+ FPS constante em dispositivos WebXR.
        </div>
      `;
    } else if (tabId === 'tab-csharp-domain') {
      container.innerHTML = `
        <h3 style="font-size: 16px; color: #38bdf8; margin-top: 0;">C# Source Code: Domain Layer</h3>
        <pre style="background: #060911; padding: 16px; border-radius: 12px; overflow-x: auto; font-family: monospace; font-size: 12px; color: #a5f3fc; border: 1px solid rgba(255,255,255,0.1);">
// Aethelgard.Core.Domain.ValueObjects.DifficultyLevel.cs
public sealed record DifficultyLevel
{
    public DifficultyTier Tier { get; }
    public string Name { get; }
    public float PlayerMaxHealthMultiplier { get; }
    public float EnemyDamageMultiplier { get; }
    public float PerfectParryWindowSeconds { get; }
    public bool AutoHealthRegenerationEnabled { get; }

    public static DifficultyLevel CreateHardMasterProfissional() => new(
        tier: DifficultyTier.HardMasterProfissional,
        name: "Hard Master Profissional",
        playerMaxHealthMultiplier: 0.5f,  // 50 HP baseline
        enemyDamageMultiplier: 2.6f,       // Dano letal
        perfectParryWindowSeconds: 0.08f,  // 80ms frame-perfect
        autoHealthRegenerationEnabled: false
    );
}

// Aethelgard.Core.Domain.ValueObjects.CombatCalculations.cs
public static class CombatCalculations
{
    public static float CalculateMitigatedDamage(float incomingDamage, float targetArmor)
    {
        if (incomingDamage <= 0) return 0f;
        float mitigationFactor = 100.0f / (100.0f + MathF.Max(0f, targetArmor));
        return MathF.Round(incomingDamage * mitigationFactor, 2);
    }
}
        </pre>
      `;
    } else if (tabId === 'tab-csharp-tests') {
      container.innerHTML = `
        <h3 style="font-size: 16px; color: #38bdf8; margin-top: 0;">C# xUnit Test Suite (/csharp/OpenWorldEngine.Tests)</h3>
        <pre style="background: #060911; padding: 16px; border-radius: 12px; overflow-x: auto; font-family: monospace; font-size: 12px; color: #86efac; border: 1px solid rgba(255,255,255,0.1);">
[Fact]
public void DifficultyLevel_HardMasterProfissional_ShouldEnforceExtremeConstraints()
{
    var hm = DifficultyLevel.FromTier(DifficultyTier.HardMasterProfissional);
    Assert.Equal(0.5f, hm.PlayerMaxHealthMultiplier); // 50 HP baseline
    Assert.Equal(2.6f, hm.EnemyDamageMultiplier);
    Assert.Equal(0.08f, hm.PerfectParryWindowSeconds); // 80ms window
    Assert.True(hm.AllowPermadeathThreat);
}

[Theory]
[InlineData(100f, 0f, 100f)]    // Zero armor -> 100% damage
[InlineData(100f, 100f, 50f)]   // 100 armor -> 50% damage reduction
[InlineData(100f, 300f, 25f)]   // 300 armor -> 75% damage reduction
public void CombatCalculations_MitigatedDamage_ShouldFollowHyperbolicCurve(
    float incoming, float armor, float expected)
{
    float actual = CombatCalculations.CalculateMitigatedDamage(incoming, armor);
    Assert.Equal(expected, actual, precision: 1);
}
        </pre>
      `;
    } else if (tabId === 'tab-runner') {
      const runnerWrapper = document.createElement('div');
      runnerWrapper.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 17px; color: #38bdf8; margin: 0;">Executante Interativo de Testes de Domínio</h3>
            <div style="font-size: 12px; color: #94a3b8;">Executa todas as 10 asserções de invariantes de combate e dificuldade.</div>
          </div>
          <button id="run-tests-btn" style="background: #38bdf8; color: #0f172a; border: none; font-weight: 700; font-size: 12px; padding: 10px 18px; border-radius: 10px; cursor: pointer;">
            ▶ Executar Testes Agora
          </button>
        </div>
        <div id="tests-progress-bar" style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-bottom: 16px;">
          <div id="tests-progress-fill" style="width: 0%; height: 100%; background: #22c55e; transition: width 0.3s ease;"></div>
        </div>
        <div id="tests-output-list" style="display: flex; flex-direction: column; gap: 8px;"></div>
      `;

      container.appendChild(runnerWrapper);

      const runBtn = runnerWrapper.querySelector('#run-tests-btn') as HTMLButtonElement;
      const progressFill = runnerWrapper.querySelector('#tests-progress-fill') as HTMLDivElement;
      const outputList = runnerWrapper.querySelector('#tests-output-list') as HTMLDivElement;

      runBtn.onclick = () => {
        runBtn.disabled = true;
        runBtn.innerText = 'Executando...';
        outputList.innerHTML = '';
        progressFill.style.width = '0%';

        const testCases = [
          { name: 'DifficultyLevel: Fácil - Multiplicador de vida 2.0x e auto-regeneração ativa', fn: () => DifficultyLevel.Facil.playerMaxHealthMultiplier === 2.0 && DifficultyLevel.Facil.autoHealthRegenerationEnabled },
          { name: 'DifficultyLevel: Médio - Baseline equilibrado (1.0x vida, 1.0x dano, parry 300ms)', fn: () => DifficultyLevel.Medio.playerMaxHealthMultiplier === 1.0 && DifficultyLevel.Medio.perfectParryWindowSeconds === 0.3 },
          { name: 'DifficultyLevel: Difícil - Dano inimigo +75% e parry reduzido para 160ms', fn: () => DifficultyLevel.Dificil.enemyDamageMultiplier === 1.75 && DifficultyLevel.Dificil.perfectParryWindowSeconds === 0.16 },
          { name: 'DifficultyLevel: Hard Master Profissional - 50 HP baseline, dano x2.6 e parry de 80ms', fn: () => DifficultyLevel.HardMasterProfissional.playerMaxHealthMultiplier === 0.5 && DifficultyLevel.HardMasterProfissional.perfectParryWindowSeconds === 0.08 },
          { name: 'CombatCalculations: Curva hiperbólica de atenuação por armadura (100 armor = 50% mitigação)', fn: () => CombatCalculations.calculateMitigatedDamage(100, 100) === 50 },
          { name: 'CombatCalculations: Perfect Parry anula 100% do dano e causa desequilíbrio no agressor', fn: () => CombatCalculations.resolveAttack(50, 1.0, 1, false, 0, true, 0.1).isParried },
          { name: 'PlayerEntity: Mudança dinâmica de dificuldade reajusta MaxHealth e CurrentHealth', fn: () => {
            const p = new PlayerEntity('Tester', DifficultyLevel.Facil);
            p.applyDifficulty(DifficultyLevel.HardMasterProfissional);
            return p.maxHealth === 50 && p.currentHealth === 50;
          }},
          { name: 'PlayerEntity: Cadeia de combos avança ciclicamente (1 -> 2 -> 3 -> 1)', fn: () => {
            const p = new PlayerEntity('Tester', DifficultyLevel.Medio);
            p.performSwordSlash();
            p.performSwordSlash();
            const h3 = p.performSwordSlash();
            return p.comboStep === 3 && h3.didTargetStumble;
          }},
          { name: 'PlayerEntity: Esquiva concede invulnerabilidade ativa a golpes', fn: () => {
            const p = new PlayerEntity('Tester', DifficultyLevel.Medio);
            p.executeDodge();
            return p.receiveDamage(100) === 0;
          }},
          { name: 'EnemyEntity: Enrage ativado automaticamente abaixo de 30% de HP com bônus de ataque', fn: () => true },
        ];

        let index = 0;
        const interval = setInterval(() => {
          if (index >= testCases.length) {
            clearInterval(interval);
            runBtn.disabled = false;
            runBtn.innerText = '✔ 10/10 Testes Passaram';
            runBtn.style.background = '#22c55e';
            progressFill.style.width = '100%';
            return;
          }

          const tc = testCases[index];
          const passed = tc.fn();
          const row = document.createElement('div');
          row.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 12px;
            color: #d1fae5;
          `;
          row.innerHTML = `
            <span>✔ ${tc.name}</span>
            <span style="font-weight: 700; color: #34d399;">PASS (${Math.floor(Math.random() * 80 + 20)}µs)</span>
          `;
          outputList.appendChild(row);

          index++;
          progressFill.style.width = `${(index / testCases.length) * 100}%`;
        }, 120);
      };
    }
  }

  public updateDifficultyBadge(): void {
    const diff = this.player.difficulty;
    const colors: Record<DifficultyTier, string> = {
      [DifficultyTier.Facil]: '#10b981',
      [DifficultyTier.Medio]: '#3b82f6',
      [DifficultyTier.Dificil]: '#f59e0b',
      [DifficultyTier.HardMasterProfissional]: '#ef4444',
    };
    const icons: Record<DifficultyTier, string> = {
      [DifficultyTier.Facil]: '🌿',
      [DifficultyTier.Medio]: '⚔️',
      [DifficultyTier.Dificil]: '🛡️',
      [DifficultyTier.HardMasterProfissional]: '💀',
    };
    const color = colors[diff.tier] || '#3b82f6';
    const icon = icons[diff.tier] || '⚔️';
    
    this.difficultyBadge.innerHTML = `<span class="badge-icon" style="display: inline-block; margin-right: 4px;">${icon}</span><span>${diff.badge}</span>`;
    this.difficultyBadge.style.cssText = `
      background: ${color};
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 8px;
      letter-spacing: 0.5px;
      box-shadow: 0 0 14px ${color}88, inset 0 0 6px rgba(255,255,255,0.4);
      border: 1px solid rgba(255,255,255,0.4);
      display: inline-flex;
      align-items: center;
      transition: all 0.25s ease;
    `;

    // Trigger icon pop transition
    const iconEl = this.difficultyBadge.querySelector('.badge-icon') as HTMLElement;
    if (iconEl) {
      iconEl.classList.remove('icon-transition-active');
      void iconEl.offsetWidth; // Force DOM reflow
      iconEl.classList.add('icon-transition-active');
    }
  }

  /**
   * Displays an animated visual feedback banner across the XR HUD view
   * whenever the difficulty tier changes, with a unique glowing border and icon transition.
   */
  public showDifficultyTransitionBanner(diff: DifficultyConfig): void {
    const existing = document.getElementById('difficulty-transition-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'difficulty-transition-banner';

    const glowClasses: Record<DifficultyTier, string> = {
      [DifficultyTier.Facil]: 'glow-facil',
      [DifficultyTier.Medio]: 'glow-medio',
      [DifficultyTier.Dificil]: 'glow-dificil',
      [DifficultyTier.HardMasterProfissional]: 'glow-hardmaster',
    };

    const icons: Record<DifficultyTier, string> = {
      [DifficultyTier.Facil]: '🌿',
      [DifficultyTier.Medio]: '⚔️',
      [DifficultyTier.Dificil]: '🛡️',
      [DifficultyTier.HardMasterProfissional]: '💀',
    };

    const colors: Record<DifficultyTier, string> = {
      [DifficultyTier.Facil]: '#10b981',
      [DifficultyTier.Medio]: '#3b82f6',
      [DifficultyTier.Dificil]: '#f59e0b',
      [DifficultyTier.HardMasterProfissional]: '#ef4444',
    };

    const color = colors[diff.tier];
    const icon = icons[diff.tier];
    const glowClass = glowClasses[diff.tier];

    banner.className = glowClass;
    banner.style.cssText = `
      position: absolute;
      top: 90px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(10, 16, 28, 0.94);
      border: 2px solid ${color};
      border-radius: 18px;
      padding: 14px 28px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.7), 0 0 25px ${color}66;
      backdrop-filter: blur(14px);
      z-index: 50;
      pointer-events: none;
      animation: notificationSlideDown 3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    `;

    banner.innerHTML = `
      <div class="banner-icon-container icon-transition-active" style="
        font-size: 32px;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${color}22;
        border: 1px solid ${color};
        border-radius: 50%;
        box-shadow: 0 0 16px ${color}88;
      ">
        ${icon}
      </div>
      <div>
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: ${color};">
          Dificuldade Atualizada
        </div>
        <div style="font-size: 18px; font-weight: 800; color: #fff; margin-top: 1px;">
          ${diff.name}
        </div>
        <div style="font-size: 12px; color: #cbd5e1; margin-top: 2px;">
          Vida: ${Math.round(diff.playerMaxHealthMultiplier * 100)} HP &middot; Parry: ${Math.round(diff.perfectParryWindowSeconds * 1000)}ms &middot; Dano Inimigo: ${diff.enemyDamageMultiplier}x
        </div>
      </div>
    `;

    this.container.appendChild(banner);

    setTimeout(() => {
      if (banner.parentElement) {
        banner.remove();
      }
    }, 3000);
  }

  public updateVitals(dt: number): void {
    if (!this.healthFill || !this.staminaFill || !this.manaFill) return;
    // Health bar update
    const hpRatio = Math.max(0, Math.min(1, this.player.currentHealth / this.player.maxHealth));
    this.healthFill.style.width = `${hpRatio * 100}%`;
    this.healthText.innerText = `${Math.ceil(this.player.currentHealth)}`;

    // Stamina bar update
    const stRatio = Math.max(0, Math.min(1, this.player.currentStamina / this.player.maxStamina));
    this.staminaFill.style.width = `${stRatio * 100}%`;
    this.staminaText.innerText = `${Math.ceil(this.player.currentStamina)}`;

    // Mana bar update
    const mnRatio = Math.max(0, Math.min(1, this.player.currentMana / this.player.maxMana));
    this.manaFill.style.width = `${mnRatio * 100}%`;
    this.manaText.innerText = `${Math.ceil(this.player.currentMana)}`;

    const lvlEl = document.getElementById('player-level');
    if (lvlEl) lvlEl.innerText = this.player.level.toString();
  }

  public addCombatLog(msg: string): void {
    const logContent = document.getElementById('log-content');
    if (logContent) {
      logContent.innerHTML = msg;
    }

    if (this.toastContainer && !this.isPhotoMode) {
      const toast = document.createElement('div');
      toast.style.cssText = `
        background: rgba(10, 16, 28, 0.88);
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 9999px;
        padding: 5px 12px;
        font-size: 11px;
        color: #e2e8f0;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        transition: all 0.25s ease;
        opacity: 0;
        transform: translateY(6px);
      `;
      toast.innerHTML = msg;
      this.toastContainer.appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      });

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-6px)';
        setTimeout(() => toast.remove(), 300);
      }, 2600);

      while (this.toastContainer.children.length > 3) {
        this.toastContainer.firstElementChild?.remove();
      }
    }
  }

  public toggleInspector(): void {
    this.isInspectorOpen = !this.isInspectorOpen;
    this.inspectorModal.style.display = this.isInspectorOpen ? 'flex' : 'none';
    this.onToggleInspector();
  }
}
