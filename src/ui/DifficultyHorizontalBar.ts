import { DifficultyTier, DifficultyConfig } from '../core/types.ts';
import { DifficultyLevel } from '../core/DifficultyLevel.ts';
import { GameStateManager } from '../core/GameStateManager.ts';
import { sound } from '../audio/SoundFx.ts';
import { renderDifficultyRadarChart } from './DifficultyRadarChart.ts';

/**
 * DifficultyHorizontalBar
 * 
 * Elegant glassmorphism horizontal container positioned directly above the main button.
 * Allows the user to switch seamlessly between all 4 difficulty levels:
 * - Fácil (🌿 Fácil - Aventureiro)
 * - Médio (⚔️ Médio - Veterano)
 * - Difícil (🛡️ Difícil - Comandante)
 * - Hard Master Profissional (👑 Hard Master - Engenharia Extrema)
 * 
 * Fully reactive: syncs with GameStateManager, audio feedback, and visual glowing effects.
 */
export class DifficultyHorizontalBar {
  private static instance: DifficultyHorizontalBar | null = null;
  private container: HTMLDivElement;
  private buttonsContainer: HTMLDivElement;
  private descContainer: HTMLDivElement;
  private buttons: Map<DifficultyTier, HTMLButtonElement> = new Map();
  private stateManager: GameStateManager = GameStateManager.getInstance();
  private observer: MutationObserver | null = null;

  private readonly difficulties = [
    {
      tier: DifficultyTier.Facil,
      name: 'Fácil',
      badge: '🌿',
      sub: 'Aventureiro',
      accentColor: '#10b981',
      glowClass: 'glow-facil',
      summary: '❤️ HP +100% · ⚡ Regeneração Ativa · 🛡️ Parry 500ms',
    },
    {
      tier: DifficultyTier.Medio,
      name: 'Médio',
      badge: '⚔️',
      sub: 'Veterano',
      accentColor: '#38bdf8',
      glowClass: 'glow-medio',
      summary: '⚔️ Canônico 1.0x · ⚡ Estamina Normal · 🛡️ Parry 300ms',
    },
    {
      tier: DifficultyTier.Dificil,
      name: 'Difícil',
      badge: '🛡️',
      sub: 'Comandante',
      accentColor: '#f59e0b',
      glowClass: 'glow-dificil',
      summary: '⚠️ Inimigos +75% Dano · Gasto Estamina 1.4x · 🛡️ Parry 160ms',
    },
    {
      tier: DifficultyTier.HardMasterProfissional,
      name: 'Hard Master',
      badge: '👑',
      sub: 'Profissional',
      accentColor: '#ef4444',
      glowClass: 'glow-hardmaster',
      summary: '💀 Dano Inimigo x2.6 · Parry 80ms · Perma-Death Threat',
    },
  ];

  private tooltipElement: HTMLDivElement;
  private currentHoveredTier: DifficultyTier | null = null;
  private tooltipTimeout: number | null = null;
  private keyboardHandler: ((e: KeyboardEvent) => void) | null = null;
  private compareAgainstHardMaster: boolean = false;
  private hideDebounceTimeout: number | null = null;

  public constructor() {
    this.container = document.createElement('div');
    this.container.id = 'xr-difficulty-horizontal-bar';
    this.container.className = 'xr-difficulty-horizontal-bar';

    // Floating Tooltip for hover details
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.className = 'xr-diff-tooltip';
    this.tooltipElement.innerHTML = '';
    this.container.appendChild(this.tooltipElement);

    // Keep tooltip visible when hovering over tooltip content (e.g., clicking checkbox)
    this.tooltipElement.addEventListener('mouseenter', () => {
      if (this.hideDebounceTimeout !== null) {
        window.clearTimeout(this.hideDebounceTimeout);
        this.hideDebounceTimeout = null;
      }
    });

    this.tooltipElement.addEventListener('mouseleave', () => {
      this.scheduleHideTooltip(250);
    });

    // Header label with accessibility indicator for arrow keys
    const headerLabel = document.createElement('div');
    headerLabel.className = 'xr-diff-bar-header';
    headerLabel.innerHTML = `
      <span class="xr-diff-header-icon">🎮</span>
      <span class="xr-diff-header-text">SELECIONE A DIFICULDADE</span>
      <span class="xr-diff-header-shortcut" title="Navegação rápida: use as setas ← e → do teclado">
        <kbd>←</kbd><kbd>→</kbd>
      </span>
    `;
    this.container.appendChild(headerLabel);

    // Horizontal buttons row
    this.buttonsContainer = document.createElement('div');
    this.buttonsContainer.className = 'xr-diff-buttons-row';
    this.container.appendChild(this.buttonsContainer);

    // Active summary description line
    this.descContainer = document.createElement('div');
    this.descContainer.className = 'xr-diff-bar-desc';
    this.container.appendChild(this.descContainer);

    // Build the 4 selectable buttons
    this.buildButtons();

    // Set initial state
    const currentDiff = this.stateManager.getDifficulty();
    this.updateActiveButton(currentDiff.tier);

    // Subscribe to state manager changes
    this.stateManager.subscribe((newState) => {
      this.updateActiveButton(newState.currentDifficulty.tier);
    });

    // Mount above the main button
    this.tryMount();

    // Setup keyboard listener for Left / Right arrow navigation
    this.setupKeyboardNavigation();
  }

  public static init(): DifficultyHorizontalBar {
    if (!DifficultyHorizontalBar.instance) {
      DifficultyHorizontalBar.instance = new DifficultyHorizontalBar();
    }
    return DifficultyHorizontalBar.instance;
  }

  public static getInstance(): DifficultyHorizontalBar | null {
    return DifficultyHorizontalBar.instance;
  }

  private buildButtons(): void {
    this.difficulties.forEach((diff) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'xr-diff-btn';
      btn.dataset.tier = diff.tier.toString();
      btn.setAttribute('aria-label', `${diff.name} - ${diff.sub}`);

      btn.innerHTML = `
        <span class="xr-diff-btn-icon">${diff.badge}</span>
        <span class="xr-diff-btn-name">${diff.name}</span>
        <span class="xr-diff-btn-tag" style="background: rgba(255,255,255,0.1); color: ${diff.accentColor};">${diff.sub}</span>
      `;

      // Click to select
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectDifficulty(diff.tier);
      });

      // Hover events to display rich tooltip
      btn.addEventListener('mouseenter', () => {
        if (this.hideDebounceTimeout !== null) {
          window.clearTimeout(this.hideDebounceTimeout);
          this.hideDebounceTimeout = null;
        }
        sound.playHoverSubtleTick();
        this.showTooltip(diff.tier, btn);
      });

      btn.addEventListener('mouseleave', () => {
        this.scheduleHideTooltip(250);
      });

      btn.addEventListener('focus', () => {
        if (this.hideDebounceTimeout !== null) {
          window.clearTimeout(this.hideDebounceTimeout);
          this.hideDebounceTimeout = null;
        }
        sound.playHoverSubtleTick();
        this.showTooltip(diff.tier, btn);
      });

      btn.addEventListener('blur', () => {
        this.scheduleHideTooltip(250);
      });

      this.buttons.set(diff.tier, btn);
      this.buttonsContainer.appendChild(btn);
    });
  }

  /**
   * Render and position the rich tooltip card directly above the hovered difficulty button.
   */
  private showTooltip(tier: DifficultyTier, buttonEl: HTMLButtonElement): void {
    const config = DifficultyLevel.fromTier(tier);
    const meta = this.difficulties.find((d) => d.tier === tier);
    if (!config || !meta) return;

    this.currentHoveredTier = tier;

    // Detailed stat representations
    const hpText = `${Math.round(100 * config.playerMaxHealthMultiplier)} HP (${config.playerMaxHealthMultiplier.toFixed(1)}x)`;
    const enemyDmgText = `${config.enemyDamageMultiplier.toFixed(2)}x ${config.enemyDamageMultiplier < 1 ? '(-50%)' : config.enemyDamageMultiplier > 1 ? `(+${Math.round((config.enemyDamageMultiplier - 1) * 100)}%)` : '(Normal)'}`;
    const parryText = `${Math.round(config.perfectParryWindowSeconds * 1000)}ms`;
    const staminaCostText = `${config.staminaConsumptionRateMultiplier.toFixed(1)}x`;
    const regenText = config.autoHealthRegenerationEnabled ? '✅ Ativa (+5 HP/s)' : '❌ Desativada';
    const permadeathText = config.allowPermadeathThreat ? '💀 ATIVA (Morte Permanente)' : '🛡️ Padrão (Sem Perda)';

    let impactHeadline = '';
    let impactDescription = '';

    switch (tier) {
      case DifficultyTier.Facil:
        impactHeadline = '🌿 Aventureiro Explorador · Modo Acessível';
        impactDescription = 'Projetado para apreciação cênica e gravação de gameplay. O herói resiste a erros consecutivos e sua vida se regenera continuamente.';
        break;
      case DifficultyTier.Medio:
        impactHeadline = '⚔️ Veterano de Batalha · Equilíbrio Canônico';
        impactDescription = 'O padrão autêntico dos clássicos de RPG de ação. Exige timing consciente de esquiva e ritmo tático de golpes.';
        break;
      case DifficultyTier.Dificil:
        impactHeadline = '🛡️ Comandante de Elite · Alto Desafio Tático';
        impactDescription = 'Inimigos atacam em bandos coordenados e desferem dano severo (+75%). Cada erro de posicionamento custa muito caro.';
        break;
      case DifficultyTier.HardMasterProfissional:
        impactHeadline = '👑 Hard Master · Engenharia Extrema & Perma-Death';
        impactDescription = 'Para jogadores profissionais e streamers hardcore. Vida cortada pela metade (50 HP), dano inimigo letal (2.6x) e janela de parry de 80ms.';
        break;
    }

    this.tooltipElement.innerHTML = `
      <div class="xr-diff-tooltip-header" style="border-bottom: 1px solid ${meta.accentColor}44;">
        <div class="xr-diff-tooltip-title-wrap">
          <span class="xr-diff-tooltip-badge">${meta.badge}</span>
          <span class="xr-diff-tooltip-title" style="color: ${meta.accentColor};">${meta.name}</span>
          <span class="xr-diff-tooltip-sub">${meta.sub}</span>
        </div>
        <span class="xr-diff-tooltip-tag" style="background: ${meta.accentColor}25; color: ${meta.accentColor}; border: 1px solid ${meta.accentColor}55;">
          ${tier === DifficultyTier.HardMasterProfissional ? '💀 HARDCORE' : 'GAMEPLAY'}
        </span>
      </div>

      <div class="xr-diff-tooltip-headline">${impactHeadline}</div>
      <div class="xr-diff-tooltip-desc">${impactDescription}</div>

      <!-- D3.js Radar Chart Visualization with Hard Master Overlay Checkbox -->
      <div class="xr-diff-radar-section">
        <div class="xr-diff-radar-header">
          <span class="xr-diff-radar-title">🕸️ RADAR DE PERFORMANCE (D3.JS)</span>
          <label class="xr-diff-radar-toggle-label" title="Alternar overlay para comparar diretamente contra a linha de base do Hard Master Profissional">
            <input type="checkbox" class="xr-diff-radar-toggle-checkbox" ${this.compareAgainstHardMaster ? 'checked' : ''} />
            <span class="xr-diff-toggle-box"></span>
            <span class="xr-diff-toggle-text">Comparar c/ Hard Master 👑</span>
          </label>
        </div>
        <div class="xr-diff-radar-legend" id="xr-diff-radar-legend">
          <span class="xr-legend-item">
            <span class="xr-legend-dot" style="background: ${meta.accentColor}; box-shadow: 0 0 6px ${meta.accentColor};"></span>
            ${meta.name}
          </span>
          <span class="xr-legend-item" id="xr-diff-radar-baseline-label">
            <span class="xr-legend-dot ${this.compareAgainstHardMaster ? 'xr-legend-hardmaster' : 'xr-legend-ghost'}"></span>
            ${this.compareAgainstHardMaster ? '👑 Hard Master (Letal)' : '⚔️ Médio (Canônico)'}
          </span>
        </div>
        <div class="xr-diff-radar-container"></div>
      </div>

      <div class="xr-diff-tooltip-grid">
        <div class="xr-diff-stat-item">
          <span class="xr-diff-stat-label">❤️ Vida do Herói</span>
          <span class="xr-diff-stat-value" style="color: ${meta.accentColor};">${hpText}</span>
        </div>
        <div class="xr-diff-stat-item">
          <span class="xr-diff-stat-label">⚔️ Dano Inimigo</span>
          <span class="xr-diff-stat-value" style="color: ${meta.accentColor};">${enemyDmgText}</span>
        </div>
        <div class="xr-diff-stat-item">
          <span class="xr-diff-stat-label">🛡️ Janela de Parry</span>
          <span class="xr-diff-stat-value" style="color: ${meta.accentColor};">${parryText}</span>
        </div>
        <div class="xr-diff-stat-item">
          <span class="xr-diff-stat-label">⚡ Custo de Estamina</span>
          <span class="xr-diff-stat-value">${staminaCostText}</span>
        </div>
        <div class="xr-diff-stat-item">
          <span class="xr-diff-stat-label">💖 Regeneração</span>
          <span class="xr-diff-stat-value">${regenText}</span>
        </div>
        <div class="xr-diff-stat-item">
          <span class="xr-diff-stat-label">⚠️ Risco de Morte</span>
          <span class="xr-diff-stat-value" style="color: ${config.allowPermadeathThreat ? '#ef4444' : '#94a3b8'};">${permadeathText}</span>
        </div>
      </div>

      <div class="xr-diff-tooltip-footer" style="color: ${meta.accentColor};">
        <span>Clique ou use as setas ← / → para ativar</span>
        <span>↵</span>
      </div>
    `;

    // Render D3 Radar Chart into container with current comparison setting
    const radarContainer = this.tooltipElement.querySelector('.xr-diff-radar-container') as HTMLElement | null;
    if (radarContainer) {
      renderDifficultyRadarChart(radarContainer, tier, meta.accentColor, this.compareAgainstHardMaster);
    }

    // Attach interactive listener to the Hard Master comparison checkbox
    const toggleCheckbox = this.tooltipElement.querySelector('.xr-diff-radar-toggle-checkbox') as HTMLInputElement | null;
    if (toggleCheckbox) {
      toggleCheckbox.addEventListener('change', (e) => {
        e.stopPropagation();
        this.compareAgainstHardMaster = toggleCheckbox.checked;
        sound.playHoverSubtleTick();

        if (radarContainer) {
          renderDifficultyRadarChart(radarContainer, tier, meta.accentColor, this.compareAgainstHardMaster);
        }

        const baselineLabel = this.tooltipElement.querySelector('#xr-diff-radar-baseline-label');
        if (baselineLabel) {
          baselineLabel.innerHTML = `
            <span class="xr-legend-dot ${this.compareAgainstHardMaster ? 'xr-legend-hardmaster' : 'xr-legend-ghost'}"></span>
            ${this.compareAgainstHardMaster ? '👑 Hard Master (Letal)' : '⚔️ Médio (Canônico)'}
          `;
        }
      });
    }

    // Position tooltip aligned with the hovered button
    const containerRect = this.container.getBoundingClientRect();
    const btnRect = buttonEl.getBoundingClientRect();
    const centerOffset = btnRect.left + btnRect.width / 2 - containerRect.left;

    this.tooltipElement.style.borderColor = `${meta.accentColor}88`;
    this.tooltipElement.style.boxShadow = `0 16px 40px rgba(0, 0, 0, 0.8), 0 0 30px ${meta.accentColor}33`;
    this.tooltipElement.style.left = `${centerOffset}px`;
    this.tooltipElement.classList.add('xr-diff-tooltip-visible');
  }

  private scheduleHideTooltip(delayMs: number = 250): void {
    if (this.hideDebounceTimeout !== null) {
      window.clearTimeout(this.hideDebounceTimeout);
    }
    this.hideDebounceTimeout = window.setTimeout(() => {
      // Only hide if the cursor is not hovering over the tooltip itself
      if (!this.tooltipElement.matches(':hover')) {
        this.hideTooltip();
      }
    }, delayMs);
  }

  private hideTooltip(): void {
    if (this.hideDebounceTimeout !== null) {
      window.clearTimeout(this.hideDebounceTimeout);
      this.hideDebounceTimeout = null;
    }
    if (this.tooltipTimeout !== null) {
      window.clearTimeout(this.tooltipTimeout);
      this.tooltipTimeout = null;
    }
    this.currentHoveredTier = null;
    this.tooltipElement.classList.remove('xr-diff-tooltip-visible');
  }

  public selectDifficulty(tier: DifficultyTier): void {
    const currentTier = this.stateManager.getDifficulty().tier;
    if (currentTier === tier) return;

    sound.playDifficultySwitch(tier);
    this.stateManager.setDifficulty(tier);
  }

  /**
   * Cycle smoothly through difficulty levels (Left / Right arrow keys).
   * Direction: 'next' (Right arrow) moves Fácil -> Médio -> Difícil -> Hard Master -> Fácil
   * Direction: 'prev' (Left arrow) moves Hard Master -> Difícil -> Médio -> Fácil -> Hard Master
   */
  public cycleDifficulty(direction: 'next' | 'prev'): void {
    const tiers = [
      DifficultyTier.Facil,
      DifficultyTier.Medio,
      DifficultyTier.Dificil,
      DifficultyTier.HardMasterProfissional,
    ];

    const currentTier = this.stateManager.getDifficulty().tier;
    const currentIndex = tiers.indexOf(currentTier);
    const validCurrentIndex = currentIndex >= 0 ? currentIndex : 1; // default to Médio

    let nextIndex: number;
    if (direction === 'next') {
      nextIndex = (validCurrentIndex + 1) % tiers.length;
    } else {
      nextIndex = (validCurrentIndex - 1 + tiers.length) % tiers.length;
    }

    const nextTier = tiers[nextIndex];
    this.selectDifficulty(nextTier);

    // Focus target button and display floating tooltip feedback for accessible navigation
    const targetBtn = this.buttons.get(nextTier);
    if (targetBtn) {
      targetBtn.focus();
      this.showTooltip(nextTier, targetBtn);

      if (this.tooltipTimeout !== null) {
        window.clearTimeout(this.tooltipTimeout);
      }
      this.tooltipTimeout = window.setTimeout(() => {
        if (!targetBtn.matches(':hover')) {
          this.hideTooltip();
        }
      }, 2200);
    }
  }

  /**
   * Global keyboard listener allowing Left and Right arrow keys to cycle difficulty levels.
   * Includes smart guards to avoid interfering with form fields or text inputs.
   */
  private setupKeyboardNavigation(): void {
    this.keyboardHandler = (e: KeyboardEvent) => {
      // Ignore if user is focused on an input, textarea or editable element
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if (e.code === 'ArrowRight' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.cycleDifficulty('next');
      } else if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft') {
        e.preventDefault();
        this.cycleDifficulty('prev');
      }
    };

    window.addEventListener('keydown', this.keyboardHandler);
  }

  private updateActiveButton(activeTier: DifficultyTier): void {
    this.difficulties.forEach((diff) => {
      const btn = this.buttons.get(diff.tier);
      if (!btn) return;

      const isSelected = diff.tier === activeTier;
      btn.classList.remove(
        'selected',
        'glow-facil',
        'glow-medio',
        'glow-dificil',
        'glow-hardmaster',
      );

      const iconEl = btn.querySelector('.xr-diff-btn-icon');
      if (iconEl) iconEl.classList.remove('icon-transition-active');

      if (isSelected) {
        btn.classList.add('selected');
        btn.classList.add(diff.glowClass);
        btn.style.borderColor = diff.accentColor;
        btn.style.background = `linear-gradient(135deg, ${diff.accentColor}33 0%, ${diff.accentColor}66 100%)`;
        btn.style.color = '#ffffff';

        if (iconEl) {
          // Trigger pop transition animation
          void (iconEl as HTMLElement).offsetWidth; // reflow
          iconEl.classList.add('icon-transition-active');
        }

        // Update active summary description
        this.descContainer.innerHTML = `
          <span style="color: ${diff.accentColor}; font-weight: 700;">${diff.badge} ${diff.name}:</span>
          <span>${diff.summary}</span>
        `;
      } else {
        btn.style.borderColor = 'rgba(255, 255, 255, 0.12)';
        btn.style.background = 'rgba(255, 255, 255, 0.05)';
        btn.style.color = '#94a3b8';
      }
    });
  }

  private tryMount(): boolean {
    const xrWrapper = document.getElementById('XRButtonWrapper');
    const xrButton = xrWrapper?.querySelector('.XRButton');

    if (xrWrapper && xrButton) {
      if (!xrWrapper.contains(this.container)) {
        xrWrapper.insertBefore(this.container, xrButton);
      }
      return true;
    }

    // If not mounted yet, observe DOM for the creation of XRButtonWrapper
    if (!this.observer) {
      this.observer = new MutationObserver(() => {
        const wrapper = document.getElementById('XRButtonWrapper');
        const btn = wrapper?.querySelector('.XRButton');
        if (wrapper && btn) {
          if (!wrapper.contains(this.container)) {
            wrapper.insertBefore(this.container, btn);
          }
          if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
          }
        }
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    return false;
  }

  public getContainer(): HTMLDivElement {
    return this.container;
  }
}
