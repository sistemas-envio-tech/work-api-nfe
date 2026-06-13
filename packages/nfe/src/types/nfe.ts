import type {
  TipoOperacao, FinalidadeNFe, TipoImpressao, TipoEmissao,
  DestinoOperacao, IndicadorPresenca, IndicadorConsumidorFinal,
  ProcessoEmissao, ModalidadeFrete, ModeloDocumento, Ambiente,
  RegimeTributario, IndicadorIEDestinatario, IndicadorPagamento,
} from './enums.js';

/** Namespace NFe */
export const NFE_NAMESPACE = 'http://www.portalfiscal.inf.br/nfe';
export const NFE_VERSAO = '4.00';

// ─── Endereço ───

export interface Endereco {
  xLgr: string;
  nro: string;
  xCpl?: string;
  xBairro: string;
  cMun: number;
  xMun: string;
  UF: string;
  CEP: string;
  cPais?: number;
  xPais?: string;
  fone?: string;
}

// ─── Identificação (ide) ───

export interface Identificacao {
  cUF: number;
  cNF?: number;
  natOp: string;
  mod: ModeloDocumento;
  serie: number;
  nNF: number;
  dhEmi: string;
  dhSaiEnt?: string;
  tpNF: TipoOperacao;
  idDest: DestinoOperacao;
  cMunFG: number;
  tpImp: TipoImpressao;
  tpEmis: TipoEmissao;
  cDV?: number;
  tpAmb: Ambiente;
  finNFe: FinalidadeNFe;
  indFinal: IndicadorConsumidorFinal;
  indPres: IndicadorPresenca;
  indIntermed?: 0 | 1;
  procEmi: ProcessoEmissao;
  verProc: string;
  dhCont?: string;
  xJust?: string;
}

// ─── Emitente (emit) ───

export interface Emitente {
  CNPJ?: string;
  CPF?: string;
  xNome: string;
  xFant?: string;
  enderEmit: Endereco;
  IE: string;
  IEST?: string;
  IM?: string;
  CNAE?: string;
  CRT: RegimeTributario;
}

// ─── Destinatário (dest) ───

export interface Destinatario {
  CNPJ?: string;
  CPF?: string;
  idEstrangeiro?: string;
  xNome?: string;
  enderDest?: Endereco;
  indIEDest: IndicadorIEDestinatario;
  IE?: string;
  ISUF?: string;
  IM?: string;
  email?: string;
}

// ─── Produto (prod) dentro de det ───

export interface Produto {
  cProd: string;
  cEAN: string;
  xProd: string;
  NCM: string;
  CEST?: string;
  CFOP: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  vProd: number;
  cEANTrib: string;
  uTrib: string;
  qTrib: number;
  vUnTrib: number;
  vFrete?: number;
  vSeg?: number;
  vDesc?: number;
  vOutro?: number;
  indTot: 0 | 1;
  nItemPed?: string;
  xPed?: string;
  /** Informações adicionais do produto */
  infAdProd?: string;
}

// ─── ICMS ───

export interface ICMS00 {
  orig: number;
  CST: '00';
  modBC: number;
  vBC: number;
  pICMS: number;
  vICMS: number;
  pFCP?: number;
  vFCP?: number;
}

export interface ICMS10 {
  orig: number;
  CST: '10';
  modBC: number;
  vBC: number;
  pICMS: number;
  vICMS: number;
  modBCST: number;
  pMVAST?: number;
  vBCST: number;
  pICMSST: number;
  vICMSST: number;
  pFCP?: number;
  vFCP?: number;
  vBCFCPST?: number;
  pFCPST?: number;
  vFCPST?: number;
}

export interface ICMS20 {
  orig: number;
  CST: '20';
  modBC: number;
  pRedBC: number;
  vBC: number;
  pICMS: number;
  vICMS: number;
  vICMSDeson?: number;
  motDesICMS?: number;
  pFCP?: number;
  vFCP?: number;
}

export interface ICMS30 {
  orig: number;
  CST: '30';
  modBCST: number;
  pMVAST?: number;
  vBCST: number;
  pICMSST: number;
  vICMSST: number;
  vICMSDeson?: number;
  motDesICMS?: number;
}

export interface ICMS40 {
  orig: number;
  CST: '40' | '41' | '50';
  vICMSDeson?: number;
  motDesICMS?: number;
}

export interface ICMS51 {
  orig: number;
  CST: '51';
  modBC?: number;
  pRedBC?: number;
  vBC?: number;
  pICMS?: number;
  vICMSOp?: number;
  pDif?: number;
  vICMSDif?: number;
  vICMS?: number;
}

export interface ICMS60 {
  orig: number;
  CST: '60';
  vBCSTRet?: number;
  vICMSSTRet?: number;
  vICMSSubstituto?: number;
  pST?: number;
  vICMSSTDeson?: number;
  motDesICMSST?: number;
}

export interface ICMS70 {
  orig: number;
  CST: '70';
  modBC: number;
  pRedBC: number;
  vBC: number;
  pICMS: number;
  vICMS: number;
  modBCST: number;
  pMVAST?: number;
  vBCST: number;
  pICMSST: number;
  vICMSST: number;
  vICMSDeson?: number;
  motDesICMS?: number;
}

export interface ICMS90 {
  orig: number;
  CST: '90';
  modBC?: number;
  vBC?: number;
  pRedBC?: number;
  pICMS?: number;
  vICMS?: number;
  modBCST?: number;
  pMVAST?: number;
  vBCST?: number;
  pICMSST?: number;
  vICMSST?: number;
  vICMSDeson?: number;
  motDesICMS?: number;
}

/** ICMS Simples Nacional */
export interface ICMSSN101 {
  orig: number;
  CSOSN: '101';
  pCredSN: number;
  vCredICMSSN: number;
}

export interface ICMSSN102 {
  orig: number;
  CSOSN: '102' | '103' | '300' | '400';
}

export interface ICMSSN201 {
  orig: number;
  CSOSN: '201';
  modBCST: number;
  pMVAST?: number;
  vBCST: number;
  pICMSST: number;
  vICMSST: number;
  pCredSN: number;
  vCredICMSSN: number;
}

export interface ICMSSN202 {
  orig: number;
  CSOSN: '202' | '203';
  modBCST: number;
  pMVAST?: number;
  vBCST: number;
  pICMSST: number;
  vICMSST: number;
}

export interface ICMSSN500 {
  orig: number;
  CSOSN: '500';
  vBCSTRet?: number;
  vICMSSTRet?: number;
}

export interface ICMSSN900 {
  orig: number;
  CSOSN: '900';
  modBC?: number;
  vBC?: number;
  pRedBC?: number;
  pICMS?: number;
  vICMS?: number;
  modBCST?: number;
  pMVAST?: number;
  vBCST?: number;
  pICMSST?: number;
  vICMSST?: number;
  pCredSN?: number;
  vCredICMSSN?: number;
}

export type ICMSType =
  | ICMS00 | ICMS10 | ICMS20 | ICMS30 | ICMS40 | ICMS51
  | ICMS60 | ICMS70 | ICMS90
  | ICMSSN101 | ICMSSN102 | ICMSSN201 | ICMSSN202 | ICMSSN500 | ICMSSN900;

// ─── PIS ───

export interface PISAliq {
  CST: '01' | '02';
  vBC: number;
  pPIS: number;
  vPIS: number;
}

export interface PISQtde {
  CST: '03';
  qBCProd: number;
  vAliqProd: number;
  vPIS: number;
}

export interface PISNT {
  CST: '04' | '05' | '06' | '07' | '08' | '09';
}

export interface PISOutr {
  CST: '49' | '50' | '51' | '52' | '53' | '54' | '55' | '56' | '60' | '61' | '62' | '63' | '64' | '65' | '66' | '67' | '70' | '71' | '72' | '73' | '74' | '75' | '98' | '99';
  vBC?: number;
  pPIS?: number;
  qBCProd?: number;
  vAliqProd?: number;
  vPIS: number;
}

export type PISType = PISAliq | PISQtde | PISNT | PISOutr;

// ─── COFINS ───

export interface COFINSAliq {
  CST: '01' | '02';
  vBC: number;
  pCOFINS: number;
  vCOFINS: number;
}

export interface COFINSQtde {
  CST: '03';
  qBCProd: number;
  vAliqProd: number;
  vCOFINS: number;
}

export interface COFINSNT {
  CST: '04' | '05' | '06' | '07' | '08' | '09';
}

export interface COFINSOutr {
  CST: '49' | '50' | '51' | '52' | '53' | '54' | '55' | '56' | '60' | '61' | '62' | '63' | '64' | '65' | '66' | '67' | '70' | '71' | '72' | '73' | '74' | '75' | '98' | '99';
  vBC?: number;
  pCOFINS?: number;
  qBCProd?: number;
  vAliqProd?: number;
  vCOFINS: number;
}

export type COFINSType = COFINSAliq | COFINSQtde | COFINSNT | COFINSOutr;

// ─── IPI ───

export interface IPITrib {
  CST: '00' | '49' | '50' | '99';
  vBC?: number;
  pIPI?: number;
  qUnid?: number;
  vUnid?: number;
  vIPI: number;
}

export interface IPINT {
  CST: '01' | '02' | '03' | '04' | '05' | '51' | '52' | '53' | '54' | '55';
}

export type IPIType = IPITrib | IPINT;

// ─── Imposto (conjunto por item) ───

export interface Imposto {
  vTotTrib?: number;
  ICMS: { [K: string]: ICMSType };
  IPI?: { cEnq: string } & ({ IPITrib: IPITrib } | { IPINT: IPINT });
  PIS: { [K: string]: PISType };
  COFINS: { [K: string]: COFINSType };
}

// ─── Detalhe (det) ───

export interface Detalhe {
  nItem: number;
  prod: Produto;
  imposto: Imposto;
  infAdProd?: string;
}

// ─── Totais ───

export interface ICMSTot {
  vBC: number;
  vICMS: number;
  vICMSDeson: number;
  vFCPUFDest?: number;
  vICMSUFDest?: number;
  vICMSUFRemet?: number;
  vFCP: number;
  vBCST: number;
  vST: number;
  vFCPST: number;
  vFCPSTRet: number;
  vProd: number;
  vFrete: number;
  vSeg: number;
  vDesc: number;
  vII: number;
  vIPI: number;
  vIPIDevol?: number;
  vPIS: number;
  vCOFINS: number;
  vOutro: number;
  vNF: number;
  vTotTrib?: number;
}

export interface Total {
  ICMSTot: ICMSTot;
}

// ─── Transporte ───

export interface Transportador {
  CNPJ?: string;
  CPF?: string;
  xNome?: string;
  IE?: string;
  xEnder?: string;
  xMun?: string;
  UF?: string;
}

export interface Volume {
  qVol?: number;
  esp?: string;
  marca?: string;
  nVol?: string;
  pesoL?: number;
  pesoB?: number;
}

export interface Transporte {
  modFrete: ModalidadeFrete;
  transporta?: Transportador;
  vol?: Volume[];
}

// ─── Cobrança ───

export interface Fatura {
  nFat?: string;
  vOrig?: number;
  vDesc?: number;
  vLiq?: number;
}

export interface Duplicata {
  nDup: string;
  dVenc: string;
  vDup: number;
}

export interface Cobranca {
  fat?: Fatura;
  dup?: Duplicata[];
}

// ─── Pagamento ───

export interface DetalhePagamento {
  indPag?: IndicadorPagamento;
  tPag: string;
  xPag?: string;
  vPag: number;
  /** Cartão */
  card?: {
    tpIntegra: 1 | 2;
    CNPJ?: string;
    tBand?: string;
    cAut?: string;
  };
}

export interface Pagamento {
  detPag: DetalhePagamento[];
  vTroco?: number;
}

// ─── Informações Adicionais ───

export interface InformacaoAdicional {
  infAdFisco?: string;
  infCpl?: string;
  obsCont?: Array<{ xCampo: string; xTexto: string }>;
  obsFisco?: Array<{ xCampo: string; xTexto: string }>;
}

// ─── NF Referenciada (NFref) ───
//
// Grupo opcional dentro de <ide>, usado quando a NFe referencia uma ou
// mais NFs anteriores. Caso de uso principal: NFe de DEVOLUCAO (finNFe=4)
// onde a NF nova precisa apontar pra NF da venda original via refNFe.
//
// Conforme leiauteNFe_v4.00.xsd, cada <NFref> aceita 1 entre:
//   - refNFe     : chave 44 dig da NFe referenciada
//   - refNFeSig  : chave NFe sigilosa (codigo numerico zerado)
//   - refCTe     : chave CTe 44 dig
//   - refNF      : referencia NF1 modelo 1 (legacy — campos cUF+AAMM+CNPJ+mod+serie+nNF)
//   - refNFP     : referencia NF de produtor rural
//   - refECF     : referencia cupom fiscal ECF
//
// Esta interface cobre os 3 modos por chave (refNFe, refNFeSig, refCTe).
// Os modos legacy (refNF/refNFP/refECF) podem ser adicionados quando o
// dominio exigir — hoje a maioria das devolucoes referencia NFe (4).

export interface NFref {
  /** Chave 44 dig da NFe original (caso comum em devolucao). */
  refNFe?: string;
  /** Chave NFe sigilosa (cNF zerado). */
  refNFeSig?: string;
  /** Chave 44 dig de CTe. */
  refCTe?: string;
}

// ─── Responsável Técnico ───

export interface ResponsavelTecnico {
  CNPJ: string;
  xContato: string;
  email: string;
  fone: string;
  idCSRT?: number;
  hashCSRT?: string;
}

// ─── NFe Completa ───

export interface NFe {
  ide: Identificacao;
  emit: Emitente;
  dest?: Destinatario;
  det: Detalhe[];
  total: Total;
  transp: Transporte;
  cobr?: Cobranca;
  pag: Pagamento;
  infAdic?: InformacaoAdicional;
  infRespTec?: ResponsavelTecnico;
  /** NFs referenciadas — obrigatorio em devolucao (finNFe=4) com
   *  pelo menos 1 refNFe apontando pra NF da venda original. */
  nfRef?: NFref[];
}
