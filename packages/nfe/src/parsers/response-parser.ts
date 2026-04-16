import { XmlParser } from '@acbr-node/core';
import type {
  RetornoAutorizacao, RetornoStatusServico, RetornoConsultaProtocolo,
  RetornoInutilizacao, RetornoEvento, RetornoConsultaRecibo, ProtocoloNFe,
} from '../types/retorno.js';

const parser = new XmlParser();

/**
 * Extrai valor de um campo em qualquer nível, ignorando namespaces
 */
function extract(obj: any, ...keys: string[]): any {
  for (const key of keys) {
    if (obj === null || obj === undefined) return undefined;

    // Se for array, pegar o primeiro elemento
    if (Array.isArray(obj)) {
      obj = obj[0];
      if (obj === null || obj === undefined) return undefined;
    }

    if (key in obj) {
      obj = obj[key];
    } else {
      // Buscar ignorando namespace prefix
      const found = Object.keys(obj).find(k => {
        const local = k.includes(':') ? k.split(':').pop() : k;
        return local === key;
      });
      if (found) {
        obj = obj[found];
      } else {
        return undefined;
      }
    }
  }
  // Se resultado final for array, pegar primeiro elemento
  if (Array.isArray(obj)) obj = obj[0];
  return obj;
}

/**
 * Navega até o body do SOAP e pega o primeiro filho do nfeDadosMsg/nfeResultMsg
 */
function extractSefazResponse(soapXml: string): any {
  const body = parser.parseSoapResponse(soapXml);

  // O conteúdo pode estar em nfeResultMsg ou diretamente no body
  const resultMsg = extract(body, 'nfeResultMsg') || body;

  // Pegar o primeiro filho que contenha 'ret' ou 'proc'
  if (typeof resultMsg === 'object') {
    for (const key of Object.keys(resultMsg)) {
      if (key.startsWith('@')) continue;
      if (key.startsWith('ret') || key.startsWith('proc') || key.startsWith('infInut')) {
        return resultMsg[key];
      }
    }
  }

  return resultMsg;
}

export function parseStatusServico(soapXml: string): RetornoStatusServico {
  const resp = extractSefazResponse(soapXml);
  return {
    tpAmb: String(extract(resp, 'tpAmb') ?? ''),
    verAplic: String(extract(resp, 'verAplic') ?? ''),
    cStat: String(extract(resp, 'cStat') ?? ''),
    xMotivo: String(extract(resp, 'xMotivo') ?? ''),
    cUF: String(extract(resp, 'cUF') ?? ''),
    dhRecbto: String(extract(resp, 'dhRecbto') ?? ''),
    tMed: String(extract(resp, 'tMed') ?? ''),
    dhRetorno: extract(resp, 'dhRetorno') ? String(extract(resp, 'dhRetorno')) : undefined,
    xObs: extract(resp, 'xObs') ? String(extract(resp, 'xObs')) : undefined,
  };
}

export function parseAutorizacao(soapXml: string): RetornoAutorizacao {
  const resp = extractSefazResponse(soapXml);

  const result: RetornoAutorizacao = {
    tpAmb: String(extract(resp, 'tpAmb') ?? ''),
    verAplic: String(extract(resp, 'verAplic') ?? ''),
    cStat: String(extract(resp, 'cStat') ?? ''),
    xMotivo: String(extract(resp, 'xMotivo') ?? ''),
    cUF: String(extract(resp, 'cUF') ?? ''),
    dhRecbto: extract(resp, 'dhRecbto') ? String(extract(resp, 'dhRecbto')) : undefined,
  };

  // Modo síncrono: protNFe presente diretamente
  const protNFe = extract(resp, 'protNFe');
  if (protNFe) {
    result.protNFe = parseProtocolo(protNFe);
  }

  // Modo assíncrono: nRec presente
  const nRec = extract(resp, 'nRec');
  if (nRec) {
    result.nRec = String(nRec);
  }

  return result;
}

export function parseConsultaProtocolo(soapXml: string): RetornoConsultaProtocolo {
  const resp = extractSefazResponse(soapXml);

  const result: RetornoConsultaProtocolo = {
    tpAmb: String(extract(resp, 'tpAmb') ?? ''),
    verAplic: String(extract(resp, 'verAplic') ?? ''),
    cStat: String(extract(resp, 'cStat') ?? ''),
    xMotivo: String(extract(resp, 'xMotivo') ?? ''),
    cUF: String(extract(resp, 'cUF') ?? ''),
  };

  const protNFe = extract(resp, 'protNFe');
  if (protNFe) {
    result.protNFe = parseProtocolo(protNFe);
  }

  return result;
}

export function parseInutilizacao(soapXml: string): RetornoInutilizacao {
  const resp = extractSefazResponse(soapXml);
  const infInut = extract(resp, 'infInut') || resp;

  return {
    tpAmb: String(extract(infInut, 'tpAmb') ?? ''),
    verAplic: String(extract(infInut, 'verAplic') ?? ''),
    cStat: String(extract(infInut, 'cStat') ?? ''),
    xMotivo: String(extract(infInut, 'xMotivo') ?? ''),
    cUF: String(extract(infInut, 'cUF') ?? ''),
    ano: String(extract(infInut, 'ano') ?? ''),
    CNPJ: String(extract(infInut, 'CNPJ') ?? ''),
    mod: String(extract(infInut, 'mod') ?? ''),
    serie: String(extract(infInut, 'serie') ?? ''),
    nNFIni: String(extract(infInut, 'nNFIni') ?? ''),
    nNFFin: String(extract(infInut, 'nNFFin') ?? ''),
    dhRecbto: String(extract(infInut, 'dhRecbto') ?? ''),
    nProt: extract(infInut, 'nProt') ? String(extract(infInut, 'nProt')) : undefined,
  };
}

export function parseEvento(soapXml: string): RetornoEvento {
  const resp = extractSefazResponse(soapXml);

  // retEnvEvento > retEvento > infEvento
  const retEvento = extract(resp, 'retEvento');
  const infEvento = retEvento
    ? extract(Array.isArray(retEvento) ? retEvento[0] : retEvento, 'infEvento')
    : extract(resp, 'infEvento') || resp;

  return {
    tpAmb: String(extract(infEvento, 'tpAmb') ?? ''),
    verAplic: String(extract(infEvento, 'verAplic') ?? ''),
    cOrgao: String(extract(infEvento, 'cOrgao') ?? ''),
    cStat: String(extract(infEvento, 'cStat') ?? ''),
    xMotivo: String(extract(infEvento, 'xMotivo') ?? ''),
    chNFe: String(extract(infEvento, 'chNFe') ?? ''),
    tpEvento: String(extract(infEvento, 'tpEvento') ?? ''),
    xEvento: String(extract(infEvento, 'xEvento') ?? ''),
    nSeqEvento: String(extract(infEvento, 'nSeqEvento') ?? ''),
    dhRegEvento: String(extract(infEvento, 'dhRegEvento') ?? ''),
    nProt: extract(infEvento, 'nProt') ? String(extract(infEvento, 'nProt')) : undefined,
  };
}

export function parseConsultaRecibo(soapXml: string): RetornoConsultaRecibo {
  const resp = extractSefazResponse(soapXml);

  const result: RetornoConsultaRecibo = {
    tpAmb: String(extract(resp, 'tpAmb') ?? ''),
    verAplic: String(extract(resp, 'verAplic') ?? ''),
    nRec: String(extract(resp, 'nRec') ?? ''),
    cStat: String(extract(resp, 'cStat') ?? ''),
    xMotivo: String(extract(resp, 'xMotivo') ?? ''),
    cUF: String(extract(resp, 'cUF') ?? ''),
  };

  const protNFe = extract(resp, 'protNFe');
  if (protNFe) {
    const protos = Array.isArray(protNFe) ? protNFe : [protNFe];
    result.protNFe = protos.map(parseProtocolo);
  }

  return result;
}

function parseProtocolo(proto: any): ProtocoloNFe {
  const infProt = extract(proto, 'infProt') || proto;
  return {
    tpAmb: String(extract(infProt, 'tpAmb') ?? ''),
    verAplic: String(extract(infProt, 'verAplic') ?? ''),
    chNFe: String(extract(infProt, 'chNFe') ?? ''),
    dhRecbto: String(extract(infProt, 'dhRecbto') ?? ''),
    nProt: String(extract(infProt, 'nProt') ?? ''),
    digVal: String(extract(infProt, 'digVal') ?? ''),
    cStat: String(extract(infProt, 'cStat') ?? ''),
    xMotivo: String(extract(infProt, 'xMotivo') ?? ''),
  };
}
