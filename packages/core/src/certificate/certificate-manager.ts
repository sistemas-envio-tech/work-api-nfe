import { readFileSync } from 'node:fs';
import crypto from 'node:crypto';
import { CertificateError } from '../errors/certificate-error.js';
import type { CertificateOptions, CertificateData, CertificateInfo } from './types.js';

export class CertificateManager {
  private pemKey: string = '';
  private pemCert: string = '';
  private pemChain: string[] = [];
  private certInfo: CertificateInfo | null = null;

  async load(options: CertificateOptions): Promise<CertificateData> {
    const pfxBuffer = options.pfxBuffer ?? this.readPfxFile(options.pfxPath);

    try {
      const { key, cert, chain } = this.extractFromPfx(pfxBuffer, options.password);
      this.pemKey = key;
      this.pemCert = cert;
      this.pemChain = chain;
      this.certInfo = this.parseCertificate(cert);

      return {
        info: this.certInfo,
        privateKey: this.pemKey,
        certificate: this.pemCert,
        certificateChain: this.pemChain,
        isExpired: this.isExpired,
        daysUntilExpiry: this.daysUntilExpiry,
      };
    } catch (error) {
      if (error instanceof CertificateError) throw error;
      throw new CertificateError(
        `Falha ao carregar certificado: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  get isExpired(): boolean {
    if (!this.certInfo) return true;
    return new Date() > this.certInfo.validTo;
  }

  get daysUntilExpiry(): number {
    if (!this.certInfo) return 0;
    const diff = this.certInfo.validTo.getTime() - Date.now();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  getPrivateKey(): string {
    if (!this.pemKey) throw new CertificateError('Certificado não carregado');
    return this.pemKey;
  }

  getCertificate(): string {
    if (!this.pemCert) throw new CertificateError('Certificado não carregado');
    return this.pemCert;
  }

  getCertificateChain(): string[] {
    return this.pemChain;
  }

  getInfo(): CertificateInfo {
    if (!this.certInfo) throw new CertificateError('Certificado não carregado');
    return this.certInfo;
  }

  getCertificateBase64(): string {
    const pem = this.getCertificate();
    return pem
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\s/g, '');
  }

  private readPfxFile(path?: string): Buffer {
    if (!path) throw new CertificateError('pfxPath ou pfxBuffer é obrigatório');
    try {
      return readFileSync(path);
    } catch {
      throw new CertificateError(`Arquivo PFX não encontrado: ${path}`);
    }
  }

  private extractFromPfx(
    pfxBuffer: Buffer,
    password: string
  ): { key: string; cert: string; chain: string[] } {
    const pfx = crypto.createPrivateKey({
      key: pfxBuffer,
      format: 'pkcs12' as any,
      passphrase: password,
    });

    const key = pfx.export({ type: 'pkcs8', format: 'pem' }) as string;

    // Extract certificate from PFX using X509Certificate
    const certs = this.extractCertificatesFromPfx(pfxBuffer, password);

    if (certs.length === 0) {
      throw new CertificateError('Nenhum certificado encontrado no arquivo PFX');
    }

    const cert = certs[0];
    const chain = certs.slice(1);

    return { key, cert, chain };
  }

  private extractCertificatesFromPfx(pfxBuffer: Buffer, password: string): string[] {
    // Use openssl-compatible PKCS12 parsing via Node.js tls
    // Node 20+ supports PKCS12 parsing through crypto module
    try {
      const secureContext = require('node:tls').createSecureContext({
        pfx: pfxBuffer,
        passphrase: password,
      });

      const context = secureContext.context;
      const cert = context.getCertificate();
      const certs: string[] = [];

      if (cert) {
        // cert is a Buffer containing DER-encoded certificate
        const pemCert = `-----BEGIN CERTIFICATE-----\n${cert.toString('base64').match(/.{1,64}/g)?.join('\n')}\n-----END CERTIFICATE-----`;
        certs.push(pemCert);
      }

      // Try to get CA certificates
      const ca = context.getCACerts?.();
      if (Array.isArray(ca)) {
        for (const caCert of ca) {
          if (Buffer.isBuffer(caCert)) {
            const pemCa = `-----BEGIN CERTIFICATE-----\n${caCert.toString('base64').match(/.{1,64}/g)?.join('\n')}\n-----END CERTIFICATE-----`;
            certs.push(pemCa);
          }
        }
      }

      return certs;
    } catch {
      // Fallback: try to use the PFX directly with tls.createSecureContext
      // and extract PEM from it
      throw new CertificateError('Falha ao extrair certificados do PFX. Verifique a senha.');
    }
  }

  private parseCertificate(pemCert: string): CertificateInfo {
    const x509 = new crypto.X509Certificate(pemCert);

    const subject = this.parseSubject(x509.subject);
    const cnpjFromOtherName = this.extractCNPJFromSubject(x509);

    return {
      subject: {
        CN: subject.CN || '',
        CNPJ: cnpjFromOtherName || subject.CNPJ,
        CPF: subject.CPF,
        O: subject.O,
      },
      issuer: x509.issuer,
      serialNumber: x509.serialNumber,
      validFrom: new Date(x509.validFrom),
      validTo: new Date(x509.validTo),
      thumbprint: x509.fingerprint256.replace(/:/g, ''),
    };
  }

  private parseSubject(subjectStr: string): Record<string, string> {
    const result: Record<string, string> = {};
    const parts = subjectStr.split('\n');
    for (const part of parts) {
      const [key, ...valueParts] = part.split('=');
      if (key && valueParts.length > 0) {
        result[key.trim()] = valueParts.join('=').trim();
      }
    }
    return result;
  }

  private extractCNPJFromSubject(x509: crypto.X509Certificate): string | undefined {
    // CNPJ is stored in the otherName field of subjectAltName (OID 2.16.76.1.3.3)
    // or in the CN field after ':'
    const cn = x509.subject.match(/CN=([^\n]+)/)?.[1] || '';

    // Try to extract CNPJ from CN (common pattern: "EMPRESA:12345678000199")
    const cnpjMatch = cn.match(/(\d{14})/);
    if (cnpjMatch) return cnpjMatch[1];

    // Try subjectAltName
    const san = x509.subjectAltName || '';
    const cnpjFromSan = san.match(/(\d{14})/);
    if (cnpjFromSan) return cnpjFromSan[1];

    return undefined;
  }
}
