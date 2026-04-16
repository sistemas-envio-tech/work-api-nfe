// Certificate
export {
  CertificateManager,
  type CertificateOptions,
  type CertificateData,
  type CertificateInfo,
} from './certificate/index.js';

// XML
export {
  XmlBuilder,
  XmlParser,
  XmlSigner,
  type XmlObject,
  type XmlSignOptions,
} from './xml/index.js';

// SOAP
export {
  SoapClient,
  buildSoapEnvelope,
  WSDL_NAMESPACES,
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
} from './logging/index.js';
