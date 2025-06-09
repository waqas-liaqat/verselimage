import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  const { html } = req.body;

  if (!html) {
    return res.status(400).json({ error: 'HTML is required in the request body' });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: 'new'
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1350, height: 1080 });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const buffer = await page.screenshot({ type: 'png' });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="banner.png"');
    res.status(200).send(buffer);

  } catch (error) {
    console.error('Error rendering HTML:', error);
    res.status(500).json({ error: 'Rendering failed', details: error.message });
  } finally {
    if (browser) await browser.close();
  }
}
