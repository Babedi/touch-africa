#!/usr/bin/env node
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = [
  path.join(ROOT, "models", "approved"),
  path.join(ROOT, "models", "examples"),
];

function toCamel(str) {
  if (str.startsWith("__") && str.endsWith("__")) return str; // keep sentinels
  // kebab to snake for uniformity
  let s = String(str).replace(/-/g, "_");
  // camelCase from snake
  return s.replace(/_([a-zA-Z0-9])/g, (_, c) => c.toUpperCase());
}

function camelize(obj) {
  if (Array.isArray(obj)) return obj.map(camelize);
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const nk = toCamel(k);
      out[nk] = camelize(v);
    }
    return out;
  }
  return obj;
}

async function walk(dir, files = []) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, files);
    else files.push(p);
  }
  return files;
}

async function renameExamplesHyphensToDots(baseDir) {
  const files = await walk(baseDir);
  const renames = [];
  for (const p of files) {
    if (!p.endsWith(".json")) continue;
    const dir = path.dirname(p);
    const base = path.basename(p);
    if (base.includes("-")) {
      const next = path.join(dir, base.toLowerCase().replace(/-/g, "."));
      if (next !== p) {
        await fsp.rename(p, next);
        renames.push({ from: p, to: next });
      }
    }
  }
  return renames;
}

async function camelizeJsonFiles(dirs) {
  const changed = [];
  for (const d of dirs) {
    const files = await walk(d);
    for (const p of files) {
      if (!p.endsWith(".json")) continue;
      const raw = await fsp.readFile(p, "utf8");
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        continue;
      }
      const next = camelize(data);
      const out = JSON.stringify(next, null, 2) + "\n";
      if (out !== raw) {
        await fsp.writeFile(p, out, "utf8");
        changed.push(p);
      }
    }
  }
  return changed;
}

async function updateDocReferences(renames) {
  const docDir = path.join(ROOT, "docs");
  let files = [];
  try {
    files = await walk(docDir);
  } catch {}
  const mdFiles = files.filter((p) => p.endsWith(".md"));
  for (const md of mdFiles) {
    let text = await fsp.readFile(md, "utf8");
    let before = text;
    for (const { from, to } of renames) {
      const f = path.basename(from);
      const t = path.basename(to);
      text = text.replaceAll(f, t);
    }
    if (text !== before) {
      await fsp.writeFile(md, text, "utf8");
    }
  }
}

(async () => {
  // 1) Rename hyphenated example JSON filenames to dot notation
  const exampleDir = path.join(ROOT, "models", "examples");
  const renames = await renameExamplesHyphensToDots(exampleDir);

  // 2) Camelize JSON keys in approved and examples
  const changed = await camelizeJsonFiles(TARGET_DIRS);

  // 3) Update docs references for renamed example files
  await updateDocReferences(renames);

  console.log(JSON.stringify({ renames, changed }, null, 2));
})();
