import type { XmlObject } from '@acbr-node/core';
import type { InformacaoAdicional } from '../types/nfe.js';

/**
 * Monta o grupo <infAdic> da NFe
 */
export function buildInfAdic(infAdic: InformacaoAdicional): XmlObject {
  const obj: XmlObject = {};

  if (infAdic.infAdFisco) obj.infAdFisco = infAdic.infAdFisco;
  if (infAdic.infCpl) obj.infCpl = infAdic.infCpl;

  if (infAdic.obsCont && infAdic.obsCont.length > 0) {
    obj.obsCont = infAdic.obsCont.map(obs => ({
      '@xCampo': obs.xCampo,
      xTexto: obs.xTexto,
    }));
  }

  if (infAdic.obsFisco && infAdic.obsFisco.length > 0) {
    obj.obsFisco = infAdic.obsFisco.map(obs => ({
      '@xCampo': obs.xCampo,
      xTexto: obs.xTexto,
    }));
  }

  return obj;
}
