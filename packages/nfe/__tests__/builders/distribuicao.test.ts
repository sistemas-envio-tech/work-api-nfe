import { describe, it, expect } from 'vitest';
import { buildDistDFeXml } from '../../src/builders/distribuicao-builder.js';

describe('buildDistDFeXml', () => {
  it('should build distNSU query (pagination)', () => {
    const xml = buildDistDFeXml({
      tpAmb: 2,
      CNPJ: '08043291000155',
      cUFAutor: 35,
      distNSU: '0',
    });

    expect(xml).toContain('distDFeInt');
    expect(xml).toContain('versao="1.01"');
    expect(xml).toContain('<tpAmb>2</tpAmb>');
    expect(xml).toContain('<CNPJ>08043291000155</CNPJ>');
    expect(xml).toContain('<cUFAutor>35</cUFAutor>');
    expect(xml).toContain('<ultNSU>000000000000000</ultNSU>');
  });

  it('should build consNSU query (specific NSU)', () => {
    const xml = buildDistDFeXml({
      tpAmb: 2,
      CNPJ: '08043291000155',
      cUFAutor: 35,
      consNSU: '123456',
    });

    expect(xml).toContain('<NSU>000000000123456</NSU>');
    expect(xml).not.toContain('ultNSU');
  });

  it('should build consChNFe query (by access key)', () => {
    const chNFe = '35230308043291000155550010000010011003290410';
    const xml = buildDistDFeXml({
      tpAmb: 2,
      CNPJ: '08043291000155',
      cUFAutor: 35,
      chNFe,
    });

    expect(xml).toContain(`<chNFe>${chNFe}</chNFe>`);
    expect(xml).not.toContain('ultNSU');
    expect(xml).not.toContain('consNSU');
  });

  it('should pad NSU to 15 digits', () => {
    const xml = buildDistDFeXml({
      tpAmb: 2,
      CNPJ: '08043291000155',
      cUFAutor: 35,
      distNSU: '42',
    });

    expect(xml).toContain('<ultNSU>000000000000042</ultNSU>');
  });
});
