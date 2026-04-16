import type { XmlObject } from '@acbr-node/core';
import { buildEventoXml } from './event-builder.js';
import { TipoEvento } from '../types/enums.js';

export interface CancelamentoParams {
  cOrgao: number;
  tpAmb: number;
  CNPJ: string;
  chNFe: string;
  dhEvento: string;
  nProt: string;
  xJust: string;
  nSeqEvento?: number;
}

/**
 * Monta XML do evento de cancelamento (tpEvento=110111)
 */
export function buildCancelamentoXml(params: CancelamentoParams): string {
  const detEvento: XmlObject = {
    descEvento: 'Cancelamento',
    nProt: params.nProt,
    xJust: params.xJust,
  };

  return buildEventoXml({
    cOrgao: params.cOrgao,
    tpAmb: params.tpAmb,
    CNPJ: params.CNPJ,
    chNFe: params.chNFe,
    dhEvento: params.dhEvento,
    tpEvento: TipoEvento.CANCELAMENTO,
    nSeqEvento: params.nSeqEvento ?? 1,
    detEvento,
  });
}
