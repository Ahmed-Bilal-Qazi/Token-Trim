/* ═══════════════════════════════════════════════════
    Token Trim — app.js
   ═══════════════════════════════════════════════════ */

/* ── Language map ─────────────────────────────────── */

const LANG_MAP = {
  py:     'python',
  js:     'javascript',
  ts:     'typescript',
  tsx:    'tsx',
  jsx:    'jsx',
  html:   'html',
  css:    'css',
  scss:   'scss',
  json:   'json',
  yaml:   'yaml',
  yml:    'yaml',
  md:     'markdown',
  sh:     'bash',
  bash:   'bash',
  zsh:    'bash',
  fish:   'bash',
  rs:     'rust',
  go:     'go',
  rb:     'ruby',
  java:   'java',
  cpp:    'cpp',
  cc:     'cpp',
  c:      'c',
  h:      'c',
  cs:     'csharp',
  php:    'php',
  swift:  'swift',
  kt:     'kotlin',
  sql:    'sql',
  r:      'r',
  lua:    'lua',
  toml:   'toml',
  xml:    'xml',
  vue:    'vue',
  svelte: 'svelte',
  tf:     'terraform',
  ex:     'elixir',
  exs:    'elixir',
  dart:   'dart',
  hs:     'haskell',
  clj:    'clojure',
  scala:  'scala',
};

function getLang(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return LANG_MAP[ext] || ext || 'text';
}

/* ── Token estimation ─────────────────────────────── */

function estTokens(text) {
  return Math.round(text.length / 4);
}

function fmtTokens(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}

function fmtSize(bytes) {
  return bytes < 1024 ? bytes + ' B' : (bytes / 1024).toFixed(1) + ' KB';
}

/* ── Compression engine ───────────────────────────── */

const BLOCK_COMMENT_LANGS = new Set([
  'javascript', 'typescript', 'jsx', 'tsx', 'java',
  'c', 'cpp', 'csharp', 'go', 'rust', 'swift', 'kotlin',
  'php', 'css', 'scss', 'vue', 'svelte',
]);

const LINE_COMMENT_MAP = {
  python:     '#',
  ruby:       '#',
  bash:       '#',
  yaml:       '#',
  toml:       '#',
  r:          '#',
  perl:       '#',
  elixir:     '#',
  javascript: '//',
  typescript: '//',
  jsx:        '//',
  tsx:        '//',
  java:       '//',
  c:          '//',
  cpp:        '//',
  csharp:     '//',
  go:         '//',
  rust:       '//',
  swift:      '//',
  kotlin:     '//',
  php:        '//',
  scss:       '//',
  vue:        '//',
  svelte:     '//',
  dart:       '//',
  scala:      '//',
  sql:        '--',
  lua:        '--',
  haskell:    '--',
  clojure:    ';',
};

function stripLineComment(line, marker) {
  let inStr = false;
  let strChar = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (!inStr && (ch === '"' || ch === "'" || ch === '`')) {
      inStr = true; strChar = ch; continue;
    }
    if (inStr && ch === strChar && line[i - 1] !== '\\') {
      inStr = false; continue;
    }
    if (!inStr && line.startsWith(marker, i)) {
      return line.slice(0, i).trimEnd();
    }
  }
  return line;
}

function compress(code, lang) {
  let c = code;

  const doComments = document.getElementById('oComments').checked;
  const doBlanks   = document.getElementById('oBlanks').checked;
  const doIndent   = document.getElementById('oIndent').checked;
  const doTrail    = document.getElementById('oTrail').checked;

  if (doComments) {
    /* Block comments */
    if (BLOCK_COMMENT_LANGS.has(lang)) {
      c = c.replace(/\/\*[\s\S]*?\*\//g, '');
    }
    if (lang === 'html' || lang === 'xml') {
      c = c.replace(/<!--[\s\S]*?-->/g, '');
    }
    if (lang === 'python') {
      c = c.replace(/"""[\s\S]*?"""/g, '');
      c = c.replace(/'''[\s\S]*?'''/g, '');
    }
    if (lang === 'lua') {
      c = c.replace(/--\[\[[\s\S]*?\]\]/g, '');
    }

    /* Line comments */
    const marker = LINE_COMMENT_MAP[lang];
    if (marker) {
      c = c.split('\n').map(line => stripLineComment(line, marker)).join('\n');
    }
  }

  /* Minimize indentation */
  if (doIndent) {
    const lines = c.split('\n');
    let unit = Infinity;
    for (const l of lines) {
      if (!l.trim()) continue;
      if (/^\t/.test(l)) { unit = 1; break; }
      const m = l.match(/^( +)/);
      if (m) unit = Math.min(unit, m[1].length);
    }
    if (!isFinite(unit) || unit < 2) unit = 2;
    if (unit >= 2) {
      c = lines.map(l => {
        const m = l.match(/^(\s+)/);
        if (!m) return l;
        const spaces = m[1].replace(/\t/g, ' '.repeat(unit));
        const levels = Math.round(spaces.length / unit);
        return ' '.repeat(levels) + l.trimStart();
      }).join('\n');
    }
  }

  if (doTrail)  c = c.split('\n').map(l => l.trimEnd()).join('\n');
  if (doBlanks) c = c.split('\n').filter(l => l.trim() !== '').join('\n');

  return c.trim();
}

/* ── File tree builder ────────────────────────────── */

function buildTree(names) {
  const root = {};
  for (const name of names) {
    const parts = name.split('/');
    let node = root;
    for (const p of parts) node = node[p] = node[p] || {};
  }

  const lines = [];

  function walk(node, prefix) {
    const keys = Object.keys(node).sort((a, b) => {
      const aIsDir = Object.keys(node[a]).length > 0;
      const bIsDir = Object.keys(node[b]).length > 0;
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });
    keys.forEach((k, i) => {
      const last = i === keys.length - 1;
      lines.push(prefix + (last ? '└── ' : '├── ') + k);
      if (Object.keys(node[k]).length) {
        walk(node[k], prefix + (last ? '    ' : '│   '));
      }
    });
  }

  walk(root, '');
  return lines.join('\n');
}

/* ── File reading ─────────────────────────────────── */

function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = () => resolve('');
    reader.readAsText(file);
  });
}

/* ── State ────────────────────────────────────────── */

const files = new Map();
let outputText = '';

/* ── Render file list ─────────────────────────────── */

function renderFileList() {
  const fl   = document.getElementById('fileList');
  const opts = document.getElementById('optsCard');
  const gen  = document.getElementById('genBtn');

  fl.innerHTML = '';

  if (files.size === 0) {
    opts.classList.add('hidden');
    return;
  }

  opts.classList.remove('hidden');
  gen.disabled = false;

  for (const [id, f] of files) {
    const lang = getLang(f.file.name);

    let saveBadge = '';
    if (f.raw != null && f.compressed != null) {
      const pct = Math.round(
        (1 - estTokens(f.compressed) / Math.max(1, estTokens(f.raw))) * 100
      );
      const cls = pct >= 25 ? 'badge-good' : pct >= 5 ? 'badge-mid' : 'badge-none';
      saveBadge = `<span class="badge ${cls}">${pct > 0 ? '-' + pct + '%' : '~0%'}</span>`;
    }

    const row = document.createElement('div');
    row.className = 'file-row';
    row.innerHTML = `
      <span class="file-name" title="${f.file.name}">${f.file.name}</span>
      <span class="badge badge-lang">${lang}</span>
      ${saveBadge}
      <span class="file-size">${fmtSize(f.file.size)}</span>
      <button class="rm-btn" data-id="${id}" title="Remove">&times;</button>
    `;
    fl.appendChild(row);
  }

  fl.querySelectorAll('.rm-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      files.delete(btn.dataset.id);
      renderFileList();
    });
  });
}

/* ── Add files ────────────────────────────────────── */

function addFiles(newFiles) {
  for (const f of newFiles) {
    const id = f.name + '_' + f.size;
    if (!files.has(id)) {
      files.set(id, { file: f, raw: null, compressed: null });
    }
  }
  renderFileList();
}

/* ── Generate ─────────────────────────────────────── */

document.getElementById('genBtn').addEventListener('click', async () => {
  const btn = document.getElementById('genBtn');
  btn.textContent = 'Compressing…';
  btn.disabled = true;

  const withTree = document.getElementById('oTree').checked;
  const parts    = [];
  let totalBefore = 0;
  let totalAfter  = 0;

  /* Read all raw content first */
  for (const [, f] of files) {
    if (!f.raw) f.raw = await readFile(f.file);
  }

  /* File tree */
  if (withTree) {
    const tree = buildTree([...files.values()].map(f => f.file.name));
    parts.push('<file_tree>\n' + tree + '\n</file_tree>');
  }

  /* Compress and pack each file */
  for (const [, f] of files) {
    const lang   = getLang(f.file.name);
    f.compressed = compress(f.raw, lang);
    totalBefore += estTokens(f.raw);
    totalAfter  += estTokens(f.compressed);
    parts.push(`<file path="${f.file.name}" lang="${lang}">\n${f.compressed}\n</file>`);
  }

  outputText = parts.join('\n\n');

  const saved    = totalBefore - totalAfter;
  const savedPct = Math.round(saved / Math.max(1, totalBefore) * 100);

  /* Update stats */
  document.getElementById('sBefore').textContent = fmtTokens(totalBefore);
  document.getElementById('sAfter').textContent  = fmtTokens(totalAfter);
  document.getElementById('sSaved').textContent  = fmtTokens(saved) + ' (−' + savedPct + '%)';
  document.getElementById('statsCard').classList.remove('hidden');

  /* Update output */
  document.getElementById('outMeta').textContent =
    `${files.size} file${files.size !== 1 ? 's' : ''} · ${outputText.length.toLocaleString()} chars`;
  document.getElementById('outBox').textContent = outputText;
  document.getElementById('outCard').classList.remove('hidden');

  renderFileList();
  btn.textContent = 'Pack & compress';
  btn.disabled = false;
});

/* ── Copy ─────────────────────────────────────────── */

document.getElementById('copyBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(outputText).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = 'Copied!';
    setTimeout(() => (btn.textContent = 'Copy'), 1800);
  });
});

/* ── Download ─────────────────────────────────────── */

document.getElementById('downloadBtn').addEventListener('click', () => {
  const blob = new Blob([outputText], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'ai-context.txt';
  a.click();
  URL.revokeObjectURL(url);
});

/* ── Drag & drop ──────────────────────────────────── */

document.getElementById('fileInput').addEventListener('change', e => {
  addFiles([...e.target.files]);
  e.target.value = '';
});

const dropZone = document.getElementById('dropZone');

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('over');
});

dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('over');
  addFiles([...e.dataTransfer.files]);
});
