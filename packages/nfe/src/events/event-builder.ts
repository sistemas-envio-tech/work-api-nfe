import { XmlBuilder, type XmlObject } from '@acbr-node/core';
import { NFE_NAMESPACE, NFE_VERSAO } from '../types/nfe.js';

/**
 * Monta envelope genérico de evento NFe
 */
export function buildEnvEventoXml(
  eventos: string[],
  idLote: string
): string {
  // Eventos já assinados são inseridos via raw XML
  const envEvento: XmlObject = {
    '@versao': NFE_VERSAO,
    '@xmlns': NFE_NAMESPACE,
    idLote,
  };

  return XmlBuilder.build('envEvento', envEvento, NFE_NAMESPACE);
}

/**
 * Monta XML de um evento individual (antes de assinar)
 */
export function buildEventoXml(params: {
  cOrgao: number;
  tpAmb: number;
  CNPJ: string;
  chNFe: string;
  dhEvento: string;
  tpEvento: string;
  nSeqEvento: number;
  detEvento: XmlObject;
}): string {
  const { cOrgao, tpAmb, CNPJ, chNFe, dhEvento, tpEvento, nSeqEvento, detEvento } = params;

  const id = `ID${tpEvento}${chNFe}${String(nSeqEvento).padStart(2, '0')}`;

  return XmlBuilder.build('evento', {
    '@versao': NFE_VERSAO,
    '@xmlns': NFE_NAMESPACE,
    infEvento: {
      '@Id': id,
      cOrgao: String(cOrgao),
      tpAmb: String(tpAmb),
      CNPJ,
      chNFe,
      dhEvento,
      tpEvento,
      nSeqEvento: String(nSeqEvento),
      verEvento: NFE_VERSAO,
      detEvento: {
        '@versao': NFE_VERSAO,
        ...detEvento,
      },
    },
  }, NFE_NAMESPACE);
}
