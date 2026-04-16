import { describe, it, expect } from 'vitest';
import { gzipSync } from 'node:zlib';
import { parseDistribuicaoDFe } from '../../src/parsers/distribuicao-parser.js';

const SOAP_WRAP = (body: string) => `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
<soap12:Body>
<nfeResultMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
${body}
</nfeResultMsg>
</soap12:Body>
</soap12:Envelope>`;

function compressToBase64(xml: string): string {
  return gzipSync(Buffer.from(xml, 'utf-8')).toString('base64');
}

describe('parseDistribuicaoDFe', () => {
  it('should parse response with compressed documents', () => {
    const resNFe = '<resNFe><chNFe>35230308043291000155550010000010011003290410</chNFe><CNPJ>08043291000155</CNPJ></resNFe>';
    const compressed = compressToBase64(resNFe);

    const xml = SOAP_WRAP(`
      <retDistDFeInt versao="1.01" xmlns="http://www.portalfiscal.inf.br/nfe">
        <tpAmb>2</tpAmb>
        <verAplic>AN_NFE_PL009_V4</verAplic>
        <cStat>138</cStat>
        <xMotivo>Documento localizado</xMotivo>
        <dhResp>2023-03-15T10:30:00-03:00</dhResp>
        <ultNSU>000000000000042</ultNSU>
        <maxNSU>000000000001000</maxNSU>
        <loteDistDFeInt>
          <docZip NSU="000000000000042" schema="resNFe_v1.01.xsd">${compressed}</docZip>
        </loteDistDFeInt>
      </retDistDFeInt>
    `);

    const result = parseDistribuicaoDFe(xml);
    expect(result.cStat).toBe('138');
    expect(result.xMotivo).toContain('localizado');
    expect(result.ultNSU).toBe('000000000000042');
    expect(result.maxNSU).toBe('000000000001000');
    expect(result.docs).toHaveLength(1);
    expect(result.docs[0].NSU).toBe('000000000000042');
    expect(result.docs[0].schema).toBe('resNFe_v1.01.xsd');
    expect(result.docs[0].xml).toContain('35230308043291000155550010000010011003290410');
  });

  it('should handle empty response (no documents)', () => {
    const xml = SOAP_WRAP(`
      <retDistDFeInt versao="1.01" xmlns="http://www.portalfiscal.inf.br/nfe">
        <tpAmb>2</tpAmb>
        <verAplic>AN_NFE_PL009_V4</verAplic>
        <cStat>137</cStat>
        <xMotivo>Nenhum documento localizado</xMotivo>
        <dhResp>2023-03-15T10:30:00-03:00</dhResp>
        <ultNSU>000000000000000</ultNSU>
        <maxNSU>000000000000000</maxNSU>
      </retDistDFeInt>
    `);

    const result = parseDistribuicaoDFe(xml);
    expect(result.cStat).toBe('137');
    expect(result.docs).toHaveLength(0);
    expect(result.ultNSU).toBe('000000000000000');
  });
});
