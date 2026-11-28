#!/usr/bin/env node
/* Mills Maths Tools — build the offline file list, and (optionally) add the PWA tags to every page.

   node tools/build-pwa.mjs            writes precache-manifest.js only (run before every push)
                                       It first runs tools/build-home.mjs, which keeps the homepage's
                                       finder data in step with the syllabus files.
   node tools/build-pwa.mjs --inject   also adds/refreshes the <head> block in every HTML page
   node tools/build-pwa.mjs --inject --dry-run   shows what it would change, writes nothing

   The injected block sits between <!-- mmt-pwa --> markers, so running it again updates
   it in place rather than adding a second copy. */
import { createHash } from 'node:crypto';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const INJECT = args.has('--inject');
const DRY = args.has('--dry-run');

// ---- What goes into the offline copy ------------------------------------------------
const SKIP_DIRS = new Set(['.git', '.github', 'node_modules', 'tools', 'Claude outputs']);
const INCLUDE_EXT = new Set(['.html', '.js', '.css', '.json', '.svg', '.png', '.jpg', '.jpeg',
  '.webp', '.gif', '.ico', '.woff', '.woff2', '.webmanifest']);
const SKIP_FILES = new Set(['sw.js', 'precache-manifest.js']);
const MAX_BYTES = 3 * 1024 * 1024;   // bigger files are saved the first time they're opened instead

// Pages that must NOT get the PWA block (print templates rendered inside iframes, fragments…).
// Paths are relative to the repo root; a trailing / means the whole folder.
const NO_INJECT = [
  // 'templates/',
];

const THEME = '#1f3a5f';
const APP_TITLE = 'MMT';

// -------------------------------------------------------------------------------------
async function walk(dir, out = []) {
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.') && ent.name !== '.well-known') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) { if (!SKIP_DIRS.has(ent.name)) await walk(full, out); }
    else if (ent.isFile()) out.push(full);
  }
  return out;
}

const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

function pwaBlock(prefix) {
  return [
    '<!-- mmt-pwa -->',
    `<link rel="manifest" href="${prefix}manifest.webmanifest">`,
    `<meta name="theme-color" content="${THEME}">`,
    `<link rel="apple-touch-icon" href="${prefix}icons/apple-touch-icon.png">`,
    '<meta name="mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    `<meta name="apple-mobile-web-app-title" content="${APP_TITLE}">`,
    `<script src="${prefix}pwa.js" defer></script>`,
    '<!-- /mmt-pwa -->',
  ].join('\n');
}

// ---- The homepage first: its finder reads the cards on the page, and tools/build-home.mjs fills in what
//      the syllabus files say about each one. Done before the walk so the version below includes the change.
//      If it cannot run, index.html is left exactly as it is and the offline list is still written.
try {
  const { buildHome } = await import('./build-home.mjs');
  console.log((await buildHome(ROOT, { dry: DRY })).summary);
} catch (e) {
  console.warn('[build-home] skipped, index.html left as it is: ' + e.message);
}

const all = (await walk(ROOT)).sort();
const files = [];
const tooBig = [];
const hash = createHash('sha256');
let total = 0;
let injected = 0, refreshed = 0, noHead = [];

for (const f of all) {
  const r = rel(f);
  const ext = path.extname(f).toLowerCase();

  if (INJECT && ext === '.html' && !NO_INJECT.some((p) => p.endsWith('/') ? r.startsWith(p) : r === p)) {
    let html = await readFile(f, 'utf8');
    const up = path.relative(path.dirname(f), ROOT).split(path.sep).join('/');
    const block = pwaBlock(up ? up + '/' : '');
    const re = /<!-- mmt-pwa -->[\s\S]*?<!-- \/mmt-pwa -->/;
    let next = html;
    if (re.test(html)) next = html.replace(re, block);
    else if (/<\/head>/i.test(html)) next = html.replace(/<\/head>/i, block + '\n</head>');
    else noHead.push(r);
    if (next !== html) {
      re.test(html) ? refreshed++ : injected++;
      if (!DRY) await writeFile(f, next);
    }
  }

  if (!INCLUDE_EXT.has(ext) || SKIP_FILES.has(path.basename(f))) continue;
  const { size } = await stat(f);
  if (size > MAX_BYTES) { tooBig.push(`${r} (${(size / 1048576).toFixed(1)} MB)`); continue; }
  files.push(r);
  total += size;
  hash.update(r).update(await readFile(f));   // read after injection, so the version reflects it
}

const version = hash.digest('hex').slice(0, 10);
const list = ['./', ...files.filter((f) => f !== 'index.html'), 'index.html'];
const out =
  '/* Written by tools/build-pwa.mjs — do not edit by hand. */\n' +
  `self.MMT_PRECACHE = ${JSON.stringify({ version, files: list }, null, 1)};\n`;

if (!DRY) await writeFile(path.join(ROOT, 'precache-manifest.js'), out);

console.log(`${DRY ? '[dry run] ' : ''}precache-manifest.js  version ${version}`);
console.log(`  ${list.length} files, ${(total / 1048576).toFixed(1)} MB saved for offline`);
if (tooBig.length) console.log(`  left out (over ${MAX_BYTES / 1048576} MB, saved when first opened):\n    ` + tooBig.join('\n    '));
if (INJECT) {
  console.log(`  PWA block: ${injected} pages added, ${refreshed} refreshed`);
  if (noHead.length) console.log('  no </head>, left alone:\n    ' + noHead.join('\n    '));
}
