/* eslint-disable no-console */
const fs = require('fs/promises');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const ADMIN_DIR = path.join(REPO_ROOT, 'admin');

function normalizeAssetsPaths(html) {
  let out = html;

  // Normalize data-assets-path to "assets/" for admin/*.html
  out = out.replace(/data-assets-path="[^"]*assets\/?"/g, 'data-assets-path="assets/"');

  // Normalize common asset prefixes to "assets/"
  out = out.replaceAll('../admin/assets/', 'assets/');
  out = out.replaceAll('/admin/assets/', 'assets/');
  out = out.replaceAll('./assets/', 'assets/');

  // Also normalize rare variants without trailing slash
  out = out.replaceAll('../admin/assets', 'assets');
  out = out.replaceAll('/admin/assets', 'assets');

  return out;
}

function removeDuplicateScriptSrc(html, src) {
  // Removes duplicate <script ... src="...">...</script> occurrences, keeping the first.
  const re = new RegExp(
    String.raw`(\s*<script\b[^>]*\bsrc=["']${src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>\s*<\/script>\s*)`,
    'gi'
  );

  let first = true;
  return html.replace(re, (m) => {
    if (first) {
      first = false;
      return m;
    }
    return '';
  });
}

function moveScriptsInsideBody(html) {
  const bodyClose = html.lastIndexOf('</body>');
  const htmlClose = html.lastIndexOf('</html>');
  if (bodyClose === -1 || htmlClose === -1 || bodyClose > htmlClose) return html;

  const between = html.slice(bodyClose + '</body>'.length, htmlClose);
  if (!/<script\b/i.test(between)) return html; // nothing to move

  const beforeBodyClose = html.slice(0, bodyClose);
  const afterBodyCloseToHtmlClose = between; // keep as-is but moved
  const afterHtmlClose = html.slice(htmlClose); // includes </html> onwards

  // Insert scripts (trim only outer whitespace to avoid double blank lines)
  const inserted = afterBodyCloseToHtmlClose.trim();
  const joiner = beforeBodyClose.endsWith('\n') ? '' : '\n';

  return `${beforeBodyClose}${joiner}${inserted}\n</body>\n${afterHtmlClose.replace(/^\s*/, '')}`;
}

function normalizeBranding(html) {
  // Keep it minimal: unify "Envantor" -> "Envanter360" in admin app pages.
  return html.replaceAll('Envantor', 'Envanter360');
}

async function main() {
  const entries = await fs.readdir(ADMIN_DIR, { withFileTypes: true });
  const adminHtmlFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.html'))
    .map((e) => path.join(ADMIN_DIR, e.name));

  let changed = 0;

  for (const filePath of adminHtmlFiles) {
    const fileName = path.basename(filePath).toLowerCase();
    // Skip the vendor demo landing page
    if (fileName === 'index.html') continue;

    const original = await fs.readFile(filePath, 'utf8');

    let next = original;
    next = normalizeAssetsPaths(next);
    next = normalizeBranding(next);
    next = moveScriptsInsideBody(next);

    // Remove known accidental duplicates (after path normalization these become consistent).
    next = removeDuplicateScriptSrc(next, 'assets/js/app/api.js');

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

