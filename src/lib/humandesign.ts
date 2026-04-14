/**
 * Human Design derivation logic.
 * Takes computed planetary positions and derives all chart properties.
 */

import { getDefinedChannels, GATE_TO_CENTER, getCrossOfIncarnation, longitudeToColor } from './gates';
import { ChartPositions } from './ephemeris';

export interface HDChart {
  name: string;
  birthdate: string;
  birthtime: string;
  birthplace: string;
  type: string;
  strategy: string;
  authority: string;
  definition: string;
  profile: string;
  crossOfIncarnation: string;
  notSelfTheme: string;
  sign: string;
  variables: {
    digestion: string;
    cognition: string;
    motivation: string;
    perspective: string;
    environment: string;
  };
  personalityGates: number[];
  designGates: number[];
  allGates: number[];
  definedChannels: [number, number][];
  definedCenters: string[];
  undefinedCenters: string[];
  positions: ChartPositions;
}

const ALL_CENTERS = [
  'Head', 'Ajna', 'Throat', 'G', 'Heart',
  'Sacral', 'Spleen', 'SolarPlexus', 'Root'
];

/** Gates belonging to each center — Bug 6 fixed: 41 and 19 removed from SolarPlexus */
const CENTER_GATES: Record<string, number[]> = {
  Head:        [64, 61, 63],
  Ajna:        [47, 24, 4, 17, 43, 11],
  Throat:      [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
  G:           [7, 1, 13, 10, 25, 15, 46, 2],
  Heart:       [21, 40, 26, 51],
  Sacral:      [34, 5, 14, 29, 59, 9, 3, 42, 27],
  Spleen:      [48, 57, 44, 50, 32, 28, 18],
  SolarPlexus: [36, 22, 37, 6, 49, 55, 30],   // removed 41, 19
  Root:        [53, 60, 52, 19, 39, 41, 38, 54, 58]
};

// ─── Defined centers ─────────────────────────────────────────────────────────

function getDefinedCenters(definedChannels: [number, number][]): string[] {
  const defined: string[] = [];
  for (const center of ALL_CENTERS) {
    const gates = CENTER_GATES[center] || [];
    const hasChannel = definedChannels.some(([a, b]) =>
      gates.includes(a) || gates.includes(b)
    );
    if (hasChannel) defined.push(center);
  }
  return defined;
}

// ─── Definition — Bug 3: real BFS connected-components ───────────────────────

function determineDefinition(
  definedCenters: string[],
  definedChannels: [number, number][]
): string {
  if (definedCenters.length === 0) return 'Sin Definición';

  // Build adjacency between defined centers via channels
  const adj: Record<string, Set<string>> = {};
  for (const c of definedCenters) adj[c] = new Set();

  for (const [a, b] of definedChannels) {
    const cA = GATE_TO_CENTER[a];
    const cB = GATE_TO_CENTER[b];
    if (cA && cB && cA !== cB && adj[cA] && adj[cB]) {
      adj[cA].add(cB);
      adj[cB].add(cA);
    }
  }

  // BFS to count connected components
  const visited = new Set<string>();
  let components = 0;
  for (const center of definedCenters) {
    if (!visited.has(center)) {
      components++;
      const queue = [center];
      while (queue.length) {
        const curr = queue.shift()!;
        if (visited.has(curr)) continue;
        visited.add(curr);
        for (const nb of adj[curr]) {
          if (!visited.has(nb)) queue.push(nb);
        }
      }
    }
  }

  if (components === 1) return 'Simple';
  if (components === 2) return 'Partida';
  if (components === 3) return 'Triple';
  return 'Cuádruple';
}

// ─── Type ─────────────────────────────────────────────────────────────────────

function determineType(
  definedCenters: string[],
  definedChannels: [number, number][]
): { type: string; strategy: string; notSelfTheme: string; sign: string } {
  const hasSacral = definedCenters.includes('Sacral');
  const hasThroat = definedCenters.includes('Throat');

  const motorGates = [
    ...CENTER_GATES.Heart,
    ...CENTER_GATES.SolarPlexus,
    ...CENTER_GATES.Root,
    ...CENTER_GATES.Sacral,
  ];
  const throatGates = CENTER_GATES.Throat;

  const hasMotorToThroat = definedChannels.some(([a, b]) =>
    (motorGates.includes(a) && throatGates.includes(b)) ||
    (motorGates.includes(b) && throatGates.includes(a))
  );

  if (definedCenters.length === 0) {
    return { type: 'Reflector', strategy: 'Esperar un ciclo lunar (28 días)', notSelfTheme: 'Decepción', sign: 'Sorpresa' };
  }
  if (hasThroat && hasMotorToThroat && !hasSacral) {
    return { type: 'Manifestador', strategy: 'Informar antes de actuar', notSelfTheme: 'Ira', sign: 'Paz' };
  }
  if (hasSacral && hasThroat && hasMotorToThroat) {
    return { type: 'Generador Manifestante', strategy: 'Responder, luego informar', notSelfTheme: 'Frustración / Ira', sign: 'Satisfacción / Paz' };
  }
  if (hasSacral) {
    return { type: 'Generador', strategy: 'Esperar y responder', notSelfTheme: 'Frustración', sign: 'Satisfacción' };
  }
  return { type: 'Proyector', strategy: 'Esperar la invitación', notSelfTheme: 'Amargura', sign: 'Éxito' };
}

// ─── Authority ────────────────────────────────────────────────────────────────

function determineAuthority(definedCenters: string[], type: string): string {
  if (type === 'Reflector') return 'Lunar (28 días)';
  if (definedCenters.includes('SolarPlexus')) return 'Emocional';
  if (definedCenters.includes('Sacral'))      return 'Sacral';
  if (definedCenters.includes('Spleen'))      return 'Esplénico';
  if (definedCenters.includes('Heart') && definedCenters.includes('G')) return 'Ego Proyectado';
  if (definedCenters.includes('Heart'))       return 'Ego Manifestado';
  if (definedCenters.includes('G'))           return 'Self Proyectado';
  return 'Mental (Outer Authority)';
}

// ─── Variables — Bug 5: correct COLOR-based calculation ──────────────────────

// Color 1-6 → variable name tables
const DIGESTION_TABLE  = ['Apetito / Caliente', 'Gusto Cerrado', 'Sed / Húmedo', 'Gusto Abierto', 'Sonido / Tranquilo', 'Luz / Nervioso'];
const COGNICION_TABLE  = ['Olfato', 'Gusto', 'Visión Exterior', 'Tacto', 'Sonido', 'Sin-Color'];
const MOTIVACION_TABLE = ['Miedo', 'Esperanza', 'Deseo', 'Necesidad', 'Culpa', 'Inocencia'];
const PERSPECTIVA_TABLE = ['Personal', 'Probabilidad', 'Transpersonal', 'Posibilidad', 'Poder', 'Inocencia'];
const AMBIENTE_TABLE   = ['Cuevas', 'Mercados', 'Cocinas', 'Montañas', 'Valles', 'Costas'];

function determineVariables(positions: ChartPositions): HDChart['variables'] {
  // Variable ← source planet (verified against reference chart)
  // Digestion  ← Design Sun color
  // Cognition  ← Design Moon color
  // Motivation ← Personality Sun color
  // Perspective← Personality Earth color
  // Environment← Personality Moon color
  const c = (key: string, side: 'personality' | 'design') =>
    longitudeToColor(positions[side][key].longitude) - 1; // 0-indexed

  return {
    digestion:   DIGESTION_TABLE[c('Sun',   'design')]        ?? DIGESTION_TABLE[0],
    cognition:   COGNICION_TABLE[c('Moon',  'design')]        ?? COGNICION_TABLE[0],
    motivation:  MOTIVACION_TABLE[c('Sun',  'personality')]   ?? MOTIVACION_TABLE[0],
    perspective: PERSPECTIVA_TABLE[c('Earth','personality')]  ?? PERSPECTIVA_TABLE[0],
    environment: AMBIENTE_TABLE[c('Moon',  'personality')]    ?? AMBIENTE_TABLE[0],
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function deriveChart(
  name: string,
  birthdate: string,
  birthtime: string,
  birthplace: string,
  positions: ChartPositions
): HDChart {
  const personalityGates = Object.values(positions.personality).map(p => p.gate);
  const designGates      = Object.values(positions.design).map(p => p.gate);
  const allGates         = [...new Set([...personalityGates, ...designGates])];

  const definedChannels = getDefinedChannels(allGates);
  const definedCenters  = getDefinedCenters(definedChannels);
  const undefinedCenters = ALL_CENTERS.filter(c => !definedCenters.includes(c));

  const { type, strategy, notSelfTheme, sign } = determineType(definedCenters, definedChannels);
  const authority  = determineAuthority(definedCenters, type);
  const definition = determineDefinition(definedCenters, definedChannels);

  const personalitySunLine = positions.personality['Sun'].line;
  const designSunLine      = positions.design['Sun'].line;
  const profile = `${personalitySunLine}/${designSunLine}`;

  const pSunGate   = positions.personality['Sun'].gate;
  const pEarthGate = positions.personality['Earth'].gate;
  const dSunGate   = positions.design['Sun'].gate;
  const dEarthGate = positions.design['Earth'].gate;

  const crossOfIncarnation = getCrossOfIncarnation(
    pSunGate, pEarthGate, dSunGate, dEarthGate, personalitySunLine
  );

  const variables = determineVariables(positions);

  return {
    name, birthdate, birthtime, birthplace,
    type, strategy, authority, definition,
    profile, crossOfIncarnation, notSelfTheme, sign,
    variables,
    personalityGates,
    designGates,
    allGates,
    definedChannels,
    definedCenters,
    undefinedCenters,
    positions,
  };
}
