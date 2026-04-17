import { XmlParser } from '@acbr-node/core';
import { Buffer } from 'node:buffer';
import { gunzipSync } from 'node:zlib';

const parser = new XmlParser();

export interface DocZipDFe {
  /** Número Sequencial Único */
  NSU: string;
  /** Schema do documento (ex: resNFe_v1.01.xsd, procNFe_v4.00.xsd) */
  schema: string;
  /** XML do documento (descompactado do gzip) */
  xml: string;
}

export interface RetornoDistribuicaoDFe {
  tpAmb: string;
  verAplic: string;
  cStat: string;
  xMotivo: string;
  dhResp: string;
  ultNSU: string;
  maxNSU: string;
  /** Documentos retornados (já descompactados) */
  docs: DocZipDFe[];
}

/**
 * Parse da resposta de Distribuição DFe
 *
 * Os documentos vêm compactados em gzip/base64 dentro de <docZip>
 */
export function parseDistribuicaoDFe(soapXml: string): RetornoDistribuicaoDFe {
  const body = parser.parseSoapResponse(soapXml);
  // Navigate: body > nfeResultMsg > retDistDFeInt (or directly body > retDistDFeInt)
  const resultMsg = findDeep(body, 'nfeResultMsg') || body;
  const resp = findDeep(resultMsg, 'retDistDFeInt') || resultMsg;

  const loteDistDFeInt = findDeep(resp, 'loteDistDFeInt');
  const docs: DocZipDFe[] = [];

  if (loteDistDFeInt) {
    const docZips = findDeep(loteDistDFeInt, 'docZip');
    const docArr = docZips
      ? (Array.isArray(docZips) ? docZips : [docZips])
      : [];

    for (const doc of docArr) {
      try {
        const nsu = doc['@_NSU'] || doc['@_nsu'] || '';
        const schema = doc['@_schema'] || '';
        const compressedBase64 = typeof doc === 'string' ? doc : (doc['#text'] || '');

        if (compressedBase64) {
          const xml = decompressGzip(compressedBase64);
          docs.push({ NSU: String(nsu), schema: String(schema), xml });
        }
      } catch {
        // Skip malformed docs
      }
    }
  }

  return {
    tpAmb: String(findDeep(resp, 'tpAmb') ?? ''),
    verAplic: String(findDeep(resp, 'verAplic') ?? ''),
    cStat: String(findDeep(resp, 'cStat') ?? ''),
    xMotivo: String(findDeep(resp, 'xMotivo') ?? ''),
    dhResp: String(findDeep(resp, 'dhResp') ?? ''),
    ultNSU: String(findDeep(resp, 'ultNSU') ?? ''),
    maxNSU: String(findDeep(resp, 'maxNSU') ?? ''),
    docs,
  };
}

/**
 * Descompacta conteúdo gzip em base64
 */
function decompressGzip(base64Content: string): string {
  const compressed = Buffer.from(base64Content, 'base64');
  const decompressed = gunzipSync(compressed);
  return decompressed.toString('utf-8');
}

function findDeep(obj: any, key: string): any {
  if (!obj || typeof obj !== 'object') return undefined;
  if (Array.isArray(obj)) obj = obj[0];
  // Primeiro, procura no nivel atual (match direto ou por local-name de ns prefixado)
  for (const k of Object.keys(obj)) {
    const local = k.includes(':') ? k.split(':').pop() : k;
    if (k === key || local === key) return obj[k];
  }
  // Recursa em filhos (wrapper da operacao pode aninhar varios niveis:
  // nfeDistDFeInteresseResponse > nfeDistDFeInteresseResult > retDistDFeInt).
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v && typeof v === 'object') {
      const found = findDeep(v, key);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}
