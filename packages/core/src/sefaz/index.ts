export {
  obterAutorizador,
  obterUFsPorAutorizador,
  type Autorizador,
} from './sefaz-authorizers.js';

export {
  NFE_SERVICES,
  type ServiceDefinition,
  type NFeServiceName,
} from './sefaz-services.js';

export {
  obterUrlSefaz,
  obterUrlDistribuicaoDFe,
  definirOverrideUrlSefaz,
  limparOverrideUrlSefaz,
  listarAutorizadores,
  type Ambiente,
} from './sefaz-urls.js';

export {
  TIPO_EMISSAO,
  obterTipoEmissaoContingencia,
  obterUrlContingencia,
  type ContingencyConfig,
} from './contingency.js';
