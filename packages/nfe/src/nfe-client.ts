import {
  CertificateManager,
  CertificateWatcher,
  SoapClient,
  XmlSigner,
  getSefazUrl,
  getDistribuicaoDFeUrl,
  NFE_SERVICES,
  getUFCode,
  withRetry,
  CircuitBreaker,
  nowNFe,
  SefazError,
  SoapError,
  sanitizeXmlForLog,
  truncateXml,
  type CertificateOptions,
  type Ambiente,
  type LoggerInterface,
  type RetryOptions,
  type CircuitBreakerOptions,
  createLogger,
} from '@acbr-node/core';
import type { NFe, Emitente, Endereco } from './types/nfe.js';
import type {
  RetornoAutorizacao, RetornoStatusServico, RetornoConsultaProtocolo,
  RetornoInutilizacao, RetornoEvento,
} from './types/retorno.js';
import {
  buildNFeXml, buildConsStatServXml, buildConsSitNFeXml,
  buildInutNFeXml, buildConsReciNFeXml, buildEnviNFeXml,
} from './builders/nfe-xml-builder.js';
import { buildCancelamentoXml } from './events/cancelamento.js';
import { buildCartaCorrecaoXml } from './events/carta-correcao.js';
import { buildManifestacaoXml, type TipoManifestacao } from './events/manifestacao.js';
import { buildEnvEventoXml } from './events/event-builder.js';
import { buildConsCadXml } from './builders/consulta-cadastro-builder.js';
import { buildDistDFeXml } from './builders/distribuicao-builder.js';
import {
  parseStatusServico, parseAutorizacao, parseConsultaProtocolo,
  parseInutilizacao, parseEvento, parseConsultaRecibo,
} from './parsers/response-parser.js';
import { parseConsultaCadastro, type RetornoConsultaCadastro } from './parsers/consulta-cadastro-parser.js';
import { parseDistribuicaoDFe, type RetornoDistribuicaoDFe } from './parsers/distribuicao-parser.js';
import { validateNFe } from './validation/nfe-validator.js';

export interface NFeClientConfig {
  uf: string;
  ambiente: 1 | 2;
  empresa: EmpresaConfig;
  certificado: CertificateOptions;
  logger?: LoggerInterface;
  retryOptions?: Partial<RetryOptions>;
  circuitBreakerOptions?: Partial<CircuitBreakerOptions>;
  timeout?: number;
  contingencia?: boolean;
  /** Ativar validação Zod antes de gerar XML (padrão: true) */
  validar?: boolean;
  /** Logar XML request/response sanitizado (padrão: false) */
  logXml?: boolean;
}

export interface EmpresaConfig {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  inscricaoEstadual: string;
  inscricaoMunicipal?: string;
  crt: 1 | 2 | 3;
  endereco: Endereco;
}

export class NFeClient {
  private config: NFeClientConfig;
  private certManager: CertificateManager;
  private certWatcher: CertificateWatcher;
  private soapClient: SoapClient;
  private circuitBreaker: CircuitBreaker;
  private logger: LoggerInterface;
  private initialized = false;
  private _contingenciaAtiva = false;

  private get ambienteStr(): Ambiente {
    return this.config.ambiente === 1 ? 'producao' : 'homologacao';
  }

  private get cUF(): number {
    return getUFCode(this.config.uf);
  }

  /** Indica se a contingência está ativa */
  get contingenciaAtiva(): boolean {
    return this._contingenciaAtiva || this.config.contingencia === true;
  }

  constructor(config: NFeClientConfig) {
    this.config = { validar: true, logXml: false, ...config };
    this.certManager = new CertificateManager();
    this.certWatcher = new CertificateWatcher(undefined, config.logger);
    this.logger = config.logger ?? createLogger(false);
    this.soapClient = new SoapClient({
      timeout: config.timeout ?? 30000,
      logger: this.logger,
    });
    this.circuitBreaker = new CircuitBreaker(config.circuitBreakerOptions);
  }

  /**
   * Inicializa o client: carrega certificado e configura mTLS
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    this.logger.info('Inicializando NFeClient...');

    const certData = await this.certManager.load(this.config.certificado);
    this.logger.info(`Certificado carregado: ${certData.info.subject.CN} (expira em ${certData.daysUntilExpiry} dias)`);

    // Verificar expiração do certificado
    this.certWatcher.check(certData.info);

    // Configurar mTLS com PFX original
    if (this.config.certificado.pfxBuffer) {
      this.soapClient.configureCertificate(
        this.config.certificado.pfxBuffer,
        this.config.certificado.password
      );
    } else if (this.config.certificado.pfxPath) {
      const { readFileSync } = await import('node:fs');
      const pfxBuffer = readFileSync(this.config.certificado.pfxPath);
      this.soapClient.configureCertificate(pfxBuffer, this.config.certificado.password);
    }

    this.initialized = true;
  }

  private async ensureInit(): Promise<void> {
    if (!this.initialized) await this.init();
  }

  // ─── Status do Serviço ───

  async statusServico(): Promise<RetornoStatusServico> {
    await this.ensureInit();

    const xml = buildConsStatServXml(this.config.ambiente, this.cUF);
    const url = getSefazUrl(
      { uf: this.config.uf, ambiente: this.ambienteStr, contingencia: this.config.contingencia },
      'NFeStatusServico4'
    );

    const response = await this.sendToSefaz(url, xml, 'NFeStatusServico4');
    return parseStatusServico(response);
  }

  // ─── Autorização (Emissão) ───

  async autorizarNFe(nfe: NFe, sincrono: boolean = true): Promise<RetornoAutorizacao> {
    await this.ensureInit();

    // Validar dados se configurado
    if (this.config.validar) {
      validateNFe(nfe);
    }

    // Montar XML
    const { xml, chaveAcesso } = buildNFeXml(nfe);
    this.logger.info(`NFe XML gerado. Chave: ${chaveAcesso}`);

    // Assinar
    const signedXml = XmlSigner.sign(xml, {
      privateKeyPem: this.certManager.getPrivateKey(),
      certificatePem: this.certManager.getCertificate(),
      referenceUri: 'infNFe',
    });
    this.logger.info('XML assinado com sucesso');

    // Montar envelope enviNFe
    const idLote = Date.now().toString().slice(-15);
    const enviNFeXml = buildEnviNFeXml([signedXml], idLote, sincrono ? 1 : 0);

    // Enviar para SEFAZ
    const url = getSefazUrl(
      { uf: this.config.uf, ambiente: this.ambienteStr, contingencia: this.config.contingencia },
      'NFeAutorizacao4'
    );

    const response = await this.sendToSefaz(url, enviNFeXml, 'NFeAutorizacao4');
    const resultado = parseAutorizacao(response);

    // Se assíncrono, fazer polling pelo recibo
    if (!sincrono && resultado.nRec && resultado.cStat === '103') {
      this.logger.info(`Lote recebido. Recibo: ${resultado.nRec}. Consultando...`);
      return this.consultarRecibo(resultado.nRec, signedXml, chaveAcesso);
    }

    // Se síncrono e autorizado, montar nfeProc
    if (resultado.protNFe && resultado.protNFe.cStat === '100') {
      resultado.xmlAutorizado = this.buildNFeProc(signedXml, resultado.protNFe);
      this.logger.info(`NFe autorizada! Protocolo: ${resultado.protNFe.nProt}`);
    }

    return resultado;
  }

  private async consultarRecibo(
    nRec: string,
    signedXml: string,
    chaveAcesso: string,
    maxTentativas: number = 10
  ): Promise<RetornoAutorizacao> {
    const url = getSefazUrl(
      { uf: this.config.uf, ambiente: this.ambienteStr },
      'NFeRetAutorizacao4'
    );

    for (let i = 0; i < maxTentativas; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000 + i * 2000));

      const consultaXml = buildConsReciNFeXml(this.config.ambiente, nRec);
      const response = await this.sendToSefaz(url, consultaXml, 'NFeRetAutorizacao4');
      const retConsReci = parseConsultaRecibo(response);

      // 105 = Lote em processamento
      if (retConsReci.cStat === '105') {
        this.logger.info(`Lote em processamento (tentativa ${i + 1}/${maxTentativas})...`);
        continue;
      }

      // 104 = Lote processado
      if (retConsReci.cStat === '104' && retConsReci.protNFe?.length) {
        const proto = retConsReci.protNFe.find(p => p.chNFe === chaveAcesso) || retConsReci.protNFe[0];

        const resultado: RetornoAutorizacao = {
          tpAmb: retConsReci.tpAmb,
          verAplic: retConsReci.verAplic,
          cStat: proto.cStat,
          xMotivo: proto.xMotivo,
          cUF: retConsReci.cUF,
          protNFe: proto,
        };

        if (proto.cStat === '100') {
          resultado.xmlAutorizado = this.buildNFeProc(signedXml, proto);
        }

        return resultado;
      }

      // Outro status: retornar como erro
      return {
        tpAmb: retConsReci.tpAmb,
        verAplic: retConsReci.verAplic,
        cStat: retConsReci.cStat,
        xMotivo: retConsReci.xMotivo,
        cUF: retConsReci.cUF,
      };
    }

    throw new SefazError('105', 'Timeout aguardando processamento do lote');
  }

  // ─── Consulta Protocolo ───

  async consultarProtocolo(chNFe: string): Promise<RetornoConsultaProtocolo> {
    await this.ensureInit();

    const xml = buildConsSitNFeXml(this.config.ambiente, chNFe);
    const url = getSefazUrl(
      { uf: this.config.uf, ambiente: this.ambienteStr },
      'NFeConsultaProtocolo4'
    );

    const response = await this.sendToSefaz(url, xml, 'NFeConsultaProtocolo4');
    return parseConsultaProtocolo(response);
  }

  // ─── Inutilização ───

  async inutilizar(params: {
    ano: number;
    serie: number;
    nNFIni: number;
    nNFFin: number;
    xJust: string;
  }): Promise<RetornoInutilizacao> {
    await this.ensureInit();

    const xml = buildInutNFeXml({
      tpAmb: this.config.ambiente,
      cUF: this.cUF,
      ano: params.ano,
      CNPJ: this.config.empresa.cnpj,
      mod: 55,
      serie: params.serie,
      nNFIni: params.nNFIni,
      nNFFin: params.nNFFin,
      xJust: params.xJust,
    });

    const signedXml = XmlSigner.sign(xml, {
      privateKeyPem: this.certManager.getPrivateKey(),
      certificatePem: this.certManager.getCertificate(),
      referenceUri: 'infInut',
    });

    const url = getSefazUrl(
      { uf: this.config.uf, ambiente: this.ambienteStr },
      'NFeInutilizacao4'
    );

    const response = await this.sendToSefaz(url, signedXml, 'NFeInutilizacao4');
    return parseInutilizacao(response);
  }

  // ─── Cancelamento ───

  async cancelarNFe(params: {
    chNFe: string;
    nProt: string;
    xJust: string;
  }): Promise<RetornoEvento> {
    await this.ensureInit();

    const eventoXml = buildCancelamentoXml({
      cOrgao: this.cUF,
      tpAmb: this.config.ambiente,
      CNPJ: this.config.empresa.cnpj,
      chNFe: params.chNFe,
      dhEvento: nowNFe(this.config.uf),
      nProt: params.nProt,
      xJust: params.xJust,
    });

    return this.enviarEvento(eventoXml);
  }

  // ─── Carta de Correção ───

  async cartaCorrecao(params: {
    chNFe: string;
    xCorrecao: string;
    nSeqEvento: number;
  }): Promise<RetornoEvento> {
    await this.ensureInit();

    const eventoXml = buildCartaCorrecaoXml({
      cOrgao: this.cUF,
      tpAmb: this.config.ambiente,
      CNPJ: this.config.empresa.cnpj,
      chNFe: params.chNFe,
      dhEvento: nowNFe(this.config.uf),
      xCorrecao: params.xCorrecao,
      nSeqEvento: params.nSeqEvento,
    });

    return this.enviarEvento(eventoXml);
  }

  // ─── Consulta Cadastro ───

  async consultarCadastro(params: {
    UF: string;
    CNPJ?: string;
    CPF?: string;
    IE?: string;
  }): Promise<RetornoConsultaCadastro> {
    await this.ensureInit();

    const xml = buildConsCadXml(params);
    const url = getSefazUrl(
      { uf: params.UF, ambiente: this.ambienteStr },
      'NFeConsultaCadastro4'
    );

    const response = await this.sendToSefaz(url, xml, 'NFeConsultaCadastro4');
    return parseConsultaCadastro(response);
  }

  // ─── Distribuição DFe ───

  async distribuicaoDFe(params: {
    /** Último NSU recebido (para paginação) */
    ultNSU?: string;
    /** NSU específico */
    NSU?: string;
    /** Chave de acesso */
    chNFe?: string;
  }): Promise<RetornoDistribuicaoDFe> {
    await this.ensureInit();

    const xml = buildDistDFeXml({
      tpAmb: this.config.ambiente,
      CNPJ: this.config.empresa.cnpj,
      cUFAutor: this.cUF,
      distNSU: params.ultNSU,
      consNSU: params.NSU,
      chNFe: params.chNFe,
    });

    const url = getDistribuicaoDFeUrl(this.ambienteStr);
    const response = await this.sendToSefaz(url, xml, 'NFeDistribuicaoDFe');
    return parseDistribuicaoDFe(response);
  }

  // ─── Manifestação do Destinatário ───

  async manifestarDestinatario(params: {
    chNFe: string;
    tipo: TipoManifestacao;
    xJust?: string;
  }): Promise<RetornoEvento> {
    await this.ensureInit();

    const eventoXml = buildManifestacaoXml({
      tpAmb: this.config.ambiente,
      CNPJ: this.config.empresa.cnpj,
      chNFe: params.chNFe,
      dhEvento: nowNFe(this.config.uf),
      tipo: params.tipo,
      xJust: params.xJust,
    });

    return this.enviarEvento(eventoXml);
  }

  // ─── Helpers internos ───

  private async enviarEvento(eventoXml: string): Promise<RetornoEvento> {
    const signedEvento = XmlSigner.sign(eventoXml, {
      privateKeyPem: this.certManager.getPrivateKey(),
      certificatePem: this.certManager.getCertificate(),
      referenceUri: 'infEvento',
    });

    const idLote = Date.now().toString().slice(-15);
    // buildEnvEventoXml já insere os eventos assinados dentro do envelope
    const finalXml = buildEnvEventoXml([signedEvento], idLote);

    const url = getSefazUrl(
      { uf: this.config.uf, ambiente: this.ambienteStr },
      'RecepcaoEvento4'
    );

    const response = await this.sendToSefaz(url, finalXml, 'RecepcaoEvento4');
    return parseEvento(response);
  }

  /**
   * Ativa contingência manualmente
   */
  ativarContingencia(): void {
    this._contingenciaAtiva = true;
    this.logger.warn('Contingência ativada manualmente');
  }

  /**
   * Desativa contingência manualmente
   */
  desativarContingencia(): void {
    this._contingenciaAtiva = false;
    this.circuitBreaker.reset();
    this.logger.info('Contingência desativada');
  }

  private async sendToSefaz(
    url: string,
    xml: string,
    serviceName: string
  ): Promise<string> {
    const service = NFE_SERVICES[serviceName];
    if (!service) throw new Error(`Serviço desconhecido: ${serviceName}`);

    // Log XML request sanitizado
    if (this.config.logXml) {
      this.logger.debug(`SOAP Request XML:\n${truncateXml(sanitizeXmlForLog(xml))}`);
    }

    const sendFn = async () => {
      const response = await this.circuitBreaker.execute(() =>
        this.soapClient.send(
          { url, action: service.action, body: xml },
          serviceName
        )
      );

      // Log XML response sanitizado
      if (this.config.logXml) {
        this.logger.debug(`SOAP Response XML:\n${truncateXml(sanitizeXmlForLog(response.xml))}`);
      }

      return response.xml;
    };

    try {
      if (this.config.retryOptions) {
        return await withRetry(sendFn, {
          ...this.config.retryOptions,
          retryableCheck: (error) => {
            if (error instanceof SefazError) return error.isRetryable;
            if (error instanceof SoapError) return true;
            return true; // retry network errors
          },
        });
      }
      return await sendFn();
    } catch (error) {
      // Fallback automático para contingência se SEFAZ principal falhar
      if (!this.contingenciaAtiva && this.shouldFallbackToContingency(error)) {
        this.logger.warn(`Falha no autorizador principal, tentando contingência SVC...`);
        this._contingenciaAtiva = true;

        const contingencyUrl = getSefazUrl(
          { uf: this.config.uf, ambiente: this.ambienteStr, contingencia: true },
          serviceName as any
        );

        try {
          const response = await this.soapClient.send(
            { url: contingencyUrl, action: service.action, body: xml },
            serviceName
          );
          return response.xml;
        } catch (contingencyError) {
          this._contingenciaAtiva = false;
          throw contingencyError;
        }
      }
      throw error;
    }
  }

  private shouldFallbackToContingency(error: unknown): boolean {
    // Ativar contingência para erros de rede/timeout ou SEFAZ indisponível
    if (error instanceof SoapError) return true;
    if (error instanceof SefazError) {
      return ['108', '109'].includes(error.cStat); // Serviço paralisado
    }
    if (error instanceof Error && error.message.includes('Circuit breaker')) return true;
    return false;
  }

  private buildNFeProc(signedNFeXml: string, protNFe: any): string {
    const protXml = `<protNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe"><infProt><tpAmb>${protNFe.tpAmb}</tpAmb><verAplic>${protNFe.verAplic}</verAplic><chNFe>${protNFe.chNFe}</chNFe><dhRecbto>${protNFe.dhRecbto}</dhRecbto><nProt>${protNFe.nProt}</nProt><digVal>${protNFe.digVal}</digVal><cStat>${protNFe.cStat}</cStat><xMotivo>${protNFe.xMotivo}</xMotivo></infProt></protNFe>`;

    return `<?xml version="1.0" encoding="UTF-8"?><nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">${signedNFeXml}${protXml}</nfeProc>`;
  }
}
