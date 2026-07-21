// Render out/*.html with headless Chromium: poster PDF (single page, exact size),
// A3 landscape PDF, and PNG previews (full + per-panel crops) for inspection.
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const here = path.dirname(new URL(import.meta.url).pathname);
const out = (p) => path.join(here, 'out', p);
const mode = process.argv[2] || 'all'; // all | poster | a3 | png

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

if (mode === 'all' || mode === 'poster' || mode === 'png') {
  await page.goto('file://' + out('dynamical-systems-cheatsheet.html'));
  await page.waitForTimeout(300);
  const { w, h } = await page.evaluate(() => {
    const el = document.querySelector('.sheet');
    return { w: Math.ceil(el.scrollWidth), h: Math.ceil(el.scrollHeight) };
  });
  console.log(`poster content size: ${w} x ${h} px  (${(w / 96 * 2.54).toFixed(1)} x ${(h / 96 * 2.54).toFixed(1)} cm)`);

  if (mode !== 'png') {
    await page.pdf({
      path: out('dynamical-systems-cheatsheet.pdf'),
      width: `${w + 2}px`, height: `${h + 2}px`,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      printBackground: true, pageRanges: '1',
    });
    console.log('wrote poster pdf');
  }

  fs.mkdirSync(out('preview'), { recursive: true });
  await page.setViewportSize({ width: w, height: Math.min(h, 4000) });
  // full overview, downscaled
  await page.screenshot({ path: out('preview/full.png'), fullPage: true, scale: 'css' });
  // per-panel crops at readable resolution
  const ids = await page.evaluate(() =>
    [...document.querySelectorAll('[id^="panel-"]')].map((e) => e.id));
  for (const id of ids) {
    const el = page.locator('#' + id);
    await el.screenshot({ path: out(`preview/${id}.png`) });
  }
  console.log('previews:', ids.join(', ') || '(no panels tagged)');
}

if (mode === 'all' || mode === 'a3') {
  await page.goto('file://' + out('a3.html'));
  await page.waitForTimeout(300);
  await page.pdf({
    path: out('dynamical-systems-cheatsheet-a3.pdf'),
    format: 'A3', landscape: true, printBackground: true,
    margin: { top: '7mm', bottom: '7mm', left: '7mm', right: '7mm' },
  });
  console.log('wrote a3 pdf');
}

await browser.close();
