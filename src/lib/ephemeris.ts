/**
 * Astronomical calculations using astronomy-engine (pure JS, no native bindings).
 * Computes planetary ecliptic longitudes for Human Design charts.
 */

import * as Astronomy from 'astronomy-engine';

export interface PlanetPosition {
  longitude: number; // ecliptic longitude 0-360°
  latitude: number;
  distance: number;
}

export interface BirthData {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  lat: number;
  lon: number;
  tzOffset: number; // hours offset from UTC
}

const PLANETS = [
  { name: 'Sun',     body: Astronomy.Body.Sun },
  { name: 'Earth',   body: Astronomy.Body.Earth }, // handled specially
  { name: 'Moon',    body: Astronomy.Body.Moon },
  { name: 'Mercury', body: Astronomy.Body.Mercury },
  { name: 'Venus',   body: Astronomy.Body.Venus },
  { name: 'Mars',    body: Astronomy.Body.Mars },
  { name: 'Jupiter', body: Astronomy.Body.Jupiter },
  { name: 'Saturn',  body: Astronomy.Body.Saturn },
  { name: 'Uranus',  body: Astronomy.Body.Uranus },
  { name: 'Neptune', body: Astronomy.Body.Neptune },
  { name: 'Pluto',   body: Astronomy.Body.Pluto },
] as const;

function toAstroTime(data: BirthData): Astronomy.AstroTime {
  const utcHour = data.hour - data.tzOffset;
  const date = new Date(Date.UTC(data.year, data.month - 1, data.day, 0, 0, 0, 0));
  const totalMinutes = Math.round(utcHour * 60 + data.minute);
  date.setUTCMinutes(date.getUTCMinutes() + totalMinutes);
  return Astronomy.MakeTime(date);
}

function getSunLongitude(time: Astronomy.AstroTime): number {
  const ecliptic = Astronomy.SunPosition(time);
  return ((ecliptic.elon % 360) + 360) % 360;
}

function getBodyLongitude(body: Astronomy.Body, time: Astronomy.AstroTime): number {
  if (body === Astronomy.Body.Sun) {
    return getSunLongitude(time);
  }
  if (body === Astronomy.Body.Earth) {
    // Earth in HD = opposite of Sun
    return (getSunLongitude(time) + 180) % 360;
  }
  // For other bodies, get heliocentric or geocentric position
  // astronomy-engine GeoVector gives geocentric; we use EclipticGeoMoon for Moon
  if (body === Astronomy.Body.Moon) {
    const moonEcl = Astronomy.EclipticGeoMoon(time);
    return ((moonEcl.lon % 360) + 360) % 360;
  }
  // For planets: compute geocentric ecliptic longitude
  const geo = Astronomy.GeoVector(body, time, true);
  const ecl = Astronomy.Ecliptic(geo);
  return ((ecl.elon % 360) + 360) % 360;
}

export interface ChartPositions {
  personality: Record<string, { longitude: number; gate: number; line: number }>;
  design: Record<string, { longitude: number; gate: number; line: number }>;
  designDate: Date;
}

/**
 * Find the time when the Sun was exactly `degrees` of solar arc before `birthTime`.
 * Used to compute the Design point (88° before birth).
 */
function findDesignTime(birthTime: Astronomy.AstroTime, degrees: number): Astronomy.AstroTime {
  const birthLon = getSunLongitude(birthTime);
  const targetLon = ((birthLon - degrees) % 360 + 360) % 360;

  // Start searching ~90 days before birth (88 solar degrees ≈ ~88 days)
  let t = new Date(birthTime.date.getTime() - 92 * 24 * 3600 * 1000);
  let astroT = Astronomy.MakeTime(t);

  // Bisection search to find when Sun longitude == targetLon
  let lo = new Date(birthTime.date.getTime() - 95 * 24 * 3600 * 1000);
  let hi = new Date(birthTime.date.getTime() - 80 * 24 * 3600 * 1000);

  for (let i = 0; i < 60; i++) {
    const mid = new Date((lo.getTime() + hi.getTime()) / 2);
    const midT = Astronomy.MakeTime(mid);
    const midLon = getSunLongitude(midT);

    // Angular difference (handle wrap-around)
    let diff = midLon - targetLon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    if (Math.abs(diff) < 0.0001) {
      astroT = midT;
      break;
    }
    if (diff > 0) {
      hi = mid;
    } else {
      lo = mid;
    }
    astroT = midT;
  }

  return astroT;
}

import { longitudeToGateLine } from './gates';

/**
 * Mean ascending lunar node (North Node) longitude using the standard IAU formula.
 * N = 125.0445479° - 0.0529539297° × days_from_J2000
 * Regresses ~19.341°/year (retrograde motion).
 */
function getMoonNodeLongitude(time: Astronomy.AstroTime): number {
  const J2000 = 2451545.0;
  const jd = time.tt + J2000; // astronomy-engine .tt = TT days from J2000
  const d = jd - J2000;
  const node = 125.0445479 - 0.0529539297 * d;
  return ((node % 360) + 360) % 360;
}

export function computePositions(data: BirthData): ChartPositions {
  const birthTime  = toAstroTime(data);
  const designTime = findDesignTime(birthTime, 88);

  const personality: Record<string, { longitude: number; gate: number; line: number }> = {};
  const design:      Record<string, { longitude: number; gate: number; line: number }> = {};

  // Standard planets
  for (const planet of PLANETS) {
    const pLon = getBodyLongitude(planet.body, birthTime);
    const dLon = getBodyLongitude(planet.body, designTime);
    personality[planet.name] = { longitude: pLon, ...longitudeToGateLine(pLon) };
    design[planet.name]      = { longitude: dLon, ...longitudeToGateLine(dLon) };
  }

  // North Node (Moon's ascending node)
  const pNNodeLon = getMoonNodeLongitude(birthTime);
  const dNNodeLon = getMoonNodeLongitude(designTime);
  personality['NorthNode'] = { longitude: pNNodeLon, ...longitudeToGateLine(pNNodeLon) };
  design['NorthNode']      = { longitude: dNNodeLon, ...longitudeToGateLine(dNNodeLon) };

  // South Node = North Node + 180°
  const pSNodeLon = (pNNodeLon + 180) % 360;
  const dSNodeLon = (dNNodeLon + 180) % 360;
  personality['SouthNode'] = { longitude: pSNodeLon, ...longitudeToGateLine(pSNodeLon) };
  design['SouthNode']      = { longitude: dSNodeLon, ...longitudeToGateLine(dSNodeLon) };

  return {
    personality,
    design,
    designDate: designTime.date,
  };
}
