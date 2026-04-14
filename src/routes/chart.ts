import { Router, Request, Response } from 'express';
import { launchBrowser } from '../lib/browser';
import { geocode, getTimezoneOffset } from '../lib/geocoding';
import { computePositions, BirthData } from '../lib/ephemeris';
import { deriveChart } from '../lib/humandesign';
import { generateChartHTML } from '../templates/chart';

const router = Router();

interface ChartRequest {
  name: string;
  birthdate: string; // YYYY-MM-DD
  birthtime: string; // HH:MM
  birthplace: string;
}

async function buildChart(body: ChartRequest) {
  const { name, birthdate, birthtime, birthplace } = body;

  // Parse birth date/time
  const [year, month, day] = birthdate.split('-').map(Number);
  const [hour, minute] = birthtime.split(':').map(Number);

  // Geocode birthplace
  const geo = await geocode(birthplace);

  // Get timezone offset
  const birthDateObj = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const tzOffset = getTimezoneOffset(geo.timezone, birthDateObj);

  const birthData: BirthData = {
    year, month, day, hour, minute,
    lat: geo.lat,
    lon: geo.lon,
    tzOffset,
  };

  // Compute planetary positions
  const positions = computePositions(birthData);

  // Derive HD chart
  const chart = deriveChart(name, birthdate, birthtime, birthplace, positions);

  return chart;
}

/**
 * POST /api/chart
 * Returns a PDF with the Human Design chart.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as ChartRequest;

    if (!body.name || !body.birthdate || !body.birthtime || !body.birthplace) {
      return res.status(400).json({
        error: 'Missing required fields: name, birthdate, birthtime, birthplace'
      });
    }

    const chart = await buildChart(body);
    const html = generateChartHTML(chart);

    // Generate PDF with Puppeteer (env-aware launcher)
    const browser = await launchBrowser();

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });

    await browser.close();

    const filename = `${body.name.replace(/\s+/g, '_')}_HD_Chart.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(pdf));

  } catch (err: any) {
    console.error('Chart generation error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * GET /api/chart/preview
 * Returns the HTML that would be rendered as PDF.
 * Accepts query params: name, birthdate, birthtime, birthplace
 */
router.get('/preview', async (req: Request, res: Response) => {
  try {
    const name = (req.query.name as string) || 'Jorge Borja Gonzalez';
    const birthdate = (req.query.birthdate as string) || '2000-04-03';
    const birthtime = (req.query.birthtime as string) || '13:09';
    const birthplace = (req.query.birthplace as string) || 'Scottsdale, Arizona, United States';

    const chart = await buildChart({ name, birthdate, birthtime, birthplace });
    const html = generateChartHTML(chart);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);

  } catch (err: any) {
    console.error('Preview error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * GET /api/chart/data
 * Returns raw JSON data for the chart (useful for debugging).
 */
router.get('/data', async (req: Request, res: Response) => {
  try {
    const name = (req.query.name as string) || 'Jorge Borja Gonzalez';
    const birthdate = (req.query.birthdate as string) || '2000-04-03';
    const birthtime = (req.query.birthtime as string) || '13:09';
    const birthplace = (req.query.birthplace as string) || 'Scottsdale, Arizona, United States';

    const chart = await buildChart({ name, birthdate, birthtime, birthplace });

    res.json({
      name: chart.name,
      type: chart.type,
      strategy: chart.strategy,
      authority: chart.authority,
      definition: chart.definition,
      profile: chart.profile,
      crossOfIncarnation: chart.crossOfIncarnation,
      notSelfTheme: chart.notSelfTheme,
      variables: chart.variables,
      definedChannels: chart.definedChannels.map(([a, b]) => `${a}-${b}`),
      definedCenters: chart.definedCenters,
      undefinedCenters: chart.undefinedCenters,
      personalityGates: [...new Set(chart.personalityGates)].sort((a, b) => a - b),
      designGates: [...new Set(chart.designGates)].sort((a, b) => a - b),
      positions: {
        designDate: chart.positions.designDate,
        personality: Object.fromEntries(
          Object.entries(chart.positions.personality).map(([k, v]) => [k, `Gate ${v.gate}.${v.line} (${v.longitude.toFixed(2)}°)`])
        ),
        design: Object.fromEntries(
          Object.entries(chart.positions.design).map(([k, v]) => [k, `Gate ${v.gate}.${v.line} (${v.longitude.toFixed(2)}°)`])
        ),
      }
    });
  } catch (err: any) {
    console.error('Data error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default router;
