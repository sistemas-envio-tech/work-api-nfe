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

  it('should include NFref grouped under ide for devolucao (finNFe=4)', () => {
    const nfe = createSampleNFe();
    nfe.ide.finNFe = FinalidadeNFe.DEVOLUCAO;
    nfe.nfRef = [
      { refNFe: '35200512345678901234550010000000011000000016' },
    ];
    const { xml } = buildNFeXml(nfe);

    expect(xml).toContain('<finNFe>4</finNFe>');
    expect(xml).toContain(
      '<NFref><refNFe>35200512345678901234550010000000011000000016</refNFe></NFref>',
    );
  });

  it('should serialize multiple NFref entries when given an array', () => {
    const nfe = createSampleNFe();
    nfe.ide.finNFe = FinalidadeNFe.DEVOLUCAO;
    nfe.nfRef = [
      { refNFe: '35200512345678901234550010000000011000000016' },
      { refNFe: '35200512345678901234550010000000021000000023' },
    ];
    const { xml } = buildNFeXml(nfe);

    // 2 tags <NFref>
    const matches = xml.match(/<NFref>/g) || [];
    expect(matches.length).toBe(2);
  });

  // ============================================================
  // CSTs Regime Normal — geracao de XML
  // ============================================================
  describe('CSTs do Regime Normal — geracao de XML', () => {
    function buildWithIcms(blocoIcms: Record<string, unknown>) {
      const nfe = createSampleNFe();
      nfe.det[0].imposto.ICMS = blocoIcms;
      return buildNFeXml(nfe);
    }

    it('ICMS10 (tributada + ST) gera todos os campos no XML', () => {
      const { xml } = buildWithIcms({
        ICMS10: {
          orig: 0, CST: '10', modBC: 3, vBC: 100.00, pICMS: 18.0000, vICMS: 18.00,
          modBCST: 4, vBCST: 150.00, pICMSST: 18.0000, vICMSST: 27.00,
        },
      });
      expect(xml).toContain('<ICMS10>');
      expect(xml).toContain('<CST>10</CST>');
      expect(xml).toContain('<vBC>100');
      expect(xml).toContain('<vBCST>150');
      expect(xml).toContain('<vICMSST>27');
    });

    it('ICMS20 (reducao de base) gera pRedBC', () => {
      const { xml } = buildWithIcms({
        ICMS20: {
          orig: 0, CST: '20', modBC: 3, pRedBC: 30.0000,
          vBC: 70.00, pICMS: 18.0000, vICMS: 12.60,
        },
      });
      expect(xml).toContain('<ICMS20>');
      expect(xml).toContain('<pRedBC>30');
    });

    it('ICMS40 (isenta) gera so orig + CST', () => {
      const { xml } = buildWithIcms({
        ICMS40: { orig: 0, CST: '40' },
      });
      expect(xml).toContain('<ICMS40>');
      expect(xml).toContain('<CST>40</CST>');
      // Bloco ICMS40 nao deve ter pICMS dentro (a NFe inteira pode ter
      // vBC=0 no Total, entao limitamos a checagem ao trecho do ICMS40).
      const trecho = xml.match(/<ICMS40>[\s\S]*?<\/ICMS40>/)?.[0] ?? '';
      expect(trecho).not.toMatch(/<vBC>/);
      expect(trecho).not.toMatch(/<pICMS>/);
    });

    it('ICMS41 (nao tributada) usa o mesmo bloco ICMS40 (XSD)', () => {
      const { xml } = buildWithIcms({
        ICMS40: { orig: 0, CST: '41' },
      });
      expect(xml).toContain('<CST>41</CST>');
    });

    it('ICMS51 (diferimento) gera vICMSDif e vICMS=0', () => {
      const { xml } = buildWithIcms({
        ICMS51: {
          orig: 0, CST: '51', modBC: 3, vBC: 100.00, pICMS: 18.0000,
          vICMSOp: 18.00, vICMSDif: 18.00, vICMS: 0.00,
        },
      });
      expect(xml).toContain('<ICMS51>');
      expect(xml).toContain('<vICMSDif>18');
      expect(xml).toMatch(/<vICMS>0/);
    });

    it('ICMS60 (ST anterior) gera vBCSTRet + vICMSSTRet', () => {
      const { xml } = buildWithIcms({
        ICMS60: { orig: 0, CST: '60', vBCSTRet: 150.00, vICMSSTRet: 27.00 },
      });
      expect(xml).toContain('<ICMS60>');
      expect(xml).toContain('<vBCSTRet>150');
      expect(xml).toContain('<vICMSSTRet>27');
    });

    it('ICMS70 (reducao + ST) gera campos das duas', () => {
      const { xml } = buildWithIcms({
        ICMS70: {
          orig: 0, CST: '70', modBC: 3, pRedBC: 30.0000,
          vBC: 70.00, pICMS: 18.0000, vICMS: 12.60,
          modBCST: 4, vBCST: 150.00, pICMSST: 18.0000, vICMSST: 27.00,
        },
      });
      expect(xml).toContain('<ICMS70>');
      expect(xml).toContain('<pRedBC>30');
      expect(xml).toContain('<vBCST>150');
    });

    it('ICMS90 (generico) gera vBC + pICMS + vICMS', () => {
      const { xml } = buildWithIcms({
        ICMS90: {
          orig: 0, CST: '90', modBC: 3,
          vBC: 100.00, pICMS: 18.0000, vICMS: 18.00,
        },
      });
      expect(xml).toContain('<ICMS90>');
      expect(xml).toContain('<vBC>100');
    });

    it('FCP em ICMS00 gera pFCP + vFCP (sem vBCFCP)', () => {
      const { xml } = buildWithIcms({
        ICMS00: {
          orig: 0, CST: '00', modBC: 3, vBC: 100, pICMS: 18, vICMS: 18,
          pFCP: 2.0000, vFCP: 2.00,
        },
      });
      expect(xml).toContain('<pFCP>2');
      expect(xml).toContain('<vFCP>2');
    });

    it('FCP em ICMS10 gera vBCFCP + pFCP + vFCP', () => {
      const { xml } = buildWithIcms({
        ICMS10: {
          orig: 0, CST: '10', modBC: 3, vBC: 100, pICMS: 18, vICMS: 18,
          vBCFCP: 100, pFCP: 2, vFCP: 2,
          modBCST: 4, vBCST: 150, pICMSST: 18, vICMSST: 27,
        },
      });
      // Builder do work-api-nfe e generico (record<unknown>) — passa os
      // campos como vieram. Verificamos so a presenca das tags no trecho
      // do ICMS10 pra nao confundir com vFCP do total geral.
      const trecho = xml.match(/<ICMS10>[\s\S]*?<\/ICMS10>/)?.[0] ?? '';
      expect(trecho).toMatch(/<vBCFCP>/);
      expect(trecho).toMatch(/<pFCP>/);
      expect(trecho).toMatch(/<vFCP>/);
    });
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
