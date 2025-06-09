import { buffer } from 'micro';
import puppeteer from 'puppeteer-core';
import chromium from 'chrome-aws-lambda';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  try {
    const raw = await buffer(req);
    const { html } = JSON.parse(raw.toString());

    if (!html) {
      return res.status(400).send('Missing "html" in request body');
    }

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: chromium.executablePath || '/usr/bin/chromium-browser',
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1350, height: 1080 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const imageBuffer = await page.screenshot({ type: 'png' });
    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(imageBuffer);
  } catch (error) {
    console.error('Rendering error:', error);
    res.status(500).send('Server error while rendering image');
  }
}
