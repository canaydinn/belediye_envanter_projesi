/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(REPO_ROOT, 'admin', 'assets', 'js', 'app');

function listJsFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.js'))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
}

function readFileSafe(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function has(re, s) {
  return re.test(s);
}

function analyzeFile(contents) {
  return {
    hasApiBaseUrlConst: has(/\bAPI_BASE_URL\b/, contents),
    usesApiFetch: has(/\bapiFetch\s*\(/, contents),
    usesApiRequest: has(/\bapiRequest\s*\(/, contents),
    usesFetchDirect: has(/\bfetch\s*\(/, contents),
    usesTokenStorage: has(/localStorage\.(getItem|setItem)\(['"]token['"]\)/, contents),
    usesCredentialsInclude: has(/credentials\s*:\s*['"]include['"]/, contents),
    usesBearerHeader: has(/\bAuthorization\s*:\s*`Bearer\s+\$\{token\}`|Authorization\s*:\s*['"]Bearer\s+/i, contents),
  };
}

function main() {
  const files = listJsFiles(APP_DIR);
  const perFile = {};

  for (const f of files) {
    const full = path.join(APP_DIR, f);
    const c = readFileSafe(full);
    perFile[f] = analyzeFile(c);
  }

  const by = (pred) => files.filter((f) => pred(perFile[f]));

  const report = {
    totalFiles: files.length,
    apiBaseUrlConst: by((x) => x.hasApiBaseUrlConst),
    apiFetchUsers: by((x) => x.usesApiFetch),
    apiRequestUsers: by((x) => x.usesApiRequest),
    directFetchOnly: by((x) => x.usesFetchDirect && !x.usesApiFetch && !x.usesApiRequest),
    tokenUsers: by((x) => x.usesTokenStorage),
    credentialsIncludeUsers: by((x) => x.usesCredentialsInclude),
    bearerHeaderUsers: by((x) => x.usesBearerHeader),
  };

  console.log(JSON.stringify(report, null, 2));
}

main();

