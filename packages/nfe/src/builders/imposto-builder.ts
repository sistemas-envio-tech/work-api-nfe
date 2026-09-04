import type { XmlObject } from '@acbr-node/core';
import type { Imposto, ICMSType, PISType, COFINSType } from '../types/nfe.js';
import { formatarDecimal } from './det-builder.js';

/**
 * Monta o grupo <imposto> de cada item
 */
export function buildImposto(imposto: Imposto): XmlObject {
  const obj: XmlObject = {};

  if (imposto.vTotTrib !== undefined) {
    obj.vTotTrib = formatarDecimal(imposto.vTotTrib, 2);
  }

  obj.ICMS = buildICMS(imposto.ICMS);

  if (imposto.IPI) {
    obj.IPI = buildIPI(imposto.IPI);
  }

  obj.PIS = buildPIS(imposto.PIS);
  obj.COFINS = buildCOFINS(imposto.COFINS);

  return obj;
}

function buildICMS(icms: { [K: string]: ICMSType }): XmlObject {
  const obj: XmlObject = {};

  for (const [key, value] of Object.entries(icms)) {
    obj[key] = buildICMSFields(value);
  }

  return obj;
}

function buildICMSFields(icms: ICMSType): XmlObject {
  const obj: XmlObject = { orig: String(icms.orig) };

  if ('CST' in icms) {
    obj.CST = icms.CST;
  }
  if ('CSOSN' in icms) {
    obj.CSOSN = icms.CSOSN;
  }

  // Campos comuns
  if ('modBC' in icms && icms.modBC !== undefined) obj.modBC = String(icms.modBC);
  // pRedBC vem ANTES de vBC no XSD (ICMS20/51/70/90 e CSON 201/202/900): a ordem
  // invertida passava no zod e a SEFAZ devolvia 225 (falha de esquema).
  if ('pRedBC' in icms && icms.pRedBC !== undefined) obj.pRedBC = formatarDecimal(icms.pRedBC, 4);
  if ('vBC' in icms && icms.vBC !== undefined) obj.vBC = formatarDecimal(icms.vBC, 2);
  if ('pICMS' in icms && icms.pICMS !== undefined) obj.pICMS = formatarDecimal(icms.pICMS, 4);
  if ('vICMS' in icms && icms.vICMS !== undefined) obj.vICMS = formatarDecimal(icms.vICMS, 2);

  // ST
  if ('modBCST' in icms && icms.modBCST !== undefined) obj.modBCST = String(icms.modBCST);
  if ('pMVAST' in icms && icms.pMVAST !== undefined) obj.pMVAST = formatarDecimal(icms.pMVAST, 4);
  if ('vBCST' in icms && icms.vBCST !== undefined) obj.vBCST = formatarDecimal(icms.vBCST, 2);
  if ('pICMSST' in icms && icms.pICMSST !== undefined) obj.pICMSST = formatarDecimal(icms.pICMSST, 4);
  if ('vICMSST' in icms && icms.vICMSST !== undefined) obj.vICMSST = formatarDecimal(icms.vICMSST, 2);

  // FCP (Fundo de Combate a Pobreza) — Regime Normal. ICMS00 nao tem
  // vBCFCP no XSD (base implicita = vBC); ICMS10/20/70/90 exigem a base
  // separada. ICMS10/70/90 tambem podem ter FCP-ST (vBCFCPST/pFCPST/
  // vFCPST). Builder e generico — caller controla quais campos enviar.
  if ('vBCFCP' in icms && icms.vBCFCP !== undefined) obj.vBCFCP = formatarDecimal(icms.vBCFCP, 2);
  if ('pFCP' in icms && icms.pFCP !== undefined) obj.pFCP = formatarDecimal(icms.pFCP, 4);
  if ('vFCP' in icms && icms.vFCP !== undefined) obj.vFCP = formatarDecimal(icms.vFCP, 2);

  // FCP-ST (Fundo de Combate a Pobreza retido por Substituicao Tributaria)
  if ('vBCFCPST' in icms && icms.vBCFCPST !== undefined) obj.vBCFCPST = formatarDecimal(icms.vBCFCPST, 2);
  if ('pFCPST' in icms && icms.pFCPST !== undefined) obj.pFCPST = formatarDecimal(icms.pFCPST, 4);
  if ('vFCPST' in icms && icms.vFCPST !== undefined) obj.vFCPST = formatarDecimal(icms.vFCPST, 2);

  // FCP-ST Retido (CST 60 — quando ST foi recolhido anteriormente)
  if ('vBCFCPSTRet' in icms && icms.vBCFCPSTRet !== undefined) obj.vBCFCPSTRet = formatarDecimal(icms.vBCFCPSTRet, 2);
  if ('pFCPSTRet' in icms && icms.pFCPSTRet !== undefined) obj.pFCPSTRet = formatarDecimal(icms.pFCPSTRet, 4);
  if ('vFCPSTRet' in icms && icms.vFCPSTRet !== undefined) obj.vFCPSTRet = formatarDecimal(icms.vFCPSTRet, 2);

  // Desoneração
  if ('vICMSDeson' in icms && icms.vICMSDeson !== undefined) obj.vICMSDeson = formatarDecimal(icms.vICMSDeson, 2);
  if ('motDesICMS' in icms && icms.motDesICMS !== undefined) obj.motDesICMS = String(icms.motDesICMS);

  // Simples Nacional
  if ('pCredSN' in icms && icms.pCredSN !== undefined) obj.pCredSN = formatarDecimal(icms.pCredSN, 4);
  if ('vCredICMSSN' in icms && icms.vCredICMSSN !== undefined) obj.vCredICMSSN = formatarDecimal(icms.vCredICMSSN, 2);

  // ST Ret
  if ('vBCSTRet' in icms && icms.vBCSTRet !== undefined) obj.vBCSTRet = formatarDecimal(icms.vBCSTRet, 2);
  if ('vICMSSTRet' in icms && icms.vICMSSTRet !== undefined) obj.vICMSSTRet = formatarDecimal(icms.vICMSSTRet, 2);

  // ICMS51 specific
  if ('vICMSOp' in icms && icms.vICMSOp !== undefined) obj.vICMSOp = formatarDecimal(icms.vICMSOp, 2);
  if ('pDif' in icms && icms.pDif !== undefined) obj.pDif = formatarDecimal(icms.pDif, 4);
  if ('vICMSDif' in icms && icms.vICMSDif !== undefined) obj.vICMSDif = formatarDecimal(icms.vICMSDif, 2);

  return obj;
}

function buildIPI(ipi: any): XmlObject {
  const obj: XmlObject = { cEnq: ipi.cEnq };

  if (ipi.IPITrib) {
    const trib: XmlObject = { CST: ipi.IPITrib.CST };
    if (ipi.IPITrib.vBC !== undefined) trib.vBC = formatarDecimal(ipi.IPITrib.vBC, 2);
    if (ipi.IPITrib.pIPI !== undefined) trib.pIPI = formatarDecimal(ipi.IPITrib.pIPI, 4);
    if (ipi.IPITrib.qUnid !== undefined) trib.qUnid = formatarDecimal(ipi.IPITrib.qUnid, 4);
    if (ipi.IPITrib.vUnid !== undefined) trib.vUnid = formatarDecimal(ipi.IPITrib.vUnid, 4);
    trib.vIPI = formatarDecimal(ipi.IPITrib.vIPI, 2);
    obj.IPITrib = trib;
  } else if (ipi.IPINT) {
    obj.IPINT = { CST: ipi.IPINT.CST };
  }

  return obj;
}

function buildPIS(pis: { [K: string]: PISType }): XmlObject {
  const obj: XmlObject = {};

  for (const [key, value] of Object.entries(pis)) {
    const pisObj: XmlObject = { CST: value.CST };

    if ('vBC' in value && value.vBC !== undefined) pisObj.vBC = formatarDecimal(value.vBC, 2);
    if ('pPIS' in value && value.pPIS !== undefined) pisObj.pPIS = formatarDecimal(value.pPIS, 4);
    if ('qBCProd' in value && value.qBCProd !== undefined) pisObj.qBCProd = formatarDecimal(value.qBCProd, 4);
    if ('vAliqProd' in value && value.vAliqProd !== undefined) pisObj.vAliqProd = formatarDecimal(value.vAliqProd, 4);
    if ('vPIS' in value && value.vPIS !== undefined) pisObj.vPIS = formatarDecimal(value.vPIS, 2);

    obj[key] = pisObj;
  }

  return obj;
}

function buildCOFINS(cofins: { [K: string]: COFINSType }): XmlObject {
  const obj: XmlObject = {};

  for (const [key, value] of Object.entries(cofins)) {
    const cofObj: XmlObject = { CST: value.CST };

    if ('vBC' in value && value.vBC !== undefined) cofObj.vBC = formatarDecimal(value.vBC, 2);
    if ('pCOFINS' in value && value.pCOFINS !== undefined) cofObj.pCOFINS = formatarDecimal(value.pCOFINS, 4);
    if ('qBCProd' in value && value.qBCProd !== undefined) cofObj.qBCProd = formatarDecimal(value.qBCProd, 4);
    if ('vAliqProd' in value && value.vAliqProd !== undefined) cofObj.vAliqProd = formatarDecimal(value.vAliqProd, 4);
    if ('vCOFINS' in value && value.vCOFINS !== undefined) cofObj.vCOFINS = formatarDecimal(value.vCOFINS, 2);

    obj[key] = cofObj;
  }

  return obj;
}
