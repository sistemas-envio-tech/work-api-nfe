import servicosData from './data/servicos-nfe.json' with { type: 'json' };
import { obterAutorizador } from './sefaz-authorizers.js';
import type { NFeServiceName } from './sefaz-services.js';

export type Ambiente = 'producao' | 'homologacao';

interface SefazUrlConfig {
  uf: string;
  ambiente: Ambiente;
  contingencia?: boolean;
}

type ServicosRegistry = Record<string, Record<string, Record<string, string>>>;
const servicos = servicosData as ServicosRegistry;

/** Override manual de URLs (para emergÃªncias sem esperar update do pacote) */
const urlOverrides = new Map<string, string>();

/**
 * Resolve a URL do web service SEFAZ para uma UF/ambiente/serviÃ§o
 */
export function obterUrlSefaz(
  config: SefazUrlConfig,
  serviceName: NFeServiceName
): string {
  // Verificar override manual
  const overrideKey = `${config.uf}:${config.ambiente}:${serviceName}`;
  const override = urlOverrides.get(overrideKey);
  if (override) return override;

  const autorizador = obterAutorizador(config.uf, config.contingencia);
  const ambienteKey = config.ambiente === 'producao' ? 'producao' : 'homologacao';

  const autorizadorServicos = servicos[autorizador];
  if (!autorizadorServicos) {
    throw new Error(`Autorizador nÃ£o encontrado: ${autorizador}`);
  }

  const ambienteServicos = autorizadorServicos[ambienteKey];
  if (!ambienteServicos) {
    throw new Error(`Ambiente nÃ£o encontrado para ${autorizador}: ${ambienteKey}`);
  }

  const url = ambienteServicos[serviceName];
  if (!url) {
    // ServiÃ§os nacionais (AN) como DistribuicaoDFe
    if (serviceName === 'NFeDistribuicaoDFe') {
      const anServicos = servicos['AN']?.[ambienteKey];
      if (anServicos?.[serviceName]) return anServicos[serviceName];
    }

    throw new Error(
      `ServiÃ§o ${serviceName} nÃ£o disponÃ­vel para ${autorizador} em ${ambienteKey}`
    );
  }

  return url;
}

/**
 * Resolve a URL de DistribuiÃ§Ã£o DFe (sempre serviÃ§o AN nacional)
 */
export function obterUrlDistribuicaoDFe(ambiente: Ambiente): string {
  const ambienteKey = ambiente === 'producao' ? 'producao' : 'homologacao';
  const url = servicos['AN']?.[ambienteKey]?.['NFeDistribuicaoDFe'];
  if (!url) throw new Error(`URL DistribuicaoDFe nÃ£o encontrada para ${ambienteKey}`);
  return url;
}

/**
 * Define override manual de URL (para emergÃªncias)
 */
export function definirOverrideUrlSefaz(
  uf: string,
  ambiente: Ambiente,
  serviceName: string,
  url: string
): void {
  urlOverrides.set(`${uf}:${ambiente}:${serviceName}`, url);
}

/**
 * Remove override manual de URL
 */
export function limparOverrideUrlSefaz(
  uf: string,
  ambiente: Ambiente,
  serviceName: string
): void {
  urlOverrides.delete(`${uf}:${ambiente}:${serviceName}`);
}

/**
 * Lista todos os autorizadores disponÃ­veis
 */
export function listarAutorizadores(): string[] {
  return Object.keys(servicos);
}
