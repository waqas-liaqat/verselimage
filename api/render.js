import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', async () => {
    const body = Buffer.concat(chunks).toString();
    const { html } = JSON.parse(body);

    if (!html) {
      return res.status(400).json({ error: 'HTML content missing' });
    }

    try {
      const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1350, height: 1080 },
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const imageBuffer = await page.screenshot({ type: 'png' });

      await browser.close();

      res.setHeader('Content-Type', 'image/png');
      res.send(imageBuffer);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Rendering failed', detail: error.message });
    }
  });
}
