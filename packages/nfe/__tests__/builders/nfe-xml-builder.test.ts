import { describe, it, expect } from 'vitest';
import { buildNFeXml, buildConsStatServXml, buildConsSitNFeXml, buildInutNFeXml } from '../../src/builders/nfe-xml-builder.js';
import type { NFe } from '../../src/types/nfe.js';
import {
  TipoOperacao, FinalidadeNFe, TipoImpressao, TipoEmissao,
  DestinoOperacao, IndicadorPresenca, IndicadorConsumidorFinal,
  ProcessoEmissao, ModalidadeFrete, ModeloDocumento, Ambiente,
  RegimeTributario, IndicadorIEDestinatario, FormaPagamento,
} from '../../src/types/enums.js';

function createSampleNFe(): NFe {
  return {
    ide: {
      cUF: 35,
      natOp: 'VENDA DE MERCADORIA',
      mod: ModeloDocumento.NFE,
      serie: 1,
      nNF: 1001,
      dhEmi: '2023-03-15T10:30:00-03:00',
      tpNF: TipoOperacao.SAIDA,
      idDest: DestinoOperacao.INTERNA,
      cMunFG: 3550308,
      tpImp: TipoImpressao.RETRATO,
      tpEmis: TipoEmissao.NORMAL,
      tpAmb: Ambiente.HOMOLOGACAO,
      finNFe: FinalidadeNFe.NORMAL,
      indFinal: IndicadorConsumidorFinal.CONSUMIDOR_FINAL,
      indPres: IndicadorPresenca.PRESENCIAL,
      procEmi: ProcessoEmissao.APLICATIVO_CONTRIBUINTE,
      verProc: 'acbr-node 0.1.0',
    },
    emit: {
      CNPJ: '08043291000155',
      xNome: 'EMPRESA TESTE LTDA',
      xFant: 'EMPRESA TESTE',
      enderEmit: {
        xLgr: 'Rua Teste',
        nro: '100',
        xBairro: 'Centro',
        cMun: 3550308,
        xMun: 'SAO PAULO',
        UF: 'SP',
        CEP: '01001000',
        cPais: 1058,
        xPais: 'BRASIL',
      },
      IE: '123456789',
      CRT: RegimeTributario.NORMAL,
    },
    dest: {
      CNPJ: '99999999000191',
      xNome: 'NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL',
      enderDest: {
        xLgr: 'Rua Destinatario',
        nro: '200',
        xBairro: 'Centro',
        cMun: 3550308,
        xMun: 'SAO PAULO',
        UF: 'SP',
        CEP: '01002000',
        cPais: 1058,
        xPais: 'BRASIL',
      },
      indIEDest: IndicadorIEDestinatario.NAO_CONTRIBUINTE,
    },
    det: [
      {
        nItem: 1,
        prod: {
          cProd: '001',
          cEAN: 'SEM GTIN',
          xProd: 'PRODUTO TESTE',
          NCM: '84715010',
          CFOP: '5102',
          uCom: 'UN',
          qCom: 1,
          vUnCom: 100.00,
          vProd: 100.00,
          cEANTrib: 'SEM GTIN',
          uTrib: 'UN',
          qTrib: 1,
          vUnTrib: 100.00,
          indTot: 1,
        },
        imposto: {
          ICMS: {
            ICMS00: {
              orig: 0,
              CST: '00',
              modBC: 3,
              vBC: 100.00,
              pICMS: 18.00,
              vICMS: 18.00,
            },
          },
          PIS: {
            PISAliq: {
              CST: '01',
              vBC: 100.00,
              pPIS: 1.65,
              vPIS: 1.65,
            },
          },
          COFINS: {
            COFINSAliq: {
              CST: '01',
              vBC: 100.00,
              pCOFINS: 7.60,
              vCOFINS: 7.60,
            },
          },
        },
      },
    ],
    total: {
      ICMSTot: {
        vBC: 100.00,
        vICMS: 18.00,
        vICMSDeson: 0,
        vFCP: 0,
        vBCST: 0,
        vST: 0,
        vFCPST: 0,
        vFCPSTRet: 0,
        vProd: 100.00,
        vFrete: 0,
        vSeg: 0,
        vDesc: 0,
        vII: 0,
        vIPI: 0,
        vPIS: 1.65,
        vCOFINS: 7.60,
        vOutro: 0,
        vNF: 100.00,
      },
    },
    transp: {
      modFrete: ModalidadeFrete.SEM_FRETE,
    },
    pag: {
      detPag: [
        {
          tPag: FormaPagamento.DINHEIRO,
          vPag: 100.00,
        },
      ],
    },
  };
}

describe('buildNFeXml', () => {
  it('should generate valid NFe XML with 44-digit access key', () => {
    const nfe = createSampleNFe();
    const { xml, chaveAcesso } = buildNFeXml(nfe);

    expect(chaveAcesso).toHaveLength(44);
    expect(chaveAcesso).toMatch(/^\d{44}$/);
    expect(xml).toContain(`Id="NFe${chaveAcesso}"`);
    expect(xml).toContain('xmlns="http://www.portalfiscal.inf.br/nfe"');
    expect(xml).toContain('versao="4.00"');
  });

  it('should contain all required groups in correct order', () => {
    const nfe = createSampleNFe();
    const { xml } = buildNFeXml(nfe);

    const ideIdx = xml.indexOf('<ide>');
    const emitIdx = xml.indexOf('<emit>');
    const destIdx = xml.indexOf('<dest>');
    const detIdx = xml.indexOf('<det');
    const totalIdx = xml.indexOf('<total>');
    const transpIdx = xml.indexOf('<transp>');
    const pagIdx = xml.indexOf('<pag>');

    expect(ideIdx).toBeGreaterThan(-1);
    expect(emitIdx).toBeGreaterThan(ideIdx);
    expect(destIdx).toBeGreaterThan(emitIdx);
    expect(detIdx).toBeGreaterThan(destIdx);
    expect(totalIdx).toBeGreaterThan(detIdx);
    expect(transpIdx).toBeGreaterThan(totalIdx);
    expect(pagIdx).toBeGreaterThan(transpIdx);
  });

  it('should format decimal values correctly', () => {
    const nfe = createSampleNFe();
    const { xml } = buildNFeXml(nfe);

    expect(xml).toContain('<vProd>100.00</vProd>');
    expect(xml).toContain('<qCom>1.0000</qCom>');
    expect(xml).toContain('<vUnCom>100.0000000000</vUnCom>');
    expect(xml).toContain('<pICMS>18.0000</pICMS>');
    expect(xml).toContain('<vICMS>18.00</vICMS>');
  });

  it('should include CNPJ of emitente', () => {
    const nfe = createSampleNFe();
    const { xml } = buildNFeXml(nfe);

    expect(xml).toContain('<CNPJ>08043291000155</CNPJ>');
  });

  it('should include product details', () => {
    const nfe = createSampleNFe();
    const { xml } = buildNFeXml(nfe);

    expect(xml).toContain('<xProd>PRODUTO TESTE</xProd>');
    expect(xml).toContain('<NCM>84715010</NCM>');
    expect(xml).toContain('<CFOP>5102</CFOP>');
  });
});

describe('buildConsStatServXml', () => {
  it('should generate valid status query XML', () => {
    const xml = buildConsStatServXml(2, 35);

    expect(xml).toContain('consStatServ');
    expect(xml).toContain('versao="4.00"');
    expect(xml).toContain('<tpAmb>2</tpAmb>');
    expect(xml).toContain('<cUF>35</cUF>');
    expect(xml).toContain('<xServ>STATUS</xServ>');
  });
});

describe('buildConsSitNFeXml', () => {
  it('should generate valid protocol query XML', () => {
    const chNFe = '35230308043291000155550010000010011003290410';
    const xml = buildConsSitNFeXml(2, chNFe);

    expect(xml).toContain('consSitNFe');
    expect(xml).toContain('<xServ>CONSULTAR</xServ>');
    expect(xml).toContain(`<chNFe>${chNFe}</chNFe>`);
  });
});

describe('buildInutNFeXml', () => {
  it('should generate valid invalidation XML with correct ID', () => {
    const xml = buildInutNFeXml({
      tpAmb: 2,
      cUF: 35,
      ano: 2023,
      CNPJ: '08043291000155',
      mod: 55,
      serie: 1,
      nNFIni: 1,
      nNFFin: 10,
      xJust: 'Numeracao nao utilizada por erro de sequencia',
    });

    expect(xml).toContain('inutNFe');
    expect(xml).toContain('infInut');
    expect(xml).toContain('Id="ID');
    expect(xml).toContain('<xServ>INUTILIZAR</xServ>');
    expect(xml).toContain('<nNFIni>1</nNFIni>');
    expect(xml).toContain('<nNFFin>10</nNFFin>');
  });
});
