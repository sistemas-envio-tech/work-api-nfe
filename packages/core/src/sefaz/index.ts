export {
  getAutorizador,
  getUFsByAutorizador,
  type Autorizador,
} from './sefaz-authorizers.js';

export {
  NFE_SERVICES,
  type ServiceDefinition,
  type NFeServiceName,
} from './sefaz-services.js';

export {
  getSefazUrl,
  getDistribuicaoDFeUrl,
  setSefazUrlOverride,
  clearSefazUrlOverride,
  listAutorizadores,
  type Ambiente,
} from './sefaz-urls.js';

export {
  TIPO_EMISSAO,
  getTipoEmissaoContingencia,
  getContingencyUrl,
  type ContingencyConfig,
} from './contingency.js';
