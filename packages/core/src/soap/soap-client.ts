import * as https from 'node:https';
import * as tls from 'node:tls';
import { SoapError } from '../errors/soap-error.js';
import { buildSoapEnvelope, WSDL_NAMESPACES } from './soap-envelope.js';
import type { SoapClientOptions, SoapRequest, SoapResponse } from './types.js';
import type { LoggerInterface } from '../logging/logger.js';

export class SoapClient {
  private options: Required<SoapClientOptions>;
  private secureContext: tls.SecureContext | null = null;
  private clientCertPem: string | null = null;
  private clientKeyPem: string | null = null;
  private clientPfxBuffer: Buffer | null = null;
  private clientPfxPassphrase: string | null = null;
  private logger?: LoggerInterface;

  constructor(options?: SoapClientOptions & { logger?: LoggerInterface }) {
    this.options = {
      timeout: options?.timeout ?? 30000,
      rejectUnauthorized: options?.rejectUnauthorized ?? true,
      proxy: options?.proxy ?? { host: '', port: 0 },
    };
    this.logger = options?.logger;
  }

  /**
   * Configura o certificado digital para mTLS
   */
  configureCertificate(pfxBuffer: Buffer, passphrase: string): void;
  configureCertificate(cert: string, key: string): void;
  configureCertificate(certOrPfx: Buffer | string, keyOrPassphrase: string): void {
    if (Buffer.isBuffer(certOrPfx)) {
      this.clientPfxBuffer = certOrPfx;
      this.clientPfxPassphrase = keyOrPassphrase;
      this.clientCertPem = null;
      this.clientKeyPem = null;
      this.secureContext = tls.createSecureContext({
        pfx: certOrPfx,
        passphrase: keyOrPassphrase,
      });
    } else {
      this.clientCertPem = certOrPfx;
      this.clientKeyPem = keyOrPassphrase;
      this.clientPfxBuffer = null;
      this.clientPfxPassphrase = null;
      this.secureContext = tls.createSecureContext({
        cert: certOrPfx,
        key: keyOrPassphrase,
      });
    }
  }

  /**
   * Envia requisição SOAP para SEFAZ
   */
  async send(request: SoapRequest, serviceName?: string): Promise<SoapResponse> {
    const wsdlNamespace = serviceName ? WSDL_NAMESPACES[serviceName] : '';
    // Nome da operacao = ultimo segmento do SOAPAction (ex: "nfeDistDFeInteresse").
    // SEFAZ NFe 4.00 espera o elemento wrapper da operacao no SOAP body.
    const operationName = request.action.split('/').pop() || '';
    const soapXml = buildSoapEnvelope(request.body, wsdlNamespace || request.action, operationName);

    this.logger?.debug(`SOAP Request to ${request.url}`, { action: request.action });

    const startTime = Date.now();

    // SOAP 1.2 requer o action como parametro do Content-Type, nao como header separado.
    // Header SOAPAction e SOAP 1.1. SEFAZ DistribuicaoDFe e demais servicos NFe 4.00
    // rejeitam com 500 "Unable to handle request without a valid action parameter"
    // se nao for enviado dessa forma.
    const contentType = request.contentType
      || `application/soap+xml; charset=utf-8; action="${request.action}"`;

    try {
      const response = await this.httpPost(request.url, soapXml, {
        'Content-Type': contentType,
      });

      const responseTime = Date.now() - startTime;
      this.logger?.info(`SOAP Response ${response.statusCode} in ${responseTime}ms`);

      if (response.statusCode >= 400) {
        this.logger?.warn(`SOAP ${response.statusCode} body (${response.body.length}b): ${response.body.slice(0, 2000)}`);
        this.logger?.warn(`SOAP ${response.statusCode} request body (first 2000b): ${soapXml.slice(0, 2000)}`);
        throw new SoapError(
          `HTTP ${response.statusCode}`,
          response.statusCode,
          response.body
        );
      }

      return {
        statusCode: response.statusCode,
        xml: response.body,
        responseTime,
      };
    } catch (error) {
      if (error instanceof SoapError) throw error;

      const message = error instanceof Error ? error.message : String(error);
      throw new SoapError(`Falha na comunicação SOAP: ${message}`);
    }
  }

  private httpPost(
    url: string,
    body: string,
    headers: Record<string, string>
  ): Promise<{ statusCode: number; body: string }> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);

      const options: https.RequestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          ...headers,
          'Content-Length': Buffer.byteLength(body, 'utf-8').toString(),
        },
        timeout: this.options.timeout,
        rejectUnauthorized: this.options.rejectUnauthorized,
      };

      // mTLS: passar cert/key (ou pfx) diretamente nas opcoes do https.request.
      // `secureContext` nao e uma option padrao do https.request em todas versoes
      // do Node — cert/key/pfx sao as vias suportadas oficialmente.
      if (this.clientCertPem && this.clientKeyPem) {
        (options as any).cert = this.clientCertPem;
        (options as any).key = this.clientKeyPem;
      } else if (this.clientPfxBuffer) {
        (options as any).pfx = this.clientPfxBuffer;
        if (this.clientPfxPassphrase) (options as any).passphrase = this.clientPfxPassphrase;
      }

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 500,
            body: Buffer.concat(chunks).toString('utf-8'),
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new SoapError('Timeout na comunicação com SEFAZ', undefined));
      });

      req.write(body);
      req.end();
    });
  }
}
