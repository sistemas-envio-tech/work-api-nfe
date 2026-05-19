#!/usr/bin/env node
// Garante que o microservice continua stateless por design — sem deps de
// banco de dados, ORM, cache server-side ou message broker.
//
// Estado e responsabilidade do consumer (work-manager). Este servico
// traduz JSON -> SOAP SEFAZ -> JSON e nao mantem nenhuma persistencia.
//
// Verifica deps em TODOS os package.json sob packages/ + root.
// Falha (exit 1) se encontrar qualquer dep da lista FORBIDDEN.

import { readdir, readFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

/**
 * Lista de pacotes proibidos. Inclui o ecossistema mais comum de:
 * - ORMs (Prisma, TypeORM, Sequelize, Mongoose, Drizzle, Kysely, Knex, Mikro-ORM)
 * - Drivers SQL (pg, mysql, mariadb, sqlite, sqlite3, mssql, oracle)
 * - Drivers NoSQL / Cache (mongodb, redis, ioredis, memcached)
 * - Cloud DBs (Neon, Supabase, PlanetScale, DynamoDB)
 * - Message brokers / job queues (amqplib, kafkajs, bullmq, bull, agenda)
 *
 * Se uma dep legitima for adicionada por engano, atualize esta lista no
 * mesmo PR justificando (ex.: usar Redis APENAS pra rate limit nao-persistente).
 */
const FORBIDDEN = new Set([
  // ORMs
  'prisma', '@prisma/client', '@prisma/migrate',
  'typeorm', 'sequelize', 'sequelize-typescript', 'mongoose',
  'drizzle-orm', 'kysely', 'knex', 'objection',
  '@mikro-orm/core', '@mikro-orm/postgresql', '@mikro-orm/mysql', '@mikro-orm/mongodb',
  // SQL drivers
  'pg', 'pg-native', 'pg-promise', 'postgres',
  'mysql', 'mysql2', 'mariadb',
  'sqlite', 'sqlite3', 'better-sqlite3',
  'mssql', 'tedious', 'oracledb',
  // NoSQL drivers
  'mongodb', 'mongojs',
  // Cache servers
  'redis', 'ioredis', '@redis/client', 'memcached', 'memjs',
  // Cloud DBs
  'neon', '@neondatabase/serverless',
  '@supabase/supabase-js',
  '@planetscale/database',
  '@aws-sdk/client-dynamodb', '@aws-sdk/client-rds-data', '@aws-sdk/client-rds',
  // Message brokers / job queues (state externo)
  'amqplib', 'kafkajs', 'rdkafka', 'node-rdkafka',
  'bullmq', 'bull', 'agenda', 'bee-queue',
  // Search engines (state externo)
  '@elastic/elasticsearch', '@opensearch-project/opensearch',
]);

async function findPackageJsons() {
  const result = [join(ROOT, 'package.json')];
  const pkgs = await readdir(join(ROOT, 'packages'));
  for (const pkg of pkgs) {
    result.push(join(ROOT, 'packages', pkg, 'package.json'));
  }
  return result;
}

const violations = [];

for (const pkgPath of await findPackageJsons()) {
  let content;
  try {
    content = JSON.parse(await readFile(pkgPath, 'utf8'));
  } catch {
    continue;
  }
  const rel = pkgPath.replace(ROOT, '').replace(/^[\\/]/, '');
  for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const deps = content[section] || {};
    for (const dep of Object.keys(deps)) {
      if (FORBIDDEN.has(dep)) {
        violations.push(`${rel}: ${section}.${dep} (${deps[dep]})`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error('[check:stateless] FALHA: deps proibidas encontradas:');
  for (const v of violations) console.error(`  - ${v}`);
  console.error('');
  console.error('O work-api-nfe e STATELESS por design — sem banco, sem cache,');
  console.error('sem fila. Persistencia e responsabilidade exclusiva do consumer');
  console.error('(work-manager). Ver "Principios arquiteturais" no README.');
  console.error('');
  console.error('Se a dep e mesmo necessaria, justifique no PR e adicione uma');
  console.error('excecao explicita em scripts/check-stateless.mjs no mesmo commit.');
  process.exit(1);
}

console.log(`[check:stateless] OK — nenhuma dep de DB/ORM/cache/queue encontrada.`);
