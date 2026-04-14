/**
 * Environment-aware Puppeteer browser launcher.
 *
 * - Local dev  → uses bundled `puppeteer` (Chromium included)
 * - Vercel     → uses `puppeteer-core` + `@sparticuz/chromium`
 *                (lightweight Chromium optimized for serverless)
 */

export async function launchBrowser() {
  if (process.env.VERCEL) {
    // ── Serverless (Vercel) ───────────────────────────────────────
    const { default: chromium } = await import('@sparticuz/chromium');
    const { default: puppeteer } = await import('puppeteer-core');

    // Disable graphics stack for headless serverless (no WebGL needed)
    chromium.setGraphicsMode = false;

    return puppeteer.launch({
      args:           chromium.args,
      executablePath: await chromium.executablePath(),
      headless:       true,
    });
  }

  // ── Local dev ────────────────────────────────────────────────
  const { default: puppeteer } = await import('puppeteer');
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}
