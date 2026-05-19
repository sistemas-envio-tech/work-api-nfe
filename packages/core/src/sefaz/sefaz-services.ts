/**
 * Definições dos serviços web NFe (método SOAP e action)
 */

export interface ServiceDefinition {
  method: string;
  action: string;
}

export const NFE_SERVICES: Record<string, ServiceDefinition> = {
  // ── Serviços NF-e (modelo 55) ──
  NFeAutorizacao4: {
    method: 'nfeAutorizacaoLote',
    action: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLote',
  },
  NFeRetAutorizacao4: {
    method: 'nfeRetAutorizacaoLote',
    action: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRetAutorizacao4/nfeRetAutorizacaoLote',
  },
  NFeConsultaProtocolo4: {
    method: 'nfeConsultaNF',
    action: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4/nfeConsultaNF',
  },
  NFeStatusServico4: {
    method: 'nfeStatusServicoNF',
    action: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4/nfeStatusServicoNF',
  },
  NFeInutilizacao4: {
    method: 'nfeInutilizacaoNF',
    action: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeInutilizacao4/nfeInutilizacaoNF',
  },
  RecepcaoEvento4: {
    method: 'nfeRecepcaoEvento',
    action: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4/nfeRecepcaoEvento',
  },
  NFeConsultaCadastro4: {
    method: 'consultaCadastro',
    action: 'http://www.portalfiscal.inf.br/nfe/wsdl/CadConsultaCadastro4/consultaCadastro',
  },
  NFeDistribuicaoDFe: {
    method: 'nfeDistDFeInteresse',
    action: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe/nfeDistDFeInteresse',
  },

  // ── Serviços NFC-e (modelo 65) ──
  // Endpoints SOAP separados dos NF-e. Algumas UFs nao tem servico proprio
  // e usam SVRS-NFCe (ver sefaz-authorizers).
  NFCeAutorizacao4: {
    method: 'nfeAutorizacaoLote',
    action: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLote',
  },
  NFCeRetAutorizacao4: {
    method: 'nfeRetAutorizacaoLote',
    action: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRetAutorizacao4/nfeRetAutorizacaoLote',
  },
  NFCeConsultaProtocolo4: {
    method: 'nfeConsultaNF',
    action: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4/nfeConsultaNF',
  },
  NFCeStatusServico4: {
    method: 'nfeStatusServicoNF',
    action: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4/nfeStatusServicoNF',
  },
  NFCeInutilizacao4: {
    method: 'nfeInutilizacaoNF',
    action: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeInutilizacao4/nfeInutilizacaoNF',
  },
  NFCeRecepcaoEvento4: {
    method: 'nfeRecepcaoEvento',
    action: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4/nfeRecepcaoEvento',
  },
};

export type NFeServiceName = keyof typeof NFE_SERVICES;

/** Modelo de documento fiscal (55=NFe, 65=NFCe). */
export type ModeloDocFiscal = 55 | 65;

/**
 * Mapeia modelo -> nome do servico SOAP correspondente.
 * Os servicos sao tecnicamente o mesmo SOAP (mesma method/action), mas
 * os endpoints HTTP sao diferentes (servicos-nfe.json), o que justifica
 * names separados pro roteamento de URL.
 */
export function servicoParaModelo(
  base: 'Autorizacao' | 'RetAutorizacao' | 'ConsultaProtocolo' | 'StatusServico' | 'Inutilizacao' | 'RecepcaoEvento',
  modelo: ModeloDocFiscal,
): NFeServiceName {
  const prefix = modelo === 65 ? 'NFCe' : 'NFe';
  // RecepcaoEvento e o unico que muda o nome no NFCe (NFCeRecepcaoEvento4 vs RecepcaoEvento4).
  if (base === 'RecepcaoEvento') {
    return (modelo === 65 ? 'NFCeRecepcaoEvento4' : 'RecepcaoEvento4') as NFeServiceName;
  }
  return `${prefix}${base}4` as NFeServiceName;
}
