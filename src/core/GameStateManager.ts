import { DifficultyConfig, DifficultyTier } from './types.ts';
import { DifficultyLevel } from './DifficultyLevel.ts';

export interface GameState {
  currentDifficulty: DifficultyConfig;
  activeWorldId: string;
  isAudioMuted: boolean;
  isHardMasterUnlocked: boolean;
  totalTimeInGameSeconds: number;
  sessionHighScores: {
    enemiesDefeated: number;
    highestCombo: number;
  };
}

export type StateChangeListener = (newState: GameState, previousState: GameState) => void;

/**
 * Enterprise Game State Manager
 * Thread-safe / Deterministic State Store with Pub-Sub subscriber pattern
 * and LocalStorage persistence.
 */
export class GameStateManager {
  private static instance: GameStateManager | null = null;
  private state: GameState;
  private listeners: Set<StateChangeListener> = new Set();
  private readonly storageKey: string = 'aethelgard_game_state_v1';

  private constructor() {
    this.state = this.loadInitialState();
  }

  public static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  /**
   * Resets the singleton instance (useful for unit tests).
   */
  public static resetInstance(): void {
    GameStateManager.instance = null;
  }

  private loadInitialState(): GameState {
    const defaultState: GameState = {
      currentDifficulty: DifficultyLevel.Medio,
      activeWorldId: 'portal-medieval-forest',
      isAudioMuted: false,
      isHardMasterUnlocked: true,
      totalTimeInGameSeconds: 0,
      sessionHighScores: {
        enemiesDefeated: 0,
        highestCombo: 0,
      },
    };

    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return defaultState;
    }

    try {
      const saved = window.localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.difficultyTier) {
          defaultState.currentDifficulty = DifficultyLevel.fromTier(parsed.difficultyTier);
        }
        if (parsed.activeWorldId) {
          defaultState.activeWorldId = parsed.activeWorldId;
        }
        if (typeof parsed.isAudioMuted === 'boolean') {
          defaultState.isAudioMuted = parsed.isAudioMuted;
        }
      }
    } catch {
      // Fallback silently if storage unavailable or corrupted
    }

    return defaultState;
  }

  private saveState(): void {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
    try {
      const toSave = {
        difficultyTier: this.state.currentDifficulty.tier,
        activeWorldId: this.state.activeWorldId,
        isAudioMuted: this.state.isAudioMuted,
      };
      window.localStorage.setItem(this.storageKey, JSON.stringify(toSave));
    } catch {
      // Ignore storage write quotas
    }
  }

  public getState(): Readonly<GameState> {
    return this.state;
  }

  public getDifficulty(): Readonly<DifficultyConfig> {
    return this.state.currentDifficulty;
  }

  public setDifficulty(tier: DifficultyTier): void {
    if (this.state.currentDifficulty.tier === tier) return;

    const previousState = { ...this.state };
    const newConfig = DifficultyLevel.fromTier(tier);

    this.state = {
      ...this.state,
      currentDifficulty: newConfig,
    };

    this.saveState();
    this.notifyListeners(previousState);
  }

  public setActiveWorld(worldId: string): void {
    if (this.state.activeWorldId === worldId) return;

    const previousState = { ...this.state };
    this.state = {
      ...this.state,
      activeWorldId: worldId,
    };

    this.saveState();
    this.notifyListeners(previousState);
  }

  public toggleAudioMute(): boolean {
    const previousState = { ...this.state };
    const newMuted = !this.state.isAudioMuted;

    this.state = {
      ...this.state,
      isAudioMuted: newMuted,
    };

    this.saveState();
    this.notifyListeners(previousState);
    return newMuted;
  }

  public recordScore(enemiesDefeated: number, combo: number): void {
    const previousState = { ...this.state };
    this.state = {
      ...this.state,
      sessionHighScores: {
        enemiesDefeated: Math.max(this.state.sessionHighScores.enemiesDefeated, enemiesDefeated),
        highestCombo: Math.max(this.state.sessionHighScores.highestCombo, combo),
      },
    };
    this.notifyListeners(previousState);
  }

  public subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(previousState: GameState): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state, previousState);
      } catch (err) {
        console.error('Error in GameStateManager listener:', err);
      }
    }
  }
}
