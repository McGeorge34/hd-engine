import axios from 'axios';

export interface GeoResult {
  name: string;
  lat: number;
  lon: number;
  timezone: string;
  country: string;
  admin1?: string; // state / province / region
}

// ─── Country name → ISO-2 code ────────────────────────────────────────────────
const COUNTRY_ALIASES: Record<string, string> = {
  // English
  'united states': 'US', 'usa': 'US', 'us': 'US', 'united states of america': 'US',
  'united kingdom': 'GB', 'uk': 'GB', 'great britain': 'GB', 'england': 'GB',
  'mexico': 'MX', 'canada': 'CA', 'australia': 'AU', 'new zealand': 'NZ',
  'germany': 'DE', 'france': 'FR', 'spain': 'ES', 'italy': 'IT',
  'portugal': 'PT', 'brazil': 'BR', 'argentina': 'AR', 'colombia': 'CO',
  'chile': 'CL', 'peru': 'PE', 'venezuela': 'VE', 'ecuador': 'EC',
  'bolivia': 'BO', 'paraguay': 'PY', 'uruguay': 'UY', 'cuba': 'CU',
  'japan': 'JP', 'china': 'CN', 'india': 'IN', 'russia': 'RU',
  'netherlands': 'NL', 'holland': 'NL', 'belgium': 'BE', 'switzerland': 'CH',
  'austria': 'AT', 'sweden': 'SE', 'norway': 'NO', 'denmark': 'DK',
  'finland': 'FI', 'poland': 'PL', 'ukraine': 'UA', 'turkey': 'TR',
  'israel': 'IL', 'egypt': 'EG', 'south africa': 'ZA', 'nigeria': 'NG',
  'kenya': 'KE', 'ethiopia': 'ET', 'ghana': 'GH', 'morocco': 'MA',
  'south korea': 'KR', 'korea': 'KR', 'north korea': 'KP',
  'indonesia': 'ID', 'philippines': 'PH', 'vietnam': 'VN', 'thailand': 'TH',
  'malaysia': 'MY', 'singapore': 'SG', 'pakistan': 'PK', 'bangladesh': 'BD',
  'saudi arabia': 'SA', 'iran': 'IR', 'iraq': 'IQ', 'uae': 'AE',
  'united arab emirates': 'AE', 'qatar': 'QA', 'kuwait': 'KW',
  // Spanish (only entries that differ from English keys)
  'estados unidos': 'US', 'ee. uu.': 'US', 'ee.uu.': 'US',
  'reino unido': 'GB', 'alemania': 'DE', 'francia': 'FR', 'españa': 'ES',
  'italia': 'IT', 'países bajos': 'NL', 'holanda': 'NL', 'bélgica': 'BE',
  'suiza': 'CH', 'suecia': 'SE', 'noruega': 'NO',
  'dinamarca': 'DK', 'finlandia': 'FI', 'polonia': 'PL', 'ucrania': 'UA',
  'turquía': 'TR', 'rusia': 'RU', 'japón': 'JP',
  'corea del sur': 'KR', 'corea': 'KR', 'tailandia': 'TH',
  'filipinas': 'PH', 'malasia': 'MY',
  'arabia saudita': 'SA', 'emiratos árabes': 'AE', 'irán': 'IR',
  'irak': 'IQ', 'egipto': 'EG', 'marruecos': 'MA', 'sudáfrica': 'ZA',
  'kenia': 'KE', 'etiopía': 'ET',
  'brasil': 'BR', 'perú': 'PE',
  'méxico': 'MX', 'canadá': 'CA', 'nueva zelanda': 'NZ',
};

// US state names → abbreviation
const US_STATES: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC', 'dc': 'DC',
};

interface PlaceParts {
  city: string;
  region?: string; // state, province, etc.
  country?: string; // raw string
  countryCode?: string; // ISO-2
}

/**
 * Parse "City, State, Country" into structured parts.
 * Handles 1, 2, or 3 comma-separated segments.
 */
function parsePlaceString(place: string): PlaceParts {
  const parts = place.split(',').map(p => p.trim()).filter(Boolean);
  const city = parts[0] ?? place.trim();

  if (parts.length === 1) return { city };

  if (parts.length === 2) {
    // Could be "City, Country" or "City, State"
    const second = parts[1].toLowerCase();
    const countryCode = COUNTRY_ALIASES[second];
    if (countryCode) return { city, country: parts[1], countryCode };
    return { city, region: parts[1] };
  }

  // 3+ parts: City, State, Country (most common)
  const region = parts[1];
  const countryRaw = parts.slice(2).join(', ');
  const countryCode = COUNTRY_ALIASES[countryRaw.toLowerCase()];

  return { city, region, country: countryRaw, countryCode };
}

interface OpenMeteoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country_code: string;
  country: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  timezone: string;
}

/**
 * Score how well a geocoding result matches the user's input.
 * Higher = better match.
 */
function scoreResult(r: OpenMeteoResult, parts: PlaceParts): number {
  let score = 0;
  const lc = (s?: string) => (s ?? '').toLowerCase();

  // City name match (exact > starts-with > contains)
  const resultCity = lc(r.name);
  const inputCity  = lc(parts.city);
  if (resultCity === inputCity)               score += 100;
  else if (resultCity.startsWith(inputCity))  score += 60;
  else if (resultCity.includes(inputCity))    score += 30;

  // Country code match — strong signal
  if (parts.countryCode && lc(r.country_code) === lc(parts.countryCode)) score += 80;

  // Region (state/province) match
  if (parts.region) {
    const regionLc = lc(parts.region);
    const admin1Lc = lc(r.admin1);
    if (admin1Lc === regionLc)              score += 60;
    else if (admin1Lc.includes(regionLc) || regionLc.includes(admin1Lc)) score += 35;
    // US state abbreviation match
    const stateAbbr = US_STATES[regionLc];
    if (stateAbbr && admin1Lc.includes(regionLc)) score += 20;
  }

  // Country name match in raw input
  if (parts.country) {
    const cLc = lc(parts.country);
    if (lc(r.country) === cLc || lc(r.country).includes(cLc) || cLc.includes(lc(r.country))) score += 20;
  }

  return score;
}

// Simple in-memory cache to avoid hammering the API for the same place
const geoCache = new Map<string, GeoResult>();

export async function geocode(place: string): Promise<GeoResult> {
  const cacheKey = place.trim().toLowerCase();
  if (geoCache.has(cacheKey)) return geoCache.get(cacheKey)!;

  const parts = parsePlaceString(place);

  // Try progressively broader searches until we find a good result
  const searchQueries = [parts.city];

  // If city name has multiple words, also try just the first word as fallback
  const words = parts.city.split(/\s+/);
  if (words.length > 1) searchQueries.push(words[0]);

  let bestResult: GeoResult | null = null;
  let bestScore = -1;

  for (const query of searchQueries) {
    const url = `https://geocoding-api.open-meteo.com/v1/search` +
      `?name=${encodeURIComponent(query)}&count=15&language=en&format=json`;

    let results: OpenMeteoResult[] = [];
    try {
      const response = await axios.get(url, { timeout: 12000 });
      results = response.data?.results ?? [];
    } catch (err: any) {
      throw new Error(`Geocoding API error: ${err.message}`);
    }

    for (const r of results) {
      const score = scoreResult(r, parts);
      if (score > bestScore) {
        bestScore = score;
        bestResult = {
          name:     r.name,
          lat:      r.latitude,
          lon:      r.longitude,
          timezone: r.timezone || 'UTC',
          country:  r.country_code || '',
          admin1:   r.admin1,
        };
      }
    }

    // Stop early if we found a confident match
    if (bestScore >= 150) break;
  }

  if (!bestResult) {
    throw new Error(
      `No se encontraron resultados de geocodificación para: "${place}". ` +
      `Prueba el formato "Ciudad, Estado/Región, País" (ej. "Guadalajara, Jalisco, México").`
    );
  }

  geoCache.set(cacheKey, bestResult);
  return bestResult;
}

// ─── Timezone offset ───────────────────────────────────────────────────────────

/**
 * Get UTC offset in hours for a timezone name at a given date.
 * Uses Intl API (DST-aware) with a static fallback table.
 */
export function getTimezoneOffset(timezone: string, date: Date): number {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate  = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return (tzDate.getTime() - utcDate.getTime()) / 3600000;
  } catch {
    // Static fallback (standard time, no DST)
    const STATIC: Record<string, number> = {
      'America/New_York': -5, 'America/Chicago': -6, 'America/Denver': -7,
      'America/Phoenix': -7,  'America/Los_Angeles': -8, 'America/Anchorage': -9,
      'America/Honolulu': -10, 'America/Puerto_Rico': -4,
      'America/Mexico_City': -6, 'America/Monterrey': -6, 'America/Tijuana': -8,
      'America/Bogota': -5, 'America/Lima': -5, 'America/Santiago': -4,
      'America/Buenos_Aires': -3, 'America/Sao_Paulo': -3, 'America/Caracas': -4,
      'America/La_Paz': -4, 'America/Asuncion': -4, 'America/Montevideo': -3,
      'America/Havana': -5, 'America/Guatemala': -6, 'America/Managua': -6,
      'America/Costa_Rica': -6, 'America/Panama': -5, 'America/Tegucigalpa': -6,
      'America/El_Salvador': -6, 'America/Belize': -6,
      'America/Toronto': -5, 'America/Vancouver': -8, 'America/Edmonton': -7,
      'America/Winnipeg': -6, 'America/Halifax': -4,
      'Europe/London': 0,  'Europe/Lisbon': 0,
      'Europe/Paris': 1,   'Europe/Madrid': 1,   'Europe/Berlin': 1,
      'Europe/Rome': 1,    'Europe/Amsterdam': 1, 'Europe/Brussels': 1,
      'Europe/Vienna': 1,  'Europe/Warsaw': 1,   'Europe/Prague': 1,
      'Europe/Budapest': 1,'Europe/Zurich': 1,   'Europe/Stockholm': 1,
      'Europe/Oslo': 1,    'Europe/Copenhagen': 1,'Europe/Helsinki': 2,
      'Europe/Athens': 2,  'Europe/Bucharest': 2, 'Europe/Kiev': 2,
      'Europe/Moscow': 3,  'Europe/Istanbul': 3,
      'Asia/Dubai': 4,     'Asia/Karachi': 5,     'Asia/Kolkata': 5.5,
      'Asia/Dhaka': 6,     'Asia/Bangkok': 7,     'Asia/Singapore': 8,
      'Asia/Shanghai': 8,  'Asia/Tokyo': 9,       'Asia/Seoul': 9,
      'Asia/Jakarta': 7,   'Asia/Manila': 8,      'Asia/Taipei': 8,
      'Asia/Beirut': 2,    'Asia/Riyadh': 3,      'Asia/Baghdad': 3,
      'Asia/Tehran': 3.5,  'Asia/Baku': 4,        'Asia/Kabul': 4.5,
      'Asia/Tashkent': 5,  'Asia/Almaty': 6,
      'Asia/Rangoon': 6.5, 'Asia/Ho_Chi_Minh': 7,'Asia/Ulaanbaatar': 8,
      'Asia/Pyongyang': 9, 'Asia/Vladivostok': 10,
      'Australia/Perth': 8,    'Australia/Darwin': 9.5, 'Australia/Adelaide': 9.5,
      'Australia/Sydney': 10,  'Australia/Brisbane': 10,'Australia/Melbourne': 10,
      'Pacific/Auckland': 12,  'Pacific/Fiji': 12,
      'Africa/Cairo': 2,   'Africa/Nairobi': 3,  'Africa/Lagos': 1,
      'Africa/Johannesburg': 2,'Africa/Accra': 0, 'Africa/Casablanca': 0,
      'Africa/Addis_Ababa': 3,
    };
    return STATIC[timezone] ?? 0;
  }
}
