export interface SoapClientOptions {
  /** Timeout em ms (padrão: 30000) */
  timeout?: number;
  /** Rejeitar certificados não confiáveis (padrão: true) */
  rejectUnauthorized?: boolean;
  /** Proxy HTTP */
  proxy?: {
    host: string;
    port: number;
  };
}

export interface SoapRequest {
  /** URL do web service */
  url: string;
  /** SOAP Action header */
  action: string;
  /** XML body (conteúdo dentro do SOAP Body) */
  body: string;
  /** Content-Type (padrão: application/soap+xml) */
  contentType?: string;
}

export interface SoapResponse {
  /** Status HTTP */
  statusCode: number;
  /** XML completo da resposta */
  xml: string;
  /** Tempo de resposta em ms */
  responseTime: number;
}
