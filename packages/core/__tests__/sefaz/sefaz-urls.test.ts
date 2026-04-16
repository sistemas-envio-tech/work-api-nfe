import { describe, it, expect } from 'vitest';
import { getSefazUrl, getDistribuicaoDFeUrl, listAutorizadores } from '../../src/sefaz/sefaz-urls.js';
import { getAutorizador } from '../../src/sefaz/sefaz-authorizers.js';

describe('SEFAZ Authorizers', () => {
  it('should map SP to SP authorizer', () => {
    expect(getAutorizador('SP')).toBe('SP');
  });

  it('should map RJ to SVRS', () => {
    expect(getAutorizador('RJ')).toBe('SVRS');
  });

  it('should map MA to SVAN', () => {
    expect(getAutorizador('MA')).toBe('SVAN');
  });

  it('should map contingency SP to SVC-AN', () => {
    expect(getAutorizador('SP', true)).toBe('SVC-AN');
  });

  it('should map contingency AM to SVC-RS', () => {
    expect(getAutorizador('AM', true)).toBe('SVC-RS');
  });

  it('should throw for invalid UF', () => {
    expect(() => getAutorizador('XX')).toThrow();
  });
});

describe('SEFAZ URLs', () => {
  it('should resolve SP producao NFeAutorizacao4', () => {
    const url = getSefazUrl({ uf: 'SP', ambiente: 'producao' }, 'NFeAutorizacao4');
    expect(url).toContain('nfe.fazenda.sp.gov.br');
    expect(url).toContain('nfeautorizacao4');
  });

  it('should resolve SP homologacao NFeStatusServico4', () => {
    const url = getSefazUrl({ uf: 'SP', ambiente: 'homologacao' }, 'NFeStatusServico4');
    expect(url).toContain('homologacao.nfe.fazenda.sp.gov.br');
  });

  it('should resolve RJ via SVRS', () => {
    const url = getSefazUrl({ uf: 'RJ', ambiente: 'producao' }, 'NFeAutorizacao4');
    expect(url).toContain('svrs.rs.gov.br');
  });

  it('should resolve MA via SVAN', () => {
    const url = getSefazUrl({ uf: 'MA', ambiente: 'producao' }, 'NFeAutorizacao4');
    expect(url).toContain('sefazvirtual.fazenda.gov.br');
  });

  it('should resolve contingency SP via SVC-AN', () => {
    const url = getSefazUrl(
      { uf: 'SP', ambiente: 'producao', contingencia: true },
      'NFeAutorizacao4'
    );
    expect(url).toContain('svc.fazenda.gov.br');
  });

  it('should resolve all 27 UFs for NFeStatusServico4', () => {
    const ufs = [
      'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO',
      'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR',
      'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
    ];

    for (const uf of ufs) {
      const url = getSefazUrl({ uf, ambiente: 'producao' }, 'NFeStatusServico4');
      expect(url).toBeTruthy();
      expect(url).toMatch(/^https:\/\//);
    }
  });
});

describe('DistribuicaoDFe', () => {
  it('should resolve producao URL', () => {
    const url = getDistribuicaoDFeUrl('producao');
    expect(url).toContain('nfe.fazenda.gov.br');
    expect(url).toContain('NFeDistribuicaoDFe');
  });

  it('should resolve homologacao URL', () => {
    const url = getDistribuicaoDFeUrl('homologacao');
    expect(url).toContain('hom');
  });
});

describe('List Autorizadores', () => {
  it('should list all autorizadores', () => {
    const list = listAutorizadores();
    expect(list).toContain('SP');
    expect(list).toContain('SVRS');
    expect(list).toContain('SVAN');
    expect(list).toContain('AN');
    expect(list.length).toBeGreaterThanOrEqual(15);
  });
});
