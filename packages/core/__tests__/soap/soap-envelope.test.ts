import { describe, it, expect } from 'vitest';
import { buildSoapEnvelope, WSDL_NAMESPACES } from '../../src/soap/soap-envelope.js';

describe('SOAP Envelope', () => {
  it('should build valid SOAP 1.2 envelope', () => {
    const body = '<consStatServ versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe"><tpAmb>2</tpAmb><cUF>35</cUF><xServ>STATUS</xServ></consStatServ>';
    const envelope = buildSoapEnvelope(body, WSDL_NAMESPACES.NFeStatusServico4);

    expect(envelope).toContain('soap12:Envelope');
    expect(envelope).toContain('http://www.w3.org/2003/05/soap-envelope');
    expect(envelope).toContain('soap12:Body');
    expect(envelope).toContain('nfeDadosMsg');
    expect(envelope).toContain(body);
  });
});

describe('WSDL Namespaces', () => {
  it('should have all required services', () => {
    expect(WSDL_NAMESPACES.NFeAutorizacao4).toBeTruthy();
    expect(WSDL_NAMESPACES.NFeRetAutorizacao4).toBeTruthy();
    expect(WSDL_NAMESPACES.NFeConsultaProtocolo4).toBeTruthy();
    expect(WSDL_NAMESPACES.NFeStatusServico4).toBeTruthy();
    expect(WSDL_NAMESPACES.NFeInutilizacao4).toBeTruthy();
    expect(WSDL_NAMESPACES.RecepcaoEvento4).toBeTruthy();
    expect(WSDL_NAMESPACES.NFeConsultaCadastro4).toBeTruthy();
    expect(WSDL_NAMESPACES.NFeDistribuicaoDFe).toBeTruthy();
  });

  it('should use correct base URL', () => {
    expect(WSDL_NAMESPACES.NFeAutorizacao4).toBe(
      'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4'
    );
  });
});
