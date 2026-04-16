import { getAutorizador } from './sefaz-authorizers.js';
import { getSefazUrl, type Ambiente } from './sefaz-urls.js';
import type { NFeServiceName } from './sefaz-services.js';

export interface ContingencyConfig {
  uf: string;
  ambiente: Ambiente;
  motivoContingencia: string;
  dhContingencia: string;
}

/**
 * Tipo de emissão baseado no modo
 */
export const TIPO_EMISSAO = {
  NORMAL: 1,
  FS_IA: 2,
  SCAN: 3,
  EPEC: 4,
  FS_DA: 5,
  SVC_AN: 6,
  SVC_RS: 7,
  OFFLINE: 9,
} as const;

/**
 * Determina o tipo de emissão para contingência SVC
 */
export function getTipoEmissaoContingencia(uf: string): number {
  const autorizador = getAutorizador(uf, true);
  return autorizador === 'SVC-AN' ? TIPO_EMISSAO.SVC_AN : TIPO_EMISSAO.SVC_RS;
}

/**
 * Resolve URL de contingência para uma UF/serviço
 */
export function getContingencyUrl(
  uf: string,
  ambiente: Ambiente,
  serviceName: NFeServiceName
): string {
  return getSefazUrl({ uf, ambiente, contingencia: true }, serviceName);
}
