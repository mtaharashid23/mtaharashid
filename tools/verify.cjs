// Verification harness: serves the site, walks it in headless Chromium at desktop,
// phone and reduced-motion, captures console errors, and writes contact sheets.
// Usage: node tools/verify.js [--only=desktop|mobile|reduced] [--enter=sound|quiet]
const { chromium, devices } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out');
const PORT = 4710;
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));

function window_h() { return 900; }

function serve() {
  const p = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  return new Promise((r) => setTimeout(() => r(p), 700));
}

async function walk(page, name, { steps = 14, settle = 900, wheel = true } = {}) {
  const shots = [];
  const total = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  const vh = await page.evaluate(() => window.innerHeight);
  const step = Math.max(vh * 0.9, total / steps);
  let y = 0, i = 0;
  while (y <= total + 1 && i < 40) {
    const target = Math.min(y, total);
    if (wheel) {
      const cur = await page.evaluate(() => window.scrollY);
      let remaining = target - cur;
      while (Math.abs(remaining) > 2) { const d = Math.sign(remaining) * Math.min(300, Math.abs(remaining)); await page.mouse.wheel(0, d); remaining -= d; await page.waitForTimeout(40); }
    } else {
      await page.evaluate((t) => window.scrollTo(0, t), target);
    }
    await page.waitForTimeout(settle);
    const file = path.join(OUT, `${name}-${String(i).padStart(2, '0')}.png`);
    await page.screenshot({ path: file });
    shots.push(file);
    y += step; i++;
  }
  return shots;
}

async function sheet(files, out, cols, w) {
  // Python/PIL does the tiling (fast and already available)
  const py = `
from PIL import Image, ImageDraw
import sys, os
files = ${JSON.stringify(files)}
cols = ${cols}; w = ${w}
ims = []
for f in files:
    im = Image.open(f); r = w / im.width; ims.append((os.path.basename(f), im.resize((w, int(im.height * r)))))
h = max(i.height for _, i in ims) + 24
rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (cols * (w + 10) + 10, rows * (h + 10) + 10), (30, 30, 34))
d = ImageDraw.Draw(S)
for k, (n, im) in enumerate(ims):
    x = 10 + (k % cols) * (w + 10); y = 10 + (k // cols) * (h + 10)
    S.paste(im, (x, y + 20)); d.text((x + 4, y + 4), n, fill=(220, 220, 220))
S.save(${JSON.stringify(out)})
print(${JSON.stringify(out)}, S.size)
`;
  await new Promise((res) => { const p = spawn('python3', ['-c', py], { stdio: 'inherit' }); p.on('exit', res); });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const onlyMode = args.only;
  for (const f of fs.readdirSync(OUT)) {
    if (!onlyMode || f.startsWith(onlyMode + '-') || f === `_sheet-${onlyMode}.png` || (onlyMode === 'desktop' && /^_sheet-(works|sections)\.png$/.test(f))) fs.rmSync(path.join(OUT, f), { force: true });
  }
  const srv = await serve();
  const CSP = args.csp ? JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')).headers[0].headers.find((h) => h.key === 'Content-Security-Policy').value : null;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const errors = [];
  const only = args.only;
  const url = `http://127.0.0.1:${PORT}/index.html?gl=force`;

  const attach = (page, tag) => {
    if (CSP) page.route('**/*', async (route) => { try { const r = await route.fetch(); const headers = { ...r.headers(), 'content-security-policy': CSP }; await route.fulfill({ response: r, headers }); } catch (e) { route.abort(); } });
    page.on('pageerror', (e) => errors.push(`[${tag}] pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() !== 'error' && m.type() !== 'warning') return;
      const loc = (m.location() && m.location().url) || '';
      if (/\/_vercel\//.test(loc)) return; // Vercel's analytics script only exists on Vercel
      errors.push(`[${tag}] console.${m.type()}: ${m.text().slice(0, 300)}${loc ? ` @ ${loc}` : ''}`);
    });
    page.on('requestfailed', (r) => { if (!/vercel/.test(r.url())) errors.push(`[${tag}] requestfailed: ${r.url()}`); });
  };

  if (!only || only === 'desktop') {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage(); attach(page, 'desktop');
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, 'desktop-loader-a.png') });
    await page.waitForTimeout(1300);
    await page.screenshot({ path: path.join(OUT, 'desktop-loader-b.png') });
    await page.waitForSelector('#loaderEnter.is-ready', { timeout: 15000 }).catch(() => errors.push('[desktop] enter buttons never became ready'));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, 'desktop-loader-c.png') });
    await page.click(args.enter === 'sound' ? '#enterSound' : '#enterQuiet');
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, 'desktop-enter-mid.png') });
    await page.waitForTimeout(2600);
    await page.mouse.move(700, 520);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, 'desktop-hero.png') });
    // x-ray probes: over the portrait, then over the name
    const pr = await page.evaluate(() => { const r = document.querySelector('#portraitFrame').getBoundingClientRect(); return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.42 }; });
    for (let i = 0; i < 14; i++) { await page.mouse.move(pr.x - 60 + i * 9, pr.y + Math.sin(i) * 20); await page.waitForTimeout(40); }
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, 'desktop-xray-portrait.png') });
    const nr = await page.evaluate(() => { const r = document.querySelector('#heroLine1').getBoundingClientRect(); return { x: r.left + r.width * 0.35, y: r.top + r.height * 0.5 }; });
    for (let i = 0; i < 14; i++) { await page.mouse.move(nr.x - 80 + i * 10, nr.y + Math.cos(i) * 10); await page.waitForTimeout(40); }
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, 'desktop-xray-name.png') });
    await page.mouse.move(700, 860);
    await page.waitForTimeout(500);
    const shots = await walk(page, 'desktop', { steps: 16 });
    // works probes: scroll the first plane to the middle, hover it, open the case, next, close; hover an archive row
    const probe = [];
    const scrollToMid = async (sel) => { const y = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return window.scrollY + r.top + r.height / 2 - window.innerHeight / 2; }, sel); await page.evaluate((y) => { const l = window.__mtbr && window.__mtbr.scroll.lenis; if (l) l.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y); }, y); await page.waitForTimeout(1400); };
    await scrollToMid('.work-item:nth-child(1) .work-media');
    await page.waitForTimeout(800);
    const m1 = await page.evaluate(() => { const r = document.querySelector('.work-item:nth-child(1) .work-media').getBoundingClientRect(); return { x: r.left + r.width * 0.55, y: r.top + r.height * 0.5 }; });
    for (let i = 0; i < 12; i++) { await page.mouse.move(m1.x - 40 + i * 8, m1.y + Math.sin(i) * 12); await page.waitForTimeout(40); }
    await page.waitForTimeout(600);
    probe.push(path.join(OUT, 'desktop-work-hover.png')); await page.screenshot({ path: probe[probe.length - 1] });
    await page.mouse.click(m1.x, m1.y);
    await page.waitForTimeout(450);
    probe.push(path.join(OUT, 'desktop-case-morph.png')); await page.screenshot({ path: probe[probe.length - 1] });
    await page.waitForTimeout(1600);
    probe.push(path.join(OUT, 'desktop-case-open.png')); await page.screenshot({ path: probe[probe.length - 1] });
    await page.evaluate(() => document.getElementById('caseScroll').scrollTo({ top: 900 }));
    await page.waitForTimeout(700);
    probe.push(path.join(OUT, 'desktop-case-scrolled.png')); await page.screenshot({ path: probe[probe.length - 1] });
    await page.evaluate(() => document.getElementById('caseScroll').scrollTo({ top: 99999 }));
    await page.waitForTimeout(700);
    probe.push(path.join(OUT, 'desktop-case-end.png')); await page.screenshot({ path: probe[probe.length - 1] });
    await page.click('#caseNext');
    await page.waitForTimeout(1800);
    probe.push(path.join(OUT, 'desktop-case-next.png')); await page.screenshot({ path: probe[probe.length - 1] });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);
    probe.push(path.join(OUT, 'desktop-case-closed.png')); await page.screenshot({ path: probe[probe.length - 1] });
    await scrollToMid('#archiveList');
    const a1 = await page.evaluate(() => { const r = document.querySelector('.archive-row').getBoundingClientRect(); return { x: r.left + 120, y: r.top + r.height / 2 }; });
    await page.mouse.move(a1.x, a1.y); await page.waitForTimeout(900);
    probe.push(path.join(OUT, 'desktop-archive-hover.png')); await page.screenshot({ path: probe[probe.length - 1] });
    await sheet(probe, path.join(OUT, '_sheet-works.png'), 3, 700);
    // sections probes: split stage at four progress points, record focus, about x-ray, contact copy, 404
    const sec = [];
    const stackTop = await page.evaluate(() => window.scrollY + document.getElementById('stack').getBoundingClientRect().top);
    for (const p of [0.08, 0.3, 0.55, 0.95]) {
      await page.evaluate((y) => window.__mtbr.scroll.lenis.scrollTo(y, { immediate: true, force: true }), stackTop + p * window_h(page) * 1.9);
      await page.waitForTimeout(1100);
      sec.push(path.join(OUT, `desktop-stack-${Math.round(p * 100)}.png`)); await page.screenshot({ path: sec[sec.length - 1] });
    }
    await scrollToMid('.job:nth-child(2)');
    sec.push(path.join(OUT, 'desktop-record-focus.png')); await page.screenshot({ path: sec[sec.length - 1] });
    await scrollToMid('#aboutPhoto');
    await page.waitForTimeout(1800);
    const ar = await page.evaluate(() => { const r = document.querySelector('#aboutPhoto picture').getBoundingClientRect(); return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.4 }; });
    for (let i = 0; i < 12; i++) { await page.mouse.move(ar.x - 40 + i * 8, ar.y + Math.sin(i) * 12); await page.waitForTimeout(40); }
    await page.waitForTimeout(700);
    sec.push(path.join(OUT, 'desktop-about-xray.png')); await page.screenshot({ path: sec[sec.length - 1] });
    await scrollToMid('.contact-row');
    await page.waitForTimeout(600);
    const cb = await page.$('.copy'); if (cb) { await cb.click(); await page.waitForTimeout(400); }
    sec.push(path.join(OUT, 'desktop-contact-copy.png')); await page.screenshot({ path: sec[sec.length - 1] });
    await page.goto(url.replace('index.html?gl=force', '404.html'), { waitUntil: 'load' });
    await page.waitForTimeout(1600);
    sec.push(path.join(OUT, 'desktop-404.png')); await page.screenshot({ path: sec[sec.length - 1] });
    await sheet(sec, path.join(OUT, '_sheet-sections.png'), 3, 700);
    await sheet([path.join(OUT, 'desktop-loader-a.png'), path.join(OUT, 'desktop-loader-b.png'), path.join(OUT, 'desktop-loader-c.png'), path.join(OUT, 'desktop-enter-mid.png'), path.join(OUT, 'desktop-hero.png'), path.join(OUT, 'desktop-xray-portrait.png'), path.join(OUT, 'desktop-xray-name.png'), ...shots], path.join(OUT, '_sheet-desktop.png'), 4, 560);
    await ctx.close();
  }

  if (!only || only === 'mobile') {
    const ctx = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 2 });
    const page = await ctx.newPage(); attach(page, 'mobile');
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(OUT, 'mobile-loader.png') });
    await page.waitForSelector('#loaderEnter.is-ready', { timeout: 15000 }).catch(() => errors.push('[mobile] enter buttons never became ready'));
    await page.tap('#enterQuiet');
    await page.waitForTimeout(3200);
    await page.screenshot({ path: path.join(OUT, 'mobile-hero.png') });
    const shots = await walk(page, 'mobile', { steps: 18, wheel: false, settle: 900 });
    // mobile works probes: scroll the first plane to the middle, tap it, screenshot the case, close
    const y1 = await page.evaluate(() => { const r = document.querySelector('.work-item:nth-child(1) .work-media').getBoundingClientRect(); return window.scrollY + r.top + r.height / 2 - window.innerHeight / 2; });
    await page.evaluate((y) => { const l = window.__mtbr && window.__mtbr.scroll.lenis; if (l) l.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y); }, y1);
    await page.waitForTimeout(1600);
    shots.push(path.join(OUT, 'mobile-work-mid.png')); await page.screenshot({ path: shots[shots.length - 1] });
    await page.tap('.work-item:nth-child(1) .work-media');
    await page.waitForTimeout(2200);
    shots.push(path.join(OUT, 'mobile-case.png')); await page.screenshot({ path: shots[shots.length - 1] });
    await page.evaluate(() => document.getElementById('caseScroll').scrollTo({ top: 700 }));
    await page.waitForTimeout(600);
    shots.push(path.join(OUT, 'mobile-case-2.png')); await page.screenshot({ path: shots[shots.length - 1] });
    await page.tap('#caseClose');
    await page.waitForTimeout(1500);
    shots.push(path.join(OUT, 'mobile-case-closed.png')); await page.screenshot({ path: shots[shots.length - 1] });
    await sheet([path.join(OUT, 'mobile-loader.png'), path.join(OUT, 'mobile-hero.png'), ...shots], path.join(OUT, '_sheet-mobile.png'), 7, 240);
    await ctx.close();
  }

  if (!only || only === 'reduced') {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage(); attach(page, 'reduced');
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const shots = await walk(page, 'reduced', { steps: 8, wheel: false, settle: 500 });
    await sheet(shots, path.join(OUT, '_sheet-reduced.png'), 4, 480);
    await ctx.close();
  }

  await browser.close(); srv.kill();
  fs.writeFileSync(path.join(OUT, 'errors.txt'), errors.join('\n'));
  console.log(errors.length ? `ERRORS (${errors.length}):\n` + errors.join('\n') : 'No console errors, page errors or failed requests.');
})();
