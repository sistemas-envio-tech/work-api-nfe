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

  it('should reject NFCe (mod=65) with friendly error', () => {
    const nfe = createMinimalNFe();
    nfe.ide.mod = 65;
    try {
      validarNFe(nfe);
      expect.fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).message).toContain('NFCe');
      expect((e as ValidationError).message).toContain('nao suportada');
    }
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
});
