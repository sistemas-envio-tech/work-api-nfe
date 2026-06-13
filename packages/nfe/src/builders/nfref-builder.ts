import type { XmlObject } from '@acbr-node/core';
import type { NFref } from '../types/nfe.js';

/**
 * Monta um grupo <NFref> com EXATAMENTE 1 das tags filhas suportadas
 * (refNFe | refNFeSig | refCTe). Conforme leiauteNFe_v4.00.xsd, NFref
 * e um choice — so pode ter 1 ref por grupo. Pra varias refs (ex: 3
 * NFes), o caller envia 3 entradas em NFe.nfRef[].
 *
 * Validacao: precisa ter exatamente 1 das chaves preenchidas. Sem
 * nenhuma → throw (caller deve filtrar antes ou pedir refNFe).
 */
export function buildNFref(ref: NFref): XmlObject {
  const obj: XmlObject = {};
  let preenchidas = 0;

  if (ref.refNFe) {
    obj.refNFe = ref.refNFe;
    preenchidas++;
  }
  if (ref.refNFeSig) {
    obj.refNFeSig = ref.refNFeSig;
    preenchidas++;
  }
  if (ref.refCTe) {
    obj.refCTe = ref.refCTe;
    preenchidas++;
  }

  if (preenchidas === 0) {
    throw new Error('NFref vazio — informe refNFe, refNFeSig ou refCTe.');
  }
  if (preenchidas > 1) {
    throw new Error('NFref aceita apenas 1 tipo de referencia por grupo. Crie entradas separadas em nfRef[] pra cada chave.');
  }

  return obj;
}
