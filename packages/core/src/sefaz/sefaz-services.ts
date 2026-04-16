/**
 * Definições dos serviços web NFe (método SOAP e action)
 */

export interface ServiceDefinition {
  method: string;
  action: string;
}

export const NFE_SERVICES: Record<string, ServiceDefinition> = {
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
};

export type NFeServiceName = keyof typeof NFE_SERVICES;
