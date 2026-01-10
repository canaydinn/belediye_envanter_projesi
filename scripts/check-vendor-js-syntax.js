/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO_ROOT = path.resolve(__dirname, '..');

const TARGET_DIRS = [
  path.join(REPO_ROOT, 'admin', 'libs'),
  path.join(REPO_ROOT, 'admin', 'assets', 'vendor'),
  path.join(REPO_ROOT, 'admin', 'dist'),
];

function isDirectory(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function walk(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (e.isFile()) out.push(full);
  }
  return out;
}

function listFiles() {
  const files = [];
  for (const d of TARGET_DIRS) {
    if (isDirectory(d)) files.push(...walk(d));
  }
  return files.filter((f) => f.toLowerCase().endsWith('.js'));
}

function main() {
  const files = listFiles();
  const errors = [];
  const esm = [];

  const start = Date.now();
  let processed = 0;

  for (const f of files) {
    const code = fs.readFileSync(f, 'utf8');
    const rel = path.relative(REPO_ROOT, f);

    // Flag ESM syntax; most vendor bundles are scripts/UMD.
    if (/^\s*(import|export)\b/m.test(code)) {
      esm.push(rel);
      continue;
    }

    try {
      new vm.Script(code, { filename: rel });
    } catch (err) {
      errors.push({
        file: rel,
        error: String(err && err.message ? err.message : err),
      });
    }

    processed += 1;
    if (processed % 250 === 0) {
      const elapsedSec = Math.round((Date.now() - start) / 1000);
      console.log(`...checked ${processed}/${files.length} files (${elapsedSec}s)`);
    }
  }

  const result = {
    ok: errors.length === 0,
    checked: processed,
    totalJsFiles: files.length,
    esmFiles: esm.length,
    errorsCount: errors.length,
    esm: esm.slice(0, 50),
    errors: errors.slice(0, 50),
  };

  console.log(JSON.stringify(result, null, 2));

  if (esm.length || errors.length) {
    // Non-zero exit so CI can catch it if desired.
    process.exitCode = 1;
  }
}

main();

