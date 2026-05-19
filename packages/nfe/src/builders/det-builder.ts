import type { XmlObject } from '@acbr-node/core';
import type { Detalhe, Produto } from '../types/nfe.js';
import { buildImposto } from './imposto-builder.js';

/**
 * Monta o grupo <det> da NFe (produto + impostos)
 */
export function buildDet(det: Detalhe): XmlObject {
  const obj: XmlObject = {
    '@nItem': String(det.nItem),
    prod: buildProd(det.prod),
    imposto: buildImposto(det.imposto),
  };

  if (det.infAdProd) {
    obj.infAdProd = det.infAdProd;
  }

  return obj;
}

function buildProd(prod: Produto): XmlObject {
  const obj: XmlObject = {
    cProd: prod.cProd,
    cEAN: prod.cEAN,
    xProd: prod.xProd,
    NCM: prod.NCM,
  };

  if (prod.CEST) obj.CEST = prod.CEST;

  obj.CFOP = prod.CFOP;
  obj.uCom = prod.uCom;
  obj.qCom = formatarDecimal(prod.qCom, 4);
  obj.vUnCom = formatarDecimal(prod.vUnCom, 10);
  obj.vProd = formatarDecimal(prod.vProd, 2);
  obj.cEANTrib = prod.cEANTrib;
  obj.uTrib = prod.uTrib;
  obj.qTrib = formatarDecimal(prod.qTrib, 4);
  obj.vUnTrib = formatarDecimal(prod.vUnTrib, 10);

  if (prod.vFrete !== undefined) obj.vFrete = formatarDecimal(prod.vFrete, 2);
  if (prod.vSeg !== undefined) obj.vSeg = formatarDecimal(prod.vSeg, 2);
  if (prod.vDesc !== undefined) obj.vDesc = formatarDecimal(prod.vDesc, 2);
  if (prod.vOutro !== undefined) obj.vOutro = formatarDecimal(prod.vOutro, 2);

  obj.indTot = String(prod.indTot);

  if (prod.xPed) obj.xPed = prod.xPed;
  if (prod.nItemPed) obj.nItemPed = prod.nItemPed;

  return obj;
}

/**
 * Formata nÃºmero decimal com casas fixas (sem notaÃ§Ã£o cientÃ­fica)
 */
export function formatarDecimal(value: number, decimals: number): string {
  return value.toFixed(decimals);
}
