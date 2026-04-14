/**
 * Human Design BodyGraph SVG generator.
 * Generates a complete BodyGraph with 9 centers and 32 channels.
 */

// Center positions (cx, cy, width, height)
const CENTER_SHAPES: Record<string, { cx: number; cy: number; size: number; shape: 'diamond' | 'square' | 'triangle' }> = {
  Head:        { cx: 320, cy:  60, size: 44, shape: 'triangle' },
  Ajna:        { cx: 320, cy: 135, size: 44, shape: 'triangle' },
  Throat:      { cx: 320, cy: 225, size: 44, shape: 'square' },
  G:           { cx: 320, cy: 320, size: 50, shape: 'diamond' },
  Heart:       { cx: 230, cy: 290, size: 44, shape: 'diamond' },
  Sacral:      { cx: 320, cy: 430, size: 44, shape: 'square' },
  Spleen:      { cx: 185, cy: 375, size: 44, shape: 'diamond' },
  SolarPlexus: { cx: 445, cy: 375, size: 44, shape: 'diamond' },
  Root:        { cx: 320, cy: 530, size: 44, shape: 'square' },
};

// Channel connections: [gate1, gate2, center1, center2, label position]
const CHANNEL_PATHS: Array<{
  gates: [number, number];
  centers: [string, string];
  path: string;
}> = [
  // Head-Ajna
  { gates: [64, 47], centers: ['Head', 'Ajna'], path: 'M305,82 L305,113' },
  { gates: [61, 24], centers: ['Head', 'Ajna'], path: 'M320,82 L320,113' },
  { gates: [63, 4],  centers: ['Head', 'Ajna'], path: 'M335,82 L335,113' },
  // Ajna-Throat
  { gates: [17, 62], centers: ['Ajna', 'Throat'], path: 'M305,157 L305,203' },
  { gates: [43, 23], centers: ['Ajna', 'Throat'], path: 'M320,157 L320,203' },
  { gates: [11, 56], centers: ['Ajna', 'Throat'], path: 'M335,157 L335,203' },
  // Throat-G
  { gates: [31, 7],  centers: ['Throat', 'G'],     path: 'M305,247 L305,298' },
  { gates: [8, 1],   centers: ['Throat', 'G'],     path: 'M320,247 L320,298' },
  { gates: [33, 13], centers: ['Throat', 'G'],     path: 'M335,247 L335,298' },
  // Throat-G (20-10)
  { gates: [20, 10], centers: ['Throat', 'G'],     path: 'M290,247 Q270,280 285,315' },
  // Throat-Heart
  { gates: [45, 21], centers: ['Throat', 'Heart'], path: 'M298,235 L258,278' },
  // G-Sacral
  { gates: [2, 14],  centers: ['G', 'Sacral'],    path: 'M320,346 L320,408' },
  { gates: [15, 5],  centers: ['G', 'Sacral'],    path: 'M308,346 L308,408' },
  { gates: [46, 29], centers: ['G', 'Sacral'],    path: 'M332,346 L332,408' },
  // G-Spleen (57-10)
  { gates: [57, 10], centers: ['Spleen', 'G'],    path: 'M207,365 Q240,345 290,330' },
  // Heart-G
  { gates: [25, 51], centers: ['G', 'Heart'],     path: 'M296,322 L252,302' },
  // Heart-Sacral (34-20, 34-10)
  // Sacral channels
  { gates: [34, 10], centers: ['Sacral', 'G'],    path: 'M332,410 Q380,370 345,340' },
  { gates: [34, 20], centers: ['Sacral', 'Throat'], path: 'M340,410 Q420,310 350,235' },
  { gates: [34, 57], centers: ['Sacral', 'Spleen'], path: 'M300,420 Q240,400 207,397' },
  // Sacral-Root
  { gates: [9, 52],  centers: ['Sacral', 'Root'], path: 'M305,452 L305,508' },
  { gates: [3, 60],  centers: ['Sacral', 'Root'], path: 'M320,452 L320,508' },
  { gates: [42, 53], centers: ['Sacral', 'Root'], path: 'M335,452 L335,508' },
  // Sacral-SolarPlexus
  { gates: [59, 6],  centers: ['Sacral', 'SolarPlexus'], path: 'M345,425 Q410,400 423,397' },
  // Root-SolarPlexus
  { gates: [41, 30], centers: ['Root', 'SolarPlexus'], path: 'M345,530 Q420,510 423,397' },
  { gates: [19, 49], centers: ['Root', 'SolarPlexus'], path: 'M350,525 Q440,490 445,397' },
  { gates: [39, 55], centers: ['Root', 'SolarPlexus'], path: 'M355,520 Q460,480 467,397' },
  // Root-Spleen
  { gates: [58, 18], centers: ['Root', 'Spleen'], path: 'M290,530 Q220,510 207,397' },
  { gates: [38, 28], centers: ['Root', 'Spleen'], path: 'M285,525 Q210,490 185,397' },
  { gates: [54, 32], centers: ['Root', 'Spleen'], path: 'M280,520 Q200,480 163,397' },
  // Spleen-Throat (57-20)
  { gates: [57, 20], centers: ['Spleen', 'Throat'], path: 'M185,353 Q200,290 298,232' },
  // Spleen-Heart
  { gates: [44, 26], centers: ['Spleen', 'Heart'], path: 'M205,365 L218,305' },
  // SolarPlexus-Heart
  { gates: [37, 40], centers: ['SolarPlexus', 'Heart'], path: 'M425,360 L255,305' },
  // SolarPlexus-Throat (12-22)
  { gates: [22, 12], centers: ['SolarPlexus', 'Throat'], path: 'M430,353 Q410,280 342,235' },
  // SolarPlexus-Spleen
  { gates: [50, 27], centers: ['SolarPlexus', 'Spleen'], path: 'M420,395 Q300,430 207,395' },
  // Head-Ajna extra (4-63)
  // G-Throat (20-10 already above)
];

// Gate label positions along channels (gate number → position on SVG)
const GATE_POSITIONS: Record<number, { x: number; y: number }> = {
  // Head center area
  64: { x: 298, y: 75 }, 47: { x: 298, y: 128 },
  61: { x: 313, y: 75 }, 24: { x: 313, y: 128 },
  63: { x: 328, y: 75 }, 4:  { x: 328, y: 128 },
  // Ajna-Throat
  17: { x: 298, y: 170 }, 62: { x: 298, y: 200 },
  43: { x: 313, y: 170 }, 23: { x: 313, y: 200 },
  11: { x: 328, y: 170 }, 56: { x: 328, y: 200 },
  // Throat-G
  31: { x: 296, y: 262 }, 7:  { x: 296, y: 290 },
  8:  { x: 313, y: 262 }, 1:  { x: 313, y: 290 },
  33: { x: 330, y: 262 }, 13: { x: 330, y: 290 },
  // G-Sacral main
  2:  { x: 313, y: 363 }, 14: { x: 313, y: 395 },
  15: { x: 300, y: 363 }, 5:  { x: 300, y: 395 },
  46: { x: 326, y: 363 }, 29: { x: 326, y: 395 },
  // Heart-Throat
  45: { x: 283, y: 248 }, 21: { x: 253, y: 260 },
  // Heart-G
  25: { x: 282, y: 318 }, 51: { x: 255, y: 306 },
  // Sacral-Root
  9:  { x: 298, y: 470 }, 52: { x: 298, y: 494 },
  3:  { x: 313, y: 470 }, 60: { x: 313, y: 494 },
  42: { x: 328, y: 470 }, 53: { x: 328, y: 494 },
  // Sacral-SolarPlexus
  59: { x: 365, y: 418 }, 6:  { x: 405, y: 406 },
  // Root-SolarPlexus
  41: { x: 360, y: 520 }, 30: { x: 430, y: 460 },
  19: { x: 372, y: 516 }, 49: { x: 445, y: 455 },
  39: { x: 384, y: 510 }, 55: { x: 462, y: 450 },
  // Root-Spleen
  58: { x: 278, y: 520 }, 18: { x: 222, y: 460 },
  38: { x: 266, y: 516 }, 28: { x: 205, y: 455 },
  54: { x: 254, y: 510 }, 32: { x: 188, y: 450 },
  // Spleen
  57: { x: 195, y: 372 }, 10: { x: 268, y: 338 },
  44: { x: 210, y: 368 }, 26: { x: 228, y: 320 },
  48: { x: 172, y: 382 }, 16: { x: 305, y: 220 },
  50: { x: 405, y: 430 }, 27: { x: 200, y: 432 },
  // SolarPlexus-Heart
  37: { x: 390, y: 368 }, 40: { x: 338, y: 316 },
  // SolarPlexus-Throat
  22: { x: 428, y: 348 }, 12: { x: 348, y: 230 },
  // Sacral-Spleen (34-57)
  34: { x: 288, y: 425 }, // multiple connections
  // SolarPlexus extra
  36: { x: 460, y: 375 },
  20: { x: 348, y: 270 },
};

function centerPath(cx: number, cy: number, size: number): string {
  const h = size / 2;
  return `M${cx},${cy - h} L${cx + h},${cy} L${cx},${cy + h} L${cx - h},${cy} Z`;
}

function squarePath(cx: number, cy: number, size: number): string {
  const h = size / 2;
  return `M${cx - h},${cy - h} L${cx + h},${cy - h} L${cx + h},${cy + h} L${cx - h},${cy + h} Z`;
}

function trianglePath(cx: number, cy: number, size: number): string {
  const h = size / 2;
  return `M${cx},${cy - h} L${cx + h},${cy + h} L${cx - h},${cy + h} Z`;
}

function getShapePath(center: string, def: typeof CENTER_SHAPES[string]): string {
  if (def.shape === 'diamond') return centerPath(def.cx, def.cy, def.size);
  if (def.shape === 'square') return squarePath(def.cx, def.cy, def.size);
  return trianglePath(def.cx, def.cy, def.size);
}

export function generateBodygraphSVG(
  personalityGates: number[],
  designGates: number[],
  definedChannels: [number, number][],
  definedCenters: string[]
): string {
  const pSet = new Set(personalityGates);
  const dSet = new Set(designGates);
  const definedChannelSet = new Set(
    definedChannels.map(([a, b]) => `${Math.min(a,b)}-${Math.max(a,b)}`)
  );

  function gateColor(gate: number): string {
    const inP = pSet.has(gate);
    const inD = dSet.has(gate);
    if (inP && inD) return '#8B4513'; // brown = both
    if (inP) return '#1a1a2e'; // dark = personality (black)
    if (inD) return '#c0392b'; // red = design
    return 'none';
  }

  function channelColor(g1: number, g2: number): string | null {
    const key = `${Math.min(g1,g2)}-${Math.max(g1,g2)}`;
    if (!definedChannelSet.has(key)) return null;
    const inP1 = pSet.has(g1), inP2 = pSet.has(g2);
    const inD1 = dSet.has(g1), inD2 = dSet.has(g2);
    const isPersonality = inP1 && inP2;
    const isDesign = inD1 && inD2;
    if (isPersonality && isDesign) return '#8B4513';
    if (isPersonality) return '#1a1a2e';
    if (isDesign) return '#c0392b';
    // Mixed
    return '#6b2fa0';
  }

  // Build SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 620" width="640" height="620" font-family="Arial, sans-serif">
  <rect width="640" height="620" fill="#fafafa" rx="8"/>

  <!-- Title -->
  <text x="320" y="20" text-anchor="middle" font-size="13" font-weight="bold" fill="#333">BodyGraph</text>

  <!-- Channel paths (background - undefined) -->`;

  // Draw all channel paths
  for (const ch of CHANNEL_PATHS) {
    const [g1, g2] = ch.gates;
    const color = channelColor(g1, g2);
    const strokeColor = color || '#ddd';
    const strokeWidth = color ? 6 : 2;
    const opacity = color ? 1 : 0.5;
    svg += `\n  <path d="${ch.path}" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="none" opacity="${opacity}" stroke-linecap="round"/>`;
  }

  // Draw centers
  svg += '\n\n  <!-- Centers -->';
  for (const [centerName, def] of Object.entries(CENTER_SHAPES)) {
    const isDefined = definedCenters.includes(centerName);
    const shapePath = getShapePath(centerName, def);
    const fillColor = isDefined ? '#f0c040' : '#e8e8e8';
    const strokeColor = isDefined ? '#c8960a' : '#aaa';

    svg += `\n  <path d="${shapePath}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`;

    // Center label
    const displayName = centerName === 'SolarPlexus' ? 'SP' :
                        centerName === 'G' ? 'G/Id' : centerName.substring(0, 4);
    svg += `\n  <text x="${def.cx}" y="${def.cy + 5}" text-anchor="middle" font-size="9" fill="${isDefined ? '#7a5800' : '#666'}" font-weight="${isDefined ? 'bold' : 'normal'}">${displayName}</text>`;
  }

  // Draw gate numbers
  svg += '\n\n  <!-- Gate numbers -->';
  for (const [gateStr, pos] of Object.entries(GATE_POSITIONS)) {
    const gate = parseInt(gateStr);
    const color = gateColor(gate);
    if (color === 'none') continue;
    svg += `\n  <circle cx="${pos.x}" cy="${pos.y}" r="8" fill="${color}" opacity="0.9"/>`;
    svg += `\n  <text x="${pos.x}" y="${pos.y + 4}" text-anchor="middle" font-size="7" fill="white" font-weight="bold">${gate}</text>`;
  }

  // Legend
  svg += `
  <!-- Legend -->
  <rect x="10" y="580" width="12" height="12" fill="#1a1a2e" rx="2"/>
  <text x="26" y="591" font-size="10" fill="#333">Personalidad</text>
  <rect x="110" y="580" width="12" height="12" fill="#c0392b" rx="2"/>
  <text x="126" y="591" font-size="10" fill="#333">Diseño</text>
  <rect x="195" y="580" width="12" height="12" fill="#8B4513" rx="2"/>
  <text x="211" y="591" font-size="10" fill="#333">Ambos</text>
  <rect x="260" y="580" width="12" height="12" fill="#f0c040" rx="2" stroke="#c8960a"/>
  <text x="276" y="591" font-size="10" fill="#333">Centro Definido</text>`;

  svg += '\n</svg>';
  return svg;
}
