export interface CertificateOptions {
  pfxPath?: string;
  pfxBuffer?: Buffer;
  password: string;
}

export interface CertificateInfo {
  subject: {
    CN: string;
    CNPJ?: string;
    CPF?: string;
    O?: string;
  };
  issuer: string;
  serialNumber: string;
  validFrom: Date;
  validTo: Date;
  thumbprint: string;
}

export interface CertificateData {
  info: CertificateInfo;
  privateKey: string;
  certificate: string;
  certificateChain: string[];
  isExpired: boolean;
  daysUntilExpiry: number;
}
