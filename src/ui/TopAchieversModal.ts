import { DifficultyTier } from '../core/types.ts';
import { PlayerEntity } from '../core/PlayerEntity.ts';
import { firebaseService, AchieverScore } from '../services/firebaseService.ts';
import { sound } from '../audio/SoundFx.ts';

export class TopAchieversModal {
  private modalContainer: HTMLDivElement;
  private isOpen: boolean = false;
  private currentTierFilter: DifficultyTier | null = null;
  private player: PlayerEntity;
  private listContainer!: HTMLDivElement;
  private statsBanner!: HTMLDivElement;
  private nameInput!: HTMLInputElement;
  private statusMessage!: HTMLDivElement;
  private onNotification?: (msg: string) => void;

  constructor(player: PlayerEntity, onNotification?: (msg: string) => void) {
    this.player = player;
    this.onNotification = onNotification;

    this.modalContainer = document.createElement('div');
    this.modalContainer.id = 'top-achievers-modal';
    this.modalContainer.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.96);
      width: 92%;
      max-width: 920px;
      height: 84%;
      max-height: 680px;
      background: #090e1a;
      border: 1px solid rgba(245, 158, 11, 0.45);
      border-radius: 20px;
      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.85), 0 0 35px rgba(245, 158, 11, 0.2);
      backdrop-filter: blur(18px);
      pointer-events: auto;
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 120;
      color: #e2e8f0;
      font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    this.renderHeader();
    this.renderHeroStatusBar();
    this.renderFilterTabs();
    this.renderListArea();
    this.renderFooter();

    document.body.appendChild(this.modalContainer);
  }

  private renderHeader(): void {
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: rgba(15, 23, 42, 0.9);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;

    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 28px;">🏆</span>
        <div>
          <div style="font-weight: 800; font-size: 19px; color: #fbbf24; letter-spacing: 0.5px;">
            Top Achievers &middot; Hall da Glória de Aethelgard
          </div>
          <div style="font-size: 12px; color: #94a3b8;">
            Banco de Dados Firestore em Tempo Real &middot; Registros de Bravura por Dificuldade
          </div>
        </div>
      </div>
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerText = '✕';
    closeBtn.title = 'Fechar Hall da Glória';
    closeBtn.style.cssText = `
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
      font-size: 15px;
      font-weight: bold;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    `;
    closeBtn.onclick = () => this.close();
    header.appendChild(closeBtn);
    this.modalContainer.appendChild(header);
  }

  private renderHeroStatusBar(): void {
    this.statsBanner = document.createElement('div');
    this.statsBanner.style.cssText = `
      background: linear-gradient(90deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95));
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    `;

    this.updateHeroStatusContent();
    this.modalContainer.appendChild(this.statsBanner);
  }

  private updateHeroStatusContent(): void {
    const currentScore = firebaseService.calculateScore(this.player);
    const heroName = firebaseService.getPlayerName();

    this.statsBanner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="font-size: 13px;">
          <span style="color: #94a3b8;">Herói Ativo:</span>
          <strong style="color: #38bdf8; font-size: 14px; margin-left: 4px;">${heroName}</strong>
          <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-left: 6px;">Nv. ${this.player.level}</span>
        </div>
        <div style="font-size: 13px;">
          <span style="color: #94a3b8;">Dificuldade:</span>
          <span style="color: #fbbf24; font-weight: 700; margin-left: 4px;">${this.player.difficulty.name}</span>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 18px; font-size: 12px;">
        <div>💀 <strong style="color: #fff;">${this.player.enemiesDefeated}</strong> Inimigos</div>
        <div>🛡️ <strong style="color: #fff;">${this.player.parriesPerformed}</strong> Parries</div>
        <div>⚔️ <strong style="color: #fff;">${this.player.combosExecuted}</strong> Combos</div>
        <div>⏱️ <strong style="color: #fff;">${Math.floor(this.player.survivalSeconds)}s</strong> Sobrevivência</div>
        <div style="background: rgba(245, 158, 11, 0.2); border: 1px solid #f59e0b; padding: 4px 10px; border-radius: 8px;">
          Pontos: <strong style="color: #fbbf24; font-size: 14px;">${currentScore}</strong>
        </div>
      </div>
    `;
  }

  private renderFilterTabs(): void {
    const filterRow = document.createElement('div');
    filterRow.style.cssText = `
      display: flex;
      background: rgba(10, 16, 28, 0.9);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 6px 20px;
      gap: 8px;
      overflow-x: auto;
    `;

    const filters = [
      { tier: null, label: '🌐 Todos os Níveis', icon: '' },
      { tier: DifficultyTier.Facil, label: '🌿 Fácil', icon: '' },
      { tier: DifficultyTier.Medio, label: '⚔️ Médio', icon: '' },
      { tier: DifficultyTier.Dificil, label: '🛡️ Difícil', icon: '' },
      { tier: DifficultyTier.HardMasterProfissional, label: '👑 Hard Master', icon: '' },
    ];

    filters.forEach(({ tier, label }) => {
      const btn = document.createElement('button');
      btn.innerText = label;
      btn.dataset.tier = tier !== null ? tier.toString() : 'all';
      btn.style.cssText = `
        background: ${this.currentTierFilter === tier ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.06)'};
        border: 1px solid ${this.currentTierFilter === tier ? '#f59e0b' : 'rgba(255, 255, 255, 0.12)'};
        color: ${this.currentTierFilter === tier ? '#fbbf24' : '#cbd5e1'};
        font-weight: 700;
        font-size: 11px;
        padding: 7px 14px;
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
      `;
      btn.onclick = () => {
        this.currentTierFilter = tier;
        filterRow.querySelectorAll('button').forEach((b) => {
          const isSelected = b === btn;
          (b as HTMLButtonElement).style.background = isSelected ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.06)';
          (b as HTMLButtonElement).style.borderColor = isSelected ? '#f59e0b' : 'rgba(255, 255, 255, 0.12)';
          (b as HTMLButtonElement).style.color = isSelected ? '#fbbf24' : '#cbd5e1';
        });
        this.loadAndDisplayAchievers();
      };
      filterRow.appendChild(btn);
    });

    this.modalContainer.appendChild(filterRow);
  }

  private renderListArea(): void {
    this.listContainer = document.createElement('div');
    this.listContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
    this.modalContainer.appendChild(this.listContainer);
  }

  private renderFooter(): void {
    const footer = document.createElement('div');
    footer.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 24px;
      background: rgba(15, 23, 42, 0.95);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      gap: 12px;
      flex-wrap: wrap;
    `;

    // Left: Hero Name Input Field
    const nameSection = document.createElement('div');
    nameSection.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    nameSection.innerHTML = `<span style="font-size: 12px; color: #94a3b8;">Seu Nome:</span>`;

    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.value = firebaseService.getPlayerName();
    this.nameInput.maxLength = 24;
    this.nameInput.placeholder = 'Nome do Herói';
    this.nameInput.style.cssText = `
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: #fff;
      font-size: 12px;
      padding: 6px 10px;
      outline: none;
      width: 140px;
    `;
    this.nameInput.onchange = () => {
      firebaseService.setPlayerName(this.nameInput.value);
      this.player.name = this.nameInput.value;
      this.updateHeroStatusContent();
    };
    nameSection.appendChild(this.nameInput);

    this.statusMessage = document.createElement('div');
    this.statusMessage.style.cssText = `
      font-size: 11px;
      color: #34d399;
      font-weight: 600;
      margin-left: 6px;
    `;
    nameSection.appendChild(this.statusMessage);
    footer.appendChild(nameSection);

    // Right: Action buttons
    const actions = document.createElement('div');
    actions.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
    `;

    // Button: Gravar Conquista Atual (Submit High Score)
    const submitBtn = document.createElement('button');
    submitBtn.innerHTML = '⚡ <span>Gravar Conquista no Firestore</span>';
    submitBtn.title = 'Enviar pontuação atual da sessão para o ranking global';
    submitBtn.style.cssText = `
      background: linear-gradient(135deg, #f59e0b, #d97706);
      border: none;
      color: #0f172a;
      font-weight: 800;
      font-size: 12px;
      padding: 9px 18px;
      border-radius: 9999px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
      transition: all 0.2s ease;
    `;
    submitBtn.onclick = async () => {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Gravando...';
      const result = await firebaseService.submitAchieverScore(this.player);
      await firebaseService.savePlayerProgress(this.player);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '⚡ <span>Gravar Conquista no Firestore</span>';

      if (result) {
        sound.playVictoryChime();
        this.statusMessage.innerText = '✔ Conquista registrada com sucesso!';
        this.onNotification?.(`🏆 Conquista de <strong>${result.score} pts</strong> gravada no Firestore!`);
        setTimeout(() => (this.statusMessage.innerText = ''), 3500);
        this.loadAndDisplayAchievers();
      } else {
        this.statusMessage.innerText = 'Conquista salva localmente.';
        this.loadAndDisplayAchievers();
      }
    };
    actions.appendChild(submitBtn);

    // Button: Salvar Progresso
    const saveBtn = document.createElement('button');
    saveBtn.innerHTML = '💾 <span>Salvar Progresso</span>';
    saveBtn.title = 'Salvar nível e atributos no Firestore';
    saveBtn.style.cssText = `
      background: rgba(56, 189, 248, 0.2);
      border: 1px solid #38bdf8;
      color: #38bdf8;
      font-weight: 700;
      font-size: 12px;
      padding: 8px 14px;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.15s ease;
    `;
    saveBtn.onclick = async () => {
      saveBtn.disabled = true;
      saveBtn.innerText = 'Salvando...';
      const ok = await firebaseService.savePlayerProgress(this.player);
      saveBtn.disabled = false;
      saveBtn.innerHTML = '💾 <span>Salvar Progresso</span>';
      this.statusMessage.innerText = ok ? '✔ Progresso salvo no Cloud Firestore!' : 'Progresso salvo localmente.';
      this.onNotification?.('💾 Progresso do Herói salvo no Cloud Firestore!');
      setTimeout(() => (this.statusMessage.innerText = ''), 3500);
    };
    actions.appendChild(saveBtn);

    // Button: Recarregar
    const refreshBtn = document.createElement('button');
    refreshBtn.innerHTML = '🔄';
    refreshBtn.title = 'Recarregar Placar';
    refreshBtn.style.cssText = `
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
      font-size: 13px;
      padding: 8px 10px;
      border-radius: 50%;
      cursor: pointer;
    `;
    refreshBtn.onclick = () => this.loadAndDisplayAchievers();
    actions.appendChild(refreshBtn);

    footer.appendChild(actions);
    this.modalContainer.appendChild(footer);
  }

  public async loadAndDisplayAchievers(): Promise<void> {
    this.listContainer.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 160px; color: #94a3b8; font-size: 13px;">
        Carregando Top Achievers do Firestore...
      </div>
    `;

    const filter = this.currentTierFilter !== null ? this.currentTierFilter : undefined;
    const achievers = await firebaseService.getTopAchievers(filter);

    this.listContainer.innerHTML = '';

    if (achievers.length === 0) {
      this.listContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #94a3b8;">
          Nenhum herói registrado ainda nesta dificuldade. Seja o primeiro a gravar uma conquista!
        </div>
      `;
      return;
    }

    achievers.forEach((item, index) => {
      const row = this.createAchieverRow(item, index + 1);
      this.listContainer.appendChild(row);
    });
  }

  private createAchieverRow(achiever: AchieverScore, rank: number): HTMLDivElement {
    const row = document.createElement('div');
    const isTop3 = rank <= 3;
    const rankBadges = ['🥇 1º', '🥈 2º', '🥉 3º'];
    const rankLabel = isTop3 ? rankBadges[rank - 1] : `${rank}º`;

    const tierColors: Record<number, string> = {
      [DifficultyTier.Facil]: '#10b981',
      [DifficultyTier.Medio]: '#3b82f6',
      [DifficultyTier.Dificil]: '#f59e0b',
      [DifficultyTier.HardMasterProfissional]: '#ef4444',
    };
    const tierColor = tierColors[achiever.difficultyTier] || '#3b82f6';

    const bg = isTop3
      ? rank === 1
        ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.2), rgba(15, 23, 42, 0.9))'
        : 'rgba(255, 255, 255, 0.05)'
      : 'rgba(255, 255, 255, 0.02)';

    row.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: ${bg};
      border: 1px solid ${isTop3 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(255, 255, 255, 0.08)'};
      border-radius: 12px;
      transition: all 0.15s ease;
      gap: 12px;
    `;

    row.onmouseenter = () => {
      row.style.background = 'rgba(245, 158, 11, 0.12)';
      row.style.transform = 'scale(1.008)';
    };
    row.onmouseleave = () => {
      row.style.background = bg;
      row.style.transform = 'scale(1.0)';
    };

    const dateStr = achiever.achievedAt ? new Date(achiever.achievedAt).toLocaleDateString('pt-BR') : '';

    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px; min-width: 220px;">
        <span style="font-weight: 800; font-size: 14px; color: ${isTop3 ? '#fbbf24' : '#94a3b8'}; min-width: 44px;">
          ${rankLabel}
        </span>
        <div>
          <div style="font-weight: 700; font-size: 14px; color: #ffffff;">
            ${achiever.playerName}
          </div>
          <div style="font-size: 11px; color: #94a3b8;">
            ${achiever.rankTitle || 'Guerreiro de Aethelgard'}
          </div>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 16px; font-size: 12px; color: #cbd5e1;">
        <span style="background: ${tierColor}22; border: 1px solid ${tierColor}; color: ${tierColor}; font-weight: 700; padding: 2px 8px; border-radius: 6px; font-size: 10px;">
          ${achiever.difficultyName}
        </span>
        <span title="Inimigos Derrotados">💀 ${achiever.enemiesDefeated}</span>
        <span title="Parries Perfeitos">🛡️ ${achiever.parryCount}</span>
        <span title="Tempo de Sobrevivência">⏱️ ${achiever.survivedSeconds}s</span>
      </div>

      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="text-align: right;">
          <div style="font-weight: 800; font-size: 16px; color: #fbbf24; font-variant-numeric: tabular-nums;">
            ${achiever.score.toLocaleString('pt-BR')} pts
          </div>
          <div style="font-size: 10px; color: #64748b;">
            ${dateStr}
          </div>
        </div>
      </div>
    `;

    return row;
  }

  public open(): void {
    this.isOpen = true;
    this.modalContainer.style.display = 'flex';
    this.updateHeroStatusContent();
    this.nameInput.value = firebaseService.getPlayerName();
    this.loadAndDisplayAchievers();
  }

  public close(): void {
    this.isOpen = false;
    this.modalContainer.style.display = 'none';
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}
