/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO_ROOT = path.resolve(__dirname, '..');

const TARGETS = [
  path.join(REPO_ROOT, 'admin', 'assets', 'js', 'app'),
  path.join(REPO_ROOT, 'api', 'src'),
  path.join(REPO_ROOT, 'api', 'index.js'),
  path.join(REPO_ROOT, 'api', 'server.js'),
  path.join(REPO_ROOT, 'api', 'knexfile.js'),
  path.join(REPO_ROOT, 'scripts'),
];

function isDirectory(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
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

function listTargetFiles() {
  const files = [];
  for (const t of TARGETS) {
    if (isDirectory(t)) files.push(...walk(t));
    else if (isFile(t)) files.push(t);
  }
  return files.filter((f) => f.toLowerCase().endsWith('.js'));
}

function parseAsScript(filePath, code) {
  // vm.Script only parses; it does not execute.
  // Most of our frontend files are classic scripts (not ESM).
  // For backend CommonJS, this is also valid syntax.
  new vm.Script(code, { filename: filePath });
}

function main() {
  const files = listTargetFiles();
  const errors = [];

  for (const f of files) {
    const code = fs.readFileSync(f, 'utf8');

    // If file uses ESM (import/export), vm.Script will throw.
    // We'll flag it explicitly so you can decide whether to keep it as module.
    const hasEsmSyntax = /^\s*(import|export)\b/m.test(code);
    if (hasEsmSyntax) {
      errors.push({
        file: path.relative(REPO_ROOT, f),
        error: 'ESM syntax (import/export) detected; this repo loads scripts as non-module in most pages.',
      });
      continue;
    }

    try {
      parseAsScript(f, code);
    } catch (err) {
      errors.push({
        file: path.relative(REPO_ROOT, f),
        error: String(err && err.message ? err.message : err),
      });
    }
  }

  if (errors.length) {
    console.log(JSON.stringify({ ok: false, checked: files.length, errors }, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify({ ok: true, checked: files.length }, null, 2));
}

main();

