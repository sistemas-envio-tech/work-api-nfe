import { describe, it, expect } from 'vitest';
import { XmlParser } from '../../src/xml/xml-parser.js';

describe('XmlParser', () => {
  const parser = new XmlParser();

  it('should parse simple XML', () => {
    const result = parser.parse<any>('<root><name>test</name><value>123</value></root>');
    expect(result.root.name).toBe('test');
    expect(result.root.value).toBe('123'); // numberParseOptions disabled, all values are strings
  });

  it('should parse XML with attributes', () => {
    const result = parser.parse<any>('<infNFe versao="4.00"><ide>test</ide></infNFe>');
    expect(result.infNFe['@_versao']).toBe('4.00');
    expect(result.infNFe.ide).toBe('test');
  });

  it('should parse det as array', () => {
    const xml = '<NFe><det nItem="1"><prod>A</prod></det></NFe>';
    const result = parser.parse<any>(xml);
    // NFe is also configured as array
    const nfe = Array.isArray(result.NFe) ? result.NFe[0] : result.NFe;
    expect(Array.isArray(nfe.det)).toBe(true);
    expect(nfe.det[0].prod).toBe('A');
  });

  it('should extract value by path', () => {
    const xml = '<retEnviNFe><cStat>100</cStat><protNFe><infProt><chNFe>123</chNFe></infProt></protNFe></retEnviNFe>';
    const result = parser.parse<any>(xml);
    const value = parser.extractValue(result, 'retEnviNFe.cStat');
    expect(value).toBe('100');
  });
});

describe('XmlParser SOAP Response', () => {
  const parser = new XmlParser();

  it('should extract body from SOAP 1.2 envelope', () => {
    const soapXml = `
      <soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
        <soap12:Body>
          <nfeResultMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4">
            <retConsStatServ>
              <cStat>107</cStat>
              <xMotivo>Servico em Operacao</xMotivo>
            </retConsStatServ>
          </nfeResultMsg>
        </soap12:Body>
      </soap12:Envelope>`;

    const body = parser.parseSoapResponse(soapXml);
    expect(body).toBeTruthy();
  });
});
