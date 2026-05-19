import { obterAutorizador } from './sefaz-authorizers.js';
import { obterUrlSefaz, type Ambiente } from './sefaz-urls.js';
import type { NFeServiceName } from './sefaz-services.js';

export interface ContingencyConfig {
  uf: string;
  ambiente: Ambiente;
  motivoContingencia: string;
  dhContingencia: string;
}

/**
 * Tipo de emissÃ£o baseado no modo
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
 * Determina o tipo de emissÃ£o para contingÃªncia SVC
 */
export function obterTipoEmissaoContingencia(uf: string): number {
  const autorizador = obterAutorizador(uf, true);
  return autorizador === 'SVC-AN' ? TIPO_EMISSAO.SVC_AN : TIPO_EMISSAO.SVC_RS;
}

/**
 * Resolve URL de contingÃªncia para uma UF/serviÃ§o
 */
export function obterUrlContingencia(
  uf: string,
  ambiente: Ambiente,
  serviceName: NFeServiceName
): string {
  return obterUrlSefaz({ uf, ambiente, contingencia: true }, serviceName);
}
