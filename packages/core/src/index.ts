// Certificate
export {
  CertificateManager,
  CertificateWatcher,
  type CertificateOptions,
  type CertificateData,
  type CertificateInfo,
  type CertificateWatcherOptions,
  type CertificateStatus,
} from './certificate/index.js';

// XML
export {
  XmlBuilder,
  XmlParser,
  XmlSigner,
  comoNoXml,
  comoArrayXml,
  type XmlObject,
  type XmlSignOptions,
  type XmlNode,
  type XmlValue,
  type XmlScalar,
} from './xml/index.js';

// SOAP
export {
  SoapClient,
  buildSoapEnvelope,
  WSDL_NAMESPACES,
  sanearXmlParaLog,
  truncarXml,
  type SoapClientOptions,
  type SoapRequest,
  type SoapResponse,
} from './soap/index.js';

// SEFAZ
export {
  obterAutorizador,
  obterUFsPorAutorizador,
  obterUrlSefaz,
  obterUrlDistribuicaoDFe,
  definirOverrideUrlSefaz,
  limparOverrideUrlSefaz,
  listarAutorizadores,
  NFE_SERVICES,
  TIPO_EMISSAO,
  obterTipoEmissaoContingencia,
  obterUrlContingencia,
  type Autorizador,
  type Ambiente,
  type ServiceDefinition,
  type NFeServiceName,
  type ContingencyConfig,
} from './sefaz/index.js';

// Utils
export {
  cnpjValido,
  cpfValido,
  ieValida,
  formatarCNPJ,
  formatarCPF,
  gerarChaveAcesso,
  calcularMod11,
  validarChaveAcesso,
  gerarCodigoAleatorio,
  obterOffsetTimezone,
  formatarDataNFe,
  agoraNFe,
  executarComRetry,
  CircuitBreaker,
  CircuitState,
  type CircuitBreakerOptions,
  IBGE_UF,
  obterCodigoUF,
  obterUFPorCodigo,
  type RetryOptions,
} from './utils/index.js';

// Errors
export {
  AcbrError,
  CertificateError,
  SefazError,
  ValidationError,
  SoapError,
} from './errors/index.js';

// Logging
export {
  criarLogger,
  loggerNoop,
  type LoggerInterface,
  type LoggerOptions,
  type LogLevel,
} from './logging/index.js';
