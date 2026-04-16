/**
 * Constrói envelope SOAP 1.2 para comunicação com SEFAZ
 *
 * NFe v4.00 usa SOAP 1.2 (namespace http://www.w3.org/2003/05/soap-envelope)
 * com content-type application/soap+xml
 */
export function buildSoapEnvelope(body: string, nfeDadosMsg: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    ' xmlns:xsd="http://www.w3.org/2001/XMLSchema"',
    ' xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
    '<soap12:Body>',
    `<nfeDadosMsg xmlns="${nfeDadosMsg}">`,
    body,
    '</nfeDadosMsg>',
    '</soap12:Body>',
    '</soap12:Envelope>',
  ].join('');
}

/**
 * Namespace WSDL por serviço
 */
export const WSDL_NAMESPACES: Record<string, string> = {
  NFeAutorizacao4: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4',
  NFeRetAutorizacao4: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRetAutorizacao4',
  NFeConsultaProtocolo4: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4',
  NFeStatusServico4: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4',
  NFeInutilizacao4: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeInutilizacao4',
  RecepcaoEvento4: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4',
  NFeConsultaCadastro4: 'http://www.portalfiscal.inf.br/nfe/wsdl/CadConsultaCadastro4',
  NFeDistribuicaoDFe: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe',
};
