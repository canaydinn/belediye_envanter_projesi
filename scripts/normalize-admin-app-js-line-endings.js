/* eslint-disable no-console */
const fs = require('fs/promises');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(REPO_ROOT, 'admin', 'assets', 'js', 'app');

async function main() {
  const entries = await fs.readdir(APP_DIR, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile() && e.name.endsWith('.js')).map((e) => path.join(APP_DIR, e.name));

  let changed = 0;
  for (const filePath of files) {
    const original = await fs.readFile(filePath, 'utf8');

    let next = original;
    // Normalize line endings to LF (avoids stray CR inside lines)
    next = next.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Remove leftover placeholder token line from cookie-auth migration (not needed anymore)
    next = next.replace(/^.*const token = null; \/\/ cookie-auth: HttpOnly token \(not readable in JS\)\s*$/gm, '');

    // Cleanup excessive blank lines
    next = next.replace(/\n{3,}/g, '\n\n');

    if (next !== original) {
      await fs.writeFile(filePath, next, 'utf8');
      changed += 1;
      console.log(`Normalized: ${path.relative(REPO_ROOT, filePath)}`);
    }
  }

  console.log(`Done. Normalized ${changed} file(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

