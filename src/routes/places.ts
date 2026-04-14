import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

interface OpenMeteoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country_code: string;
  country: string;
  admin1?: string;
  admin2?: string;
  timezone: string;
  population?: number;
}

export interface PlaceSuggestion {
  label: string;     // Display text: "Scottsdale, Arizona, United States"
  value: string;     // Same string, goes into the input
  lat: number;
  lon: number;
  timezone: string;
  countryCode: string;
}

function buildLabel(r: OpenMeteoResult): string {
  const parts: string[] = [r.name];
  if (r.admin1 && r.admin1 !== r.name) parts.push(r.admin1);
  if (r.country) parts.push(r.country);
  return parts.join(', ');
}

/**
 * GET /api/places/search?q=Scottsdale
 * Returns up to 8 place suggestions from Open-Meteo geocoding API.
 */
router.get('/search', async (req: Request, res: Response) => {
  const q = ((req.query.q as string) || '').trim();
  if (!q || q.length < 2) {
    return res.json({ results: [] });
  }

  try {
    const url =
      `https://geocoding-api.open-meteo.com/v1/search` +
      `?name=${encodeURIComponent(q)}&count=10&language=es&format=json`;

    const response = await axios.get(url, { timeout: 8000 });
    const raw: OpenMeteoResult[] = response.data?.results ?? [];

    // Sort: exact name match first, then by population descending
    const sorted = [...raw].sort((a, b) => {
      const aExact = a.name.toLowerCase() === q.toLowerCase() ? 1 : 0;
      const bExact = b.name.toLowerCase() === q.toLowerCase() ? 1 : 0;
      if (bExact !== aExact) return bExact - aExact;
      return (b.population ?? 0) - (a.population ?? 0);
    });

    // Deduplicate by label
    const seen = new Set<string>();
    const results: PlaceSuggestion[] = [];
    for (const r of sorted) {
      const label = buildLabel(r);
      if (!seen.has(label)) {
        seen.add(label);
        results.push({
          label,
          value: label,
          lat: r.latitude,
          lon: r.longitude,
          timezone: r.timezone,
          countryCode: r.country_code,
        });
      }
      if (results.length >= 8) break;
    }

    res.json({ results });
  } catch (err: any) {
    console.error('Places search error:', err.message);
    res.status(500).json({ error: 'Error al buscar lugares', results: [] });
  }
});

export default router;
