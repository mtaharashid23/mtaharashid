// Renders the Open Graph image (1200x630) from the live hero, no loader, DOM portrait.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
(async () => {
  const ROOT = path.resolve(__dirname, '..');
  const srv = spawn('python3', ['-m', 'http.server', '4740', '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 700));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.addInitScript(() => { try { sessionStorage.setItem('mtbr-seen', '1'); localStorage.setItem('mtbr-sound', 'off'); } catch (e) {} });
  await page.goto('http://127.0.0.1:4740/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(3200);
  await page.addStyleTag({ content: '.cursor, .grain, .nav, .hero-foot, .hero-portrait-cap { display: none !important; } .avail-dot { animation: none !important; } .hero-name { bottom: 14vh !important; font-size: 10.4vw !important; } .hero-portrait { top: 8vh !important; width: 34vw !important; } .hero-meta { padding-top: 1.5rem; }' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ROOT, 'img', 'og.jpg'), type: 'jpeg', quality: 88 });
  await browser.close(); srv.kill();
  console.log('wrote img/og.jpg');
})();
