#!/usr/bin/env node
// Lint estrutural para http-api/src/routes/.
//
// Regras (espelha lint:routes do work-manager):
//   1. Cada arquivo em routes/ deve exportar um identificador `*Router`
//      tipado como ExpressRouter (convenção: `<recurso>Router`).
//   2. Cada arquivo deve ter pelo menos uma chamada `<router>.get|post|put|patch|delete`.
//   3. health.ts e exceção (não há `*Router` exportado obrigatório? — na verdade
//      tem, é o `healthRouter`. Mantemos a regra para todos).
//
// Falha (exit 1) se alguma regra for violada.

import { readdir, readFile } from 'node:fs/promises';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ROUTES_DIR = join(ROOT, 'packages/http-api/src/routes');

const violations = [];

const files = (await readdir(ROUTES_DIR)).filter((f) => f.endsWith('.ts'));

for (const file of files) {
  const content = await readFile(join(ROUTES_DIR, file), 'utf8');
  const rel = `packages/http-api/src/routes/${file}`;

  // Regra 1: tem `export const <algo>Router`
  const routerExport = /export\s+const\s+(\w+Router)\s*:\s*ExpressRouter/.exec(content);
  if (!routerExport) {
    violations.push(`${rel}: falta export const <nome>Router: ExpressRouter`);
    continue;
  }
  const routerName = routerExport[1];

  // Regra 2: tem pelo menos um <routerName>.<verb>(...)
  const verbPattern = new RegExp(`\\b${routerName}\\.(get|post|put|patch|delete)\\s*\\(`);
  if (!verbPattern.test(content)) {
    violations.push(`${rel}: ${routerName} declarado mas sem rotas registradas (router.get/post/etc).`);
  }

  // Regra 3 (sanidade): nome do router bate com o nome do arquivo (kebab → camel + Router)
  const expected = basename(file, '.ts')
    .replace(/-([a-z])/g, (_, c) => c.toUpperCase()) + 'Router';
  if (routerName !== expected) {
    violations.push(`${rel}: convencao de nome — esperado "${expected}", encontrado "${routerName}".`);
  }
}

if (violations.length > 0) {
  console.error('[check:routes] FALHA:');
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log(`[check:routes] OK — ${files.length} rota(s) verificadas.`);
