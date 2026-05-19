#!/usr/bin/env node
// Gate evolutivo: conta ocorrencias de `as any` em packages/*/src/**/*.ts
// e compara com .as-any-baseline. Falha se o numero crescer; passa se
// estabilizar ou diminuir. Com --update, regrava o baseline com o atual.
//
// Padrao no work-manager: baseline so cai, nunca sobe. Quem precisar
// adicionar `as any` deve justificar no PR.

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BASELINE_FILE = join(ROOT, '.as-any-baseline');
const PATTERN = /\bas\s+any\b/g;
const UPDATE = process.argv.includes('--update');

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.turbo') continue;
      yield* walk(full);
    } else if (entry.isFile() && full.endsWith('.ts') && !full.endsWith('.d.ts')) {
      yield full;
    }
  }
}

async function countAsAny() {
  const pkgsDir = join(ROOT, 'packages');
  const pkgs = await readdir(pkgsDir);
  const hits = [];
  for (const pkg of pkgs) {
    const srcDir = join(pkgsDir, pkg, 'src');
    if (!existsSync(srcDir)) continue;
    if (!(await stat(srcDir)).isDirectory()) continue;
    for await (const file of walk(srcDir)) {
      const content = await readFile(file, 'utf8');
      const matches = content.match(PATTERN);
      if (matches && matches.length > 0) {
        hits.push({ file, count: matches.length });
      }
    }
  }
  return hits;
}

async function readBaseline() {
  if (!existsSync(BASELINE_FILE)) return null;
  const raw = (await readFile(BASELINE_FILE, 'utf8')).trim();
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

const hits = await countAsAny();
const total = hits.reduce((sum, h) => sum + h.count, 0);

if (UPDATE) {
  await writeFile(BASELINE_FILE, `${total}\n`, 'utf8');
  console.log(`[check-as-any] baseline regravada: ${total}`);
  process.exit(0);
}

const baseline = await readBaseline();
if (baseline === null) {
  console.error('[check-as-any] .as-any-baseline ausente. Gere com: pnpm baseline:asany');
  process.exit(1);
}

console.log(`[check-as-any] ocorrencias atuais: ${total}, baseline: ${baseline}`);
if (total > baseline) {
  console.error(`[check-as-any] FALHA: ${total - baseline} nova(s) ocorrencia(s) de "as any" alem do baseline.`);
  for (const h of hits) console.error(`  - ${h.file}: ${h.count}`);
  console.error('\nResolva os "as any" novos ou justifique no PR e atualize com: pnpm baseline:asany');
  process.exit(1);
}
if (total < baseline) {
  console.warn(`[check-as-any] AVISO: ${baseline - total} ocorrencia(s) abaixo do baseline.`);
  console.warn(`Aproveite e baixe o baseline: pnpm baseline:asany`);
}
