import type { XmlObject } from '@acbr-node/core';
import type { Emitente } from '../types/nfe.js';
import { buildEndereco } from './endereco-builder.js';

/**
 * Monta o grupo <emit> da NFe
 */
export function buildEmit(emit: Emitente): XmlObject {
  const obj: XmlObject = {};

  if (emit.CNPJ) obj.CNPJ = emit.CNPJ;
  else if (emit.CPF) obj.CPF = emit.CPF;

  obj.xNome = emit.xNome;

  if (emit.xFant) obj.xFant = emit.xFant;

  obj.enderEmit = buildEndereco(emit.enderEmit);
  obj.IE = emit.IE;

  if (emit.IEST) obj.IEST = emit.IEST;
  if (emit.IM) obj.IM = emit.IM;
  if (emit.CNAE) obj.CNAE = emit.CNAE;

  obj.CRT = String(emit.CRT);

  return obj;
}
