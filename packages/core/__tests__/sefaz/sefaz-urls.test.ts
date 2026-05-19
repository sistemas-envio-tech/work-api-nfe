import { describe, it, expect } from 'vitest';
import { obterUrlSefaz, obterUrlDistribuicaoDFe, listarAutorizadores } from '../../src/sefaz/sefaz-urls.js';
import { obterAutorizador } from '../../src/sefaz/sefaz-authorizers.js';

describe('SEFAZ Authorizers', () => {
  it('should map SP to SP authorizer', () => {
    expect(obterAutorizador('SP')).toBe('SP');
  });

  it('should map RJ to SVRS', () => {
    expect(obterAutorizador('RJ')).toBe('SVRS');
  });

  it('should map MA to SVAN', () => {
    expect(obterAutorizador('MA')).toBe('SVAN');
  });

  it('should map contingency SP to SVC-AN', () => {
    expect(obterAutorizador('SP', true)).toBe('SVC-AN');
  });

  it('should map contingency AM to SVC-RS', () => {
    expect(obterAutorizador('AM', true)).toBe('SVC-RS');
  });

  it('should throw for invalid UF', () => {
    expect(() => obterAutorizador('XX')).toThrow();
  });
});

describe('SEFAZ URLs', () => {
  it('should resolve SP producao NFeAutorizacao4', () => {
    const url = obterUrlSefaz({ uf: 'SP', ambiente: 'producao' }, 'NFeAutorizacao4');
    expect(url).toContain('nfe.fazenda.sp.gov.br');
    expect(url).toContain('nfeautorizacao4');
  });

  it('should resolve SP homologacao NFeStatusServico4', () => {
    const url = obterUrlSefaz({ uf: 'SP', ambiente: 'homologacao' }, 'NFeStatusServico4');
    expect(url).toContain('homologacao.nfe.fazenda.sp.gov.br');
  });

  it('should resolve RJ via SVRS', () => {
    const url = obterUrlSefaz({ uf: 'RJ', ambiente: 'producao' }, 'NFeAutorizacao4');
    expect(url).toContain('svrs.rs.gov.br');
  });

  it('should resolve MA via SVAN', () => {
    const url = obterUrlSefaz({ uf: 'MA', ambiente: 'producao' }, 'NFeAutorizacao4');
    expect(url).toContain('sefazvirtual.fazenda.gov.br');
  });

  it('should resolve contingency SP via SVC-AN', () => {
    const url = obterUrlSefaz(
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
      const url = obterUrlSefaz({ uf, ambiente: 'producao' }, 'NFeStatusServico4');
      expect(url).toBeTruthy();
      expect(url).toMatch(/^https:\/\//);
    }
  });
});

describe('DistribuicaoDFe', () => {
  it('should resolve producao URL', () => {
    const url = obterUrlDistribuicaoDFe('producao');
    expect(url).toContain('nfe.fazenda.gov.br');
    expect(url).toContain('NFeDistribuicaoDFe');
  });

  it('should resolve homologacao URL', () => {
    const url = obterUrlDistribuicaoDFe('homologacao');
    expect(url).toContain('hom');
  });
});

describe('List Autorizadores', () => {
  it('should list all autorizadores', () => {
    const list = listarAutorizadores();
    expect(list).toContain('SP');
    expect(list).toContain('SVRS');
    expect(list).toContain('SVAN');
    expect(list).toContain('AN');
    expect(list.length).toBeGreaterThanOrEqual(15);
  });
});
