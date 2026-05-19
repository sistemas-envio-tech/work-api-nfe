#!/usr/bin/env node
// Gate evolutivo de erros TypeScript. Roda `tsc --noEmit` em cada package
// (le pnpm-workspace.yaml) e compara o total de erros com .tsc-baseline.
// Falha se o numero crescer.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BASELINE_FILE = join(ROOT, '.tsc-baseline');
const UPDATE = process.argv.includes('--update');

async function readBaseline() {
  if (!existsSync(BASELINE_FILE)) return null;
  const raw = (await readFile(BASELINE_FILE, 'utf8')).trim();
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function countErrorsInOutput(output) {
  // tsc imprime "error TS..." por erro. Pode haver duplicatas (related info), mas
  // a contagem direta eh boa o suficiente como gate.
  const matches = output.match(/error TS\d+/g);
  return matches ? matches.length : 0;
}

const pkgsDir = join(ROOT, 'packages');
const pkgs = (await readdir(pkgsDir, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

let total = 0;
const perPackage = [];
for (const pkg of pkgs) {
  const pkgDir = join(pkgsDir, pkg);
  if (!existsSync(join(pkgDir, 'tsconfig.json'))) continue;
  const r = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['--no-install', 'tsc', '--noEmit', '--pretty', 'false'],
    { cwd: pkgDir, encoding: 'utf8', shell: false },
  );
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  const errs = countErrorsInOutput(out);
  perPackage.push({ pkg, errs, output: out });
  total += errs;
}

if (UPDATE) {
  await writeFile(BASELINE_FILE, `${total}\n`, 'utf8');
  console.log(`[check-tsc-baseline] baseline regravada: ${total}`);
  process.exit(0);
}

const baseline = await readBaseline();
if (baseline === null) {
  console.error('[check-tsc-baseline] .tsc-baseline ausente. Gere com: pnpm baseline:tsc');
  process.exit(1);
}

console.log(`[check-tsc-baseline] erros TS atuais: ${total}, baseline: ${baseline}`);
for (const p of perPackage) {
  console.log(`  - @acbr-node/${p.pkg}: ${p.errs} erro(s)`);
}

if (total > baseline) {
  console.error(`\n[check-tsc-baseline] FALHA: ${total - baseline} novo(s) erro(s) TypeScript alem do baseline.`);
  for (const p of perPackage) {
    if (p.errs > 0) {
      console.error(`\n--- @acbr-node/${p.pkg} ---`);
      console.error(p.output.trim());
    }
  }
  process.exit(1);
}
if (total < baseline) {
  console.warn(`[check-tsc-baseline] AVISO: ${baseline - total} erro(s) abaixo do baseline.`);
  console.warn(`Atualize com: pnpm baseline:tsc`);
}
