import { describe, it, expect } from 'vitest';
import { DanfceGenerator } from '../src/danfce-generator.js';
import { extractDanfeData } from '../src/danfe-data.js';

const SAMPLE_NFCE_PROC = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe versao="4.00" Id="NFe35230308043291000155650010000010011003290410">
      <ide>
        <natOp>VENDA AO CONSUMIDOR</natOp>
        <mod>65</mod>
        <serie>1</serie>
        <nNF>1001</nNF>
        <dhEmi>2026-05-19T10:30:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <tpImp>4</tpImp>
        <tpEmis>1</tpEmis>
        <tpAmb>2</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
      </ide>
      <emit>
        <CNPJ>08043291000155</CNPJ>
        <xNome>LOJA TESTE LTDA</xNome>
        <xFant>LOJA TESTE</xFant>
        <enderEmit>
          <xLgr>Rua das Flores</xLgr>
          <nro>100</nro>
          <xBairro>Centro</xBairro>
          <cMun>3550308</cMun>
          <xMun>SAO PAULO</xMun>
          <UF>SP</UF>
          <CEP>01001000</CEP>
        </enderEmit>
        <IE>123456789</IE>
        <CRT>3</CRT>
      </emit>
      <det nItem="1">
        <prod>
          <cProd>001</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>PRODUTO TESTE A</xProd>
          <NCM>84715010</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>2.0000</qCom>
          <vUnCom>10.5000</vUnCom>
          <vProd>21.00</vProd>
          <cEANTrib>SEM GTIN</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>2.0000</qTrib>
          <vUnTrib>10.5000</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMSSN102>
              <orig>0</orig>
              <CSOSN>102</CSOSN>
            </ICMSSN102>
          </ICMS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>0.00</vBC>
          <vICMS>0.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>21.00</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vPIS>0.00</vPIS>
          <vCOFINS>0.00</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>21.00</vNF>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>9</modFrete>
      </transp>
      <pag>
        <detPag>
          <tPag>01</tPag>
          <vPag>21.00</vPag>
        </detPag>
      </pag>
    </infNFe>
    <infNFeSupl>
      <qrCode><![CDATA[https://www.homologacao.nfce.fazenda.sp.gov.br/qrcode?p=35230308043291000155650010000010011003290410|2|2|000001|abc123def456]]></qrCode>
      <urlChave>https://www.homologacao.nfce.fazenda.sp.gov.br/consulta</urlChave>
    </infNFeSupl>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>2</tpAmb>
      <verAplic>SP-PL-4.00</verAplic>
      <chNFe>35230308043291000155650010000010011003290410</chNFe>
      <dhRecbto>2026-05-19T10:30:30-03:00</dhRecbto>
      <nProt>135000000000001</nProt>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;

describe('DanfceGenerator', () => {
  it('extrai qrCode e urlChave do infNFeSupl', () => {
    const data = extractDanfeData(SAMPLE_NFCE_PROC);
    expect(data.qrCode).toBeDefined();
    expect(data.qrCode).toContain('?p=35230308043291000155650010000010011003290410');
    expect(data.urlChave).toBe('https://www.homologacao.nfce.fazenda.sp.gov.br/consulta');
  });

  it('gera PDF buffer para NFCe valida', async () => {
    const gen = new DanfceGenerator();
    const pdf = await gen.gerarDanfce(SAMPLE_NFCE_PROC);
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.length).toBeGreaterThan(1000);
    // Magic number PDF: %PDF-
    expect(pdf.toString('ascii', 0, 5)).toBe('%PDF-');
  });

  it('rejeita XML sem infNFeSupl com mensagem clara', async () => {
    const xmlNFe = SAMPLE_NFCE_PROC
      .replace('<mod>65</mod>', '<mod>55</mod>')
      .replace(/<infNFeSupl>[\s\S]*?<\/infNFeSupl>/, '');
    const gen = new DanfceGenerator();
    await expect(gen.gerarDanfce(xmlNFe)).rejects.toThrow(/infNFeSupl/);
  });

  it('aceita mensagem de rodape opcional', async () => {
    const gen = new DanfceGenerator();
    const pdf = await gen.gerarDanfce(SAMPLE_NFCE_PROC, {
      mensagemRodape: 'Troca em ate 7 dias com nota fiscal',
    });
    expect(pdf.length).toBeGreaterThan(1000);
  });
});
