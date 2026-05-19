import type { XmlObject } from '@acbr-node/core';
import type { Pagamento } from '../types/nfe.js';
import { formatarDecimal } from './det-builder.js';

/**
 * Monta o grupo <pag> da NFe
 */
export function buildPag(pag: Pagamento): XmlObject {
  const obj: XmlObject = {};

  obj.detPag = pag.detPag.map(dp => {
    const detPag: XmlObject = {};

    if (dp.indPag !== undefined) detPag.indPag = String(dp.indPag);
    detPag.tPag = dp.tPag;
    if (dp.xPag) detPag.xPag = dp.xPag;
    detPag.vPag = formatarDecimal(dp.vPag, 2);

    if (dp.card) {
      detPag.card = {
        tpIntegra: String(dp.card.tpIntegra),
      };
      if (dp.card.CNPJ) (detPag.card as XmlObject).CNPJ = dp.card.CNPJ;
      if (dp.card.tBand) (detPag.card as XmlObject).tBand = dp.card.tBand;
      if (dp.card.cAut) (detPag.card as XmlObject).cAut = dp.card.cAut;
    }

    return detPag;
  });

  if (pag.vTroco !== undefined) {
    obj.vTroco = formatarDecimal(pag.vTroco, 2);
  }

  return obj;
}
