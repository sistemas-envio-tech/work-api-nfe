import { describe, it, expect } from 'vitest';
import { validarNFe, validarRegrasNegocio } from '../../src/validation/nfe-validator.js';
import { ValidationError } from '@acbr-node/core';

function createMinimalNFe() {
  return {
    ide: {
      cUF: 35, natOp: 'VENDA', mod: 55, serie: 1, nNF: 1,
      dhEmi: '2023-03-15T10:30:00-03:00', tpNF: 1, idDest: 1,
      cMunFG: 3550308, tpImp: 1, tpEmis: 1, tpAmb: 2,
      finNFe: 1, indFinal: 1, indPres: 1, procEmi: 0, verProc: 'acbr-node',
    },
    emit: {
      CNPJ: '08043291000155', xNome: 'EMPRESA TESTE',
      enderEmit: {
        xLgr: 'Rua', nro: '1', xBairro: 'Centro',
        cMun: 3550308, xMun: 'SAO PAULO', UF: 'SP', CEP: '01001000',
      },
      IE: '123456789', CRT: 3,
    },
    det: [{
      nItem: 1,
      prod: {
        cProd: '001', cEAN: 'SEM GTIN', xProd: 'PRODUTO',
        NCM: '84715010', CFOP: '5102', uCom: 'UN',
        qCom: 1, vUnCom: 100, vProd: 100,
        cEANTrib: 'SEM GTIN', uTrib: 'UN', qTrib: 1, vUnTrib: 100,
        indTot: 1,
      },
      imposto: {},
    }],
    total: { ICMSTot: { vProd: 100, vNF: 100 } },
    transp: { modFrete: 9 },
    pag: { detPag: [{ tPag: '01', vPag: 100 }] },
  };
}

describe('validarNFe', () => {
  it('should pass for valid NFe', () => {
    expect(() => validarNFe(createMinimalNFe())).not.toThrow();
  });

  it('should fail for missing emitente CNPJ and CPF', () => {
    const nfe = createMinimalNFe();
    (nfe.emit as any).CNPJ = undefined;
    expect(() => validarNFe(nfe)).toThrow(ValidationError);
  });

  it('should fail for empty det array', () => {
    const nfe = createMinimalNFe();
    nfe.det = [];
    expect(() => validarNFe(nfe)).toThrow(ValidationError);
  });

  it('should fail for invalid NCM', () => {
    const nfe = createMinimalNFe();
    nfe.det[0].prod.NCM = '123'; // should be 8 digits
    expect(() => validarNFe(nfe)).toThrow(ValidationError);
  });

  it('should fail for invalid CFOP', () => {
    const nfe = createMinimalNFe();
    nfe.det[0].prod.CFOP = '51'; // should be 4 digits
    expect(() => validarNFe(nfe)).toThrow(ValidationError);
  });

  it('should fail for invalid CEP', () => {
    const nfe = createMinimalNFe();
    nfe.emit.enderEmit.CEP = '123'; // should be 8 digits
    expect(() => validarNFe(nfe)).toThrow(ValidationError);
  });

  it('should fail for missing pagamento', () => {
    const nfe = createMinimalNFe();
    nfe.pag.detPag = [];
    expect(() => validarNFe(nfe)).toThrow(ValidationError);
  });

  it('should accept NFCe (mod=65) when structure is valid', () => {
    const nfe = createMinimalNFe();
    nfe.ide.mod = 65;
    nfe.ide.idDest = 1;
    nfe.ide.indFinal = 1;
    nfe.ide.indPres = 1;
    expect(() => validarNFe(nfe)).not.toThrow();
  });

  it('should include field path in error details', () => {
    const nfe = createMinimalNFe();
    nfe.det[0].prod.NCM = 'XX';
    try {
      validarNFe(nfe);
      expect.fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).details).toBeDefined();
      expect((e as ValidationError).details!.length).toBeGreaterThan(0);
    }
  });
});

describe('validarRegrasNegocio', () => {
  it('should pass for correct totals', () => {
    const nfe = createMinimalNFe();
    expect(() => validarRegrasNegocio(nfe)).not.toThrow();
  });

  it('should fail when vProd does not match sum of items', () => {
    const nfe = createMinimalNFe();
    nfe.total.ICMSTot.vProd = 999; // should be 100
    expect(() => validarRegrasNegocio(nfe)).toThrow(ValidationError);
  });

  it('should fail when contingency without xJust', () => {
    const nfe = createMinimalNFe();
    nfe.ide.tpEmis = 6; // SVC-AN
    // No xJust
    expect(() => validarRegrasNegocio(nfe)).toThrow(ValidationError);
  });

  describe('NFCe (mod=65) business rules', () => {
    function createNFCe() {
      const nfe = createMinimalNFe();
      nfe.ide.mod = 65;
      nfe.ide.idDest = 1;
      nfe.ide.indFinal = 1;
      nfe.ide.indPres = 1;
      nfe.transp = { modFrete: 9 };
      return nfe;
    }

    it('should accept a valid NFCe', () => {
      expect(() => validarRegrasNegocio(createNFCe())).not.toThrow();
    });

    it('should reject NFCe with idDest != 1 (apenas operacao interna)', () => {
      const nfe = createNFCe();
      nfe.ide.idDest = 2;
      expect(() => validarRegrasNegocio(nfe)).toThrow(/idDest=1/);
    });

    it('should reject NFCe sem consumidor final', () => {
      const nfe = createNFCe();
      nfe.ide.indFinal = 0;
      expect(() => validarRegrasNegocio(nfe)).toThrow(/indFinal=1/);
    });

    it('should reject NFCe com indPres=0 (nao presencial)', () => {
      const nfe = createNFCe();
      nfe.ide.indPres = 0;
      expect(() => validarRegrasNegocio(nfe)).toThrow(/indPres=0/);
    });

    it('should reject NFCe com frete (modFrete != 9)', () => {
      const nfe = createNFCe();
      nfe.transp.modFrete = 0;
      expect(() => validarRegrasNegocio(nfe)).toThrow(/modFrete=9/);
    });

    it('should reject NFCe com duplicatas (cobranca a prazo)', () => {
      const nfe = createNFCe();
      nfe.cobr = { dup: [{ nDup: '001', dVenc: '2026-06-01', vDup: 100 }] };
      expect(() => validarRegrasNegocio(nfe)).toThrow(/duplicatas/);
    });
  });

  // ============================================================
  // Validacao por CST/CSOSN — campos obrigatorios por bloco ICMS
  // ============================================================
  describe('validarNFe — CST ICMS Regime Normal', () => {
    function createNFeComIcms(blocoIcms: Record<string, unknown>) {
      const nfe = createMinimalNFe();
      (nfe.det[0].imposto as any).ICMS = blocoIcms;
      return nfe;
    }

    it('ICMS00 valido (orig + CST + modBC + vBC + pICMS + vICMS) passa', () => {
      const nfe = createNFeComIcms({
        ICMS00: { orig: '0', CST: '00', modBC: '3', vBC: '100.00', pICMS: '18.0000', vICMS: '18.00' },
      });
      expect(() => validarNFe(nfe)).not.toThrow();
    });

    it('ICMS00 SEM vBC falha', () => {
      const nfe = createNFeComIcms({
        ICMS00: { orig: '0', CST: '00', modBC: '3', pICMS: '18.0000', vICMS: '18.00' },
      });
      expect(() => validarNFe(nfe)).toThrow(/vBC/i);
    });

    it('ICMS10 SEM vBCST falha (substituicao tributaria)', () => {
      const nfe = createNFeComIcms({
        ICMS10: {
          orig: '0', CST: '10', modBC: '3', vBC: '100.00', pICMS: '18.0000', vICMS: '18.00',
          modBCST: '4', pICMSST: '18.0000', vICMSST: '27.00',
          // FALTA vBCST
        },
      });
      expect(() => validarNFe(nfe)).toThrow(/vBCST/i);
    });

    it('ICMS20 SEM pRedBC falha', () => {
      const nfe = createNFeComIcms({
        ICMS20: {
          orig: '0', CST: '20', modBC: '3', vBC: '70.00', pICMS: '18.0000', vICMS: '12.60',
          // FALTA pRedBC
        },
      });
      expect(() => validarNFe(nfe)).toThrow(/pRedBC/i);
    });

    it('ICMS40 (isenta) so exige orig + CST', () => {
      const nfe = createNFeComIcms({ ICMS40: { orig: '0', CST: '40' } });
      expect(() => validarNFe(nfe)).not.toThrow();
    });

    it('ICMS41 (nao tributada) tambem ok com orig + CST', () => {
      const nfe = createNFeComIcms({ ICMS40: { orig: '0', CST: '41' } });
      expect(() => validarNFe(nfe)).not.toThrow();
    });

    it('ICMS51 (diferimento) SEM vICMSDif falha', () => {
      const nfe = createNFeComIcms({
        ICMS51: {
          orig: '0', CST: '51', modBC: '3', vBC: '100.00', pICMS: '18.0000',
          vICMSOp: '18.00', vICMS: '0.00',
          // FALTA vICMSDif
        },
      });
      expect(() => validarNFe(nfe)).toThrow(/vICMSDif/i);
    });

    it('ICMS60 (ST anterior) SEM vICMSSTRet falha', () => {
      const nfe = createNFeComIcms({
        ICMS60: { orig: '0', CST: '60', vBCSTRet: '150.00' },
      });
      expect(() => validarNFe(nfe)).toThrow(/vICMSSTRet/i);
    });

    it('ICMS60 so com orig + CST passa (grupo do ST retido e opcional no XSD)', () => {
      const nfe = createNFeComIcms({ ICMS60: { orig: '0', CST: '60' } });
      expect(() => validarNFe(nfe)).not.toThrow();
    });

    it('ICMS60 com vBCSTRet e vICMSSTRet mas SEM pST falha (cStat 225 da NF-e 901)', () => {
      const nfe = createNFeComIcms({
        ICMS60: { orig: '0', CST: '60', vBCSTRet: '0.00', vICMSSTRet: '0.00' },
      });
      expect(() => validarNFe(nfe)).toThrow(/pST/);
    });

    it('ICMS60 com o grupo completo passa', () => {
      const nfe = createNFeComIcms({
        ICMS60: { orig: '0', CST: '60', vBCSTRet: '40.00', pST: '23.0000', vICMSSTRet: '9.20' },
      });
      expect(() => validarNFe(nfe)).not.toThrow();
    });

    it('ICMS70 SEM pRedBC nem vBCST falha (precisa dos 2)', () => {
      const nfe = createNFeComIcms({
        ICMS70: {
          orig: '0', CST: '70', modBC: '3', vBC: '70.00', pICMS: '18.0000', vICMS: '12.60',
          modBCST: '4', pICMSST: '18.0000', vICMSST: '27.00',
        },
      });
      // Faltou pRedBC + vBCST → deve falhar em pelo menos um
      expect(() => validarNFe(nfe)).toThrow();
    });

    it('orig "0" (Nacional) eh valido — nao confundir com null/empty', () => {
      const nfe = createNFeComIcms({
        ICMS00: { orig: '0', CST: '00', modBC: '3', vBC: '100', pICMS: '18', vICMS: '18' },
      });
      expect(() => validarNFe(nfe)).not.toThrow();
    });

    it('CST desconhecido (ICMS99) e ignorado pela validacao (XSD trata)', () => {
      const nfe = createNFeComIcms({ ICMS99: { campo_qualquer: 'x' } });
      expect(() => validarNFe(nfe)).not.toThrow();
    });
  });

  describe('validarNFe — CSOSN Simples Nacional', () => {
    function createNFeComIcms(blocoIcms: Record<string, unknown>) {
      const nfe = createMinimalNFe();
      (nfe.det[0].imposto as any).ICMS = blocoIcms;
      return nfe;
    }

    it('ICMSSN102 (sem credito) so exige orig + CSOSN', () => {
      const nfe = createNFeComIcms({ ICMSSN102: { orig: '0', CSOSN: '102' } });
      expect(() => validarNFe(nfe)).not.toThrow();
    });

    it('ICMSSN101 SEM pCredSN falha', () => {
      const nfe = createNFeComIcms({
        ICMSSN101: { orig: '0', CSOSN: '101', vCredICMSSN: '4.00' },
      });
      expect(() => validarNFe(nfe)).toThrow(/pCredSN/i);
    });

    it('ICMSSN500 SEM vICMSSTRet falha', () => {
      const nfe = createNFeComIcms({
        ICMSSN500: { orig: '0', CSOSN: '500', vBCSTRet: '150.00' },
      });
      expect(() => validarNFe(nfe)).toThrow(/vICMSSTRet/i);
    });

    it('ICMSSN500 so com orig + CSOSN passa', () => {
      const nfe = createNFeComIcms({ ICMSSN500: { orig: '0', CSOSN: '500' } });
      expect(() => validarNFe(nfe)).not.toThrow();
    });
  });
});
