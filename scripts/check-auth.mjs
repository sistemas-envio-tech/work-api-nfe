#!/usr/bin/env node
// Lint estrutural para garantir que toda rota do http-api passa pelo authMiddleware.
//
// Adapta o lint:rota-acl do work-manager. Como auth eh aplicado globalmente
// no index.ts (`app.use(authMiddleware)`) antes dos `app.use('/<rota>', ...)`,
// a regra mecanica eh: no index.ts, a linha que chama app.use(authMiddleware)
// deve aparecer ANTES da primeira rota nominal (`app.use('/...')`).
//
// Failure modes:
//   - authMiddleware nao importado
//   - app.use(authMiddleware) ausente
//   - app.use(authMiddleware) aparece DEPOIS de alguma rota nominal
//
// /health e auto-bypass dentro do authMiddleware (req.path === '/health'),
// entao mesmo /health passa pelo middleware (apenas pula a verificacao do token).

import { readFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const INDEX_PATH = join(ROOT, 'packages/http-api/src/index.ts');

const content = await readFile(INDEX_PATH, 'utf8');
const lines = content.split('\n');

// Regra 1: authMiddleware deve ser importado
if (!/import\s+{[^}]*\bauthMiddleware\b[^}]*}\s+from/.test(content)) {
  console.error('[check:auth] FALHA: authMiddleware nao importado em packages/http-api/src/index.ts');
  process.exit(1);
}

// Regras 2 e 3: app.use(authMiddleware) deve existir e vir antes de qualquer app.use('/...')
let authLine = -1;
let firstRouteLine = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (authLine === -1 && /app\.use\s*\(\s*authMiddleware\s*\)/.test(line)) {
    authLine = i;
  }
  if (firstRouteLine === -1 && /app\.use\s*\(\s*['"]\/[^'"]/.test(line)) {
    firstRouteLine = i;
  }
}

if (authLine === -1) {
  console.error('[check:auth] FALHA: app.use(authMiddleware) ausente em index.ts.');
  console.error('  Sem ele, todas as rotas ficam abertas — violacao do contrato de seguranca.');
  process.exit(1);
}

if (firstRouteLine !== -1 && authLine > firstRouteLine) {
  console.error('[check:auth] FALHA: app.use(authMiddleware) declarado na linha', authLine + 1,
    'mas a primeira rota (`app.use("/...")`)  e na linha', firstRouteLine + 1, '.');
  console.error('  Mova authMiddleware para ANTES de qualquer rota nominal.');
  process.exit(1);
}

console.log(`[check:auth] OK — authMiddleware na linha ${authLine + 1}, primeira rota na linha ${firstRouteLine + 1}.`);
