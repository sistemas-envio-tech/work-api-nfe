import { describe, it, expect } from 'vitest';
import { parseConsultaCadastro } from '../../src/parsers/consulta-cadastro-parser.js';

const SOAP_WRAP = (body: string) => `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
<soap12:Body>
<nfeResultMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/CadConsultaCadastro4">
${body}
</nfeResultMsg>
</soap12:Body>
</soap12:Envelope>`;

describe('parseConsultaCadastro', () => {
  it('should parse cadastro response with infCad', () => {
    const xml = SOAP_WRAP(`
      <retConsCad versao="2.00" xmlns="http://www.portalfiscal.inf.br/nfe">
        <infCons>
          <verAplic>SP_NFE_PL009_V4</verAplic>
          <cStat>111</cStat>
          <xMotivo>Consulta cadastro com uma ocorrencia</xMotivo>
          <UF>SP</UF>
          <infCad>
            <IE>123456789</IE>
            <CNPJ>08043291000155</CNPJ>
            <UF>SP</UF>
            <cSit>1</cSit>
            <indCredNFe>1</indCredNFe>
            <xNome>EMPRESA TESTE LTDA</xNome>
            <xFant>EMPRESA TESTE</xFant>
            <CNAE>6201501</CNAE>
            <dIniAtiv>2020-01-15</dIniAtiv>
            <dUltSit>2020-01-15</dUltSit>
            <ender>
              <xLgr>Rua Teste</xLgr>
              <nro>100</nro>
              <xBairro>Centro</xBairro>
              <cMun>3550308</cMun>
              <xMun>SAO PAULO</xMun>
              <CEP>01001000</CEP>
            </ender>
          </infCad>
        </infCons>
      </retConsCad>
    `);

    const result = parseConsultaCadastro(xml);
    expect(result.cStat).toBe('111');
    expect(result.xMotivo).toContain('uma ocorrencia');
    expect(result.UF).toBe('SP');
    expect(result.infCad).toHaveLength(1);
    expect(result.infCad[0].CNPJ).toBe('08043291000155');
    expect(result.infCad[0].xNome).toBe('EMPRESA TESTE LTDA');
    expect(result.infCad[0].IE).toBe('123456789');
    expect(result.infCad[0].cSit).toBe('1');
    expect(result.infCad[0].ender?.xLgr).toBe('Rua Teste');
    expect(result.infCad[0].ender?.cMun).toBe('3550308');
  });

  it('should handle not found response', () => {
    const xml = SOAP_WRAP(`
      <retConsCad versao="2.00" xmlns="http://www.portalfiscal.inf.br/nfe">
        <infCons>
          <verAplic>SP_NFE_PL009_V4</verAplic>
          <cStat>112</cStat>
          <xMotivo>Consulta cadastro sem ocorrencia</xMotivo>
          <UF>SP</UF>
        </infCons>
      </retConsCad>
    `);

    const result = parseConsultaCadastro(xml);
    expect(result.cStat).toBe('112');
    expect(result.infCad).toHaveLength(0);
  });
});
