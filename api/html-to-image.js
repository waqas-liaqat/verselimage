import { buffer } from 'micro';
import puppeteer from 'puppeteer';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const raw = await buffer(req);
    const { html } = JSON.parse(raw.toString());

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: 'new',
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1350, height: 1080 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const image = await page.screenshot({ type: 'png' });
    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(image);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error rendering image');
  }
}
