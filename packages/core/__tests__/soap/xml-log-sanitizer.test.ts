import { describe, it, expect } from 'vitest';
import { sanearXmlParaLog, truncarXml } from '../../src/soap/xml-log-sanitizer.js';

describe('sanearXmlParaLog', () => {
  it('should mask CNPJ values', () => {
    const xml = '<emit><CNPJ>08043291000155</CNPJ></emit>';
    const sanitized = sanearXmlParaLog(xml);
    expect(sanitized).toContain('<CNPJ>080**********</CNPJ>');
    expect(sanitized).not.toContain('08043291000155');
  });

  it('should mask CPF values', () => {
    const xml = '<dest><CPF>52998224725</CPF></dest>';
    const sanitized = sanearXmlParaLog(xml);
    expect(sanitized).toContain('<CPF>529********</CPF>');
  });

  it('should mask email values', () => {
    const xml = '<email>teste@empresa.com</email>';
    const sanitized = sanearXmlParaLog(xml);
    expect(sanitized).not.toContain('teste@empresa.com');
    expect(sanitized).toContain('<email>tes');
  });

  it('should preserve short values (<=4 chars)', () => {
    const xml = '<UF>SP</UF>';
    // UF is not in sensitive tags, so it won't be touched
    expect(sanearXmlParaLog(xml)).toBe(xml);
  });

  it('should not mask non-sensitive fields', () => {
    const xml = '<natOp>VENDA</natOp><CFOP>5102</CFOP>';
    expect(sanearXmlParaLog(xml)).toBe(xml);
  });
});

describe('truncarXml', () => {
  it('should not truncate short XML', () => {
    const xml = '<root>short</root>';
    expect(truncarXml(xml)).toBe(xml);
  });

  it('should truncate long XML', () => {
    const xml = 'a'.repeat(5000);
    const truncated = truncarXml(xml, 100);
    expect(truncated.length).toBeLessThan(200);
    expect(truncated).toContain('truncado');
    expect(truncated).toContain('5000 chars');
  });
});
