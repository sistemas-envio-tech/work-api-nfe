import { describe, it, expect } from 'vitest';
import { buildManifestacaoXml } from '../../src/events/manifestacao.js';

describe('buildManifestacaoXml', () => {
  const baseParams = {
    tpAmb: 2,
    CNPJ: '08043291000155',
    chNFe: '35230308043291000155550010000010011003290410',
    dhEvento: '2023-03-15T10:30:00-03:00',
  };

  it('should build ciencia event (210210)', () => {
    const xml = buildManifestacaoXml({ ...baseParams, tipo: 'ciencia' });

    expect(xml).toContain('<tpEvento>210210</tpEvento>');
    expect(xml).toContain('<descEvento>Ciencia da Operacao</descEvento>');
    expect(xml).toContain('<cOrgao>91</cOrgao>'); // AN
    expect(xml).toContain('<nSeqEvento>1</nSeqEvento>');
  });

  it('should build confirmacao event (210200)', () => {
    const xml = buildManifestacaoXml({ ...baseParams, tipo: 'confirmacao' });

    expect(xml).toContain('<tpEvento>210200</tpEvento>');
    expect(xml).toContain('<descEvento>Confirmacao da Operacao</descEvento>');
  });

  it('should build desconhecimento event (210220)', () => {
    const xml = buildManifestacaoXml({ ...baseParams, tipo: 'desconhecimento' });

    expect(xml).toContain('<tpEvento>210220</tpEvento>');
    expect(xml).toContain('<descEvento>Desconhecimento da Operacao</descEvento>');
  });

  it('should build nao_realizada event (210240) with justificativa', () => {
    const xml = buildManifestacaoXml({
      ...baseParams,
      tipo: 'nao_realizada',
      xJust: 'Pedido cancelado pelo cliente',
    });

    expect(xml).toContain('<tpEvento>210240</tpEvento>');
    expect(xml).toContain('<descEvento>Operacao nao Realizada</descEvento>');
    expect(xml).toContain('<xJust>Pedido cancelado pelo cliente</xJust>');
  });

  it('should include correct ID format', () => {
    const xml = buildManifestacaoXml({ ...baseParams, tipo: 'ciencia' });

    // ID = ID + tpEvento + chNFe + nSeqEvento (2 dígitos)
    expect(xml).toContain('Id="ID21021035230308043291000155550010000010011003290410');
  });
});
