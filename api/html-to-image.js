// api/generate-banner.js

const chromium = require('chrome-aws-lambda');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { html } = req.body;
  if (!html) {
    return res.status(400).json({ error: 'Missing HTML input' });
  }

  let browser = null;
  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const screenshotBuffer = await page.screenshot({ type: 'png' });

    await browser.close();

    const base64 = screenshotBuffer.toString('base64');
    res.status(200).json({ image_base64: `data:image/png;base64,${base64}` });
  } catch (error) {
    console.error('Image generation failed:', error);
    if (browser) await browser.close();
    res.status(500).json({ error: 'Failed to generate image' });
  }
};
