import { XmlParser } from '@acbr-node/core';

const parser = new XmlParser();

export interface InfCadConsulta {
  IE: string;
  CNPJ?: string;
  CPF?: string;
  UF: string;
  cSit: string;
  indCredNFe?: string;
  indCredCTe?: string;
  xNome: string;
  xFant?: string;
  xRegApur?: string;
  CNAE?: string;
  dIniAtiv?: string;
  dUltSit?: string;
  dBaixa?: string;
  ender?: {
    xLgr?: string;
    nro?: string;
    xCpl?: string;
    xBairro?: string;
    cMun?: string;
    xMun?: string;
    CEP?: string;
  };
}

export interface RetornoConsultaCadastro {
  verAplic: string;
  cStat: string;
  xMotivo: string;
  UF: string;
  infCad: InfCadConsulta[];
}

/**
 * Parse da resposta de Consulta Cadastro
 */
export function parseConsultaCadastro(soapXml: string): RetornoConsultaCadastro {
  const body = parser.parseSoapResponse(soapXml);
  // Navigate: body > nfeResultMsg > retConsCad (or directly body > retConsCad)
  const resultMsg = findDeep(body, 'nfeResultMsg') || body;
  const resp = findDeep(resultMsg, 'retConsCad') || resultMsg;
  const infCons = findDeep(resp, 'infCons') || resp;

  const infCadRaw = findDeep(infCons, 'infCad');
  const infCadArr = infCadRaw
    ? (Array.isArray(infCadRaw) ? infCadRaw : [infCadRaw])
    : [];

  return {
    verAplic: String(findDeep(infCons, 'verAplic') ?? ''),
    cStat: String(findDeep(infCons, 'cStat') ?? ''),
    xMotivo: String(findDeep(infCons, 'xMotivo') ?? ''),
    UF: String(findDeep(infCons, 'UF') ?? ''),
    infCad: infCadArr.map((c: any) => ({
      IE: String(c.IE ?? ''),
      CNPJ: c.CNPJ ? String(c.CNPJ) : undefined,
      CPF: c.CPF ? String(c.CPF) : undefined,
      UF: String(c.UF ?? ''),
      cSit: String(c.cSit ?? ''),
      indCredNFe: c.indCredNFe ? String(c.indCredNFe) : undefined,
      indCredCTe: c.indCredCTe ? String(c.indCredCTe) : undefined,
      xNome: String(c.xNome ?? ''),
      xFant: c.xFant ? String(c.xFant) : undefined,
      xRegApur: c.xRegApur ? String(c.xRegApur) : undefined,
      CNAE: c.CNAE ? String(c.CNAE) : undefined,
      dIniAtiv: c.dIniAtiv ? String(c.dIniAtiv) : undefined,
      dUltSit: c.dUltSit ? String(c.dUltSit) : undefined,
      dBaixa: c.dBaixa ? String(c.dBaixa) : undefined,
      ender: c.ender ? {
        xLgr: c.ender.xLgr ? String(c.ender.xLgr) : undefined,
        nro: c.ender.nro ? String(c.ender.nro) : undefined,
        xCpl: c.ender.xCpl ? String(c.ender.xCpl) : undefined,
        xBairro: c.ender.xBairro ? String(c.ender.xBairro) : undefined,
        cMun: c.ender.cMun ? String(c.ender.cMun) : undefined,
        xMun: c.ender.xMun ? String(c.ender.xMun) : undefined,
        CEP: c.ender.CEP ? String(c.ender.CEP) : undefined,
      } : undefined,
    })),
  };
}

function findDeep(obj: any, key: string): any {
  if (!obj || typeof obj !== 'object') return undefined;
  if (Array.isArray(obj)) obj = obj[0];
  if (key in obj) return obj[key];
  for (const k of Object.keys(obj)) {
    const local = k.includes(':') ? k.split(':').pop() : k;
    if (local === key) return obj[k];
  }
  return undefined;
}
