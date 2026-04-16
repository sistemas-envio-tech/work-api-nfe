import { describe, it, expect } from 'vitest';
import {
  parseStatusServico,
  parseAutorizacao,
  parseConsultaProtocolo,
  parseInutilizacao,
  parseEvento,
} from '../../src/parsers/response-parser.js';

const SOAP_WRAP = (body: string) => `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
<soap12:Body>
<nfeResultMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4">
${body}
</nfeResultMsg>
</soap12:Body>
</soap12:Envelope>`;

describe('parseStatusServico', () => {
  it('should parse service status response', () => {
    const xml = SOAP_WRAP(`
      <retConsStatServ versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
        <tpAmb>2</tpAmb>
        <verAplic>SP_NFE_PL009_V4</verAplic>
        <cStat>107</cStat>
        <xMotivo>Servico em Operacao</xMotivo>
        <cUF>35</cUF>
        <dhRecbto>2023-03-15T10:30:00-03:00</dhRecbto>
        <tMed>1</tMed>
      </retConsStatServ>
    `);

    const result = parseStatusServico(xml);
    expect(result.cStat).toBe('107');
    expect(result.xMotivo).toBe('Servico em Operacao');
    expect(result.cUF).toBe('35');
    expect(result.tMed).toBe('1');
  });
});

describe('parseAutorizacao', () => {
  it('should parse synchronous authorization response', () => {
    const xml = SOAP_WRAP(`
      <retEnviNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
        <tpAmb>2</tpAmb>
        <verAplic>SP_NFE_PL009_V4</verAplic>
        <cStat>104</cStat>
        <xMotivo>Lote processado</xMotivo>
        <cUF>35</cUF>
        <dhRecbto>2023-03-15T10:30:00-03:00</dhRecbto>
        <protNFe versao="4.00">
          <infProt>
            <tpAmb>2</tpAmb>
            <verAplic>SP_NFE_PL009_V4</verAplic>
            <chNFe>35230308043291000155550010000010011003290410</chNFe>
            <dhRecbto>2023-03-15T10:30:01-03:00</dhRecbto>
            <nProt>135230000000001</nProt>
            <digVal>abc123def456</digVal>
            <cStat>100</cStat>
            <xMotivo>Autorizado o uso da NF-e</xMotivo>
          </infProt>
        </protNFe>
      </retEnviNFe>
    `);

    const result = parseAutorizacao(xml);
    expect(result.cStat).toBe('104');
    expect(result.protNFe).toBeDefined();
    expect(result.protNFe!.cStat).toBe('100');
    expect(result.protNFe!.nProt).toBe('135230000000001');
    expect(result.protNFe!.chNFe).toBe('35230308043291000155550010000010011003290410');
  });

  it('should parse async response with receipt number', () => {
    const xml = SOAP_WRAP(`
      <retEnviNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
        <tpAmb>2</tpAmb>
        <verAplic>SP_NFE_PL009_V4</verAplic>
        <cStat>103</cStat>
        <xMotivo>Lote recebido com sucesso</xMotivo>
        <cUF>35</cUF>
        <dhRecbto>2023-03-15T10:30:00-03:00</dhRecbto>
        <nRec>351000000000001</nRec>
      </retEnviNFe>
    `);

    const result = parseAutorizacao(xml);
    expect(result.cStat).toBe('103');
    expect(result.nRec).toBe('351000000000001');
    expect(result.protNFe).toBeUndefined();
  });
});

describe('parseConsultaProtocolo', () => {
  it('should parse protocol query response', () => {
    const xml = SOAP_WRAP(`
      <retConsSitNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
        <tpAmb>2</tpAmb>
        <verAplic>SP_NFE_PL009_V4</verAplic>
        <cStat>100</cStat>
        <xMotivo>Autorizado o uso da NF-e</xMotivo>
        <cUF>35</cUF>
        <protNFe versao="4.00">
          <infProt>
            <tpAmb>2</tpAmb>
            <verAplic>SP_NFE_PL009_V4</verAplic>
            <chNFe>35230308043291000155550010000010011003290410</chNFe>
            <dhRecbto>2023-03-15T10:30:01-03:00</dhRecbto>
            <nProt>135230000000001</nProt>
            <digVal>abc123</digVal>
            <cStat>100</cStat>
            <xMotivo>Autorizado o uso da NF-e</xMotivo>
          </infProt>
        </protNFe>
      </retConsSitNFe>
    `);

    const result = parseConsultaProtocolo(xml);
    expect(result.cStat).toBe('100');
    expect(result.protNFe!.nProt).toBe('135230000000001');
  });
});

describe('parseInutilizacao', () => {
  it('should parse invalidation response', () => {
    const xml = SOAP_WRAP(`
      <retInutNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
        <infInut>
          <tpAmb>2</tpAmb>
          <verAplic>SP_NFE_PL009_V4</verAplic>
          <cStat>102</cStat>
          <xMotivo>Inutilizacao de numero homologado</xMotivo>
          <cUF>35</cUF>
          <ano>23</ano>
          <CNPJ>08043291000155</CNPJ>
          <mod>55</mod>
          <serie>1</serie>
          <nNFIni>1</nNFIni>
          <nNFFin>10</nNFFin>
          <dhRecbto>2023-03-15T10:30:00-03:00</dhRecbto>
          <nProt>135230000000002</nProt>
        </infInut>
      </retInutNFe>
    `);

    const result = parseInutilizacao(xml);
    expect(result.cStat).toBe('102');
    expect(result.nProt).toBe('135230000000002');
    expect(result.nNFIni).toBe('1');
    expect(result.nNFFin).toBe('10');
  });
});

describe('parseEvento', () => {
  it('should parse event response (cancelamento)', () => {
    const xml = SOAP_WRAP(`
      <retEnvEvento versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
        <idLote>1</idLote>
        <tpAmb>2</tpAmb>
        <verAplic>SP_NFE_PL009_V4</verAplic>
        <cOrgao>35</cOrgao>
        <cStat>128</cStat>
        <xMotivo>Lote de Evento Processado</xMotivo>
        <retEvento versao="4.00">
          <infEvento>
            <tpAmb>2</tpAmb>
            <verAplic>SP_NFE_PL009_V4</verAplic>
            <cOrgao>35</cOrgao>
            <cStat>135</cStat>
            <xMotivo>Evento registrado e vinculado a NF-e</xMotivo>
            <chNFe>35230308043291000155550010000010011003290410</chNFe>
            <tpEvento>110111</tpEvento>
            <xEvento>Cancelamento</xEvento>
            <nSeqEvento>1</nSeqEvento>
            <dhRegEvento>2023-03-15T11:00:00-03:00</dhRegEvento>
            <nProt>135230000000003</nProt>
          </infEvento>
        </retEvento>
      </retEnvEvento>
    `);

    const result = parseEvento(xml);
    expect(result.cStat).toBe('135');
    expect(result.tpEvento).toBe('110111');
    expect(result.xEvento).toBe('Cancelamento');
    expect(result.nProt).toBe('135230000000003');
  });
});
