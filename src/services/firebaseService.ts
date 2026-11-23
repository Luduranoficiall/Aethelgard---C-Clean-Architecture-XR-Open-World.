import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  Firestore,
} from 'firebase/firestore';
import { DifficultyTier } from '../core/types.ts';
import { PlayerEntity } from '../core/PlayerEntity.ts';

// Config from firebase-applet-config.json
const FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0562546284',
  appId: '1:698259368267:web:9e68d1024a5793915260ce',
  apiKey: 'AIzaSyBbVJBPu1PrKDpXfGeyWp6Ga0zfiaURihw',
  authDomain: 'gen-lang-client-0562546284.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-aethelgardcclean-344d9f27-bf79-48fb-afb0-27a426484a07',
  storageBucket: 'gen-lang-client-0562546284.firebasestorage.app',
  messagingSenderId: '698259368267',
};

export interface PlayerProfile {
  playerId: string;
  playerName: string;
  level: number;
  exp: number;
  enemiesDefeated: number;
  portalsTraversed: number;
  combosExecuted: number;
  parriesPerformed: number;
  lastPlayedDifficulty: number;
  updatedAt: string;
}

export interface AchieverScore {
  id?: string;
  playerName: string;
  difficultyTier: number;
  difficultyName: string;
  score: number;
  enemiesDefeated: number;
  survivedSeconds: number;
  parryCount: number;
  rankTitle: string;
  achievedAt: string;
}

const SEED_LEGENDARY_ACHIEVERS: AchieverScore[] = [
  {
    playerName: 'Arthur Pendragon',
    difficultyTier: DifficultyTier.HardMasterProfissional,
    difficultyName: 'Hard Master Profissional',
    score: 18450,
    enemiesDefeated: 42,
    survivedSeconds: 620,
    parryCount: 38,
    rankTitle: 'Lenda Imortal de Aethelgard',
    achievedAt: '2026-11-04T12:00:00Z',
  },
  {
    playerName: 'Valeria da Névoa',
    difficultyTier: DifficultyTier.HardMasterProfissional,
    difficultyName: 'Hard Master Profissional',
    score: 14200,
    enemiesDefeated: 31,
    survivedSeconds: 480,
    parryCount: 26,
    rankTitle: 'Matadora de Titãs',
    achievedAt: '2026-11-03T18:30:00Z',
  },
  {
    playerName: 'Gareth Lâmina-Solar',
    difficultyTier: DifficultyTier.Dificil,
    difficultyName: 'Difícil',
    score: 9800,
    enemiesDefeated: 24,
    survivedSeconds: 390,
    parryCount: 19,
    rankTitle: 'Comandante de Elite',
    achievedAt: '2026-11-04T08:15:00Z',
  },
  {
    playerName: 'Elowen Coração-de-Carvalho',
    difficultyTier: DifficultyTier.Medio,
    difficultyName: 'Médio',
    score: 6500,
    enemiesDefeated: 18,
    survivedSeconds: 310,
    parryCount: 12,
    rankTitle: 'Veterana Canônica',
    achievedAt: '2026-11-02T20:00:00Z',
  },
  {
    playerName: 'Rowan Explorador',
    difficultyTier: DifficultyTier.Facil,
    difficultyName: 'Fácil',
    score: 4100,
    enemiesDefeated: 12,
    survivedSeconds: 240,
    parryCount: 8,
    rankTitle: 'Guardião Verdejante',
    achievedAt: '2026-11-01T15:00:00Z',
  },
];

class FirebaseService {
  private static instance: FirebaseService;
  private db: Firestore | null = null;
  private auth: ReturnType<typeof getAuth> | null = null;
  private currentUser: User | null = null;
  private initialized: boolean = false;
  private customPlayerName: string = 'Herói de Aethelgard';

  private constructor() {
    const savedName = localStorage.getItem('aethelgard_player_name');
    if (savedName) {
      this.customPlayerName = savedName;
    }
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  public async init(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
      this.auth = getAuth(app);
      this.db = getFirestore(app, FIREBASE_CONFIG.firestoreDatabaseId);

      // Authenticate anonymously so every player has a persistent UID
      await new Promise<void>((resolve) => {
        if (!this.auth) return resolve();
        onAuthStateChanged(this.auth, async (user) => {
          if (user) {
            this.currentUser = user;
            resolve();
          } else {
            try {
              const cred = await signInAnonymously(this.auth!);
              this.currentUser = cred.user;
            } catch (err) {
              console.warn('Anonymous signIn failed, using guest UUID:', err);
            }
            resolve();
          }
        });
      });

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Firebase Firestore:', error);
      return false;
    }
  }

  public getPlayerName(): string {
    return this.customPlayerName;
  }

  public setPlayerName(name: string): void {
    if (!name || name.trim().length === 0) return;
    this.customPlayerName = name.trim();
    localStorage.setItem('aethelgard_player_name', this.customPlayerName);
  }

  public getUserId(): string {
    if (this.currentUser?.uid) {
      return this.currentUser.uid;
    }
    let localId = localStorage.getItem('aethelgard_guest_uid');
    if (!localId) {
      localId = 'hero_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('aethelgard_guest_uid', localId);
    }
    return localId;
  }

  public calculateScore(player: PlayerEntity): number {
    const tier = player.difficulty.tier;
    const tierMultiplier = tier === 4 ? 3.5 : tier === 3 ? 2.0 : tier === 2 ? 1.2 : 0.8;
    const basePoints =
      player.enemiesDefeated * 250 +
      player.parriesPerformed * 150 +
      player.combosExecuted * 30 +
      Math.floor(player.survivalSeconds) * 8;
    return Math.floor(basePoints * tierMultiplier);
  }

  public getRankTitle(score: number, tier: DifficultyTier): string {
    if (tier === DifficultyTier.HardMasterProfissional) {
      if (score >= 15000) return '👑 Lenda Viva de Aethelgard';
      if (score >= 8000) return '⚔️ Mestre do Abismo';
      return '🛡️ Sobrevivente Implacável';
    }
    if (tier === DifficultyTier.Dificil) {
      if (score >= 10000) return '⚡ Comandante Arcano Supremo';
      if (score >= 5000) return '🗡️ Campeão de Elite';
      return '🛡️ Guerreiro Resiliente';
    }
    if (tier === DifficultyTier.Medio) {
      if (score >= 6000) return '🌟 Paladino do Reino';
      return '⚔️ Veterano Valente';
    }
    return '🌿 Guardião da Floresta';
  }

  public async savePlayerProgress(player: PlayerEntity): Promise<boolean> {
    await this.init();
    if (!this.db) return false;

    const playerId = this.getUserId();
    const profile: PlayerProfile = {
      playerId,
      playerName: this.customPlayerName || player.name,
      level: player.level,
      exp: player.experience,
      enemiesDefeated: player.enemiesDefeated,
      portalsTraversed: player.portalsVisited,
      combosExecuted: player.combosExecuted,
      parriesPerformed: player.parriesPerformed,
      lastPlayedDifficulty: player.difficulty.tier,
      updatedAt: new Date().toISOString(),
    };

    try {
      const playerDocRef = doc(this.db, 'players', playerId);
      await setDoc(playerDocRef, profile, { merge: true });
      return true;
    } catch (error) {
      console.warn('Could not persist player to Firestore:', error);
      return false;
    }
  }

  public async loadPlayerProgress(): Promise<PlayerProfile | null> {
    await this.init();
    if (!this.db) return null;

    const playerId = this.getUserId();
    try {
      const playerDocRef = doc(this.db, 'players', playerId);
      const snap = await getDoc(playerDocRef);
      if (snap.exists()) {
        const data = snap.data() as PlayerProfile;
        if (data.playerName) {
          this.setPlayerName(data.playerName);
        }
        return data;
      }
    } catch (error) {
      console.warn('Could not load player profile from Firestore:', error);
    }
    return null;
  }

  public async submitAchieverScore(player: PlayerEntity): Promise<AchieverScore | null> {
    await this.init();
    if (!this.db) return null;

    const score = this.calculateScore(player);
    const tier = player.difficulty.tier;
    const achiever: AchieverScore = {
      playerName: this.customPlayerName || player.name,
      difficultyTier: tier,
      difficultyName: player.difficulty.name,
      score,
      enemiesDefeated: player.enemiesDefeated,
      survivedSeconds: Math.floor(player.survivalSeconds),
      parryCount: player.parriesPerformed,
      rankTitle: this.getRankTitle(score, tier),
      achievedAt: new Date().toISOString(),
    };

    try {
      const achieversCol = collection(this.db, 'achievers');
      const docRef = await addDoc(achieversCol, achiever);
      achiever.id = docRef.id;
      return achiever;
    } catch (error) {
      console.warn('Could not save achiever score to Firestore:', error);
      return null;
    }
  }

  public async getTopAchievers(tierFilter?: DifficultyTier): Promise<AchieverScore[]> {
    await this.init();
    const results: AchieverScore[] = [];

    if (this.db) {
      try {
        const achieversCol = collection(this.db, 'achievers');
        let q = query(achieversCol, orderBy('score', 'desc'), limit(25));
        if (tierFilter) {
          q = query(achieversCol, where('difficultyTier', '==', tierFilter), orderBy('score', 'desc'), limit(15));
        }
        const snap = await getDocs(q);
        snap.forEach((d) => {
          results.push({ id: d.id, ...(d.data() as AchieverScore) });
        });
      } catch (error) {
        console.warn('Could not fetch achievers from Firestore:', error);
      }
    }

    // Combine with seed achievers if empty or few, filtering by tier if requested
    let combined = [...results];
    SEED_LEGENDARY_ACHIEVERS.forEach((seed) => {
      if (!combined.some((c) => c.playerName === seed.playerName && c.difficultyTier === seed.difficultyTier)) {
        if (!tierFilter || seed.difficultyTier === tierFilter) {
          combined.push(seed);
        }
      }
    });

    combined.sort((a, b) => b.score - a.score);
    return combined.slice(0, 20);
  }
}

export const firebaseService = FirebaseService.getInstance();
