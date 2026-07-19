/**
 * Generate shields.io-style SVG badges with unique gradient/clip ids
 * and correct pixel widths (no BOM). GitHub-safe.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'docs', 'badges');

/** Conservative char width for Verdana 11px (shields-style). */
function textWidth(str) {
  let w = 0;
  for (const ch of str) {
    if (ch === ' ') w += 5;
    else if ('ilI.,|:;!\'`'.includes(ch)) w += 4.5;
    else if ('fjtJr-'.includes(ch)) w += 5.5;
    else if ('mwMW@'.includes(ch)) w += 10.5;
    else if (/[A-Z]/.test(ch)) w += 8.2;
    else w += 7.2;
  }
  return Math.ceil(w);
}

function escapeXml(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function badge(id, left, right, color) {
  // Extra padding is intentional: GitHub's image proxy/browser fonts can differ
  // from local rendering, and too-tight SVGs get visibly cropped.
  const pad = 20; // total horizontal padding per side label
  const lw = textWidth(left) + pad;
  const rw = textWidth(right) + pad;
  const width = lw + rw;
  const lx = lw / 2;
  const rx = lw + rw / 2;
  const L = escapeXml(left);
  const R = escapeXml(right);
  const label = `${L}: ${R}`;

  // Unique ids per file so multiple badges on one page don't collide.
  const gid = `g-${id}`;
  const cid = `c-${id}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" viewBox="0 0 ${width} 20" role="img" aria-label="${label}">
  <title>${label}</title>
  <linearGradient id="${gid}" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="${cid}">
    <rect width="${width}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#${cid})">
    <rect width="${lw}" height="20" fill="#555"/>
    <rect x="${lw}" width="${rw}" height="20" fill="${color}"/>
    <rect width="${width}" height="20" fill="url(#${gid})"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="${lx}" y="15" fill="#010101" fill-opacity=".3">${L}</text>
    <text x="${lx}" y="14">${L}</text>
    <text aria-hidden="true" x="${rx}" y="15" fill="#010101" fill-opacity=".3">${R}</text>
    <text x="${rx}" y="14">${R}</text>
  </g>
</svg>
`;
}

const BADGES = [
  ['chrome', 'Chrome', 'MV3 Extension', '#4285F4'],
  ['byok', 'AI', 'BYOK only', '#7C3AED'],
  ['license', 'License', 'MIT', '#22C55E'],
  ['react', 'React', '18 + TS', '#0EA5E9'],
  ['tailwind', 'Tailwind', 'v4', '#38BDF8'],
  ['node', 'node', '>=20', '#339933'],
  ['pnpm', 'pnpm', '11', '#F69220'],
  ['mv3', 'manifest', 'v3', '#F59E0B'],
  ['i18n', 'i18n', 'EN | RU', '#3B82F6'],
  ['stars', 'GitHub', 'stars welcome', '#181717'],
];

fs.mkdirSync(outDir, { recursive: true });
for (const [id, left, right, color] of BADGES) {
  const svg = badge(id, left, right, color);
  const file = path.join(outDir, `${id}.svg`);
  // Write UTF-8 without BOM
  fs.writeFileSync(file, svg, { encoding: 'utf8' });
  console.log('wrote', path.basename(file), 'bytes', Buffer.byteLength(svg));
}
console.log('done');
