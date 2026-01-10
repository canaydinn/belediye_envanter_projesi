/* eslint-disable no-console */
const fs = require('fs/promises');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const ADMIN_DIR = path.join(REPO_ROOT, 'admin');

function shouldSkip(fileName) {
  // Keep vendor template landing untouched
  return fileName.toLowerCase() === 'index.html';
}

function convert(html) {
  // Add type="module" to app scripts (assets/js/app/*) if missing.
  // Node regex supports lookaheads.
  return html.replace(
    /<script(?![^>]*\btype\s*=)([^>]*\bsrc\s*=\s*["']assets\/js\/app\/[^"']+["'][^>]*)>/gi,
    '<script type="module"$1>'
  );
}

async function main() {
  const entries = await fs.readdir(ADMIN_DIR, { withFileTypes: true });
  const htmlFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.html'))
    .map((e) => e.name)
    .filter((name) => !shouldSkip(name))
    .map((name) => path.join(ADMIN_DIR, name));

  let changed = 0;
  for (const filePath of htmlFiles) {
    const original = await fs.readFile(filePath, 'utf8');
    const next = convert(original);
    if (next !== original) {
      await fs.writeFile(filePath, next, 'utf8');
      changed += 1;
      console.log(`Updated: ${path.relative(REPO_ROOT, filePath)}`);
    }
  }

  console.log(`Done. Updated ${changed} file(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

