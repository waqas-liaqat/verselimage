// File: api/render.js
import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  const { html } = req.body;

  if (!html) {
    return res.status(400).json({ error: 'HTML is required in the request body' });
  }

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1350, height: 1080 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const screenshotBuffer = await page.screenshot({ type: 'png' });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename=\"banner.png\"');
    res.status(200).send(screenshotBuffer);
  } catch (error) {
    console.error('Rendering error:', error);
    res.status(500).json({ error: 'Rendering failed', details: error.message });
  } finally {
    await browser.close();
  }
}
