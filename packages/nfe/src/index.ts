// Client
export { NFeClient, type NFeClientConfig, type EmpresaConfig } from './nfe-client.js';

// Types
export * from './types/index.js';

// Builders (for advanced usage)
export {
  buildNFeXml,
  buildConsStatServXml,
  buildConsSitNFeXml,
  buildInutNFeXml,
  buildConsReciNFeXml,
  buildEnviNFeXml,
} from './builders/nfe-xml-builder.js';
export { buildConsCadXml, type ConsultaCadastroParams } from './builders/consulta-cadastro-builder.js';
export { buildDistDFeXml, type DistribuicaoDFeParams } from './builders/distribuicao-builder.js';

// Events
export { buildCancelamentoXml, type CancelamentoParams } from './events/cancelamento.js';
export { buildCartaCorrecaoXml, type CartaCorrecaoParams } from './events/carta-correcao.js';
export { buildManifestacaoXml, type ManifestacaoParams, type TipoManifestacao } from './events/manifestacao.js';

// Parsers (for advanced usage)
export {
  parseStatusServico,
  parseAutorizacao,
  parseConsultaProtocolo,
  parseInutilizacao,
  parseEvento,
  parseConsultaRecibo,
} from './parsers/response-parser.js';
export { parseConsultaCadastro, type RetornoConsultaCadastro, type InfCadConsulta } from './parsers/consulta-cadastro-parser.js';
export { parseDistribuicaoDFe, type RetornoDistribuicaoDFe, type DocZipDFe } from './parsers/distribuicao-parser.js';

// Validation
export { validateNFe, validateBusinessRules } from './validation/nfe-validator.js';
