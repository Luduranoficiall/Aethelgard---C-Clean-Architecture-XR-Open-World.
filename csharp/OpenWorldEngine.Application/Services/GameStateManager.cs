// ==============================================================================
// AETHELGARD - PURE C# CLEAN ARCHITECTURE GAME ENGINE
// Application Layer: GameStateManager Service
// Thread-safe State Manager with Event-Driven Dispatcher & Difficulty State
// ==============================================================================

using System;
using Aethelgard.Core.Domain.Enums;
using Aethelgard.Core.Domain.ValueObjects;

namespace Aethelgard.Core.Application.Services;

public sealed class GameStateManager
{
    private static readonly Lazy<GameStateManager> _instance =
        new(() => new GameStateManager());

    public static GameStateManager Instance => _instance.Value;

    private readonly object _syncRoot = new();

    public DifficultyLevel CurrentDifficulty { get; private set; }
    public string ActiveWorldId { get; private set; }
    public bool IsAudioMuted { get; private set; }
    public int EnemiesDefeatedSession { get; private set; }

    public event Action<DifficultyLevel, DifficultyLevel>? OnDifficultyChanged;
    public event Action<string>? OnWorldChanged;

    private GameStateManager()
    {
        CurrentDifficulty = DifficultyLevel.CreateMedio();
        ActiveWorldId = "portal-medieval-forest";
        IsAudioMuted = false;
        EnemiesDefeatedSession = 0;
    }

    public void SetDifficulty(DifficultyTier tier)
    {
        lock (_syncRoot)
        {
            if (CurrentDifficulty.Tier == tier) return;

            var previous = CurrentDifficulty;
            CurrentDifficulty = DifficultyLevel.FromTier(tier);

            OnDifficultyChanged?.Invoke(CurrentDifficulty, previous);
        }
    }

    public void SetActiveWorld(string worldId)
    {
        lock (_syncRoot)
        {
            if (ActiveWorldId == worldId) return;

            ActiveWorldId = worldId ?? throw new ArgumentNullException(nameof(worldId));
            OnWorldChanged?.Invoke(ActiveWorldId);
        }
    }

    public void RecordDefeatedEnemy()
    {
        lock (_syncRoot)
        {
            EnemiesDefeatedSession++;
        }
    }
}
