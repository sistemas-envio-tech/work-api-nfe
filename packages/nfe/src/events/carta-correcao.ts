import type { XmlObject } from '@acbr-node/core';
import { buildEventoXml } from './event-builder.js';
import { TipoEvento } from '../types/enums.js';

export interface CartaCorrecaoParams {
  cOrgao: number;
  tpAmb: number;
  CNPJ: string;
  chNFe: string;
  dhEvento: string;
  xCorrecao: string;
  nSeqEvento: number;
}

const CONDICAO_USO = 'A Carta de Correcao e disciplinada pelo paragrafo 1o-A do art. 7o do Convenio S/N, de 15 de dezembro de 1970 e pode ser utilizada para regularizacao de erro ocorrido na emissao de documento fiscal, desde que o erro nao esteja relacionado com: I - as variaveis que determinam o valor do imposto tais como: base de calculo, aliquota, diferenca de preco, quantidade, valor da operacao ou da prestacao; II - a correcao de dados cadastrais que implique mudanca do remetente ou do destinatario; III - a data de emissao ou de saida.';

/**
 * Monta XML do evento de Carta de Correção (tpEvento=110110)
 */
export function buildCartaCorrecaoXml(params: CartaCorrecaoParams): string {
  const detEvento: XmlObject = {
    descEvento: 'Carta de Correcao',
    xCorrecao: params.xCorrecao,
    xCondUso: CONDICAO_USO,
  };

  return buildEventoXml({
    cOrgao: params.cOrgao,
    tpAmb: params.tpAmb,
    CNPJ: params.CNPJ,
    chNFe: params.chNFe,
    dhEvento: params.dhEvento,
    tpEvento: TipoEvento.CARTA_CORRECAO,
    nSeqEvento: params.nSeqEvento,
    detEvento,
  });
}
