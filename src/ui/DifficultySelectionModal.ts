import { DifficultyLevel } from '../core/DifficultyLevel.ts';
import { DifficultyTier, DifficultyConfig } from '../core/types.ts';
import { GameStateManager } from '../core/GameStateManager.ts';
import { sound } from '../audio/SoundFx.ts';

export class DifficultySelectionModal {
  private container: HTMLDivElement;
  private stateManager: GameStateManager;
  private selectedTier: DifficultyTier;
  private isOpen: boolean = false;
  private onAppliedCallback?: (newTier: DifficultyTier) => void;

  // Cache of cards
  private cardElements: Map<DifficultyTier, HTMLDivElement> = new Map();
  private statsComparisonContainer!: HTMLDivElement;

  constructor(onApplied?: (newTier: DifficultyTier) => void) {
    this.stateManager = GameStateManager.getInstance();
    this.selectedTier = this.stateManager.getDifficulty().tier;
    this.onAppliedCallback = onApplied;

    this.container = document.createElement('div');
    this.container.id = 'difficulty-selection-modal';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(4, 7, 14, 0.85);
      backdrop-filter: blur(16px);
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      user-select: none;
      font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #fff;
      padding: 20px;
      box-sizing: border-box;
      transition: opacity 0.25s ease;
    `;

    document.body.appendChild(this.container);
    this.render();

    // Listen to state changes externally to stay in sync
    this.stateManager.subscribe((newState) => {
      this.selectedTier = newState.currentDifficulty.tier;
      this.updateCardSelectionVisuals();
    });
  }

  private render(): void {
    this.container.innerHTML = '';

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: #0b111e;
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 20px;
      width: 100%;
      max-width: 960px;
      max-height: 82vh;
      overflow-y: auto;
      box-shadow: 0 25px 80px rgba(0,0,0,0.85), 0 0 40px rgba(56, 189, 248, 0.2);
      display: flex;
      flex-direction: column;
      padding: 22px 26px;
      box-sizing: border-box;
      gap: 16px;
      margin-bottom: 30px;
    `;

    // Modal Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 20px;
    `;

    header.innerHTML = `
      <div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 28px;">⚙️</span>
          <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #f8fafc; letter-spacing: -0.5px;">
            Seleção de Nível de Dificuldade
          </h2>
          <span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">
            Clean Architecture State Store
          </span>
        </div>
        <p style="margin: 6px 0 0 0; font-size: 14px; color: #94a3b8; line-height: 20px;">
          Escolha o perfil de desafio tático de combate. A escolha é gerenciada de forma reativa pelo <code>GameStateManager</code> e persistida no navegador.
        </p>
      </div>
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerText = '✕';
    closeBtn.ariaLabel = 'Fechar modal';
    closeBtn.style.cssText = `
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #94a3b8;
      font-size: 16px;
      font-weight: bold;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    `;
    closeBtn.onmouseenter = () => {
      closeBtn.style.background = 'rgba(239, 68, 68, 0.2)';
      closeBtn.style.color = '#ef4444';
    };
    closeBtn.onmouseleave = () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.08)';
      closeBtn.style.color = '#94a3b8';
    };
    closeBtn.onclick = () => this.close();
    header.appendChild(closeBtn);
    dialog.appendChild(header);

    // 4 Cards Grid
    const cardsGrid = document.createElement('div');
    cardsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
    `;

    const allDiffs = [
      {
        config: DifficultyLevel.Facil,
        icon: '🌿',
        subtitle: 'Aventureiro Explorador',
        color: '#10b981',
        badges: ['200 HP', 'Regen Ativa', 'Parry 500ms', 'Estamina 0.6x'],
      },
      {
        config: DifficultyLevel.Medio,
        icon: '⚔️',
        subtitle: 'Veterano de Batalha',
        color: '#3b82f6',
        badges: ['100 HP', 'Padrão Canônico', 'Parry 300ms', 'Estamina 1.0x'],
      },
      {
        config: DifficultyLevel.Dificil,
        icon: '🛡️',
        subtitle: 'Comandante de Elite',
        color: '#f59e0b',
        badges: ['80 HP', 'Inimigos +75% Dmg', 'Parry 160ms', 'Estamina 1.4x'],
      },
      {
        config: DifficultyLevel.HardMasterProfissional,
        icon: '💀',
        subtitle: 'Engenharia Extrema (Pro)',
        color: '#ef4444',
        badges: ['50 HP', 'Dano x2.6 (Letal)', 'Parry 80ms', 'Permadeath & Enrage'],
      },
    ];

    allDiffs.forEach(({ config, icon, subtitle, color, badges }) => {
      const card = document.createElement('div');
      card.dataset.tier = config.tier.toString();
      card.style.cssText = `
        background: rgba(15, 23, 42, 0.7);
        border: 2px solid ${this.selectedTier === config.tier ? color : 'rgba(255, 255, 255, 0.1)'};
        border-radius: 18px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
        overflow: hidden;
        box-shadow: ${this.selectedTier === config.tier ? `0 10px 30px ${color}33, 0 0 15px ${color}44` : 'none'};
      `;

      card.onmouseenter = () => {
        if (this.selectedTier !== config.tier) {
          card.style.borderColor = color;
          card.style.transform = 'translateY(-4px)';
          card.style.background = 'rgba(30, 41, 59, 0.8)';
        }
      };

      card.onmouseleave = () => {
        if (this.selectedTier !== config.tier) {
          card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          card.style.transform = 'translateY(0)';
          card.style.background = 'rgba(15, 23, 42, 0.7)';
        }
      };

      card.onclick = () => {
        this.selectedTier = config.tier;
        sound.playParryClang();
        this.updateCardSelectionVisuals();
        this.updateStatsComparison(config);
      };

      card.innerHTML = `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div class="card-icon" style="font-size: 34px; display: inline-block; transition: transform 0.4s ease;">${icon}</div>
            <span class="active-badge" style="
              display: ${this.selectedTier === config.tier ? 'inline-block' : 'none'};
              background: ${color};
              color: #fff;
              font-size: 10px;
              font-weight: 800;
              padding: 4px 8px;
              border-radius: 6px;
              letter-spacing: 0.5px;
            ">
              ✔ ATIVO
            </span>
          </div>

          <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: #fff; letter-spacing: 0.3px;">
            ${config.badge}
          </h3>
          <div style="font-size: 12px; font-weight: 600; color: ${color}; margin-top: 2px;">
            ${subtitle}
          </div>

          <p style="font-size: 12px; color: #94a3b8; line-height: 18px; margin: 12px 0;">
            ${config.description}
          </p>
        </div>

        <div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px;">
            ${badges
              .map(
                (b) => `
              <span style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; font-size: 10px; font-weight: 600; padding: 3px 6px; border-radius: 6px;">
                ${b}
              </span>
            `,
              )
              .join('')}
          </div>
        </div>
      `;

      this.cardElements.set(config.tier, card);
      cardsGrid.appendChild(card);
    });

    dialog.appendChild(cardsGrid);

    // Live Stats Comparison Preview Section
    this.statsComparisonContainer = document.createElement('div');
    this.statsComparisonContainer.style.cssText = `
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;
    dialog.appendChild(this.statsComparisonContainer);
    this.updateStatsComparison(DifficultyLevel.fromTier(this.selectedTier));

    // Footer with Action Buttons
    const footer = document.createElement('div');
    footer.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 20px;
    `;

    footer.innerHTML = `
      <div style="font-size: 13px; color: #94a3b8;">
        Dica: Você também pode usar as teclas numéricas <kbd style="background: #1e293b; padding: 2px 6px; border-radius: 4px; border: 1px solid #334155;">1</kbd>, <kbd style="background: #1e293b; padding: 2px 6px; border-radius: 4px; border: 1px solid #334155;">2</kbd>, <kbd style="background: #1e293b; padding: 2px 6px; border-radius: 4px; border: 1px solid #334155;">3</kbd>, <kbd style="background: #1e293b; padding: 2px 6px; border-radius: 4px; border: 1px solid #334155;">4</kbd> em tempo real.
      </div>
    `;

    const buttonGroup = document.createElement('div');
    buttonGroup.style.cssText = 'display: flex; gap: 12px;';

    const cancelBtn = document.createElement('button');
    cancelBtn.innerText = 'Cancelar';
    cancelBtn.style.cssText = `
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      font-weight: 600;
      font-size: 13px;
      padding: 12px 20px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    cancelBtn.onclick = () => this.close();

    const applyBtn = document.createElement('button');
    applyBtn.innerText = 'Confirmar & Aplicar no Jogo';
    applyBtn.style.cssText = `
      background: linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%);
      border: none;
      color: #0b111e;
      font-weight: 800;
      font-size: 13px;
      padding: 12px 28px;
      border-radius: 12px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(56, 189, 248, 0.4);
      transition: all 0.2s ease;
    `;
    applyBtn.onmouseenter = () => {
      applyBtn.style.transform = 'translateY(-2px)';
      applyBtn.style.boxShadow = '0 6px 20px rgba(56, 189, 248, 0.6)';
    };
    applyBtn.onmouseleave = () => {
      applyBtn.style.transform = 'translateY(0)';
      applyBtn.style.boxShadow = '0 4px 15px rgba(56, 189, 248, 0.4)';
    };
    applyBtn.onclick = () => {
      this.applySelection();
    };

    buttonGroup.appendChild(cancelBtn);
    buttonGroup.appendChild(applyBtn);
    footer.appendChild(buttonGroup);
    dialog.appendChild(footer);

    this.container.appendChild(dialog);
  }

  private updateCardSelectionVisuals(): void {
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

    this.cardElements.forEach((card, tier) => {
      const isSelected = tier === this.selectedTier;
      const color = colors[tier];
      card.classList.remove('glow-facil', 'glow-medio', 'glow-dificil', 'glow-hardmaster');

      const iconEl = card.querySelector('.card-icon') as HTMLElement;
      if (iconEl) {
        iconEl.classList.remove('icon-transition-active');
      }

      if (isSelected) {
        card.style.borderColor = color;
        card.style.background = 'rgba(20, 32, 54, 0.9)';
        card.style.transform = 'scale(1.02)';
        card.classList.add(glowClasses[tier]);

        if (iconEl) {
          void iconEl.offsetWidth; // Force reflow to retrigger animation
          iconEl.classList.add('icon-transition-active');
        }
      } else {
        card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        card.style.boxShadow = 'none';
        card.style.background = 'rgba(15, 23, 42, 0.7)';
        card.style.transform = 'scale(1.0)';
      }

      const badge = card.querySelector('.active-badge') as HTMLElement;
      if (badge) {
        badge.style.display = isSelected ? 'inline-block' : 'none';
      }
    });

    this.updateStatsComparison(DifficultyLevel.fromTier(this.selectedTier));
  }

  private updateStatsComparison(config: DifficultyConfig): void {
    if (!this.statsComparisonContainer) return;

    const hpPercent = (config.playerMaxHealthMultiplier / 2.0) * 100;
    const enemyDmgPercent = (config.enemyDamageMultiplier / 2.6) * 100;
    const parryPercent = (config.perfectParryWindowSeconds / 0.5) * 100;
    const staminaDrainPercent = (config.staminaConsumptionRateMultiplier / 2.0) * 100;

    this.statsComparisonContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 700; font-size: 14px; color: #e2e8f0;">
          📊 Comparativo de Telemetria: <span style="color: #38bdf8;">${config.name}</span>
        </span>
        <span style="font-size: 12px; color: #94a3b8;">
          Regra de Permadeath: <strong style="color: ${config.allowPermadeathThreat ? '#ef4444' : '#10b981'};">${config.allowPermadeathThreat ? 'ATIVADO (Letal)' : 'DESATIVADO'}</strong>
        </span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 8px;">
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
            <span style="color: #cbd5e1;">Vida Base Jogador</span>
            <span style="font-weight: 700; color: #ef4444;">${Math.round(100 * config.playerMaxHealthMultiplier)} HP</span>
          </div>
          <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
            <div style="width: ${hpPercent}%; height: 100%; background: #ef4444; border-radius: 3px;"></div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
            <span style="color: #cbd5e1;">Agressão & Dano Inimigo</span>
            <span style="font-weight: 700; color: #f59e0b;">${config.enemyDamageMultiplier}x</span>
          </div>
          <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
            <div style="width: ${enemyDmgPercent}%; height: 100%; background: #f59e0b; border-radius: 3px;"></div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
            <span style="color: #cbd5e1;">Janela de Perfect Parry</span>
            <span style="font-weight: 700; color: #10b981;">${Math.round(config.perfectParryWindowSeconds * 1000)} ms</span>
          </div>
          <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
            <div style="width: ${parryPercent}%; height: 100%; background: #10b981; border-radius: 3px;"></div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
            <span style="color: #cbd5e1;">Consumo de Estamina</span>
            <span style="font-weight: 700; color: #8b5cf6;">${config.staminaConsumptionRateMultiplier}x</span>
          </div>
          <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
            <div style="width: ${staminaDrainPercent}%; height: 100%; background: #8b5cf6; border-radius: 3px;"></div>
          </div>
        </div>
      </div>
    `;
  }

  public applySelection(): void {
    this.stateManager.setDifficulty(this.selectedTier);
    sound.playDifficultySwitch(this.selectedTier);
    this.onAppliedCallback?.(this.selectedTier);
    this.close();
  }

  public open(): void {
    this.selectedTier = this.stateManager.getDifficulty().tier;
    this.updateCardSelectionVisuals();
    this.container.style.display = 'flex';
    this.isOpen = true;
  }

  public close(): void {
    this.container.style.display = 'none';
    this.isOpen = false;
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}
