#!/usr/bin/env node
/*
  index-content.js — builds the JSON manifests the public site reads.

  WHY THIS EXISTS
  ---------------
  Decap CMS stores one Markdown file per event and per photo (content/events/*.md,
  content/photos/*.md). A browser cannot list the files in a folder, so the public
  site needs a manifest that says "here are all the events". This script reads the
  folders and writes:

      content/events.json   — every event, oldest date first
      content/photos.json   — every photo, by `order` then caption

  It uses ONLY Node's built-in modules (no npm install, no package.json). Netlify
  runs it as the build command (see netlify.toml), so the manifests are rebuilt on
  every deploy — including after a committee member's CMS change is merged.

  Run it locally after editing content by hand:
      node scripts/index-content.js

  The generated files are committed too, so the site works when you just open a
  local server without running the script. The build always regenerates them, so
  the committed copies are only a snapshot for local previews.
*/
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EVENTS_DIR = path.join(ROOT, 'content', 'events');
const PHOTOS_DIR = path.join(ROOT, 'content', 'photos');

/* ----------------------------------------------------------------------
   A small YAML front-matter reader.

   Decap writes front matter with the `yaml` package. For the flat, scalar-only
   fields we use, its output is one of:

       key: plain value
       key: "double quoted, with \" escapes"
       key: 'single quoted, with '' escapes'
       key: >-            (folded block scalar — long text wrapped onto lines)
         line one
         line two
       key: |-            (literal block scalar — newlines kept)
         line one
       key: a long plain value that the writer wrapped
         onto a continuation line

   We handle all of those plus booleans, numbers and null. Nested objects are
   not needed (and not supported) — every field in admin/config.yml is flat.
   ---------------------------------------------------------------------- */
function parseFrontMatter(source) {
  const text = source.replace(/\r\n?/g, '\n');
  if (!text.startsWith('---\n')) return { data: {}, body: text };

  // Find the closing `---` line. Everything between is YAML, everything after is body.
  const end = text.indexOf('\n---', 4);
  if (end === -1) return { data: {}, body: text };
  const yamlText = text.slice(4, end);
  const body = text.slice(end + 4).replace(/^\n/, '');

  const lines = yamlText.split('\n');
  const data = {};
  let i = 0;

  const isIndented = (l) => /^\s+\S/.test(l);
  const isBlank = (l) => /^\s*$/.test(l);
  const indentOf = (l) => l.match(/^\s*/)[0].length;

  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line) || line.startsWith('#')) { i++; continue; }

    // Only top-level `key:` lines start a field.
    const m = /^([A-Za-z0-9_\-]+):(?:\s*(.*))?$/.exec(line);
    if (!m) { i++; continue; }
    const key = m[1];
    const rest = (m[2] || '').trim();
    i++;

    // --- block scalar: `|`, `|-`, `|+`, `>`, `>-`, `>+`
    if (/^[|>][+-]?$/.test(rest)) {
      const literal = rest[0] === '|';
      const chomp = rest[1] || '';           // '' = clip, '-' = strip, '+' = keep
      const block = [];
      let indent = null;
      while (i < lines.length && (isBlank(lines[i]) || isIndented(lines[i]))) {
        const l = lines[i];
        if (indent === null && !isBlank(l)) indent = indentOf(l);
        block.push(indent === null ? '' : l.slice(Math.min(indent, indentOf(l))));
        i++;
      }
      let value;
      if (literal) {
        value = block.join('\n');
      } else {
        // Folded: single newlines become spaces, blank lines become newlines.
        value = block.reduce((acc, l, idx) => {
          if (idx === 0) return l;
          if (l === '') return acc + '\n';
          return acc + (acc.endsWith('\n') ? '' : ' ') + l;
        }, '');
      }
      value = value.replace(/\n+$/, '');
      if (chomp === '+') value += '\n';
      data[key] = value;
      continue;
    }

    // --- empty value: either null, or a list of scalars on the following lines
    if (rest === '') {
      const items = [];
      while (i < lines.length && /^\s+-\s*/.test(lines[i])) {
        items.push(parseScalar(lines[i].replace(/^\s+-\s*/, '')));
        i++;
      }
      data[key] = items.length ? items : null;
      continue;
    }

    // --- scalar, possibly wrapped onto indented continuation lines
    let raw = rest;
    while (i < lines.length && isIndented(lines[i])) {
      raw += ' ' + lines[i].trim();
      i++;
    }
    data[key] = parseScalar(raw);
  }

  return { data, body };
}

function parseScalar(raw) {
  const s = raw.trim();
  if (s === '' || s === '~' || s === 'null') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s[0] === '"' && s[s.length - 1] === '"' && s.length >= 2) {
    const map = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
    return s.slice(1, -1).replace(/\\(["\\/bfnrt])/g, (_, c) => map[c]);
  }
  if (s[0] === "'" && s[s.length - 1] === "'" && s.length >= 2) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

/* ----------------------------------------------------------------------
   Read every .md file in a folder → array of front-matter objects.
   Each object also gets `slug` (file name without extension) so the
   front end has a stable id for keys, lightbox labels, etc.
   ---------------------------------------------------------------------- */
function readFolder(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const { data, body } = parseFrontMatter(fs.readFileSync(path.join(dir, f), 'utf8'));
      const entry = Object.assign({ slug: f.replace(/\.md$/, '') }, data);
      if (body.trim()) entry.body = body.trim();
      return entry;
    });
}

/* ---------------------------------------------------------------------- */
function normaliseEvent(e) {
  // Dates may come out as a plain YYYY-MM-DD string, or a full ISO timestamp
  // if someone changes the widget format. Keep just the calendar date.
  const date = e.date == null ? '' : String(e.date);
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(date);
  return {
    slug: e.slug,
    title: e.title || 'Untitled event',
    date: iso ? iso[1] : '',
    time: e.time || '',
    venue: e.venue || '',
    description: e.description || '',
    published: e.published !== false,   // a missing flag counts as published
  };
}

function normalisePhoto(p) {
  return {
    slug: p.slug,
    caption: p.caption || '',
    image: p.image || '',
    size: p.size || 'normal',
    order: typeof p.order === 'number' ? p.order : 0,
  };
}

const events = readFolder(EVENTS_DIR)
  .map(normaliseEvent)
  .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.title.localeCompare(b.title));

const photos = readFolder(PHOTOS_DIR)
  .map(normalisePhoto)
  .sort((a, b) => a.order - b.order || a.caption.localeCompare(b.caption));

function write(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
  console.log('wrote ' + path.relative(ROOT, file) + ' (' + value.length + ' entries)');
}

write(path.join(ROOT, 'content', 'events.json'), events);
write(path.join(ROOT, 'content', 'photos.json'), photos);
