import { XmlBuilder, type XmlObject, gerarChaveAcesso, gerarCodigoAleatorio } from '@acbr-node/core';
import type { NFe } from '../types/nfe.js';
import { NFE_NAMESPACE, NFE_VERSAO } from '../types/nfe.js';
import { buildIde } from './ide-builder.js';
import { buildEmit } from './emit-builder.js';
import { buildDest } from './dest-builder.js';
import { buildDet } from './det-builder.js';
import { buildTotal } from './total-builder.js';
import { buildTransp } from './transp-builder.js';
import { buildCobr } from './cobr-builder.js';
import { buildPag } from './pag-builder.js';
import { buildInfAdic } from './infadic-builder.js';
import { buildInfRespTec } from './resp-tec-builder.js';

/**
 * Monta o XML completo da NFe a partir dos dados tipados
 *
 * Estrutura: NFe > infNFe (versao, Id) > ide, emit, dest, det[], total, transp, cobr, pag, infAdic
 */
export function buildNFeXml(nfe: NFe): { xml: string; chaveAcesso: string } {
  // Gerar código numérico se não informado
  const cNF = nfe.ide.cNF ?? gerarCodigoAleatorio();

  // Gerar chave de acesso
  const chaveAcesso = gerarChaveAcesso({
    cUF: nfe.ide.cUF,
    dataEmissao: new Date(nfe.ide.dhEmi),
    cnpj: (nfe.emit.CNPJ || nfe.emit.CPF)!,
    mod: nfe.ide.mod,
    serie: nfe.ide.serie,
    nNF: nfe.ide.nNF,
    tpEmis: nfe.ide.tpEmis,
    cNF,
  });

  const cDV = parseInt(chaveAcesso[43], 10);

  // Montar infNFe com todos os grupos na ordem correta do XSD
  const infNFe: XmlObject = {
    '@versao': NFE_VERSAO,
    '@Id': `NFe${chaveAcesso}`,
    ide: buildIde({ ...nfe.ide, cNF, cDV }),
    emit: buildEmit(nfe.emit),
  };

  if (nfe.dest) {
    infNFe.dest = buildDest(nfe.dest);
  }

  // Detalhes (items) - cada det com nItem sequencial
  infNFe.det = nfe.det.map((d, i) => buildDet({ ...d, nItem: i + 1 }));

  infNFe.total = buildTotal(nfe.total);
  infNFe.transp = buildTransp(nfe.transp);

  if (nfe.cobr) {
    infNFe.cobr = buildCobr(nfe.cobr);
  }

  infNFe.pag = buildPag(nfe.pag);

  if (nfe.infAdic) {
    infNFe.infAdic = buildInfAdic(nfe.infAdic);
  }

  if (nfe.infRespTec) {
    infNFe.infRespTec = buildInfRespTec(nfe.infRespTec, chaveAcesso);
  }

  const xml = XmlBuilder.build('NFe', { infNFe }, NFE_NAMESPACE);

  return { xml, chaveAcesso };
}

/**
 * Monta o envelope enviNFe para envio de lote
 */
export function buildEnviNFeXml(
  signedNFeXmls: string[],
  idLote: string,
  indSinc: 0 | 1 = 1
): string {
  return XmlBuilder.buildEnviNFe(signedNFeXmls, idLote, indSinc);
}

/**
 * Monta o XML de consulta de status do serviço
 */
export function buildConsStatServXml(tpAmb: number, cUF: number): string {
  return XmlBuilder.build('consStatServ', {
    '@versao': NFE_VERSAO,
    '@xmlns': NFE_NAMESPACE,
    tpAmb: String(tpAmb),
    cUF: String(cUF),
    xServ: 'STATUS',
  }, NFE_NAMESPACE);
}

/**
 * Monta o XML de consulta de protocolo (por chave de acesso)
 */
export function buildConsSitNFeXml(tpAmb: number, chNFe: string): string {
  return XmlBuilder.build('consSitNFe', {
    '@versao': NFE_VERSAO,
    '@xmlns': NFE_NAMESPACE,
    tpAmb: String(tpAmb),
    xServ: 'CONSULTAR',
    chNFe,
  }, NFE_NAMESPACE);
}

/**
 * Monta o XML de inutilização
 */
export function buildInutNFeXml(params: {
  tpAmb: number;
  cUF: number;
  ano: number;
  CNPJ: string;
  mod: number;
  serie: number;
  nNFIni: number;
  nNFFin: number;
  xJust: string;
}): string {
  const { tpAmb, cUF, ano, CNPJ, mod, serie, nNFIni, nNFFin, xJust } = params;

  const anoStr = String(ano).slice(-2);
  const id = `ID${cUF}${anoStr}${CNPJ}${String(mod).padStart(2, '0')}${String(serie).padStart(3, '0')}${String(nNFIni).padStart(9, '0')}${String(nNFFin).padStart(9, '0')}`;

  return XmlBuilder.build('inutNFe', {
    '@versao': NFE_VERSAO,
    '@xmlns': NFE_NAMESPACE,
    infInut: {
      '@Id': id,
      tpAmb: String(tpAmb),
      xServ: 'INUTILIZAR',
      cUF: String(cUF),
      ano: anoStr,
      CNPJ,
      mod: String(mod),
      serie: String(serie),
      nNFIni: String(nNFIni),
      nNFFin: String(nNFFin),
      xJust,
    },
  }, NFE_NAMESPACE);
}

/**
 * Monta o XML de consulta de recibo (async)
 */
export function buildConsReciNFeXml(tpAmb: number, nRec: string): string {
  return XmlBuilder.build('consReciNFe', {
    '@versao': NFE_VERSAO,
    '@xmlns': NFE_NAMESPACE,
    tpAmb: String(tpAmb),
    nRec,
  }, NFE_NAMESPACE);
}

/**
 * Monta o fragmento <infNFeSupl> que vai DEPOIS da Signature na NFCe.
 *
 * Conforme leiaute SEFAZ NFCe v4.00 (Anexo II do Manual da NFCe), o elemento
 * <infNFeSupl> e irmao de <infNFe> e <Signature>, contendo:
 *   - <qrCode>: URL completa que vai dentro do QR Code (CDATA pra preservar
 *      caracteres especiais como | e &)
 *   - <urlChave>: URL publica de consulta manual pela chave de acesso
 *
 * Retorna apenas o fragmento — quem chama insere antes de </NFe> na string
 * do XML ja assinado.
 */
export function buildInfNFeSuplXml(qrCode: string, urlChave: string): string {
  return `<infNFeSupl><qrCode><![CDATA[${qrCode}]]></qrCode><urlChave>${urlChave}</urlChave></infNFeSupl>`;
}
