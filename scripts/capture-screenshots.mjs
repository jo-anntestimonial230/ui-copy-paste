/**
 * Real screenshots of the built MV3 extension via Playwright.
 *
 * No mocked screenshots: Chromium is launched with dist/ as an unpacked
 * extension, screenshots are taken from chrome-extension:// pages, and the
 * capture-flow shot uses the real built content-script inspector overlay.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const outDir = path.join(root, 'docs', 'screenshots');
const profileDir = path.join(root, '.playwright-mcp', 'real-extension-profile');

const SEED_SETTINGS = {
  backendUrl: 'http://localhost:8799',
  bridgeUrl: 'http://localhost:31337',
  authToken: '',
  provider: 'openai',
  apiKey: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx',
  model: 'gpt-4o',
  baseUrl: '',
  exportPath: 'src/components',
  theme: 'dark',
  language: 'en',
  animations: true,
  typescript: true,
  accessibility: true,
  styleHint: '',
};

function requireDist() {
  const manifestPath = path.join(dist, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('dist/ missing - run pnpm build first');
  }
}

function findContentLoader() {
  const assetsDir = path.join(dist, 'assets');
  const loader = fs
    .readdirSync(assetsDir)
    .find((name) => name.endsWith('.js') && name.includes('loader'));
  if (!loader) throw new Error('content-script loader not found in dist/assets');
  return `assets/${loader}`;
}

function pngInfo(file) {
  const buf = fs.readFileSync(file);
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bytes: buf.length,
  };
}

async function waitForApp(page) {
  await page.waitForSelector('text=UI Replicator', { timeout: 25000 });
  await page.waitForTimeout(700);
}

async function seedExtensionStorage(page) {
  await page.evaluate((seed) => chrome.storage.local.set({ 'uicp-settings': seed }), SEED_SETTINGS);
}

function startDemoServer() {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>UI Copy-Paste Playwright capture demo</title>
<style>
*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#0f1219;color:#e8eaef}
body{background:radial-gradient(900px 480px at 12% -8%,#2a1848 0%,transparent 55%),radial-gradient(700px 400px at 90% 10%,#0c2a3a 0%,transparent 50%),#0f1219}
.chrome{height:44px;display:flex;align-items:center;gap:8px;padding:0 12px;background:#141820;border-bottom:1px solid #252a36}
.dot{width:10px;height:10px;border-radius:50%}.r{background:#ff5f57}.y{background:#febc2e}.g{background:#28c840}
.url{flex:1;margin-left:12px;height:28px;border-radius:8px;background:#0b0d12;border:1px solid #252a36;color:#9aa3b5;display:flex;align-items:center;padding:0 12px;font-size:12px}
.shell{padding:52px 64px;max-width:980px}.pill{display:inline-flex;gap:6px;align-items:center;font-size:12px;font-weight:700;color:#c4b5fd;background:rgba(124,58,237,.14);border:1px solid rgba(124,58,237,.4);border-radius:999px;padding:5px 12px;margin-bottom:20px}
h1{font-size:54px;letter-spacing:-.045em;line-height:1.02;margin:0 0 18px;font-weight:800}h1 span{background:linear-gradient(90deg,#a78bfa,#38bdf8);-webkit-background-clip:text;background-clip:text;color:transparent}
.lead{color:#a3adbf;font-size:17px;line-height:1.6;margin:0 0 34px;max-width:640px}.cards{display:grid;grid-template-columns:1fr 1fr;gap:18px;max-width:760px}.card{border-radius:22px;padding:24px;background:rgba(22,27,38,.92);border:1px solid #252a36;box-shadow:0 18px 50px rgba(0,0,0,.22)}
.card h3{font-size:17px;margin:0 0 8px}.card p{font-size:13px;color:#9aa3b5;line-height:1.5;margin:0}.price{font-size:34px;font-weight:800;margin-bottom:10px}.cta{margin-top:18px;height:38px;border:0;border-radius:12px;background:#7c3aed;color:#fff;padding:0 16px;font-weight:700}
</style></head><body>
<div class="chrome"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><div class="url">http://localhost:31337/demo</div></div>
<main class="shell">
  <div class="pill">Real page inspected by the built extension</div>
  <h1>Ship UI faster with <span>AI copy-paste</span></h1>
  <p class="lead">Hover any block on a live page, generate clean React + Tailwind, and drop it into your repo with your own API key.</p>
  <section class="cards" aria-label="pricing cards">
    <article class="card" data-plan="pro"><h3>Pro plan</h3><div class="price">$49</div><p>Unlimited generations, priority models, team seats, and export-to-project workflow.</p><button class="cta">Start copying UI</button></article>
    <article class="card"><h3>Starter</h3><div class="price">$19</div><p>BYOK included, clean DOM capture, screenshot fallback, and community support.</p><button class="cta">Try starter</button></article>
  </section>
</main>
</body></html>`;

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if ((req.url ?? '/').startsWith('/demo')) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(html);
        return;
      }
      res.writeHead(302, { Location: '/demo' }).end();
    });

    const tryPorts = [31337, 8799];
    const listen = (idx) => {
      if (idx >= tryPorts.length) {
        reject(new Error('localhost:31337 and localhost:8799 are busy; cannot serve permitted demo page'));
        return;
      }
      server.once('error', () => listen(idx + 1));
      server.listen(tryPorts[idx], 'localhost', () => resolve({ server, port: tryPorts[idx] }));
    };
    listen(0);
  });
}

async function getExtensionId(context) {
  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 20000 });
  const url = worker.url();
  const id = url.split('/')[2];
  if (!id) throw new Error('cannot resolve extension id from service worker URL: ' + url);
  return { id, worker };
}

async function captureSidebar(context, extensionId, fileName, configure) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 400, height: 780 });
  await page.goto(`chrome-extension://${extensionId}/src/sidebar/index.html`, { waitUntil: 'networkidle' });
  await seedExtensionStorage(page);
  await page.reload({ waitUntil: 'networkidle' });
  await waitForApp(page);
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  });
  if (configure) await configure(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, fileName), type: 'png' });
  await page.close();
  console.log('wrote', fileName, '(real extension page)');
}

async function captureFlow(context, worker, contentLoaderPath, demoUrl) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(demoUrl, { waitUntil: 'networkidle' });

  await worker.evaluate(async ({ urlPrefix, loader }) => {
    const tabs = await chrome.tabs.query({});
    const tab = tabs.find((t) => typeof t.id === 'number' && typeof t.url === 'string' && t.url.startsWith(urlPrefix));
    if (!tab?.id) throw new Error('demo tab not found for ' + urlPrefix);
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: [loader] });
    let lastError = null;
    for (let i = 0; i < 30; i += 1) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'START_INSPECT', fullPage: false });
        return;
      } catch (err) {
        lastError = err;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    throw lastError ?? new Error('content script listener did not become ready');
  }, { urlPrefix: demoUrl, loader: contentLoaderPath });

  const card = page.locator('[data-plan="pro"]');
  await card.hover();
  await page.waitForSelector('#__uicp-overlay__', { state: 'visible', timeout: 15000 });
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(outDir, 'capture-flow.png'), type: 'png' });
  await page.close();
  console.log('wrote capture-flow.png (real content-script inspector overlay)');
}

async function captureBadgesPreview(browser) {
  const badgesDir = path.join(root, 'docs', 'badges');
  const badges = fs.readdirSync(badgesDir).filter((f) => f.endsWith('.svg')).sort();
  const page = await browser.newPage({ viewport: { width: 1040, height: 150 }, deviceScaleFactor: 2 });
  const imgs = badges
    .map((b) => {
      const raw = fs.readFileSync(path.join(badgesDir, b));
      return `<img src="data:image/svg+xml;base64,${raw.toString('base64')}" alt="${b}" height="20"/>`;
    })
    .join('');
  await page.setContent(
    '<!doctype html><html><body style="margin:16px;background:#0d1117;display:flex;flex-wrap:wrap;gap:8px;align-items:center">' + imgs + '</body></html>',
    { waitUntil: 'load' },
  );
  await page.screenshot({ path: path.join(outDir, '_badges-preview.png'), type: 'png' });
  await page.close();
  console.log('wrote _badges-preview.png');
}

async function main() {
  requireDist();
  fs.mkdirSync(outDir, { recursive: true });
  fs.rmSync(profileDir, { recursive: true, force: true });

  const contentLoaderPath = findContentLoader();
  const { server, port } = await startDemoServer();
  const demoUrl = `http://localhost:${port}/demo`;
  console.log('demo', demoUrl);

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    viewport: null,
    args: [
      `--disable-extensions-except=${dist}`,
      `--load-extension=${dist}`,
      '--window-size=1280,900',
      '--font-render-hinting=none',
      '--disable-lcd-text',
    ],
  });

  try {
    const { id: extensionId, worker } = await getExtensionId(context);
    console.log('extension id', extensionId);

    await captureSidebar(context, extensionId, 'sidebar-main.png');
    await captureSidebar(context, extensionId, 'sidebar-settings.png', async (page) => {
      await page.locator('header button').last().click();
      await page.waitForSelector('text=OpenAI', { timeout: 15000 });
    });
    await captureFlow(context, worker, contentLoaderPath, demoUrl);

    const utilityBrowser = await chromium.launch({ headless: true });
    try {
      await captureBadgesPreview(utilityBrowser);
    } finally {
      await utilityBrowser.close();
    }
  } finally {
    await context.close();
    server.close();
  }

  for (const f of ['sidebar-main.png', 'sidebar-settings.png', 'capture-flow.png', '_badges-preview.png']) {
    const p = path.join(outDir, f);
    if (!fs.existsSync(p)) continue;
    const info = pngInfo(p);
    console.log(`${f}: ${info.width}x${info.height} (${info.bytes} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});