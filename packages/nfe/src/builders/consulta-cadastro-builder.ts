import { XmlBuilder } from '@acbr-node/core';
import { NFE_NAMESPACE, NFE_VERSAO } from '../types/nfe.js';

export interface ConsultaCadastroParams {
  /** UF do cadastro a consultar */
  UF: string;
  /** Consultar por CNPJ */
  CNPJ?: string;
  /** Consultar por CPF */
  CPF?: string;
  /** Consultar por Inscrição Estadual */
  IE?: string;
}

/**
 * Monta XML de consulta cadastro de contribuinte
 */
export function buildConsCadXml(params: ConsultaCadastroParams): string {
  const infCons: Record<string, unknown> = {
    xServ: 'CONS-CAD',
    UF: params.UF,
  };

  if (params.CNPJ) infCons.CNPJ = params.CNPJ;
  else if (params.CPF) infCons.CPF = params.CPF;
  else if (params.IE) infCons.IE = params.IE;

  return XmlBuilder.build('ConsCad', {
    '@versao': '2.00',
    '@xmlns': NFE_NAMESPACE,
    infCons,
  }, NFE_NAMESPACE);
}
