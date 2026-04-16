import type { XmlObject } from '@acbr-node/core';
import type { Endereco } from '../types/nfe.js';

/**
 * Monta grupo de endereço (enderEmit / enderDest)
 */
export function buildEndereco(end: Endereco): XmlObject {
  const obj: XmlObject = {
    xLgr: end.xLgr,
    nro: end.nro,
  };

  if (end.xCpl) obj.xCpl = end.xCpl;

  obj.xBairro = end.xBairro;
  obj.cMun = String(end.cMun);
  obj.xMun = end.xMun;
  obj.UF = end.UF;
  obj.CEP = end.CEP;

  if (end.cPais !== undefined) obj.cPais = String(end.cPais);
  if (end.xPais) obj.xPais = end.xPais;
  if (end.fone) obj.fone = end.fone;

  return obj;
}
