/* eslint-disable no-console */
const fs = require('fs/promises');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(REPO_ROOT, 'admin', 'assets', 'js', 'app');

function replaceAllSafe(str, search, replacement) {
  return str.split(search).join(replacement);
}

function normalizeCookieAuth(js) {
  let out = js;

  // Remove any token persistence
  out = out.replace(/^\s*localStorage\.setItem\(['"]token['"][^;]*;\s*$/gm, '');
  out = out.replace(/^\s*localStorage\.removeItem\(['"]token['"]\);\s*$/gm, '');

  // Replace token reads with null (cookie is HttpOnly; JS can't read it)
  out = replaceAllSafe(out, "localStorage.getItem('token')", 'null');
  out = replaceAllSafe(out, 'localStorage.getItem("token")', 'null');

  // Replace common "const token = null;" patterns into a single canonical form
  out = out.replace(/^\s*const token\s*=\s*null;\s*$/gm, "const token = null; // cookie-auth: HttpOnly token (not readable in JS)");

  // Remove conditional Authorization spreads
  out = out.replace(/^\s*\.\.\.\(token\s*\?\s*\{\s*Authorization:\s*`Bearer\s*\$\{token\}`\s*\}\s*:\s*\{\s*\}\s*\)\s*,?\s*$/gm, '');
  out = out.replace(/^\s*\.\.\.\(token\s*\?\s*\{\s*Authorization:\s*`Bearer\s*\$\{token\}`\s*\}\s*:\s*\{\s*\}\s*\)\s*$/gm, '');
  out = out.replace(/^\s*\.\.\.\(token\s*\?\s*\{\s*Authorization:\s*`Bearer\s*\$\{token\}`\s*\}\s*:\s*\{\s*\}\s*\)\s*,\s*$/gm, '');

  // Remove direct Authorization header lines
  out = out.replace(/^\s*Authorization:\s*`Bearer\s*\$\{token\}`\s*,?\s*$/gm, '');

  // Replace common ternary header assignments
  out = out.replace(
    /headers:\s*token\s*\?\s*\{\s*Authorization:\s*`Bearer\s*\$\{token\}`\s*\}\s*:\s*\{\s*\}\s*,/g,
    'headers: {},'
  );
  out = out.replace(
    /headers:\s*token\s*\?\s*\{\s*Authorization:\s*`Bearer\s*\$\{token\}`\s*\}\s*:\s*\{\s*\}\s*\}/g,
    'headers: {} }'
  );

  // Remove "token bulunamadı" warnings (we can't inspect HttpOnly cookie)
  out = out.replace(/^\s*if\s*\(\s*!token\s*\)\s*\{\s*console\.warn\([^\n]*\);\s*\}\s*$/gm, '');

  // Cleanup excessive blank lines (keep it simple)
  out = out.replace(/\n{3,}/g, '\n\n');

  return out;
}

async function main() {
  const entries = await fs.readdir(APP_DIR, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile() && e.name.endsWith('.js')).map((e) => path.join(APP_DIR, e.name));

  let changed = 0;
  for (const filePath of files) {
    const original = await fs.readFile(filePath, 'utf8');
    const next = normalizeCookieAuth(original);
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

