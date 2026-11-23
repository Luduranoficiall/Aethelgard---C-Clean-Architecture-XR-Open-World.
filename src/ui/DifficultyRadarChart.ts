import * as d3 from 'd3';
import { DifficultyTier } from '../core/types.ts';

export interface RadarKpiMetric {
  key: string;
  label: string;
  icon: string;
}

export interface DifficultyKpiData {
  tier: DifficultyTier;
  name: string;
  color: string;
  values: Record<string, number>; // 0 to 100
}

export const RADAR_KPI_METRICS: RadarKpiMetric[] = [
  { key: 'aiIntelligence', label: 'IA Inimiga', icon: '🧠' },
  { key: 'resourceScarcity', label: 'Escassez Recursos', icon: '⚡' },
  { key: 'movementSpeed', label: 'Velocidade / Ritmo', icon: '🏃' },
  { key: 'parryPrecision', label: 'Precisão Parry', icon: '🛡️' },
  { key: 'lethality', label: 'Letalidade', icon: '💀' },
];

export const DIFFICULTY_KPI_MAP: Record<DifficultyTier, DifficultyKpiData> = {
  [DifficultyTier.Facil]: {
    tier: DifficultyTier.Facil,
    name: 'Fácil (Aventureiro)',
    color: '#10b981',
    values: {
      aiIntelligence: 25,
      resourceScarcity: 20,
      movementSpeed: 30,
      parryPrecision: 20,
      lethality: 15,
    },
  },
  [DifficultyTier.Medio]: {
    tier: DifficultyTier.Medio,
    name: 'Médio (Veterano)',
    color: '#38bdf8',
    values: {
      aiIntelligence: 50,
      resourceScarcity: 50,
      movementSpeed: 50,
      parryPrecision: 50,
      lethality: 45,
    },
  },
  [DifficultyTier.Dificil]: {
    tier: DifficultyTier.Dificil,
    name: 'Difícil (Comandante)',
    color: '#f59e0b',
    values: {
      aiIntelligence: 75,
      resourceScarcity: 70,
      movementSpeed: 75,
      parryPrecision: 75,
      lethality: 75,
    },
  },
  [DifficultyTier.HardMasterProfissional]: {
    tier: DifficultyTier.HardMasterProfissional,
    name: 'Hard Master Profissional',
    color: '#ef4444',
    values: {
      aiIntelligence: 98,
      resourceScarcity: 95,
      movementSpeed: 95,
      parryPrecision: 95,
      lethality: 100,
    },
  },
};

/**
 * Renders an interactive D3.js Radar (Spider) Chart comparing difficulty levels
 * across 5 key performance indicators (KPIs).
 * @param compareAgainstHardMaster When true, overlays the Hard Master Professional baseline
 */
export function renderDifficultyRadarChart(
  container: HTMLElement,
  currentTier: DifficultyTier,
  accentColor: string,
  compareAgainstHardMaster: boolean = false,
): void {
  // Clear any existing SVG inside container
  container.innerHTML = '';

  const width = 360;
  const height = 195;
  const margin = { top: 22, right: 35, bottom: 22, left: 35 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const radius = Math.min(innerWidth, innerHeight) / 2 - 8;
  const centerX = width / 2;
  const centerY = height / 2 + 3;

  const currentData = DIFFICULTY_KPI_MAP[currentTier];
  // Select baseline: Hard Master Professional if toggled, otherwise canonical Médio
  const baselineTier = compareAgainstHardMaster
    ? DifficultyTier.HardMasterProfissional
    : DifficultyTier.Medio;
  const baselineData = DIFFICULTY_KPI_MAP[baselineTier];
  const totalAxes = RADAR_KPI_METRICS.length;
  const angleSlice = (Math.PI * 2) / totalAxes;

  // D3 Radial Scale: 0 to 100 -> 0 to radius
  const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

  // Create Root SVG with D3
  const svg = d3
    .select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('overflow', 'visible');

  // Filter for glowing radar polygon
  const defs = svg.append('defs');
  const filter = defs
    .append('filter')
    .attr('id', 'd3-radar-glow')
    .attr('x', '-30%')
    .attr('y', '-30%')
    .attr('width', '160%')
    .attr('height', '160%');

  filter
    .append('feGaussianBlur')
    .attr('stdDeviation', '4')
    .attr('result', 'coloredBlur');

  const feMerge = filter.append('feMerge');
  feMerge.append('feMergeNode').attr('in', 'coloredBlur');
  feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

  // Linear Gradient for radar fill
  const gradient = defs
    .append('radialGradient')
    .attr('id', `radar-gradient-${currentTier}`)
    .attr('cx', '50%')
    .attr('cy', '50%')
    .attr('r', '50%');

  gradient
    .append('stop')
    .attr('offset', '0%')
    .attr('stop-color', accentColor)
    .attr('stop-opacity', 0.65);

  gradient
    .append('stop')
    .attr('offset', '100%')
    .attr('stop-color', accentColor)
    .attr('stop-opacity', 0.2);

  const mainG = svg.append('g').attr('transform', `translate(${centerX}, ${centerY})`);

  // 1. Concentric circular/polygon grid rings (25%, 50%, 75%, 100%)
  const gridLevels = [25, 50, 75, 100];
  gridLevels.forEach((level) => {
    const r = rScale(level);
    const gridPoints: [number, number][] = [];

    for (let i = 0; i < totalAxes; i++) {
      const angle = i * angleSlice - Math.PI / 2;
      gridPoints.push([r * Math.cos(angle), r * Math.sin(angle)]);
    }

    // Grid polygon outline
    mainG
      .append('polygon')
      .attr('points', gridPoints.map((p) => p.join(',')).join(' '))
      .style('fill', level === 100 ? 'rgba(255,255,255,0.02)' : 'none')
      .style('stroke', level === 100 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)')
      .style('stroke-dasharray', level === 100 ? 'none' : '3,3')
      .style('stroke-width', '1px');

    // Grid level label at the top axis
    mainG
      .append('text')
      .attr('x', 4)
      .attr('y', -r + 3)
      .attr('fill', 'rgba(148, 163, 184, 0.55)')
      .attr('font-size', '8px')
      .attr('font-weight', '600')
      .style('pointer-events', 'none')
      .text(`${level}%`);
  });

  // 2. Axis radiating rays and outer labels
  RADAR_KPI_METRICS.forEach((metric, i) => {
    const angle = i * angleSlice - Math.PI / 2;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    // Radiating line
    mainG
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', x)
      .attr('y2', y)
      .style('stroke', 'rgba(255, 255, 255, 0.15)')
      .style('stroke-width', '1px');

    // Text Anchor calculation based on angle
    const labelDistance = radius + 15;
    const labelX = labelDistance * Math.cos(angle);
    const labelY = labelDistance * Math.sin(angle);

    let textAnchor = 'middle';
    if (Math.cos(angle) > 0.3) textAnchor = 'start';
    else if (Math.cos(angle) < -0.3) textAnchor = 'end';

    // Label Group
    const labelG = mainG
      .append('g')
      .attr('transform', `translate(${labelX}, ${labelY})`)
      .style('pointer-events', 'none');

    // Emoji + Label
    labelG
      .append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('text-anchor', textAnchor)
      .attr('dominant-baseline', 'central')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('fill', '#cbd5e1')
      .text(`${metric.icon} ${metric.label}`);
  });

  // 3. Comparison Ghost Baseline (Hard Master Professional or Canonical Médio)
  const shouldRenderBaseline = compareAgainstHardMaster
    ? currentTier !== DifficultyTier.HardMasterProfissional
    : currentTier !== DifficultyTier.Medio;

  if (shouldRenderBaseline) {
    const baselinePoints: [number, number][] = RADAR_KPI_METRICS.map((metric, i) => {
      const val = baselineData.values[metric.key] ?? 50;
      const r = rScale(val);
      const angle = i * angleSlice - Math.PI / 2;
      return [r * Math.cos(angle), r * Math.sin(angle)];
    });

    const baselineStroke = compareAgainstHardMaster ? 'rgba(239, 68, 68, 0.85)' : 'rgba(56, 189, 248, 0.5)';
    const baselineFill = compareAgainstHardMaster ? 'rgba(239, 68, 68, 0.12)' : 'rgba(56, 189, 248, 0.08)';

    mainG
      .append('polygon')
      .attr('points', baselinePoints.map((p) => p.join(',')).join(' '))
      .style('fill', baselineFill)
      .style('stroke', baselineStroke)
      .style('stroke-width', compareAgainstHardMaster ? '1.5px' : '1.2px')
      .style('stroke-dasharray', compareAgainstHardMaster ? '4,3' : '3,3');
  }

  // 4. Current Difficulty Polygon with D3 Shape
  const currentPoints: [number, number][] = RADAR_KPI_METRICS.map((metric, i) => {
    const val = currentData.values[metric.key] ?? 50;
    const r = rScale(val);
    const angle = i * angleSlice - Math.PI / 2;
    return [r * Math.cos(angle), r * Math.sin(angle)];
  });

  // Polygon fill with glow
  mainG
    .append('polygon')
    .attr('points', currentPoints.map((p) => p.join(',')).join(' '))
    .style('fill', `url(#radar-gradient-${currentTier})`)
    .style('stroke', accentColor)
    .style('stroke-width', '2.2px')
    .style('filter', 'url(#d3-radar-glow)');

  // 5. Data Points & Value Badges at Vertices
  RADAR_KPI_METRICS.forEach((metric, i) => {
    const val = currentData.values[metric.key] ?? 50;
    const [x, y] = currentPoints[i];

    // Dot circle
    mainG
      .append('circle')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', 3.5)
      .style('fill', '#ffffff')
      .style('stroke', accentColor)
      .style('stroke-width', '2px');

    // Small numerical badge
    const angle = i * angleSlice - Math.PI / 2;
    const badgeOffsetX = Math.cos(angle) * 11;
    const badgeOffsetY = Math.sin(angle) * 10;

    mainG
      .append('text')
      .attr('x', x + badgeOffsetX)
      .attr('y', y + badgeOffsetY)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '8px')
      .attr('font-weight', '800')
      .attr('fill', accentColor)
      .style('text-shadow', '0 1px 3px rgba(0,0,0,0.9)')
      .style('pointer-events', 'none')
      .text(`${val}%`);
  });
}
