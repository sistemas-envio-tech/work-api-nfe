import { createHash } from 'node:crypto';
import type { Ambiente } from './sefaz-urls.js';

/**
 * URLs publicas de consulta NFCe por UF.
 *
 * IMPORTANTE: estas URLs SAO DIFERENTES das URLs SOAP de autorizacao.
 * O QR Code da NFCe sempre aponta para o portal de consulta da UF EMITENTE,
 * independente do autorizador SOAP (uma NFCe do RJ autorizada via SVRS-NFCe
 * tem QR Code apontando para o portal SEFAZ-RJ).
 *
 * As URLs aqui sao baseadas em documentacao publica SEFAZ (Anexo II - QR Code
 * do Manual da NFCe). Caso uma UF mude o portal publico, use
 * definirOverrideUrlQrCodeNFCe() em runtime sem esperar release.
 *
 * Cada UF tem 2 URLs:
 *   - qrCode: usada para construir o conteudo do QR Code (consumer escaneia)
 *   - urlChave: usada no campo <urlChave> do XML (consulta manual pela chave)
 */
interface QrCodeUrls {
  qrCode: string;
  urlChave: string;
}

const NFCE_URLS_PROD: Record<string, QrCodeUrls> = {
  AC: { qrCode: 'http://www.sefaznet.ac.gov.br/nfce/qrcode',                     urlChave: 'http://www.sefaznet.ac.gov.br/nfce/consulta' },
  AL: { qrCode: 'http://nfce.sefaz.al.gov.br/QRCode/consultarNFCe.jsp',          urlChave: 'http://www.sefaz.al.gov.br/nfce/consulta' },
  AM: { qrCode: 'https://sistemas.sefaz.am.gov.br/nfceweb/consultarNFCe.jsp',    urlChave: 'https://sistemas.sefaz.am.gov.br/nfceweb/formConsulta.do' },
  AP: { qrCode: 'https://www.sefaz.ap.gov.br/nfce/qrcode',                       urlChave: 'https://www.sefaz.ap.gov.br/nfce/consulta' },
  BA: { qrCode: 'http://nfe.sefaz.ba.gov.br/servicos/nfce/qrcode.aspx',          urlChave: 'http://nfe.sefaz.ba.gov.br/servicos/nfce/Modulos/Geral/NFCEC_consulta_chave_acesso.aspx' },
  CE: { qrCode: 'http://nfceh.sefaz.ce.gov.br/pages/ShowNFCe.html',              urlChave: 'http://www.sefaz.ce.gov.br/nfce/consulta' },
  DF: { qrCode: 'http://dec.fazenda.df.gov.br/ConsultarNFCe.aspx',               urlChave: 'http://dec.fazenda.df.gov.br/NFCE/' },
  ES: { qrCode: 'http://app.sefaz.es.gov.br/ConsultaNFCe/qrcode.aspx',           urlChave: 'http://app.sefaz.es.gov.br/ConsultaNFCe' },
  GO: { qrCode: 'http://www.sefaz.go.gov.br/nfeweb/sites/nfce/danfeNFCe',        urlChave: 'http://www.sefaz.go.gov.br/nfe/consulta' },
  MA: { qrCode: 'http://www.nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp',      urlChave: 'http://www.nfce.sefaz.ma.gov.br/portal/consultaNFCe.jsp' },
  MG: { qrCode: 'https://portalsped.fazenda.mg.gov.br/portalnfce',               urlChave: 'https://portalsped.fazenda.mg.gov.br/portalnfce' },
  MS: { qrCode: 'http://www.dfe.ms.gov.br/nfce/qrcode',                          urlChave: 'http://www.dfe.ms.gov.br/nfce' },
  MT: { qrCode: 'http://www.sefaz.mt.gov.br/nfce/consultanfce',                  urlChave: 'http://www.sefaz.mt.gov.br/nfce/consultanfce' },
  PA: { qrCode: 'https://appnfc.sefa.pa.gov.br/portal/view/consultas/nfce/nfceForm.seam',  urlChave: 'https://appnfc.sefa.pa.gov.br/portal/view/consultas/nfce/consultanfce.seam' },
  PB: { qrCode: 'http://www.receita.pb.gov.br/nfce',                             urlChave: 'http://www.receita.pb.gov.br/nfce' },
  PE: { qrCode: 'http://nfce.sefaz.pe.gov.br/nfce/consulta',                     urlChave: 'http://nfce.sefaz.pe.gov.br/nfce/consulta' },
  PI: { qrCode: 'http://www.sefaz.pi.gov.br/nfce/qrcode',                        urlChave: 'http://www.sefaz.pi.gov.br/nfce/consulta' },
  PR: { qrCode: 'http://www.fazenda.pr.gov.br/nfce/qrcode',                      urlChave: 'http://www.fazenda.pr.gov.br/nfce/consulta' },
  RJ: { qrCode: 'http://www4.fazenda.rj.gov.br/consultaNFCe/QRCode',             urlChave: 'http://www4.fazenda.rj.gov.br/consultaNFCe' },
  RN: { qrCode: 'http://nfce.set.rn.gov.br/consultarNFCe.aspx',                  urlChave: 'http://nfce.set.rn.gov.br/portalDFE/NFCe/mod/ConsultaCompletaNFCe.aspx' },
  RO: { qrCode: 'http://www.nfce.sefin.ro.gov.br/consultanfce/consulta.jsp',     urlChave: 'http://www.nfce.sefin.ro.gov.br/consultanfce' },
  RR: { qrCode: 'https://www.sefaz.rr.gov.br/nfce/servlet/qrcode',               urlChave: 'https://www.sefaz.rr.gov.br/nfce/servlet/wp_consulta_nfce' },
  RS: { qrCode: 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx',                urlChave: 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx' },
  SC: { qrCode: 'https://sat.sef.sc.gov.br/nfce/consulta',                       urlChave: 'https://sat.sef.sc.gov.br/nfce/consulta' },
  SE: { qrCode: 'http://www.nfce.se.gov.br/portal/consultarNFCe.jsp',            urlChave: 'http://www.nfce.se.gov.br/portal/consultarNFCe.jsp' },
  SP: { qrCode: 'https://www.nfce.fazenda.sp.gov.br/qrcode',                     urlChave: 'https://www.nfce.fazenda.sp.gov.br/consulta' },
  TO: { qrCode: 'http://www.sefaz.to.gov.br/nfce/qrcode',                        urlChave: 'http://www.sefaz.to.gov.br/nfce/consulta' },
};

const NFCE_URLS_HOM: Record<string, QrCodeUrls> = {
  AC: { qrCode: 'http://hml.sefaznet.ac.gov.br/nfce/qrcode',                        urlChave: 'http://hml.sefaznet.ac.gov.br/nfce/consulta' },
  AL: { qrCode: 'http://nfce.sefaz.al.gov.br/QRCode/consultarNFCe.jsp',             urlChave: 'http://www.sefaz.al.gov.br/nfce/consulta' },
  AM: { qrCode: 'https://homnfce.sefaz.am.gov.br/nfceweb-hom/consultarNFCe.jsp',    urlChave: 'https://homnfce.sefaz.am.gov.br/nfceweb-hom/formConsulta.do' },
  AP: { qrCode: 'https://www.sefaz.ap.gov.br/nfcehom/qrcode',                       urlChave: 'https://www.sefaz.ap.gov.br/nfcehom/consulta' },
  BA: { qrCode: 'http://hnfe.sefaz.ba.gov.br/servicos/nfce/qrcode.aspx',            urlChave: 'http://hnfe.sefaz.ba.gov.br/servicos/nfce/Modulos/Geral/NFCEC_consulta_chave_acesso.aspx' },
  CE: { qrCode: 'http://nfceh.sefaz.ce.gov.br/pages/ShowNFCe.html',                 urlChave: 'http://nfceh.sefaz.ce.gov.br/nfce/consulta' },
  DF: { qrCode: 'http://dec.fazenda.df.gov.br/ConsultarNFCe.aspx',                  urlChave: 'http://dec.fazenda.df.gov.br/NFCE/' },
  ES: { qrCode: 'http://homologacao.sefaz.es.gov.br/ConsultaNFCe/qrcode.aspx',      urlChave: 'http://homologacao.sefaz.es.gov.br/ConsultaNFCe' },
  GO: { qrCode: 'http://homolog.sefaz.go.gov.br/nfeweb/sites/nfce/danfeNFCe',       urlChave: 'http://homolog.sefaz.go.gov.br/nfe/consulta' },
  MA: { qrCode: 'http://www.hom.nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp',     urlChave: 'http://www.hom.nfce.sefaz.ma.gov.br/portal/consultaNFCe.jsp' },
  MG: { qrCode: 'https://hportalsped.fazenda.mg.gov.br/portalnfce',                 urlChave: 'https://hportalsped.fazenda.mg.gov.br/portalnfce' },
  MS: { qrCode: 'http://www.dfe.ms.gov.br/nfce/qrcode',                             urlChave: 'http://www.dfe.ms.gov.br/nfce' },
  MT: { qrCode: 'http://homologacao.sefaz.mt.gov.br/nfce/consultanfce',             urlChave: 'http://homologacao.sefaz.mt.gov.br/nfce/consultanfce' },
  PA: { qrCode: 'https://appnfc.sefa.pa.gov.br/portal-homologacao/view/consultas/nfce/nfceForm.seam',  urlChave: 'https://appnfc.sefa.pa.gov.br/portal-homologacao/view/consultas/nfce/consultanfce.seam' },
  PB: { qrCode: 'http://www.receita.pb.gov.br/nfcehom',                             urlChave: 'http://www.receita.pb.gov.br/nfcehom' },
  PE: { qrCode: 'http://nfcehomolog.sefaz.pe.gov.br/nfce/consulta',                 urlChave: 'http://nfcehomolog.sefaz.pe.gov.br/nfce/consulta' },
  PI: { qrCode: 'http://www.sefaz.pi.gov.br/nfcehom/qrcode',                        urlChave: 'http://www.sefaz.pi.gov.br/nfcehom/consulta' },
  PR: { qrCode: 'http://www.fazenda.pr.gov.br/nfce/qrcode',                         urlChave: 'http://www.fazenda.pr.gov.br/nfce/consulta' },
  RJ: { qrCode: 'http://www4.fazenda.rj.gov.br/consultaNFCeHom/QRCode',             urlChave: 'http://www4.fazenda.rj.gov.br/consultaNFCeHom' },
  RN: { qrCode: 'http://homologacao.set.rn.gov.br/portalDFE/NFCe/mod/QRCode.aspx',  urlChave: 'http://hom.nfce.set.rn.gov.br/portalDFE/NFCe/mod/ConsultaCompletaNFCe.aspx' },
  RO: { qrCode: 'http://www.nfce.sefin.ro.gov.br/consultanfce/consulta.jsp',        urlChave: 'http://www.nfce.sefin.ro.gov.br/consultanfce' },
  RR: { qrCode: 'http://200.174.88.103:8080/nfce/servlet/qrcode',                   urlChave: 'http://200.174.88.103:8080/nfce/servlet/wp_consulta_nfce' },
  RS: { qrCode: 'https://www.sefazrs.rs.gov.br/NFCE/NFCE-COM.aspx',                 urlChave: 'https://www.sefazrs.rs.gov.br/NFCE/NFCE-COM.aspx' },
  SC: { qrCode: 'https://hom.sat.sef.sc.gov.br/nfce/consulta',                      urlChave: 'https://hom.sat.sef.sc.gov.br/nfce/consulta' },
  SE: { qrCode: 'http://www.hom.nfe.se.gov.br/portal/consultarNFCe.jsp',            urlChave: 'http://www.hom.nfe.se.gov.br/portal/consultarNFCe.jsp' },
  SP: { qrCode: 'https://www.homologacao.nfce.fazenda.sp.gov.br/qrcode',            urlChave: 'https://www.homologacao.nfce.fazenda.sp.gov.br/consulta' },
  TO: { qrCode: 'http://homologacao.sefaz.to.gov.br/nfce/qrcode',                   urlChave: 'http://homologacao.sefaz.to.gov.br/nfce/consulta' },
};

const urlOverrides = new Map<string, QrCodeUrls>();

function obterUrls(uf: string, ambiente: Ambiente): QrCodeUrls {
  const ufUpper = uf.toUpperCase();
  const overrideKey = `${ufUpper}:${ambiente}`;
  const override = urlOverrides.get(overrideKey);
  if (override) return override;

  const map = ambiente === 'producao' ? NFCE_URLS_PROD : NFCE_URLS_HOM;
  const urls = map[ufUpper];
  if (!urls) {
    throw new Error(
      `URLs de QR Code NFCe nao configuradas para UF=${uf} ambiente=${ambiente}. ` +
      `Use definirOverrideUrlQrCodeNFCe() para configurar.`,
    );
  }
  return urls;
}

/**
 * Define override manual das URLs de QR Code NFCe pra uma UF/ambiente.
 * Util quando a SEFAZ-UF mudou o portal e o app precisa funcionar antes do
 * release de atualizacao do pacote.
 */
export function definirOverrideUrlQrCodeNFCe(
  uf: string,
  ambiente: Ambiente,
  urls: { qrCode: string; urlChave: string },
): void {
  urlOverrides.set(`${uf.toUpperCase()}:${ambiente}`, urls);
}

/**
 * Parametros para gerar o QR Code da NFCe conforme Anexo II - Manual NFCe v4.00.
 */
export interface QrCodeNFCeParams {
  chaveAcesso: string;
  ambiente: 1 | 2;
  uf: string;
  /** ID do CSC (Codigo de Seguranca do Contribuinte) — 6 digitos zero-padded. */
  cscId: string;
  /** Valor do CSC (token secreto fornecido pela SEFAZ ao contribuinte). */
  csc: string;
  /** Versao do QR Code (default 2, conforme NFCe 4.00). */
  versaoQR?: '2';
}

/**
 * Gera os dois campos que vao no elemento <infNFeSupl> do XML NFCe:
 * - qrCode: URL completa que vai dentro do QR Code (consumer escaneia)
 * - urlChave: URL de consulta manual pela chave de acesso
 *
 * Conforme Anexo II do Manual da NFCe (leiaute 4.00):
 *   qrCode = {urlConsultaPublica}?p={chNFe}|{versaoQR}|{tpAmb}|{cIdToken}|{cHashQRCode}
 *   cHashQRCode = SHA1_hex_lowercase( chNFe + versaoQR + tpAmb + cIdToken + CSC )
 */
export function gerarInfoQrCodeNFCe(params: QrCodeNFCeParams): {
  qrCode: string;
  urlChave: string;
} {
  const versaoQR = params.versaoQR ?? '2';
  const cIdToken = params.cscId.padStart(6, '0');
  const ambienteResolved: Ambiente = params.ambiente === 1 ? 'producao' : 'homologacao';
  const urls = obterUrls(params.uf, ambienteResolved);

  // SHA1 hex lowercase de: chave + versao + tpAmb + cIdToken + CSC
  const payload = `${params.chaveAcesso}${versaoQR}${params.ambiente}${cIdToken}${params.csc}`;
  const cHashQRCode = createHash('sha1').update(payload, 'utf8').digest('hex').toLowerCase();

  const qrCodeUrl = `${urls.qrCode}?p=${params.chaveAcesso}|${versaoQR}|${params.ambiente}|${cIdToken}|${cHashQRCode}`;

  return {
    qrCode: qrCodeUrl,
    urlChave: urls.urlChave,
  };
}
