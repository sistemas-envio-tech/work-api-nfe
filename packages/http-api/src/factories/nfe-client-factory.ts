import { Buffer } from 'node:buffer';
import { NFeClient, type EmpresaConfig, type Endereco } from '@acbr-node/nfe';
import { createLogger } from '@acbr-node/core';
import { env } from '../config/env.js';

export interface CertificadoPayload {
  pfxBase64: string;
  senha: string;
}

export interface NFeClientPayload {
  ambiente: 1 | 2;
  uf: string;
  cnpj: string;
  certificado: CertificadoPayload;
  razaoSocial?: string;
  nomeFantasia?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  /** 1=Simples Nacional, 2=Simples com excesso de sublimite, 3=Regime Normal. Default 3. */
  crt?: 1 | 2 | 3;
  /**
   * Endereco completo da empresa emitente.
   *
   * Para eventos (cancelamento/CCe/inutilizacao) o SEFAZ usa apenas o CNPJ,
   * entao este campo e opcional aqui. Para emissao real de NFe (modelo 55)
   * o leiaute SEFAZ exige o enderEmit completo — neste caso o objeto NFe ja
   * carrega seu proprio emit.enderEmit, mas o NFeClient tambem pode usar
   * este endereco internamente (ex.: NFCe modelo 65 futuramente).
   *
   * Quando omitido, a factory usa placeholders ("-"/"00000000"). Isso e seguro
   * para os eventos atuais mas seria rejeitado pelo SEFAZ em emissoes reais.
   */
  enderecoEmpresa?: Endereco;
  logXml?: boolean;
}

const logger = createLogger(env.logLevel === 'debug');

function buildEmpresa(payload: NFeClientPayload): EmpresaConfig {
  return {
    cnpj: payload.cnpj,
    razaoSocial: payload.razaoSocial ?? 'SEM RAZAO SOCIAL',
    nomeFantasia: payload.nomeFantasia,
    inscricaoEstadual: payload.inscricaoEstadual ?? 'ISENTO',
    inscricaoMunicipal: payload.inscricaoMunicipal,
    crt: payload.crt ?? 3,
    endereco: payload.enderecoEmpresa ?? {
      xLgr: '-',
      nro: '-',
      xBairro: '-',
      cMun: 0,
      xMun: '-',
      UF: payload.uf,
      CEP: '00000000',
      cPais: 1058,
      xPais: 'BRASIL',
    },
  };
}

export async function buildNFeClient(payload: NFeClientPayload): Promise<NFeClient> {
  if (!payload.certificado?.pfxBase64 || !payload.certificado?.senha) {
    throw new Error('Certificado (pfxBase64 + senha) obrigatorio');
  }
  if (!payload.cnpj) throw new Error('CNPJ obrigatorio');
  if (!payload.uf) throw new Error('UF obrigatoria');
  if (payload.ambiente !== 1 && payload.ambiente !== 2) {
    throw new Error('Ambiente deve ser 1 (producao) ou 2 (homologacao)');
  }

  const pfxBuffer = Buffer.from(payload.certificado.pfxBase64, 'base64');

  const client = new NFeClient({
    uf: payload.uf,
    ambiente: payload.ambiente,
    empresa: buildEmpresa(payload),
    certificado: { pfxBuffer, password: payload.certificado.senha },
    logger,
    logXml: payload.logXml ?? env.logXml,
    rejectUnauthorized: !env.insecureTls,
  });

  await client.init();
  return client;
}
