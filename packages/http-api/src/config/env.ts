import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const candidates = [
  path.resolve(__dirname, '../../../../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
];

for (const p of candidates) {
  dotenv.config({ path: p });
  if (process.env.INTERNAL_TOKEN) break;
}

export const env = {
  host: process.env.HTTP_API_HOST || '0.0.0.0',
  // Railway (e a maioria das PaaS) injeta a porta via PORT — o healthcheck
  // bate nessa porta. HTTP_API_PORT fica como override pra dev local.
  port: parseInt(process.env.PORT || process.env.HTTP_API_PORT || '3002', 10),
  internalToken: process.env.INTERNAL_TOKEN || '',
  logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  logXml: process.env.LOG_XML === 'true',
  // Em dev, Node pode nao ter a cadeia ICP-Brasil no truststore e SEFAZ
  // rejeitar com "unable to get local issuer certificate". Setar pra true
  // APENAS em dev; em prod use NODE_EXTRA_CA_CERTS com o bundle ICP-Brasil.
  insecureTls: process.env.NFE_API_INSECURE_TLS === 'true',
};
