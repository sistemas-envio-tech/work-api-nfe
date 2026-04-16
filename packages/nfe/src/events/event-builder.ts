import { XmlBuilder, type XmlObject } from '@acbr-node/core';
import { NFE_NAMESPACE, NFE_VERSAO } from '../types/nfe.js';

/**
 * Monta envelope completo envEvento com eventos assinados dentro
 *
 * Usa string concatenation para preservar assinatura digital dos eventos
 */
export function buildEnvEventoXml(
  signedEventosXmls: string[],
  idLote: string
): string {
  const eventosConcat = signedEventosXmls
    .map(xml => xml.replace(/<\?xml[^?]*\?>\s*/g, ''))
    .join('');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<envEvento xmlns="${NFE_NAMESPACE}" versao="${NFE_VERSAO}">`,
    `<idLote>${idLote}</idLote>`,
    eventosConcat,
    '</envEvento>',
  ].join('');
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
