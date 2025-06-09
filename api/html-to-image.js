import { buffer } from 'micro';
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  console.log('✅ Handler invoked');

  if (req.method !== 'POST') {
    console.log('❌ Wrong method:', req.method);
    return res.status(405).send('Only POST allowed');
  }

  let html;
  try {
    const raw = await buffer(req);
    const json = JSON.parse(raw.toString());
    html = json.html;
    console.log('📥 HTML length:', html?.length);
    if (!html) throw new Error('Missing html');
  } catch (err) {
    console.error('🧨 Invalid request body:', err);
    return res.status(400).send('Invalid JSON or missing html');
  }

  let browser;
  try {
    console.log('🔧 Launching Chromium...');
    const executablePath = await chromium.executablePath() || '/usr/bin/chromium-browser';
    console.log('🔍 Executable path:', executablePath);

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1350, height: 1080 });

    console.log('⏳ Setting page content...');
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    console.log('📸 Taking screenshot...');
    const bufferImg = await page.screenshot({ type: 'png' });

    await browser.close();
    console.log('✅ Screenshot done, sending image');
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(bufferImg);

  } catch (err) {
    console.error('🛑 Error during rendering:', err);
    if (browser) await browser.close();
    return res.status(500).send('Server error while rendering image');
  }
}
