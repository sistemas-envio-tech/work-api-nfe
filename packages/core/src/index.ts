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
  asXmlNode,
  asXmlArray,
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
  sanitizeXmlForLog,
  truncateXml,
  type SoapClientOptions,
  type SoapRequest,
  type SoapResponse,
} from './soap/index.js';

// SEFAZ
export {
  getAutorizador,
  getUFsByAutorizador,
  getSefazUrl,
  getDistribuicaoDFeUrl,
  setSefazUrlOverride,
  clearSefazUrlOverride,
  listAutorizadores,
  NFE_SERVICES,
  TIPO_EMISSAO,
  getTipoEmissaoContingencia,
  getContingencyUrl,
  type Autorizador,
  type Ambiente,
  type ServiceDefinition,
  type NFeServiceName,
  type ContingencyConfig,
} from './sefaz/index.js';

// Utils
export {
  isValidCNPJ,
  isValidCPF,
  isValidIE,
  formatCNPJ,
  formatCPF,
  generateAccessKey,
  calculateMod11,
  validateAccessKey,
  generateRandomCode,
  getTimezoneOffset,
  formatNFeDate,
  nowNFe,
  withRetry,
  CircuitBreaker,
  CircuitState,
  type CircuitBreakerOptions,
  IBGE_UF,
  getUFCode,
  getUFByCode,
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
  createLogger,
  noopLogger,
  type LoggerInterface,
  type LoggerOptions,
  type LogLevel,
} from './logging/index.js';
