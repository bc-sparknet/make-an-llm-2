#!/usr/bin/env node
/**
 * Generates one Jupyter notebook per chapter from the chapter's MDX source,
 * so the "Open in Colab" notebooks always match the code shown on the site.
 *
 *   node scripts/build-notebooks.mjs          # write notebooks/*.ipynb
 *   node scripts/build-notebooks.mjs --check  # exit 1 if they are out of date
 *
 * How a chapter's MDX becomes a notebook:
 *   ## / ### headings      → markdown cells
 *   ```python              → a code cell
 *   ```python carry        → a code cell, AND copied into the setup cell of
 *                            every later chapter's notebook (use for classes
 *                            and helpers that later chapters build on;
 *                            torch, torch.nn as nn, torch.nn.functional as F, math and tiktoken are
 *                            imported for them automatically)
 *   ```python skip         → shown on the site only (pseudo-code, fragments)
 *   ```python no-test      → a normal code cell, tagged so scripts/run_notebooks.py
 *                            skips it (cells that need an external service)
 *
 * An optional `notebook-setup.py` next to a chapter's index.mdx is appended to
 * that chapter's setup cell. Inside it, a line
 *     # @embed notebooks/data/short_story.txt
 * is replaced by code that writes that repo file into the notebook's working
 * directory, so notebooks never need to download files from this repo.
 *
 * Also writes src/chapters/notebooks.json: the list of chapters that have a
 * notebook, which the site uses to show the Colab button.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CHAPTERS_DIR = join(ROOT, 'src/chapters');
const OUT_DIR = join(ROOT, 'notebooks');
const MANIFEST = join(CHAPTERS_DIR, 'notebooks.json');
const config = JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf8'));
const checkOnly = process.argv.includes('--check');
const CARRY_IMPORTS = 'import math\nimport tiktoken\nimport torch\nimport torch.nn as nn\nimport torch.nn.functional as F';

/** Chapter names and titles, read from the registry so there is one source of truth. */
function readRegistry() {
  const src = readFileSync(join(CHAPTERS_DIR, 'registry.ts'), 'utf8');
  const meta = {};
  const pattern = /slug: '([^']+)',\s*label: '([^']+)',\s*track: '([^']+)',\s*title: '([^']+)'/g;
  for (const [, slug, label, track, title] of src.matchAll(pattern)) {
    meta[slug] = { title, name: track === 'main' ? `Chapter ${label}` : `Foundations ${label}` };
  }
  return meta;
}

/** Splits MDX into an ordered list of headings and fenced code blocks. */
function parseMdx(src) {
  const items = [];
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const heading = line.match(/^(#{2,3}) (.+)$/);
    if (heading) {
      items.push({ kind: 'heading', level: heading[1].length, text: heading[2].trim() });
      continue;
    }
    const fence = line.match(/^```(\w+)\s*(.*)$/);
    if (fence) {
      const body = [];
      while (++i < lines.length && !lines[i].startsWith('```')) body.push(lines[i]);
      const flags = fence[2].split(/\s+/).filter(Boolean);
      if (fence[1] === 'python') items.push({ kind: 'code', code: body.join('\n'), flags });
    }
  }
  return items;
}

/** Expands `# @embed <path>` lines into Python that recreates the file. */
function expandEmbeds(setup) {
  return setup.replace(/^# @embed (\S+)\s*$/gm, (_, rel) => {
    const text = readFileSync(join(ROOT, rel), 'utf8');
    const name = rel.split('/').pop();
    return `with open(${JSON.stringify(name)}, "w", encoding="utf-8") as f:\n    f.write(${JSON.stringify(text)})`;
  });
}

const toSource = (text) => {
  const lines = text.split('\n');
  return lines.map((l, i) => (i < lines.length - 1 ? `${l}\n` : l));
};
const markdown = (text) => ({ cell_type: 'markdown', metadata: {}, source: toSource(text) });
const code = (text, metadata = {}) => ({
  cell_type: 'code',
  execution_count: null,
  metadata,
  outputs: [],
  source: toSource(text),
});

function buildNotebook({ name, slug, title, items, carried, setupFile }) {
  const chapterUrl = `${config.siteUrl}#/chapter/${slug}`;
  const cells = [
    markdown(
      `# ${name}: ${title}\n\n` +
        `Companion notebook for [${name} of the interactive course](${chapterUrl}). ` +
        `The code cells follow the chapter's examples in order; the explanations are on the site.\n\n` +
        `*This notebook is generated from the chapter source. To change it, edit the chapter and run ` +
        '`npm run notebooks`.*',
    ),
    code('%pip install -q torch tiktoken'),
  ];

  // Carried blocks assume the imports that appear earlier in their own chapter.
  const setupParts = carried.length ? [CARRY_IMPORTS, ...carried] : [];
  if (setupFile) setupParts.push(setupFile.trim());
  if (setupParts.length) {
    cells.push(
      markdown('## Setup\n\nCode carried over from earlier chapters, plus anything this chapter needs to run. Run it once and move on.'),
      code(['#@title Setup (run me first)', ...setupParts].join('\n\n'), { cellView: 'form' }),
    );
  }

  for (const item of items) {
    if (item.kind === 'heading') cells.push(markdown(`${'#'.repeat(item.level)} ${item.text}`));
    else if (!item.flags.includes('skip'))
      cells.push(code(item.code, item.flags.includes('no-test') ? { tags: ['no-test'] } : {}));
  }

  cells.forEach((cell, i) => (cell.id = `cell-${i}`)); // stable ids (required by nbformat 4.5)
  return {
    cells,
    metadata: {
      accelerator: 'GPU',
      colab: { provenance: [], toc_visible: true },
      kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' },
      language_info: { name: 'python' },
    },
    nbformat: 4,
    nbformat_minor: 5,
  };
}

function main() {
  const registry = readRegistry();
  // Main chapters are "NN-slug", optional Foundations chapters are "aN-slug".
  const folders = readdirSync(CHAPTERS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^(\d\d|a\d)-/.test(d.name))
    .map((d) => d.name)
    .sort();

  let carried = []; // carry blocks accumulated from earlier chapters in the same track
  let currentTrack;
  const outputs = new Map(); // path -> contents
  const manifest = {};

  for (const folder of folders) {
    const slug = folder.slice(3);
    const track = folder.startsWith('a') ? 'foundations' : 'main';
    if (track !== currentTrack) [carried, currentTrack] = [[], track];
    const { name, title } = registry[slug] ?? { name: folder, title: slug };
    const dir = join(CHAPTERS_DIR, folder);
    const items = parseMdx(readFileSync(join(dir, 'index.mdx'), 'utf8'));
    const setupPath = join(dir, 'notebook-setup.py');
    const setupFile = existsSync(setupPath) ? expandEmbeds(readFileSync(setupPath, 'utf8')) : undefined;
    const codeItems = items.filter((i) => i.kind === 'code' && !i.flags.includes('skip'));

    if (codeItems.length > 0) {
      const file = `${folder}.ipynb`;
      const nb = buildNotebook({ name, slug, title, items, carried: [...carried], setupFile });
      outputs.set(join(OUT_DIR, file), `${JSON.stringify(nb, null, 1)}\n`);
      manifest[slug] = `notebooks/${file}`;
    }

    const carry = codeItems.filter((i) => i.flags.includes('carry')).map((i) => i.code);
    if (carry.length) carried.push(`# ---- from ${name} ----\n${carry.join('\n\n')}`);
  }
  outputs.set(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

  const stale = [...outputs].filter(([path, text]) => !existsSync(path) || readFileSync(path, 'utf8') !== text);
  if (checkOnly) {
    if (stale.length) {
      console.error(`Out of date: ${stale.map(([p]) => p.replace(ROOT, '')).join(', ')}\nRun: npm run notebooks`);
      process.exit(1);
    }
    console.log('Notebooks are up to date.');
    return;
  }
  for (const [path, text] of stale) writeFileSync(path, text);
  console.log(`Wrote ${stale.length} file(s); ${Object.keys(manifest).length} notebooks total.`);
}

main();
