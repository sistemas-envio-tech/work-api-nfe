import { XmlBuilder } from '@acbr-node/core';

const DIST_DFE_NAMESPACE = 'http://www.portalfiscal.inf.br/nfe';
const DIST_DFE_VERSAO = '1.01';

export interface DistribuicaoDFeParams {
  tpAmb: number;
  /** CNPJ do interessado */
  CNPJ?: string;
  /** CPF do interessado */
  CPF?: string;
  /** Código da UF do autor */
  cUFAutor: number;
  /** Consultar por último NSU recebido */
  distNSU?: string;
  /** Consultar NSU específico */
  consNSU?: string;
  /** Consultar por chave de acesso */
  chNFe?: string;
}

/**
 * Monta XML de consulta Distribuição DFe (serviço AN nacional)
 *
 * Três modos de consulta:
 * - distNSU: retorna documentos a partir de um NSU (paginação)
 * - consNSU: consulta um NSU específico
 * - chNFe: consulta por chave de acesso
 */
export function buildDistDFeXml(params: DistribuicaoDFeParams): string {
  const distDFeInt: Record<string, unknown> = {
    '@versao': DIST_DFE_VERSAO,
    '@xmlns': DIST_DFE_NAMESPACE,
    tpAmb: String(params.tpAmb),
    cUFAutor: String(params.cUFAutor),
  };

  if (params.CNPJ) distDFeInt.CNPJ = params.CNPJ;
  else if (params.CPF) distDFeInt.CPF = params.CPF;

  if (params.distNSU !== undefined) {
    distDFeInt.distNSU = {
      ultNSU: params.distNSU.padStart(15, '0'),
    };
  } else if (params.consNSU !== undefined) {
    distDFeInt.consNSU = {
      NSU: params.consNSU.padStart(15, '0'),
    };
  } else if (params.chNFe) {
    distDFeInt.consChNFe = {
      chNFe: params.chNFe,
    };
  }

  return XmlBuilder.build('distDFeInt', distDFeInt, DIST_DFE_NAMESPACE);
}
