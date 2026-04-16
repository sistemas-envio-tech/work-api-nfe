import { createHash } from 'node:crypto';
import type { XmlObject } from '@acbr-node/core';
import type { ResponsavelTecnico } from '../types/nfe.js';

/**
 * Monta o grupo <infRespTec> da NFe
 *
 * Se idCSRT e CSRT token forem informados, calcula o hashCSRT:
 * hashCSRT = SHA-256( CSRT + chaveAcesso ) em base64
 */
export function buildInfRespTec(
  respTec: ResponsavelTecnico,
  chaveAcesso?: string,
  csrtToken?: string
): XmlObject {
  const obj: XmlObject = {
    CNPJ: respTec.CNPJ,
    xContato: respTec.xContato,
    email: respTec.email,
    fone: respTec.fone,
  };

  // Calcular hashCSRT se token e chave disponíveis
  if (respTec.idCSRT && csrtToken && chaveAcesso) {
    obj.idCSRT = String(respTec.idCSRT).padStart(2, '0');
    obj.hashCSRT = calculateCSRTHash(csrtToken, chaveAcesso);
  } else if (respTec.idCSRT && respTec.hashCSRT) {
    // Hash já calculado externamente
    obj.idCSRT = String(respTec.idCSRT).padStart(2, '0');
    obj.hashCSRT = respTec.hashCSRT;
  }

  return obj;
}

/**
 * Calcula hash CSRT: Base64( SHA-256( CSRT + chaveAcesso ) )
 *
 * O CSRT (Código de Segurança do Responsável Técnico) é um token
 * fornecido pela SEFAZ ao responsável técnico do software.
 */
export function calculateCSRTHash(csrtToken: string, chaveAcesso: string): string {
  const data = csrtToken + chaveAcesso;
  return createHash('sha256').update(data).digest('base64');
}
