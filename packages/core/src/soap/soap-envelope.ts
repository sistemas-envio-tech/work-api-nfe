/**
 * Constrói envelope SOAP 1.2 para comunicação com SEFAZ
 *
 * NFe v4.00 usa SOAP 1.2 (namespace http://www.w3.org/2003/05/soap-envelope)
 * com content-type application/soap+xml
 */
/**
 * Monta envelope SOAP 1.2 para SEFAZ.
 *
 * Estrutura exigida pelos WSDLs NFe 4.00:
 *   <soap12:Body>
 *     <{operationName} xmlns="{wsdlNamespace}">   ← wrapper da operacao
 *       <nfeDadosMsg>
 *         {body}                                   ← payload assinado / mensagem
 *       </nfeDadosMsg>
 *     </{operationName}>
 *   </soap12:Body>
 *
 * @param body         Conteudo da mensagem (ex: distDFeInt). Sem prolog XML.
 * @param wsdlNamespace URI do WSDL do servico (xmlns da operacao).
 * @param operationName Nome do elemento wrapper (ex: nfeDistDFeInteresse).
 *                      Se omitido, usa apenas nfeDadosMsg como wrapper (legado).
 */
export function buildSoapEnvelope(body: string, wsdlNamespace: string, operationName?: string): string {
  // Remove prolog <?xml ... ?> do body — SEFAZ rejeita se houver duas decls.
  const innerBody = body.replace(/^\s*<\?xml[^>]*\?>\s*/i, '');
  const parts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    ' xmlns:xsd="http://www.w3.org/2001/XMLSchema"',
    ' xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
    '<soap12:Body>',
  ];
  if (operationName) {
    parts.push(`<${operationName} xmlns="${wsdlNamespace}">`);
    parts.push('<nfeDadosMsg>');
    parts.push(innerBody);
    parts.push('</nfeDadosMsg>');
    parts.push(`</${operationName}>`);
  } else {
    parts.push(`<nfeDadosMsg xmlns="${wsdlNamespace}">`);
    parts.push(innerBody);
    parts.push('</nfeDadosMsg>');
  }
  parts.push('</soap12:Body>');
  parts.push('</soap12:Envelope>');
  return parts.join('');
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
