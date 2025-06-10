// /api/html-to-image.js

import chromium from 'chrome-aws-lambda';
import { NextResponse } from 'next/server';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { html } = req.body;
  if (!html) {
    res.status(400).json({ error: 'Missing HTML content' });
    return;
  }

  let browser = null;

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const imageBuffer = await page.screenshot({ type: 'png', fullPage: true });

    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    res.status(200).end(imageBuffer);
  } catch (error) {
    if (browser) await browser.close();
    console.error('Image generation failed:', error);
    res.status(500).json({ error: 'Image generation failed' });
  }
}
