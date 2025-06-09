import { buffer } from 'micro';
import chromium from 'chrome-aws-lambda';
import puppeteerCore from 'puppeteer-core';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  let html;
  try {
    const raw = await buffer(req);
    const data = JSON.parse(raw.toString());
    html = data.html;
    if (!html) throw new Error('Missing html');
  } catch (e) {
    res.status(400).send('Invalid JSON body');
    return;
  }

  let browser = null;
  try {
    browser = await puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1350, height: 1080 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const imageBuffer = await page.screenshot({ type: 'png' });

    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(imageBuffer);
  } catch (err) {
    if (browser) await browser.close();
    console.error(err);
    res.status(500).send('Server error');
  }
}
