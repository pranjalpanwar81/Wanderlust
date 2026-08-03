const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:8080';
const outDir = path.join(__dirname, '..', 'docs', 'screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function safeGoto(page, url) {
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    // small fixed delay to allow UI effects to settle
    await new Promise((res) => setTimeout(res, 500));
    return true;
  } catch (err) {
    console.warn(`Failed to load ${url}:`, err.message);
    return false;
  }
}

(async () => {
  console.log('Starting puppeteer, base:', BASE);
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const routes = ['/', '/listings', '/signup', '/login', '/listings/new'];
  for (const r of routes) {
    const url = BASE + r;
    const ok = await safeGoto(page, url);
    const name = (r === '/') ? 'home' : r.replace(/\//g, '') || 'page';
    const filepath = path.join(outDir, `${name}.png`);
    if (ok) {
      await page.screenshot({ path: filepath, fullPage: true });
      console.log('Saved', filepath);
    } else {
      console.log('Skipping screenshot for', url);
    }
  }

  // capture first several listing show pages by collecting links on /listings
  const listUrl = BASE + '/listings';
  if (await safeGoto(page, listUrl)) {
    const links = await page.$$eval('a.listing-link', els => els.map(a => a.href));
    const unique = Array.from(new Set(links)).slice(0, 8);
    let idx = 1;
    for (const link of unique) {
      const ok = await safeGoto(page, link);
      const filename = `listing_${idx}.png`;
      if (ok) {
        await page.screenshot({ path: path.join(outDir, filename), fullPage: true });
        console.log('Saved', filename);
      }
      idx++;
    }
  }

  await browser.close();
  console.log('Done capturing screenshots. Files in', outDir);
})();
