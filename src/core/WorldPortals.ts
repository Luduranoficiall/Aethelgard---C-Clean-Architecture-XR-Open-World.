export interface WorldPortalDef {
  id: string;
  title: string;
  tagline: string;
  prompt: string;
  skyColorHex: number;
  fogColorHex: number;
  groundColorHex: number;
  treeColorHex: number;
  particleColorHex: number;
  orbColorHex: number;
  ambientLightHex: number;
  position: [number, number, number];
  recommendedLevel: number;
  biomeFeatures: string[];
}

export const WORLD_PORTALS: WorldPortalDef[] = [
  {
    id: 'portal-medieval-forest',
    title: 'Floresta de Aethel & Vilarejo',
    tagline: 'Mundo Aberto Medieval Clássico',
    prompt: 'MUNDO ABERTO ESTILO MEDIEVAL, FLORESTA COM UM VILAREJO PRÓXIMO',
    skyColorHex: 0x6ca6e8,
    fogColorHex: 0xc4dcfa,
    groundColorHex: 0x3d6633,
    treeColorHex: 0x224a1f,
    particleColorHex: 0xa4d872,
    orbColorHex: 0x4aa3df,
    ambientLightHex: 0xd8ebff,
    position: [-4.6, 1.2, -3.8],
    recommendedLevel: 1,
    biomeFeatures: ['Castelo Real no Horizonte', 'Pinheiros e Carvalho Antigo', 'Cabanas de Pedra e Madeira'],
  },
  {
    id: 'portal-floating-citadel',
    title: 'Cidadela Flutuante de Solaria',
    tagline: 'Terras Altas e Picos Celestiais',
    prompt: 'CIDADELA FLUTUANTE EM NUVENS DOURADAS COM TORRES DE CRISTAL',
    skyColorHex: 0xfdbb2d,
    fogColorHex: 0xffe29f,
    groundColorHex: 0x567d46,
    treeColorHex: 0x2d5a27,
    particleColorHex: 0xffe680,
    orbColorHex: 0xffa834,
    ambientLightHex: 0xfff0d0,
    position: [4.6, 1.2, -3.8],
    recommendedLevel: 2,
    biomeFeatures: ['Torres Alvas de Cristal', 'Neblina Dourada ao Entardecer', 'Sentinelas de Luz'],
  },
  {
    id: 'portal-dragon-volcano',
    title: 'Vale Vulcânico de Drakon',
    tagline: 'Cinzas, Magma e Perigo Iminente',
    prompt: 'VALE VULCÂNICO COM RIOS DE LAVA E RUÍNAS NEGRAS DE OBSIDIANA',
    skyColorHex: 0x2b080c,
    fogColorHex: 0x611a1a,
    groundColorHex: 0x261d1d,
    treeColorHex: 0x471d15,
    particleColorHex: 0xff5522,
    orbColorHex: 0xee4422,
    ambientLightHex: 0xff8866,
    position: [-6.2, 1.5, -8.5],
    recommendedLevel: 3,
    biomeFeatures: ['Geysers de Enxofre', 'Rochas Vulcânicas Incandescentes', 'Golems Ancestrais de Magma'],
  },
  {
    id: 'portal-astral-ruins',
    title: 'Santuário Astral & Runas Arcanas',
    tagline: 'Dimensão Cósmica Desconhecida',
    prompt: 'RUÍNAS ASTRIS FLUTUANDO NO ESPAÇO COM RUNAS LUMINOSAS AZUIS',
    skyColorHex: 0x0f0c29,
    fogColorHex: 0x302b63,
    groundColorHex: 0x1b1938,
    treeColorHex: 0x4a3b7a,
    particleColorHex: 0x9b51e0,
    orbColorHex: 0x8a2be2,
    ambientLightHex: 0xbb99ff,
    position: [6.2, 1.5, -8.5],
    recommendedLevel: 4,
    biomeFeatures: ['Obeliscos Flutuantes', 'Monólitos Rúnicos Arcanos', 'Aura Gravitacional Reduzida'],
  },
];
