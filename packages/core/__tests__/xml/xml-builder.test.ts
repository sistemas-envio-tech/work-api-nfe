import { describe, it, expect } from 'vitest';
import { XmlBuilder } from '../../src/xml/xml-builder.js';

describe('XmlBuilder', () => {
  it('should build simple XML', () => {
    const xml = XmlBuilder.build('root', {
      name: 'test',
      value: '123',
    });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<root>');
    expect(xml).toContain('<name>test</name>');
    expect(xml).toContain('<value>123</value>');
    expect(xml).toContain('</root>');
  });

  it('should build XML with namespace', () => {
    const xml = XmlBuilder.build(
      'NFe',
      { infNFe: { '@versao': '4.00', ide: { cUF: '35' } } },
      'http://www.portalfiscal.inf.br/nfe'
    );

    expect(xml).toContain('xmlns="http://www.portalfiscal.inf.br/nfe"');
    expect(xml).toContain('<NFe');
    expect(xml).toContain('<infNFe');
    expect(xml).toContain('versao="4.00"');
    expect(xml).toContain('<cUF>35</cUF>');
  });

  it('should handle nested objects preserving order', () => {
    const xml = XmlBuilder.build('root', {
      first: 'a',
      second: { nested: 'b' },
      third: 'c',
    });

    const firstIdx = xml.indexOf('<first>');
    const secondIdx = xml.indexOf('<second>');
    const thirdIdx = xml.indexOf('<third>');

    expect(firstIdx).toBeLessThan(secondIdx);
    expect(secondIdx).toBeLessThan(thirdIdx);
  });

  it('should handle arrays (repeated elements)', () => {
    const xml = XmlBuilder.build('root', {
      det: [
        { prod: { xProd: 'Item 1' } },
        { prod: { xProd: 'Item 2' } },
      ],
    });

    expect(xml).toContain('<det><prod><xProd>Item 1</xProd></prod></det>');
    expect(xml).toContain('<det><prod><xProd>Item 2</xProd></prod></det>');
  });

  it('should skip null and undefined values', () => {
    const xml = XmlBuilder.build('root', {
      present: 'yes',
      absent: null,
      missing: undefined,
    });

    expect(xml).toContain('<present>yes</present>');
    expect(xml).not.toContain('absent');
    expect(xml).not.toContain('missing');
  });

  it('should handle attributes with @ prefix', () => {
    const xml = XmlBuilder.build('root', {
      '@versao': '4.00',
      '@Id': 'NFe123',
      child: 'value',
    });

    expect(xml).toContain('versao="4.00"');
    expect(xml).toContain('Id="NFe123"');
  });
});

describe('XmlBuilder.buildFragment', () => {
  it('should build XML without declaration', () => {
    const xml = XmlBuilder.buildFragment('item', { name: 'test' });
    expect(xml).not.toContain('<?xml');
    expect(xml).toContain('<item><name>test</name></item>');
  });
});
