import servicosData from './data/servicos-nfe.json' with { type: 'json' };
import { getAutorizador, type Autorizador } from './sefaz-authorizers.js';
import type { NFeServiceName } from './sefaz-services.js';

export type Ambiente = 'producao' | 'homologacao';

interface SefazUrlConfig {
  uf: string;
  ambiente: Ambiente;
  contingencia?: boolean;
}

type ServicosRegistry = Record<string, Record<string, Record<string, string>>>;
const servicos = servicosData as ServicosRegistry;

/** Override manual de URLs (para emergências sem esperar update do pacote) */
const urlOverrides = new Map<string, string>();

/**
 * Resolve a URL do web service SEFAZ para uma UF/ambiente/serviço
 */
export function getSefazUrl(
  config: SefazUrlConfig,
  serviceName: NFeServiceName
): string {
  // Verificar override manual
  const overrideKey = `${config.uf}:${config.ambiente}:${serviceName}`;
  const override = urlOverrides.get(overrideKey);
  if (override) return override;

  const autorizador = getAutorizador(config.uf, config.contingencia);
  const ambienteKey = config.ambiente === 'producao' ? 'producao' : 'homologacao';

  const autorizadorServicos = servicos[autorizador];
  if (!autorizadorServicos) {
    throw new Error(`Autorizador não encontrado: ${autorizador}`);
  }

  const ambienteServicos = autorizadorServicos[ambienteKey];
  if (!ambienteServicos) {
    throw new Error(`Ambiente não encontrado para ${autorizador}: ${ambienteKey}`);
  }

  const url = ambienteServicos[serviceName];
  if (!url) {
    // Serviços nacionais (AN) como DistribuicaoDFe
    if (serviceName === 'NFeDistribuicaoDFe') {
      const anServicos = servicos['AN']?.[ambienteKey];
      if (anServicos?.[serviceName]) return anServicos[serviceName];
    }

    throw new Error(
      `Serviço ${serviceName} não disponível para ${autorizador} em ${ambienteKey}`
    );
  }

  return url;
}

/**
 * Resolve a URL de Distribuição DFe (sempre serviço AN nacional)
 */
export function getDistribuicaoDFeUrl(ambiente: Ambiente): string {
  const ambienteKey = ambiente === 'producao' ? 'producao' : 'homologacao';
  const url = servicos['AN']?.[ambienteKey]?.['NFeDistribuicaoDFe'];
  if (!url) throw new Error(`URL DistribuicaoDFe não encontrada para ${ambienteKey}`);
  return url;
}

/**
 * Define override manual de URL (para emergências)
 */
export function setSefazUrlOverride(
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
export function clearSefazUrlOverride(
  uf: string,
  ambiente: Ambiente,
  serviceName: string
): void {
  urlOverrides.delete(`${uf}:${ambiente}:${serviceName}`);
}

/**
 * Lista todos os autorizadores disponíveis
 */
export function listAutorizadores(): string[] {
  return Object.keys(servicos);
}
