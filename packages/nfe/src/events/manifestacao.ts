import type { XmlObject } from '@acbr-node/core';
import { buildEventoXml } from './event-builder.js';
import { TipoEvento } from '../types/enums.js';

export type TipoManifestacao =
  | 'ciencia'
  | 'confirmacao'
  | 'desconhecimento'
  | 'nao_realizada';

const MANIFESTACAO_MAP: Record<TipoManifestacao, { tpEvento: string; descEvento: string }> = {
  ciencia: {
    tpEvento: TipoEvento.MANIFESTACAO_CIENCIA,
    descEvento: 'Ciencia da Operacao',
  },
  confirmacao: {
    tpEvento: TipoEvento.MANIFESTACAO_CONFIRMACAO,
    descEvento: 'Confirmacao da Operacao',
  },
  desconhecimento: {
    tpEvento: TipoEvento.MANIFESTACAO_DESCONHECIMENTO,
    descEvento: 'Desconhecimento da Operacao',
  },
  nao_realizada: {
    tpEvento: TipoEvento.MANIFESTACAO_NAO_REALIZADA,
    descEvento: 'Operacao nao Realizada',
  },
};

export interface ManifestacaoParams {
  tpAmb: number;
  CNPJ: string;
  chNFe: string;
  dhEvento: string;
  tipo: TipoManifestacao;
  /** Justificativa (obrigatória para 'nao_realizada') */
  xJust?: string;
}

/**
 * Monta XML de evento de Manifestação do Destinatário
 *
 * Tipos:
 * - ciencia (210210): ciência da existência da NFe
 * - confirmacao (210200): confirma a operação
 * - desconhecimento (210220): desconhece a operação
 * - nao_realizada (210240): operação não realizada (requer justificativa)
 */
export function buildManifestacaoXml(params: ManifestacaoParams): string {
  const { tpEvento, descEvento } = MANIFESTACAO_MAP[params.tipo];

  const detEvento: XmlObject = {
    descEvento,
  };

  if (params.xJust) {
    detEvento.xJust = params.xJust;
  }

  // cOrgao = 91 para manifestação (AN - Ambiente Nacional)
  return buildEventoXml({
    cOrgao: 91,
    tpAmb: params.tpAmb,
    CNPJ: params.CNPJ,
    chNFe: params.chNFe,
    dhEvento: params.dhEvento,
    tpEvento,
    nSeqEvento: 1,
    detEvento,
  });
}
