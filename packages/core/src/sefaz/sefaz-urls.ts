import servicosData from './data/servicos-nfe.json' with { type: 'json' };
import { obterAutorizador } from './sefaz-authorizers.js';
import type { NFeServiceName } from './sefaz-services.js';

export type Ambiente = 'producao' | 'homologacao';

interface SefazUrlConfig {
  uf: string;
  ambiente: Ambiente;
  contingencia?: boolean;
  /** 55=NFe (default), 65=NFCe. Roteia para autorizador NFCe quando 65. */
  modelo?: 55 | 65;
}

type ServicosRegistry = Record<string, Record<string, Record<string, string>>>;
const servicos = servicosData as ServicosRegistry;

/** Override manual de URLs (para emergencias sem esperar update do pacote) */
const urlOverrides = new Map<string, string>();

/**
 * Resolve a URL do web service SEFAZ para uma UF/ambiente/servico.
 *
 * Para NFCe (modelo=65), o autorizador eh roteado para *-NFCe (SVRS-NFCe ou
 * o autorizador NFCe proprio da UF). Os service names tambem mudam (ex.:
 * NFeAutorizacao4 -> NFCeAutorizacao4) — passe o serviceName apropriado.
 */
export function obterUrlSefaz(
  config: SefazUrlConfig,
  serviceName: NFeServiceName,
): string {
  // Verificar override manual (key inclui modelo para nao colidir NFe vs NFCe)
  const modelo = config.modelo ?? 55;
  const overrideKey = `${config.uf}:${config.ambiente}:${modelo}:${serviceName}`;
  const override = urlOverrides.get(overrideKey);
  if (override) return override;

  const autorizador = obterAutorizador(config.uf, config.contingencia, modelo);
  const ambienteKey = config.ambiente === 'producao' ? 'producao' : 'homologacao';

  const autorizadorServicos = servicos[autorizador];
  if (!autorizadorServicos) {
    throw new Error(`Autorizador nao encontrado: ${autorizador}`);
  }

  const ambienteServicos = autorizadorServicos[ambienteKey];
  if (!ambienteServicos) {
    throw new Error(`Ambiente nao encontrado para ${autorizador}: ${ambienteKey}`);
  }

  const url = ambienteServicos[serviceName];
  if (!url) {
    // Servicos nacionais (AN) como DistribuicaoDFe
    if (serviceName === 'NFeDistribuicaoDFe') {
      const anServicos = servicos['AN']?.[ambienteKey];
      if (anServicos?.[serviceName]) return anServicos[serviceName];
    }

    throw new Error(
      `Servico ${serviceName} nao disponivel para ${autorizador} em ${ambienteKey}. ` +
      `Use definirOverrideUrlSefaz() para configurar uma URL custom.`,
    );
  }

  return url;
}

/**
 * Resolve a URL de Distribuicao DFe (sempre servico AN nacional)
 */
export function obterUrlDistribuicaoDFe(ambiente: Ambiente): string {
  const ambienteKey = ambiente === 'producao' ? 'producao' : 'homologacao';
  const url = servicos['AN']?.[ambienteKey]?.['NFeDistribuicaoDFe'];
  if (!url) throw new Error(`URL DistribuicaoDFe nao encontrada para ${ambienteKey}`);
  return url;
}

/**
 * Define override manual de URL (para emergencias).
 *
 * @param modelo - 55 ou 65. Necessario porque NFe e NFCe sao endpoints
 *   diferentes para o mesmo serviceName logico.
 */
export function definirOverrideUrlSefaz(
  uf: string,
  ambiente: Ambiente,
  serviceName: string,
  url: string,
  modelo: 55 | 65 = 55,
): void {
  urlOverrides.set(`${uf}:${ambiente}:${modelo}:${serviceName}`, url);
}

/**
 * Remove override manual de URL.
 */
export function limparOverrideUrlSefaz(
  uf: string,
  ambiente: Ambiente,
  serviceName: string,
  modelo: 55 | 65 = 55,
): void {
  urlOverrides.delete(`${uf}:${ambiente}:${modelo}:${serviceName}`);
}

/**
 * Lista todos os autorizadores disponiveis no JSON.
 */
export function listarAutorizadores(): string[] {
  return Object.keys(servicos);
}
