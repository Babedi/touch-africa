// Simple checker to ensure all modal HTMLs use the standardized modal width class
// Contract:
// - Scan: frontend/**/modals/**/*.html
// - Expect: <div class="modal-dialog modal-md"> on the first modal container line
// - Also verify CSS defines .modal-md .modal-dialog with a max-width
// Output: PASS/FAIL with per-file mismatches if any

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const frontendDir = path.join(root, "frontend");
const cssFile = path.join(frontendDir, "shared", "styles", "modals.css");

/** Recursively walk a directory and collect files */
function walk(dir, filterFn) {
  const results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full, filterFn));
    } else if (entry.isFile()) {
      if (!filterFn || filterFn(full)) results.push(full);
    }
  }
  return results;
}

function checkCssDefinition(filePath) {
  try {
    const css = fs.readFileSync(filePath, "utf8");
    const hasMd =
      /\.modal-md\s*\.modal-dialog\s*\{[^}]*max-width\s*:\s*\d+px;?/s.test(css);
    return { exists: true, hasMd };
  } catch (e) {
    return { exists: false, hasMd: false, error: e.message };
  }
}

function checkHtmlFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  // Heuristic: first modal container line should include the class
  const match = content.match(/<div\s+class=\"([^\"]*modal-dialog[^\"]*)\"/i);
  if (!match) {
    return { ok: false, reason: "No modal-dialog container found" };
  }
  const classList = match[1].split(/\s+/);
  const hasMd = classList.includes("modal-md");
  return { ok: hasMd, found: classList.join(" ") };
}

function run() {
  const start = Date.now();
  const includeAll = process.argv.includes("--all");
  const files = walk(frontendDir, (f) => {
    if (!f.endsWith(".html")) return false;
    if (!f.includes(`${path.sep}modals${path.sep}`)) return false;
    // By default only check dashboard modals (internal/tenant admin/user). Home modals use a different shell.
    if (!includeAll && !f.includes(`${path.sep}dashboards${path.sep}`))
      return false;
    return true;
  });
  const css = checkCssDefinition(cssFile);
  const results = [];
  let failures = 0;

  for (const file of files) {
    const res = checkHtmlFile(file);
    if (!res.ok) failures++;
    results.push({ file, ...res });
  }

  // Report
  console.log("Modal size check for modal-md");
  console.log(`- Files scanned: ${files.length}`);
  console.log(`- CSS present: ${css.exists ? "Yes" : "No"}`);
  console.log(`- .modal-md rule present: ${css.hasMd ? "Yes" : "No"}`);

  if (failures > 0 || !css.exists || !css.hasMd) {
    console.log("\nFailures:");
    for (const r of results) {
      if (!r.ok) {
        console.log(
          `- ${path.relative(root, r.file)}: ${
            r.reason || `Found classes: ${r.found || "(none)"}`
          }`
        );
      }
    }
    console.log(
      `\n❌ FAIL: ${failures} files not using modal-md or missing CSS definition.`
    );
    process.exitCode = 1;
  } else {
    console.log(
      "\n✅ PASS: All modal HTML files use modal-md and CSS definition is present."
    );
  }

  console.log(`Time: ${Date.now() - start}ms`);
}

run();
