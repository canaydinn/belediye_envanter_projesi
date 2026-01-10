/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO_ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(REPO_ROOT, 'admin', 'assets', 'js', 'app');

function listJsFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.js'))
    .map((e) => path.join(dir, e.name))
    .sort();
}

function has(re, s) {
  return re.test(s);
}

function main() {
  const files = listJsFiles(APP_DIR);
  const syntaxErrors = [];
  const esmCandidates = [];
  const features = {
    usesConstLet: 0,
    usesArrow: 0,
    usesAsyncAwait: 0,
    usesTemplateString: 0,
    usesOptionalChaining: 0,
    usesNullishCoalescing: 0,
  };

  for (const filePath of files) {
    const code = fs.readFileSync(filePath, 'utf8');
    const rel = path.relative(REPO_ROOT, filePath);

    // ESM detection (import/export at line start)
    if (/^\s*(import|export)\b/m.test(code)) {
      esmCandidates.push(rel);
      continue;
    }

    // Feature detection (heuristic)
    if (has(/\b(const|let)\b/, code)) features.usesConstLet += 1;
    if (has(/=>/, code)) features.usesArrow += 1;
    if (has(/\basync\b|\bawait\b/, code)) features.usesAsyncAwait += 1;
    if (has(/`[^`]*\$\{[^}]+\}[^`]*`/, code)) features.usesTemplateString += 1;
    if (has(/\?\.\s*[A-Za-z_$\[]/, code)) features.usesOptionalChaining += 1;
    if (has(/\?\?/, code)) features.usesNullishCoalescing += 1;

    // Syntax parse as classic script (browser/global style)
    try {
      new vm.Script(code, { filename: rel });
    } catch (err) {
      syntaxErrors.push({
        file: rel,
        error: String(err && err.message ? err.message : err),
      });
    }
  }

  const result = {
    ok: syntaxErrors.length === 0,
    folder: path.relative(REPO_ROOT, APP_DIR),
    totalFiles: files.length,
    esmCandidates: esmCandidates.length,
    syntaxErrorsCount: syntaxErrors.length,
    features,
    esmSample: esmCandidates.slice(0, 20),
    syntaxErrors: syntaxErrors.slice(0, 20),
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok || result.esmCandidates) process.exitCode = 1;
}

main();

