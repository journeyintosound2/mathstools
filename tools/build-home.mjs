#!/usr/bin/env node
/* Mills Maths Tools — keep the homepage finder in step with the syllabus files.

   node tools/build-home.mjs             refresh index.html (runs by itself inside build-pwa.mjs)
   node tools/build-home.mjs --dry-run   say what would change, write nothing

   The homepage (index.html) is one self-contained page: its hidden catalogue of
   <a class="resource-card"> elements is the list of everything on the site, and the
   finder at the top of the page reads it. This script adds what the cards do not say
   for themselves, from the files that already hold it:

     data-stages="2 3 4"   every stage the resource serves (0 = Early Stage 1). From the card's
                           own folder and data-stage, plus every outcome it is listed under in
                           resources/toolLinks.js. "" = any stage (chess, dashboards).
                           To set it by hand, put data-for-stages="2 3" on the card: the script
                           copies that and works nothing out.
     data-codes="MA4-…"    its syllabus outcomes, own stage first.
     data-fam="9f3c1a"     the family it belongs to — resources with the same value go
                           together: an interactive with its worksheet, quiz and lesson plan
                           (resources/toolFamilies.js), and the whole-topic quiz and worksheet
                           of one outcome.
     data-whole            a whole-topic quiz or worksheet (one per outcome).
     data-note="…"         a description for the compact cards that have none.
     data-added="…"        the day the card first appeared. Stamped ONCE, with today's date,
                           on any card that has none — that is what "New on the site" reads.

   and one block between <!-- mmt-home-data --> markers: the syllabus topics of every stage
   and the resources that have no card (lesson plans, flash cards, uploaded PDFs and slides).

   Nothing else in index.html is touched, and running it twice changes nothing. If anything
   looks wrong (a card count that does not add up, a data file that will not load) it stops
   without writing. */
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

const STAGE_KEYS = ['stage0', 'stage1', 'stage2', 'stage3', 'stage4', 'stage5'];
const KIND_TYPE = {
  'Teacher tool': 'interactive', 'Student quiz': 'quiz', 'Worksheet maker': 'worksheet',
  'Worksheet creator': 'worksheet', 'Lesson plan': 'lesson', 'Flash cards': 'flip',
  'Flip cards': 'flip', 'Game': 'game',
};
const OWN = ['data-stages', 'data-codes', 'data-fam', 'data-family', 'data-whole', 'data-note'];
const CARD_TAG = /<a class="resource-card[^"]*"(?:\s+[a-zA-Z_:][-\w:.]*(?:="[^"]*")?)*\s*>/g;
const START = '<!-- mmt-home-data -->', END = '<!-- /mmt-home-data -->';
const CAT_START = '<!-- mmt-catalogue -->', CAT_END = '<!-- /mmt-catalogue -->';

const unesc = (s) => String(s).replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&ndash;/g, '–').replace(/&mdash;/g, '—').replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
  .replace(/&times;/g, '×').replace(/&divide;/g, '÷').replace(/&minus;/g, '−').replace(/&hellip;/g, '…')
  .replace(/&middot;/g, '·').replace(/&rarr;/g, '→').replace(/&nbsp;/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const attrEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* One key per page, however it is spelt: no origin, a leading slash, no index.html. */
export function keyOf(href) {
  let h = unesc(String(href || '')).trim();
  if (/^https?:/i.test(h)) {
    const m = h.match(/^https?:\/\/(?:www\.)?millsmathstools\.au(\/.*)?$/i);
    if (!m) return h;
    h = m[1] || '/';
  }
  try { h = decodeURIComponent(h); } catch { /* keep as typed */ }
  h = '/' + h.replace(/^(?:\.?\/)+/, '');
  return h.replace(/[?#].*$/, '').replace(/index\.html$/, '');
}
const stageOfCode = (c) => (/^MAE-/i.test(c) ? 0 : +c.charAt(2));
const getAttr = (tag, name) => {
  const m = tag.match(new RegExp('\\s' + name + '="([^"]*)"'));
  return m ? unesc(m[1]) : null;
};

async function loadData(root, rel, names) {
  const code = await readFile(path.join(root, rel), 'utf8');
  const box = { window: {} };
  vm.runInNewContext(code, box, { timeout: 8000, filename: rel });
  return names.map((n) => {
    if (box.window[n] == null) throw new Error(rel + ' did not define ' + n);
    return box.window[n];
  });
}

export async function buildHome(root, { dry = false, today } = {}) {
  const file = path.join(root, 'index.html');
  const page = await readFile(file, 'utf8');
  const [LINKS] = await loadData(root, 'resources/toolLinks.js', ['MMT_TOOL_LINKS']);
  const [DATA] = await loadData(root, 'resources/resourcesManifest.js', ['MMT_RESOURCES']);
  const [FAM, WQ, WW] = await loadData(root, 'resources/toolFamilies.js',
    ['MMT_TOOL_FAMILIES', 'MMT_WHOLE_TOPIC_QUIZZES', 'MMT_WHOLE_TOPIC_WORKSHEETS']);
  const day = today || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  if (!page.includes(START) || !page.includes(END)) throw new Error('index.html has no ' + START + ' block');
  /* only the catalogue is read and rewritten; the rest of the page is never touched */
  const c0 = page.indexOf(CAT_START), c1 = page.indexOf(CAT_END);
  if (c0 < 0 || c1 < c0) throw new Error('index.html has no ' + CAT_START + ' … ' + CAT_END + ' section');
  const html = page.slice(c0, c1);
  const tags = html.match(CARD_TAG) || [];
  const naive = html.split('<a class="resource-card').length - 1;
  if (!tags.length || tags.length !== naive) throw new Error('read ' + tags.length + ' cards but the catalogue has ' + naive);
  if (tags.some((t) => !/\shref="[^"]+"/.test(t))) throw new Error('a card has no href');

  /* ---- what the syllabus files say about each page ---- */
  const codesOf = new Map();          // key -> Set(outcome codes it is listed under)
  const linkRow = new Map();          // key -> first toolLinks row
  for (const code of Object.keys(LINKS)) {
    for (const r of LINKS[code] || []) {
      if (!r || !r.url) continue;
      const k = keyOf(r.url);
      if (!codesOf.has(k)) codesOf.set(k, new Set());
      codesOf.get(k).add(code.toUpperCase());
      if (!linkRow.has(k)) linkRow.set(k, r);
    }
  }
  const whole = new Set([...Object.keys(WQ), ...Object.keys(WW)].map(keyOf));
  const valid = new Set();            // every outcome code in the syllabus file
  for (const sk of STAGE_KEYS) for (const t of DATA[sk] || []) for (const o of t.outcomes || []) valid.add(String(o.code).toUpperCase());

  /* ---- the cards ---- */
  const cards = [];
  let at = 0;
  for (const tag of tags) {
    const start = html.indexOf(tag, at);
    const end = html.indexOf('</a>', start);
    at = start + tag.length;
    const inner = html.slice(start + tag.length, end);
    const href = getAttr(tag, 'href') || '';
    const type = getAttr(tag, 'data-type') || '';
    const ds = (getAttr(tag, 'data-stage') || '').trim();
    const key = keyOf(href);
    const own = (inner.match(/class="outcome-code">([^<]+)</) || [])[1];
    const said = ((getAttr(tag, 'data-search') || '').match(/\bma[e1-5](?:-[a-z0-9]+){1,4}\b/gi) || []).map((c) => c.toUpperCase());
    const codes = new Set([...(own ? [own.trim().toUpperCase()] : []), ...(codesOf.get(key) || []), ...said]
      .filter((c) => valid.has(c)));

    const stages = new Set();
    const general = type === 'dashboard' || type === 'research' || /\/puzzles\//.test(key);
    const byHand = getAttr(tag, 'data-for-stages');
    if (byHand != null) byHand.split(/\s+/).filter((n) => /^[0-5]$/.test(n)).forEach((n) => stages.add(+n));
    else if (type === 'assessment') [1, 2, 3, 4, 5].forEach((n) => stages.add(n));
    else if (!general) {
      const p = key.match(/\/(early-stage-1|stage-([1-5]))\//);
      if (p) stages.add(p[2] ? +p[2] : 0);
      const m = ds.match(/^Stage ([1-5])$/);
      if (m) stages.add(+m[1]);
      if (/^Early Stage 1$/i.test(ds)) stages.add(0);
      codes.forEach((c) => stages.add(stageOfCode(c)));
      if (!stages.size && /^Years 7.10$/.test(ds) && type !== 'game') { stages.add(4); stages.add(5); }
    }
    /* where it lives: its own folder, else its label, else the lowest stage it serves */
    let primary = -1;
    const home = key.match(/\/(early-stage-1|stage-([1-5]))\//);
    if (home) primary = home[2] ? +home[2] : 0;
    else if (/^Stage [1-5]$/.test(ds)) primary = +ds.slice(6);
    else if (/^Early Stage 1$/i.test(ds)) primary = 0;
    else if (stages.size) primary = Math.min(...stages);
    cards.push({ tag, key, type, inner, own: own ? own.trim().toUpperCase() : '', codes, stages, primary });
  }
  const cardKeys = new Set(cards.map((c) => c.key));

  /* ---- resources with no card: lesson plans, flash cards, uploaded files ---- */
  const extras = new Map();
  for (const [k, r] of linkRow) {
    if (cardKeys.has(k)) continue;
    const cs = [...codesOf.get(k)].sort();
    extras.set(k, { u: r.url, t: r.title, ty: KIND_TYPE[r.kind] || 'interactive', k: r.kind, n: r.note || '',
      s: [...new Set(cs.map(stageOfCode))].sort(), c: cs, g: (r.tags || []).join(' ') });
  }
  const topics = [];
  STAGE_KEYS.forEach((sk, s) => {
    for (const t of DATA[sk] || []) {
      topics.push({ s, g: t.slug, n: t.name, r: t.strand, c: (t.outcomes || []).map((o) => o.code), b: t.blurb || '' });
      for (const o of t.outcomes || []) {
        for (const r of o.resources || []) {
          const ft = String(r.type || 'link').toLowerCase();
          const u = ft === 'link' ? r.url : (r.path || '/resources/' + sk.replace('stage', 'stage-') + '/' + t.slug + '/' + encodeURIComponent(r.file || ''));
          if (!u) continue;
          const k = keyOf(u);
          if (cardKeys.has(k)) continue;
          const e = extras.get(k) || { u, t: r.title, ty: 'file', ft, n: r.note || '', y: r.year || '', s: [], c: [], g: (r.tags || []).join(' ') };
          if (!e.s.includes(s)) e.s.push(s);
          if (!e.c.includes(o.code)) e.c.push(o.code);
          extras.set(k, e);
        }
      }
    }
  });

  /* ---- families: what goes with what ---- */
  const parent = new Map();
  const find = (x) => { let p = parent.get(x); if (p === undefined || p === x) { parent.set(x, x); return x; } p = find(p); parent.set(x, p); return p; };
  const union = (a, b) => { a = find(a); b = find(b); if (a !== b) parent.set(b, a); };
  const known = (k) => cardKeys.has(k) || extras.has(k);
  const lost = [];
  for (const tool of Object.keys(FAM)) {
    const tk = keyOf(tool);
    if (!known(tk)) { lost.push(tool); continue; }
    for (const m of FAM[tool] || []) { const mk = keyOf(m); if (known(mk)) union(tk, mk); else lost.push(m); }
  }
  const byCodes = (obj) => { const out = new Map(); for (const u of Object.keys(obj)) { const k = keyOf(u); out.set([...(codesOf.get(k) || [])].sort().join(' '), k); } return out; };
  const wq = byCodes(WQ), ww = byCodes(WW);
  for (const [cs, k] of wq) if (cs && ww.has(cs) && known(k) && known(ww.get(cs))) union(k, ww.get(cs));
  const groups = new Map();
  for (const k of parent.keys()) { const r = find(k); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(k); }
  /* a family's name: a short hash of its first member, so it does not change when other families are added */
  const famId = new Map();
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    const id = createHash('md5').update(members.slice().sort()[0]).digest('hex').slice(0, 6);
    members.forEach((k) => famId.set(k, id));
  }

  /* ---- write the cards back ---- */
  let out = '', pos = 0, stamped = 0, changed = 0;
  for (const c of cards) {
    const start = html.indexOf(c.tag, pos);
    out += html.slice(pos, start);
    pos = start + c.tag.length;
    let tag = c.tag;
    for (const a of OWN) tag = tag.replace(new RegExp('\\s' + a + '(?:="[^"]*")?(?=[\\s>])', 'g'), '');
    const codes = [...c.codes].sort((a, b) => (a === c.own ? -1 : b === c.own ? 1 : 0)
      || (stageOfCode(a) === c.primary ? -1 : 0) - (stageOfCode(b) === c.primary ? -1 : 0)
      || stageOfCode(a) - stageOfCode(b) || a.localeCompare(b));
    let add = ' data-stages="' + [...c.stages].sort().join(' ') + '"';
    if (codes.length) add += ' data-codes="' + codes.join(' ') + '"';
    if (famId.has(c.key)) add += ' data-fam="' + famId.get(c.key) + '"';
    if (whole.has(c.key)) add += ' data-whole';
    const row = linkRow.get(c.key);
    if (row && row.note && !/<p[\s>]/.test(c.inner)) add += ' data-note="' + attrEsc(row.note) + '"';
    if (!/\sdata-added="/.test(tag)) { add += ' data-added="' + day + '"'; stamped++; }
    tag = tag.replace(/(\sdata-topic="[^"]*")/, '$1' + add);
    if (!tag.includes(add)) tag = tag.replace(/\s*>$/, add + '>');
    if (tag !== c.tag) changed++;
    out += tag;
  }
  out += html.slice(pos);

  /* ---- the data block ---- */
  const list = [...extras.entries()].map(([k, e]) => {
    const o = { u: e.u, t: e.t, ty: e.ty, s: e.s.sort(), c: e.c };
    if (e.n) o.n = e.n;
    if (e.ft) o.ft = e.ft;
    if (e.y) o.y = e.y;
    if (e.g) o.g = e.g;
    if (famId.has(k)) o.f = famId.get(k);
    return o;
  }).sort((a, b) => a.ty.localeCompare(b.ty) || a.t.localeCompare(b.t));
  const json = JSON.stringify({ topics, extras: list }).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, '');
  const block = START + '\n<script type="application/json" id="mmtHomeData">' + json + '</script>\n' + END;
  const after = (out.match(CARD_TAG) || []).length;
  if (after !== tags.length) throw new Error('card count changed (' + tags.length + ' -> ' + after + '); nothing written');
  out = page.slice(0, c0) + out + page.slice(c1);
  const a = out.indexOf(START), b = out.indexOf(END);
  const before = out.slice(a, b + END.length);
  out = out.slice(0, a) + block + out.slice(b + END.length);
  const dirty = out !== page;
  if (dirty && !dry) await writeFile(file, out);
  const summary = '[build-home] ' + tags.length + ' cards, ' + topics.length + ' syllabus topics, ' + list.length + ' resources without a card'
    + (dirty ? ' — index.html ' + (dry ? 'WOULD BE ' : '') + 'updated (' + changed + ' cards' + (stamped ? ', ' + stamped + ' stamped data-added="' + day + '"' : '')
      + (before !== block ? ', data block' : '') + ')' : ' — nothing to change')
    + (lost.length ? '\n[build-home] in toolFamilies.js but not found on the site: ' + lost.join(', ') : '');
  return { dirty, changed, stamped, cards: tags.length, topics: topics.length, extras: list.length, lost, summary };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  buildHome(root, { dry: process.argv.includes('--dry-run') })
    .then((r) => console.log(r.summary))
    .catch((e) => { console.error('[build-home] stopped: ' + e.message); process.exit(1); });
}
