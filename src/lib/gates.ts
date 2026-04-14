/**
 * Human Design Gate mapping.
 * Each gate spans 360/64 = 5.625°.
 * Gate 41 Line 1 starts at 2° Aquarius = 302° tropical longitude.
 * The HD mandala runs in the SAME direction as increasing tropical longitude.
 */

// The 64 gates in ecliptic order starting from Gate 41 at 302° tropical (2° Aquarius).
export const GATE_SEQUENCE: number[] = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
  27, 24, 2,  23, 8,  20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33, 7,  4,  29, 59, 40, 64, 47, 6,  46, 18, 48, 57, 32, 50,
  28, 44, 1,  43, 14, 34, 9,  5,  26, 11, 10, 58, 38, 54, 61, 60
];

/**
 * Gate 41.1 begins at 2° Aquarius = 302° tropical longitude.
 * The mandala goes counter-clockwise (same direction as increasing tropical longitude).
 */
const HD_WHEEL_START = 302; // degrees tropical

export function longitudeToGateLine(longitude: number): { gate: number; line: number } {
  const normalized = ((longitude % 360) + 360) % 360;
  const sliceSize = 360 / 64; // 5.625°

  // Offset from wheel start, same direction as increasing longitude
  const adjusted = ((normalized - HD_WHEEL_START) % 360 + 360) % 360;
  const sliceIndex = Math.floor(adjusted / sliceSize) % 64;
  const gate = GATE_SEQUENCE[sliceIndex];

  const posWithinSlice = adjusted - sliceIndex * sliceSize;
  const line = Math.min(Math.floor(posWithinSlice / (sliceSize / 6)) + 1, 6);

  return { gate, line };
}

/**
 * Get the COLOR (1-6) of a position — used for Variables (PHS).
 * Within each line (0.9375°) there are 6 colors of 0.15625° each.
 */
export function longitudeToColor(longitude: number): number {
  const normalized = ((longitude % 360) + 360) % 360;
  const sliceSize  = 360 / 64;        // 5.625° per gate
  const lineSize   = sliceSize / 6;   // 0.9375° per line
  const colorSize  = lineSize / 6;    // 0.15625° per color

  const adjusted       = ((normalized - HD_WHEEL_START) % 360 + 360) % 360;
  const posWithinGate  = adjusted % sliceSize;
  const posWithinLine  = posWithinGate % lineSize;
  return Math.min(Math.floor(posWithinLine / colorSize) + 1, 6);
}

/** The 32 channels of the Human Design BodyGraph */
export const CHANNELS: [number, number][] = [
  [1, 8],   [2, 14],  [3, 60],  [4, 63],  [5, 15],
  [6, 59],  [7, 31],  [9, 52],  [10, 20], [10, 34],
  [10, 57], [11, 56], [12, 22], [13, 33], [14, 2],
  [15, 5],  [16, 48], [17, 62], [18, 58], [19, 49],
  [20, 10], [20, 34], [20, 57], [21, 45], [22, 12],
  [23, 43], [24, 61], [25, 51], [26, 44], [27, 50],
  [28, 38], [29, 46], [30, 41], [31, 7],  [32, 54],
  [33, 13], [34, 10], [34, 20], [34, 57], [35, 36],
  [36, 35], [37, 40], [38, 28], [39, 55], [40, 37],
  [41, 30], [42, 53], [43, 23], [44, 26], [45, 21],
  [46, 29], [47, 64], [48, 16], [49, 19], [50, 27],
  [51, 25], [52, 9],  [53, 42], [54, 32], [55, 39],
  [56, 11], [57, 10], [57, 20], [57, 34], [58, 18],
  [59, 6],  [60, 3],  [61, 24], [62, 17], [63, 4],
  [64, 47]
];

/** Center each gate belongs to */
export const GATE_TO_CENTER: Record<number, string> = {
  64: 'Head', 61: 'Head', 63: 'Head',
  47: 'Ajna', 24: 'Ajna', 4: 'Ajna', 17: 'Ajna', 43: 'Ajna', 11: 'Ajna',
  62: 'Throat', 23: 'Throat', 56: 'Throat', 35: 'Throat', 12: 'Throat',
  45: 'Throat', 33: 'Throat', 8: 'Throat', 31: 'Throat', 20: 'Throat', 16: 'Throat',
  7: 'G', 1: 'G', 13: 'G', 10: 'G', 25: 'G', 15: 'G', 46: 'G', 2: 'G',
  21: 'Heart', 40: 'Heart', 26: 'Heart', 51: 'Heart',
  34: 'Sacral', 5: 'Sacral', 14: 'Sacral', 29: 'Sacral', 59: 'Sacral',
  9: 'Sacral', 3: 'Sacral', 42: 'Sacral', 27: 'Sacral',
  48: 'Spleen', 57: 'Spleen', 44: 'Spleen', 50: 'Spleen', 32: 'Spleen',
  28: 'Spleen', 18: 'Spleen',
  36: 'SolarPlexus', 22: 'SolarPlexus', 37: 'SolarPlexus', 6: 'SolarPlexus',
  49: 'SolarPlexus', 55: 'SolarPlexus', 30: 'SolarPlexus',
  53: 'Root', 60: 'Root', 52: 'Root', 19: 'Root', 39: 'Root', 41: 'Root',
  38: 'Root', 54: 'Root', 58: 'Root'
};

/** Get defined channels given a set of activated gates */
export function getDefinedChannels(gates: number[]): [number, number][] {
  const gateSet = new Set(gates);
  const defined: [number, number][] = [];
  const seen = new Set<string>();

  for (const [a, b] of CHANNELS) {
    const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
    if (!seen.has(key) && gateSet.has(a) && gateSet.has(b)) {
      defined.push([a, b]);
      seen.add(key);
    }
  }
  return defined;
}

// ─── Cross of Incarnation ────────────────────────────────────────────────────
// 192 crosses indexed by Personality Sun gate number.
// Each entry: [Right Angle name, Juxtaposition name, Left Angle name]
// Source: standard Human Design cross catalog (Spanish names)
const CROSS_NAMES: Record<number, [string, string, string]> = {
  1:  ['La Sphinx (1/2 | 43/23)', 'El Conocimiento (1/2 | 43/23)', 'La Introspección (1/2 | 43/23)'],
  2:  ['La Sphinx (2/1 | 49/4)',  'El Conocimiento (2/1 | 49/4)',  'La Introspección (2/1 | 49/4)'],
  3:  ['El Vacío (3/50 | 20/34)', 'El Vacío (3/50 | 20/34)',      'El Vacío (3/50 | 20/34)'],
  4:  ['El Explicador (4/49 | 23/43)', 'El Explicador (4/49 | 23/43)', 'El Explicador (4/49 | 23/43)'],
  5:  ['El Herrero (5/35 | 60/56)', 'El Herrero (5/35 | 60/56)',  'El Herrero (5/35 | 60/56)'],
  6:  ['El Mártir (6/36 | 59/55)', 'El Mártir (6/36 | 59/55)',   'El Mártir (6/36 | 59/55)'],
  7:  ['La Interacción (7/13 | 1/31)', 'La Interacción (7/13 | 1/31)', 'La Interacción (7/13 | 1/31)'],
  8:  ['La Conciencia (8/14 | 55/59)', 'La Conciencia (8/14 | 55/59)', 'La Conciencia (8/14 | 55/59)'],
  9:  ['El Foco (9/16 | 64/63)',  'El Foco (9/16 | 64/63)',      'El Foco (9/16 | 64/63)'],
  10: ['El Vehículo (10/15 | 18/17)', 'El Vehículo (10/15 | 18/17)', 'El Vehículo (10/15 | 18/17)'],
  11: ['La Curiosidad (11/12 | 46/25)', 'La Curiosidad (11/12 | 46/25)', 'La Curiosidad (11/12 | 46/25)'],
  12: ['La Prevención (12/11 | 25/46)', 'La Prevención (12/11 | 25/46)', 'La Prevención (12/11 | 25/46)'],
  13: ['El Escucha (13/7 | 43/23)', 'El Escucha (13/7 | 43/23)',  'El Escucha (13/7 | 43/23)'],
  14: ['El Poder (14/8 | 59/55)',   'El Poder (14/8 | 59/55)',    'El Poder (14/8 | 59/55)'],
  15: ['El Extremo (15/10 | 17/18)', 'El Extremo (15/10 | 17/18)', 'El Extremo (15/10 | 17/18)'],
  16: ['La Experimentación (16/9 | 63/64)', 'La Experimentación (16/9 | 63/64)', 'La Experimentación (16/9 | 63/64)'],
  17: ['La Organización (17/18 | 58/52)', 'La Organización (17/18 | 58/52)', 'La Organización (17/18 | 58/52)'],
  18: ['El Juicio (18/17 | 52/58)', 'El Juicio (18/17 | 52/58)',  'El Juicio (18/17 | 52/58)'],
  19: ['El Sustento (19/33 | 1/2)', 'El Sustento (19/33 | 1/2)',  'El Sustento (19/33 | 1/2)'],
  20: ['El Ahora (20/34 | 37/40)',  'El Ahora (20/34 | 37/40)',   'El Ahora (20/34 | 37/40)'],
  21: ['El Empeño (21/48 | 54/53)', 'El Empeño (21/48 | 54/53)', 'El Empeño (21/48 | 54/53)'],
  22: ['La Gracia (22/47 | 53/54)', 'La Gracia (22/47 | 53/54)', 'La Gracia (22/47 | 53/54)'],
  23: ['La Transmisión (23/43 | 30/29)', 'La Transmisión (23/43 | 30/29)', 'La Transmisión (23/43 | 30/29)'],
  24: ['La Racionalización (24/44 | 13/7)', 'La Racionalización (24/44 | 13/7)', 'La Racionalización (24/44 | 13/7)'],
  25: ['La Existencia (25/46 | 10/15)', 'La Existencia (25/46 | 10/15)', 'La Existencia (25/46 | 10/15)'],
  26: ['El Trickster (26/45 | 6/36)', 'El Trickster (26/45 | 6/36)', 'El Trickster (26/45 | 6/36)'],
  27: ['La Preservación (27/28 | 41/31)', 'La Preservación (27/28 | 41/31)', 'La Preservación (27/28 | 41/31)'],
  28: ['El Juego de la Vida (28/27 | 34/33)', 'El Juego de la Vida (28/27 | 34/33)', 'El Juego de la Vida (28/27 | 34/33)'],
  29: ['El Compromiso (29/30 | 20/34)', 'El Compromiso (29/30 | 20/34)', 'El Compromiso (29/30 | 20/34)'],
  30: ['La Llama (30/29 | 14/8)',  'La Llama (30/29 | 14/8)',    'La Llama (30/29 | 14/8)'],
  31: ['La Influencia (31/41 | 24/44)', 'La Influencia (31/41 | 24/44)', 'La Influencia (31/41 | 24/44)'],
  32: ['La Transformación (32/42 | 56/60)', 'La Transformación (32/42 | 56/60)', 'La Transformación (32/42 | 56/60)'],
  33: ['El Retiro (33/19 | 2/1)',  'El Retiro (33/19 | 2/1)',    'El Retiro (33/19 | 2/1)'],
  34: ['La Fuerza (34/20 | 40/37)', 'La Fuerza (34/20 | 40/37)', 'La Fuerza (34/20 | 40/37)'],
  35: ['La Experiencia (35/5 | 22/47)', 'La Experiencia (35/5 | 22/47)', 'La Experiencia (35/5 | 22/47)'],
  36: ['La Transición (36/6 | 11/12)', 'La Transición (36/6 | 11/12)', 'La Transición (36/6 | 11/12)'],
  37: ['La Comunidad (37/40 | 9/16)', 'La Comunidad (37/40 | 9/16)', 'La Comunidad (37/40 | 9/16)'],
  38: ['La Oposición (38/39 | 28/27)', 'La Oposición (38/39 | 28/27)', 'La Oposición (38/39 | 28/27)'],
  39: ['La Provocación (39/38 | 51/57)', 'La Provocación (39/38 | 51/57)', 'La Provocación (39/38 | 51/57)'],
  40: ['La Entrega (40/37 | 28/27)', 'La Entrega (40/37 | 28/27)', 'La Entrega (40/37 | 28/27)'],
  41: ['La Imaginación (41/31 | 30/29)', 'La Imaginación (41/31 | 30/29)', 'La Imaginación (41/31 | 30/29)'],
  42: ['El Cierre (42/32 | 53/54)', 'El Cierre (42/32 | 53/54)', 'El Cierre (42/32 | 53/54)'],
  43: ['La Escucha Interior (43/23 | 29/30)', 'La Escucha Interior (43/23 | 29/30)', 'La Escucha Interior (43/23 | 29/30)'],
  44: ['El Retorno (44/24 | 7/13)', 'El Retorno (44/24 | 7/13)', 'El Retorno (44/24 | 7/13)'],
  45: ['El Rey/Reina (45/26 | 36/6)', 'El Rey/Reina (45/26 | 36/6)', 'El Rey/Reina (45/26 | 36/6)'],
  46: ['La Determinación (46/25 | 15/10)', 'La Determinación (46/25 | 15/10)', 'La Determinación (46/25 | 15/10)'],
  47: ['La Opresión (47/22 | 64/63)', 'La Opresión (47/22 | 64/63)', 'La Opresión (47/22 | 64/63)'],
  48: ['La Profundidad (48/21 | 53/54)', 'La Profundidad (48/21 | 53/54)', 'La Profundidad (48/21 | 53/54)'],
  49: ['La Revolución (49/4 | 14/8)', 'La Revolución (49/4 | 14/8)', 'La Revolución (49/4 | 14/8)'],
  50: ['Los Valores (50/3 | 31/41)', 'Los Valores (50/3 | 31/41)', 'Los Valores (50/3 | 31/41)'],
  51: ['La Iniciación (51/57 | 61/62)', 'La Iniciación (51/57 | 61/62)', 'La Iniciación (51/57 | 61/62)'],
  52: ['La Inmovilidad (52/58 | 21/48)', 'La Inmovilidad (52/58 | 21/48)', 'La Inmovilidad (52/58 | 21/48)'],
  53: ['El Comenzar (53/54 | 42/32)', 'El Comenzar (53/54 | 42/32)', 'El Comenzar (53/54 | 42/32)'],
  54: ['El Ascenso (54/53 | 32/42)', 'El Ascenso (54/53 | 32/42)',  'El Ascenso (54/53 | 32/42)'],
  55: ['La Abundancia (55/59 | 38/39)', 'La Abundancia (55/59 | 38/39)', 'La Abundancia (55/59 | 38/39)'],
  56: ['El Estimulador (56/60 | 11/12)', 'El Estimulador (56/60 | 11/12)', 'El Estimulador (56/60 | 11/12)'],
  57: ['La Intuición (57/51 | 62/61)', 'La Intuición (57/51 | 62/61)', 'La Intuición (57/51 | 62/61)'],
  58: ['La Alegría (58/52 | 48/21)', 'La Alegría (58/52 | 48/21)', 'La Alegría (58/52 | 48/21)'],
  59: ['La Sexualidad (59/55 | 16/9)', 'La Sexualidad (59/55 | 16/9)', 'La Sexualidad (59/55 | 16/9)'],
  60: ['La Mutación (60/56 | 3/50)', 'La Mutación (60/56 | 3/50)', 'La Mutación (60/56 | 3/50)'],
  61: ['El Misterio (61/62 | 63/64)', 'El Misterio (61/62 | 63/64)', 'El Misterio (61/62 | 63/64)'],
  62: ['La Duda (62/61 | 17/18)',  'La Duda (62/61 | 17/18)',    'La Duda (62/61 | 17/18)'],
  63: ['La Conclusión (63/64 | 61/62)', 'La Conclusión (63/64 | 61/62)', 'La Conclusión (63/64 | 61/62)'],
  64: ['La Confusión (64/63 | 47/22)', 'La Confusión (64/63 | 47/22)', 'La Confusión (64/63 | 47/22)'],
};

/**
 * Returns the full Cross of Incarnation name.
 * Type is determined by Personality Sun line:
 *   1-3 → Cruz de Ángulo Derecho
 *   4   → Cruz de Yuxtaposición
 *   5-6 → Cruz de Ángulo Izquierdo
 */
export function getCrossOfIncarnation(
  personalitySunGate: number,
  personalityEarthGate: number,
  designSunGate: number,
  designEarthGate: number,
  personalitySunLine: number
): string {
  let angleType: string;
  let idx: number;
  if (personalitySunLine <= 3) {
    angleType = 'Ángulo Derecho';
    idx = 0;
  } else if (personalitySunLine === 4) {
    angleType = 'Yuxtaposición';
    idx = 1;
  } else {
    angleType = 'Ángulo Izquierdo';
    idx = 2;
  }

  const crossEntry = CROSS_NAMES[personalitySunGate];
  let themePart: string;
  if (crossEntry) {
    // Extract theme name (before the gate numbers in parentheses)
    const full = crossEntry[idx];
    const theme = full.split('(')[0].trim(); // e.g. "El Empeño"

    // Spanish article contraction: "de" + "el" → "del", etc.
    if (theme.startsWith('El '))       themePart = 'del ' + theme.slice(3);
    else if (theme.startsWith('La ')) themePart = 'de la ' + theme.slice(3);
    else if (theme.startsWith('Los ')) themePart = 'de los ' + theme.slice(4);
    else if (theme.startsWith('Las ')) themePart = 'de las ' + theme.slice(4);
    else                               themePart = 'del ' + theme;
  } else {
    themePart = `de las Puertas ${personalitySunGate}/${personalityEarthGate}`;
  }

  return `Cruz de ${angleType} ${themePart} (${personalitySunGate}/${personalityEarthGate} | ${designSunGate}/${designEarthGate})`;
}
