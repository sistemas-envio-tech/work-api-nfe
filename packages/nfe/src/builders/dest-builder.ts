import type { XmlObject } from '@acbr-node/core';
import type { Destinatario } from '../types/nfe.js';
import { buildEndereco } from './endereco-builder.js';

/**
 * Monta o grupo <dest> da NFe
 */
export function buildDest(dest: Destinatario): XmlObject {
  const obj: XmlObject = {};

  if (dest.CNPJ) obj.CNPJ = dest.CNPJ;
  else if (dest.CPF) obj.CPF = dest.CPF;
  else if (dest.idEstrangeiro) obj.idEstrangeiro = dest.idEstrangeiro;

  if (dest.xNome) obj.xNome = dest.xNome;

  if (dest.enderDest) {
    obj.enderDest = buildEndereco(dest.enderDest);
  }

  obj.indIEDest = String(dest.indIEDest);

  if (dest.IE) obj.IE = dest.IE;
  if (dest.ISUF) obj.ISUF = dest.ISUF;
  if (dest.IM) obj.IM = dest.IM;
  if (dest.email) obj.email = dest.email;

  return obj;
}
