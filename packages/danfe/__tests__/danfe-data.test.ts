import { describe, it, expect } from 'vitest';
import { extractDanfeData } from '../src/danfe-data.js';

const SAMPLE_NFEPROC = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe versao="4.00" Id="NFe35230308043291000155550010000010011003290410">
      <ide>
        <natOp>VENDA DE MERCADORIA</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>1001</nNF>
        <dhEmi>2023-03-15T10:30:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <tpEmis>1</tpEmis>
      </ide>
      <emit>
        <CNPJ>08043291000155</CNPJ>
        <xNome>EMPRESA TESTE LTDA</xNome>
        <xFant>EMPRESA TESTE</xFant>
        <enderEmit>
          <xLgr>Rua Teste</xLgr>
          <nro>100</nro>
          <xBairro>Centro</xBairro>
          <cMun>3550308</cMun>
          <xMun>SAO PAULO</xMun>
          <UF>SP</UF>
          <CEP>01001000</CEP>
          <fone>1134567890</fone>
        </enderEmit>
        <IE>123456789</IE>
        <CRT>3</CRT>
      </emit>
      <dest>
        <CNPJ>99999999000191</CNPJ>
        <xNome>CLIENTE TESTE LTDA</xNome>
        <enderDest>
          <xLgr>Av Brasil</xLgr>
          <nro>500</nro>
          <xBairro>Jardins</xBairro>
          <cMun>3550308</cMun>
          <xMun>SAO PAULO</xMun>
          <UF>SP</UF>
          <CEP>01010100</CEP>
        </enderDest>
        <indIEDest>9</indIEDest>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>001</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>PRODUTO TESTE UNITARIO</xProd>
          <NCM>84715010</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>2.0000</qCom>
          <vUnCom>50.0000</vUnCom>
          <vProd>100.00</vProd>
          <cEANTrib>SEM GTIN</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>2.0000</qTrib>
          <vUnTrib>50.0000</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS><ICMS00><orig>0</orig><CST>00</CST><modBC>3</modBC><vBC>100.00</vBC><pICMS>18.00</pICMS><vICMS>18.00</vICMS></ICMS00></ICMS>
          <PIS><PISAliq><CST>01</CST><vBC>100.00</vBC><pPIS>1.65</pPIS><vPIS>1.65</vPIS></PISAliq></PIS>
          <COFINS><COFINSAliq><CST>01</CST><vBC>100.00</vBC><pCOFINS>7.60</pCOFINS><vCOFINS>7.60</vCOFINS></COFINSAliq></COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>100.00</vBC><vICMS>18.00</vICMS><vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP><vBCST>0.00</vBCST><vST>0.00</vST>
          <vFCPST>0.00</vFCPST><vFCPSTRet>0.00</vFCPSTRet>
          <vProd>100.00</vProd><vFrete>0.00</vFrete><vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc><vII>0.00</vII><vIPI>0.00</vIPI>
          <vPIS>1.65</vPIS><vCOFINS>7.60</vCOFINS><vOutro>0.00</vOutro>
          <vNF>100.00</vNF><vTotTrib>27.25</vTotTrib>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>9</modFrete>
      </transp>
      <pag>
        <detPag><tPag>01</tPag><vPag>100.00</vPag></detPag>
      </pag>
      <infAdic>
        <infCpl>Venda realizada em ambiente de homologacao</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
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
</nfeProc>`;

describe('extractDanfeData', () => {
  it('should extract all fields from nfeProc XML', () => {
    const data = extractDanfeData(SAMPLE_NFEPROC);

    // Chave e protocolo
    expect(data.chaveAcesso).toBe('35230308043291000155550010000010011003290410');
    expect(data.nProt).toBe('135230000000001');

    // IDE
    expect(data.natOp).toBe('VENDA DE MERCADORIA');
    expect(data.nNF).toBe('1001');
    expect(data.serie).toBe('1');
    expect(data.tpNF).toBe('1');

    // Emitente
    expect(data.emitCNPJ).toBe('08043291000155');
    expect(data.emitxNome).toBe('EMPRESA TESTE LTDA');
    expect(data.emitEndereco).toContain('Rua Teste');
    expect(data.emitMunUF).toBe('SAO PAULO - SP');
    expect(data.emitIE).toBe('123456789');

    // Destinatário
    expect(data.destCNPJCPF).toBe('99999999000191');
    expect(data.destxNome).toBe('CLIENTE TESTE LTDA');
    expect(data.destBairro).toBe('Jardins');

    // Totais
    expect(data.vNF).toBe('100.00');
    expect(data.vICMS).toBe('18.00');
    expect(data.vProd).toBe('100.00');

    // Itens
    expect(data.itens).toHaveLength(1);
    expect(data.itens[0].xProd).toBe('PRODUTO TESTE UNITARIO');
    expect(data.itens[0].CST).toBe('00');
    expect(data.itens[0].CFOP).toBe('5102');

    // Transporte
    expect(data.modFrete).toBe('9');

    // Pagamento
    expect(data.pagamentos).toHaveLength(1);
    expect(data.pagamentos[0].tPag).toBe('01');

    // Info adicional
    expect(data.infCpl).toContain('homologacao');
  });
});

describe('DanfeGenerator', () => {
  it('should generate PDF buffer from XML', async () => {
    const { DanfeGenerator } = await import('../src/danfe-generator.js');
    const generator = new DanfeGenerator();
    const pdfBuffer = await generator.gerarDanfe(SAMPLE_NFEPROC);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    // PDF starts with %PDF
    expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('should generate multi-page PDF for many items', async () => {
    // Create XML with 50 items by repeating the det block
    let multiItemXml = SAMPLE_NFEPROC;
    const detBlock = `<det nItem="2"><prod><cProd>002</cProd><cEAN>SEM GTIN</cEAN><xProd>ITEM EXTRA</xProd><NCM>84715010</NCM><CFOP>5102</CFOP><uCom>UN</uCom><qCom>1.0000</qCom><vUnCom>10.0000</vUnCom><vProd>10.00</vProd><cEANTrib>SEM GTIN</cEANTrib><uTrib>UN</uTrib><qTrib>1.0000</qTrib><vUnTrib>10.0000</vUnTrib><indTot>1</indTot></prod><imposto><ICMS><ICMS00><orig>0</orig><CST>00</CST><modBC>3</modBC><vBC>10.00</vBC><pICMS>18.00</pICMS><vICMS>1.80</vICMS></ICMS00></ICMS><PIS><PISNT><CST>07</CST></PISNT></PIS><COFINS><COFINSNT><CST>07</CST></COFINSNT></COFINS></imposto></det>`;

    // Add 30 items
    const insertPoint = multiItemXml.indexOf('</det>') + 6;
    let extraDets = '';
    for (let i = 2; i <= 30; i++) {
      extraDets += detBlock.replace('nItem="2"', `nItem="${i}"`).replace('002', String(i).padStart(3, '0'));
    }
    multiItemXml = multiItemXml.slice(0, insertPoint) + extraDets + multiItemXml.slice(insertPoint);

    const { DanfeGenerator } = await import('../src/danfe-generator.js');
    const generator = new DanfeGenerator();
    const pdfBuffer = await generator.gerarDanfe(multiItemXml);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(5000);
  });
});
