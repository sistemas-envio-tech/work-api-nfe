import { XmlBuilder, type XmlObject } from '@acbr-node/core';
import { NFE_NAMESPACE } from '../types/nfe.js';

/**
 * Versao do schema de Eventos NFe (cancelamento, CCe, manifestacao, EPEC, etc).
 *
 * **NAO confundir com `NFE_VERSAO` (4.00) — essa e a versao da NFe normal.**
 * Eventos tem schema PROPRIO (`leiauteEvento_v1.00.xsd`,
 * `leiauteEventoCancNFe_v1.00.xsd`, etc.) que exigem `versao="1.00"` nos
 * atributos `evento/@versao`, `envEvento/@versao`, `verEvento`, e
 * `detEvento/@versao`. O XSD define `TVerEvento`/`TVerEnvEvento` com
 * pattern fixo `1\.00`.
 *
 * Antes esse builder usava `NFE_VERSAO` (4.00), causando rejeicao SEFAZ
 * "2254 - Falha na validacao de esquema XML" em todo cancelamento e CCe.
 * Incidente real 2026-05-19 — diagnostico via validacao local contra
 * `leiauteEventoCancNFe_v1.00.xsd`.
 */
const EVENTO_VERSAO = '1.00';

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
    `<envEvento xmlns="${NFE_NAMESPACE}" versao="${EVENTO_VERSAO}">`,
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
    '@versao': EVENTO_VERSAO,
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
      verEvento: EVENTO_VERSAO,
      detEvento: {
        '@versao': EVENTO_VERSAO,
        ...detEvento,
      },
    },
  }, NFE_NAMESPACE);
}
