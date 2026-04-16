import type { XmlObject } from '@acbr-node/core';
import type { Cobranca } from '../types/nfe.js';
import { formatDecimal } from './det-builder.js';

/**
 * Monta o grupo <cobr> da NFe
 */
export function buildCobr(cobr: Cobranca): XmlObject {
  const obj: XmlObject = {};

  if (cobr.fat) {
    const fat: XmlObject = {};
    if (cobr.fat.nFat) fat.nFat = cobr.fat.nFat;
    if (cobr.fat.vOrig !== undefined) fat.vOrig = formatDecimal(cobr.fat.vOrig, 2);
    if (cobr.fat.vDesc !== undefined) fat.vDesc = formatDecimal(cobr.fat.vDesc, 2);
    if (cobr.fat.vLiq !== undefined) fat.vLiq = formatDecimal(cobr.fat.vLiq, 2);
    obj.fat = fat;
  }

  if (cobr.dup && cobr.dup.length > 0) {
    obj.dup = cobr.dup.map(d => ({
      nDup: d.nDup,
      dVenc: d.dVenc,
      vDup: formatDecimal(d.vDup, 2),
    }));
  }

  return obj;
}
