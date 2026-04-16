import { describe, it, expect } from 'vitest';
import { sanitizeXmlForLog, truncateXml } from '../../src/soap/xml-log-sanitizer.js';

describe('sanitizeXmlForLog', () => {
  it('should mask CNPJ values', () => {
    const xml = '<emit><CNPJ>08043291000155</CNPJ></emit>';
    const sanitized = sanitizeXmlForLog(xml);
    expect(sanitized).toContain('<CNPJ>080**********</CNPJ>');
    expect(sanitized).not.toContain('08043291000155');
  });

  it('should mask CPF values', () => {
    const xml = '<dest><CPF>52998224725</CPF></dest>';
    const sanitized = sanitizeXmlForLog(xml);
    expect(sanitized).toContain('<CPF>529********</CPF>');
  });

  it('should mask email values', () => {
    const xml = '<email>teste@empresa.com</email>';
    const sanitized = sanitizeXmlForLog(xml);
    expect(sanitized).not.toContain('teste@empresa.com');
    expect(sanitized).toContain('<email>tes');
  });

  it('should preserve short values (<=4 chars)', () => {
    const xml = '<UF>SP</UF>';
    // UF is not in sensitive tags, so it won't be touched
    expect(sanitizeXmlForLog(xml)).toBe(xml);
  });

  it('should not mask non-sensitive fields', () => {
    const xml = '<natOp>VENDA</natOp><CFOP>5102</CFOP>';
    expect(sanitizeXmlForLog(xml)).toBe(xml);
  });
});

describe('truncateXml', () => {
  it('should not truncate short XML', () => {
    const xml = '<root>short</root>';
    expect(truncateXml(xml)).toBe(xml);
  });

  it('should truncate long XML', () => {
    const xml = 'a'.repeat(5000);
    const truncated = truncateXml(xml, 100);
    expect(truncated.length).toBeLessThan(200);
    expect(truncated).toContain('truncado');
    expect(truncated).toContain('5000 chars');
  });
});
