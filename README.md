# UI Copy-Paste

<p align="center">
  <img src="src/assets/icon-128.png" width="96" height="96" alt="UI Copy-Paste" />
</p>

<p align="center">
  <strong>Chrome extension that turns any website UI into clean React + Tailwind components.</strong><br/>
  Hover → click → Generate (AI) with <em>your</em> API key → copy, download, or write straight into your project.
</p>

<p align="center">
  <a href="#install-in-chrome"><img src="docs/badges/chrome.svg" alt="Chrome MV3" /></a>
  <a href="#bring-your-own-key"><img src="docs/badges/byok.svg" alt="BYOK" /></a>
  <a href="LICENSE"><img src="docs/badges/license.svg" alt="MIT" /></a>
  <a href="#stack"><img src="docs/badges/react.svg" alt="React TS" /></a>
  <a href="#stack"><img src="docs/badges/tailwind.svg" alt="Tailwind" /></a>
</p>

<p align="center">
  <img src="docs/badges/node.svg" alt="Node" />
  <img src="docs/badges/pnpm.svg" alt="pnpm" />
  <img src="docs/badges/mv3.svg" alt="MV3" />
  <img src="docs/badges/i18n.svg" alt="i18n" />
  <a href="https://github.com/yiaany/ui-copy-paste/stargazers"><img src="docs/badges/stars.svg" alt="stars" /></a>
</p>

---

## Demo

<p align="center">
  <img src="docs/screenshots/sidebar-main.png" width="280" alt="Main side panel" />
  &nbsp;
  <img src="docs/screenshots/sidebar-settings.png" width="280" alt="Settings — bring your own key" />
</p>

<p align="center">
  <img src="docs/screenshots/capture-flow.png" width="860" alt="Capture flow: pick element on a page with the side panel open" />
</p>

| Pick any element | Generate with your key | Export to project |
|:---:|:---:|:---:|
| Inspector highlights blocks on the live page | OpenAI · Claude · any OpenAI-compatible API | Copy · Download `.tsx` · write via local bridge |

---

## Features

- **Element & full-page capture** — point-and-click inspector or whole-page skeleton
- **Local DOM → JSX** instantly, plus **AI polish** (structure, interactivity, a11y)
- **Screenshot path** for Canvas / heavily obfuscated UIs
- **De-brand controls** — strip logos, images → placeholders, lorem text, neutral palette
- **BYOK only** — paste *your* OpenAI / Claude / DeepSeek (or any OpenAI-compatible) key; no free tier, no shared quota
- **Streaming Generate** — watch code appear token-by-token
- **Export** — clipboard, file download, or **To project** via `npx ui-copy-paste` bridge
- **Side panel UI** (not a popup) — stays open while you click the page
- **EN / RU** interface, light · dark · system theme
- **Privacy-first MV3** — `activeTab` only, no `<all_urls>`, content script injected on demand

---

## Quick start

### 1. Clone & install

```bash
git clone https://github.com/yiaany/ui-copy-paste.git
cd ui-copy-paste
pnpm install
```

> Need pnpm? `corepack enable && corepack prepare pnpm@latest --activate`

### 2. Build the extension

```bash
pnpm build          # → dist/
```

### 3. Load in Chrome

<a id="install-in-chrome"></a>

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right)
3. **Load unpacked** → select the `dist/` folder
4. Pin the **UI Copy-Paste** icon

<details>
<summary>Step-by-step</summary>

1. Developer mode ON  
2. Load unpacked → `…/ui-copy-paste/dist`  
3. Click the extension icon on any normal website (not `chrome://`)  
4. Side panel opens on the right  

</details>

### 4. Start the backend (required for Generate AI)

```bash
cd backend
pnpm install --ignore-workspace
cp .env.example .env   # Windows: copy .env.example .env
pnpm dev               # http://localhost:8799
```

Or double-click `backend/start-backend.bat` / root `start-all.bat`.

### 5. Bring your own key

<a id="bring-your-own-key"></a>

Open the side panel → **Settings** (gear) → **Model**:

| Provider | What you paste |
|---|---|
| **OpenAI** | API key + model (default `gpt-4o`) |
| **Claude** | Anthropic API key (model optional) |
| **OpenAI-compat** | Base URL + key + model (DeepSeek, Groq, OpenRouter, LM Studio, …) |

Keys live in `chrome.storage.local` and are sent only to *your* local backend, which proxies HTTPS to the provider. There is **no free tier** and **no shared quota**.

### 6. Capture → Generate → Export

1. On a normal https page, open the side panel  
2. **Pick element** (or **Full page**)  
3. Hover → click the block you want  
4. **Generate (AI)** — stream polished React + Tailwind  
5. **Copy** / **Download** / **To project** (`npx ui-copy-paste` in the target repo)

---

## Optional: write files into your repo

```bash
# in the project where components should land
npx ui-copy-paste
# bridge listens on http://localhost:31337
```

In the extension: Settings → Connection → bridge URL (default above) → export path (e.g. `src/components`).

---

## Architecture

```text
┌─────────────┐   activeTab    ┌────────────────┐
│  Side panel │◄──────────────►│ Content script │  (injected on click)
│  (React)    │                │ inspector DOM  │
└──────┬──────┘                └────────────────┘
       │ HTTP localhost
       ▼
┌─────────────┐   BYOK key     ┌────────────────┐
│   Backend   │───────────────►│ OpenAI/Claude  │
│  :8799      │   passthrough  │ / compat API   │
└──────┬──────┘                └────────────────┘
       │ optional bridge :31337
       ▼
┌─────────────┐
│ Your repo   │  src/components/*.tsx
└─────────────┘
```

- **Side panel** — UI, settings, preview, export  
- **Background SW** — open panel + inject content script  
- **Content script** — hover outline, extract DOM / screenshot crop  
- **Backend** — thin proxy, prompt, stream, validate TSX  
- **CLI bridge** — write files on disk without a file picker  

---

## Stack

<a id="stack"></a>

| Layer | Tech |
|---|---|
| Extension | Vite 7 · @crxjs/vite-plugin · React 18 · TS strict · Tailwind v4 · Framer Motion · Zod |
| Backend | Hono · Node · Anthropic / OpenAI-compatible SDKs |
| Bridge | tiny local HTTP server (CLI) |
| Quality | ESLint · Prettier · Vitest |

---

## Scripts

```bash
pnpm dev          # HMR dev build → dist/
pnpm build        # production build
pnpm test         # vitest
pnpm lint
pnpm typecheck
pnpm format
```

Backend:

```bash
cd backend && pnpm dev
```

Screenshots (dev):

```bash
pnpm build && node scripts/capture-screenshots.mjs
```

---

## Project layout

```text
ui-copy-paste/
├─ manifest.config.ts       # MV3 manifest (typed)
├─ src/
│  ├─ assets/               # extension icons
│  ├─ background/           # service worker
│  ├─ content/              # inspector + extractor
│  ├─ sidebar/              # React side panel
│  └─ lib/                  # settings, backend client, i18n, jsx render…
├─ backend/                 # Generate (AI) proxy (BYOK)
├─ cli/                     # npx ui-copy-paste bridge
├─ docs/
│  ├─ badges/               # README badge SVGs (always render)
│  └─ screenshots/          # real UI shots (Playwright)
└─ dist/                    # load this folder in Chrome
```

---

## Privacy & safety

- Permissions: `activeTab`, `scripting`, `storage`, `sidePanel` + localhost hosts only  
- No static `<all_urls>` content scripts  
- API keys never leave your machine except as HTTPS passthrough to the model provider via your backend  
- Sensitive pages (payment / bank login patterns) are blocked before generation  
- De-brand tools help produce a legal skeleton without copying brand assets 1:1  

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Generate fails immediately | Start backend (`backend/start-backend.bat` or `pnpm dev` in `backend/`) |
| “Need API key” | Settings → Model → paste key + required fields |
| Inspector does nothing | Open a normal https site (not `chrome://` / Web Store) |
| To project fails | Run `npx ui-copy-paste` in the target project root |
| Extension stale after pull | `pnpm build` then **Reload** on `chrome://extensions` |

---

## Contributing

PRs welcome. Keep the BYOK-only model (no shared free quota), preserve privacy defaults, and add tests for pure logic under `src/lib` / `backend/src`.

```bash
pnpm test && pnpm lint && pnpm typecheck
```

---

## License

[MIT](LICENSE) © yiaany

---

<p align="center">
  <a href="https://github.com/yiaany/ui-copy-paste">★ Star on GitHub</a>
  ·
  <a href="https://github.com/yiaany/ui-copy-paste/issues">Report issue</a>
  ·
  <a href="#quick-start">Get started</a>
</p>