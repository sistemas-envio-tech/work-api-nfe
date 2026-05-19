import type { XmlObject } from '@acbr-node/core';
import type { Transporte } from '../types/nfe.js';
import { formatarDecimal } from './det-builder.js';

/**
 * Monta o grupo <transp> da NFe
 */
export function buildTransp(transp: Transporte): XmlObject {
  const obj: XmlObject = {
    modFrete: String(transp.modFrete),
  };

  if (transp.transporta) {
    const t = transp.transporta;
    const transporta: XmlObject = {};
    if (t.CNPJ) transporta.CNPJ = t.CNPJ;
    else if (t.CPF) transporta.CPF = t.CPF;
    if (t.xNome) transporta.xNome = t.xNome;
    if (t.IE) transporta.IE = t.IE;
    if (t.xEnder) transporta.xEnder = t.xEnder;
    if (t.xMun) transporta.xMun = t.xMun;
    if (t.UF) transporta.UF = t.UF;
    obj.transporta = transporta;
  }

  if (transp.vol && transp.vol.length > 0) {
    obj.vol = transp.vol.map(v => {
      const vol: XmlObject = {};
      if (v.qVol !== undefined) vol.qVol = String(v.qVol);
      if (v.esp) vol.esp = v.esp;
      if (v.marca) vol.marca = v.marca;
      if (v.nVol) vol.nVol = v.nVol;
      if (v.pesoL !== undefined) vol.pesoL = formatarDecimal(v.pesoL, 3);
      if (v.pesoB !== undefined) vol.pesoB = formatarDecimal(v.pesoB, 3);
      return vol;
    });
  }

  return obj;
}
