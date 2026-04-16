/** Protocolo de autorização */
export interface ProtocoloNFe {
  tpAmb: string;
  verAplic: string;
  chNFe: string;
  dhRecbto: string;
  nProt: string;
  digVal: string;
  cStat: string;
  xMotivo: string;
}

/** Retorno da autorização */
export interface RetornoAutorizacao {
  tpAmb: string;
  verAplic: string;
  cStat: string;
  xMotivo: string;
  cUF: string;
  dhRecbto?: string;
  /** Protocolo (modo síncrono) */
  protNFe?: ProtocoloNFe;
  /** Número do recibo (modo assíncrono) */
  nRec?: string;
  /** XML autorizado (nfeProc) */
  xmlAutorizado?: string;
}

/** Retorno da consulta de protocolo */
export interface RetornoConsultaProtocolo {
  tpAmb: string;
  verAplic: string;
  cStat: string;
  xMotivo: string;
  cUF: string;
  protNFe?: ProtocoloNFe;
}

/** Retorno do status do serviço */
export interface RetornoStatusServico {
  tpAmb: string;
  verAplic: string;
  cStat: string;
  xMotivo: string;
  cUF: string;
  dhRecbto: string;
  /** Tempo médio de resposta em segundos */
  tMed: string;
  dhRetorno?: string;
  xObs?: string;
}

/** Retorno da inutilização */
export interface RetornoInutilizacao {
  tpAmb: string;
  verAplic: string;
  cStat: string;
  xMotivo: string;
  cUF: string;
  ano: string;
  CNPJ: string;
  mod: string;
  serie: string;
  nNFIni: string;
  nNFFin: string;
  dhRecbto: string;
  nProt?: string;
}

/** Retorno de evento (cancelamento, CCe) */
export interface RetornoEvento {
  tpAmb: string;
  verAplic: string;
  cOrgao: string;
  cStat: string;
  xMotivo: string;
  chNFe: string;
  tpEvento: string;
  xEvento: string;
  nSeqEvento: string;
  dhRegEvento: string;
  nProt?: string;
}

/** Retorno da consulta de recibo (async) */
export interface RetornoConsultaRecibo {
  tpAmb: string;
  verAplic: string;
  nRec: string;
  cStat: string;
  xMotivo: string;
  cUF: string;
  protNFe?: ProtocoloNFe[];
}
