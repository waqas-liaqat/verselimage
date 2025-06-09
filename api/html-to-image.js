import { buffer } from 'micro';
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Only POST allowed');
  }

  let html;
  try {
    const rawBody = await buffer(req);
    const json = JSON.parse(rawBody.toString());
    html = json.html;

    if (!html) {
      return res.status(400).send('Missing HTML in body');
    }
  } catch (err) {
    return res.status(400).send('Invalid request body');
  }

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath() || '/usr/bin/chromium-browser',
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1350, height: 1080 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const imageBuffer = await page.screenshot({ type: 'png' });

    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(imageBuffer);
  } catch (err) {
    if (browser) await browser.close();
    console.error('Error during screenshot:', err);
    return res.status(500).send('Server error while rendering image');
  }
}
