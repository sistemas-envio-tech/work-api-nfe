import { describe, it, expect } from 'vitest';
import {
  TipoOperacao, FinalidadeNFe, ModeloDocumento, Ambiente,
  FormaPagamento, TipoEvento, RegimeTributario, ModalidadeFrete,
} from '../../src/types/enums.js';

describe('Enums', () => {
  it('TipoOperacao values', () => {
    expect(TipoOperacao.ENTRADA).toBe(0);
    expect(TipoOperacao.SAIDA).toBe(1);
  });

  it('FinalidadeNFe values', () => {
    expect(FinalidadeNFe.NORMAL).toBe(1);
    expect(FinalidadeNFe.COMPLEMENTAR).toBe(2);
    expect(FinalidadeNFe.AJUSTE).toBe(3);
    expect(FinalidadeNFe.DEVOLUCAO).toBe(4);
  });

  it('ModeloDocumento values', () => {
    expect(ModeloDocumento.NFE).toBe(55);
    expect(ModeloDocumento.NFCE).toBe(65);
  });

  it('Ambiente values', () => {
    expect(Ambiente.PRODUCAO).toBe(1);
    expect(Ambiente.HOMOLOGACAO).toBe(2);
  });

  it('FormaPagamento values', () => {
    expect(FormaPagamento.DINHEIRO).toBe('01');
    expect(FormaPagamento.PIX).toBe('17');
    expect(FormaPagamento.SEM_PAGAMENTO).toBe('90');
  });

  it('TipoEvento values', () => {
    expect(TipoEvento.CANCELAMENTO).toBe('110111');
    expect(TipoEvento.CARTA_CORRECAO).toBe('110110');
  });

  it('RegimeTributario values', () => {
    expect(RegimeTributario.SIMPLES_NACIONAL).toBe(1);
    expect(RegimeTributario.NORMAL).toBe(3);
  });

  it('ModalidadeFrete values', () => {
    expect(ModalidadeFrete.EMITENTE).toBe(0);
    expect(ModalidadeFrete.SEM_FRETE).toBe(9);
  });
});
