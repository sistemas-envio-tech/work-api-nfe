import { describe, it, expect } from 'vitest';
import { buildConsCadXml } from '../../src/builders/consulta-cadastro-builder.js';

describe('buildConsCadXml', () => {
  it('should build consultation by CNPJ', () => {
    const xml = buildConsCadXml({ UF: 'SP', CNPJ: '08043291000155' });

    expect(xml).toContain('ConsCad');
    expect(xml).toContain('versao="2.00"');
    expect(xml).toContain('<xServ>CONS-CAD</xServ>');
    expect(xml).toContain('<UF>SP</UF>');
    expect(xml).toContain('<CNPJ>08043291000155</CNPJ>');
    expect(xml).not.toContain('<CPF>');
    expect(xml).not.toContain('<IE>');
  });

  it('should build consultation by CPF', () => {
    const xml = buildConsCadXml({ UF: 'MG', CPF: '52998224725' });

    expect(xml).toContain('<UF>MG</UF>');
    expect(xml).toContain('<CPF>52998224725</CPF>');
    expect(xml).not.toContain('<CNPJ>');
  });

  it('should build consultation by IE', () => {
    const xml = buildConsCadXml({ UF: 'RS', IE: '1234567890' });

    expect(xml).toContain('<UF>RS</UF>');
    expect(xml).toContain('<IE>1234567890</IE>');
  });
});
