// ==============================================================================
// AETHELGARD - PURE C# CLEAN ARCHITECTURE GAME ENGINE
// Entity: WorldPortalEntity
// Represents the Cosmic Orbs / World Portals from the YouTube Inspiration
// ==============================================================================

using System;
using System.Numerics;

namespace Aethelgard.Core.Domain.Entities;

public sealed class WorldPortalEntity
{
    public Guid Id { get; }
    public string Title { get; }
    public string BiomeDescription { get; }
    public string PromptOrigin { get; }
    public Vector3 PositionInCosmicHub { get; }
    public uint SphereColorHex { get; }
    public bool IsActive { get; private set; }
    public int RecommendedPlayerLevel { get; }

    public WorldPortalEntity(
        string title,
        string biomeDescription,
        string promptOrigin,
        Vector3 positionInCosmicHub,
        uint sphereColorHex,
        int recommendedLevel = 1)
    {
        Id = Guid.NewGuid();
        Title = title;
        BiomeDescription = biomeDescription;
        PromptOrigin = promptOrigin;
        PositionInCosmicHub = positionInCosmicHub;
        SphereColorHex = sphereColorHex;
        IsActive = true;
        RecommendedPlayerLevel = Math.Max(1, recommendedLevel);
    }

    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
}
