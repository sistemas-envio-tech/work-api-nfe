import type { XmlObject } from '@acbr-node/core';
import type { Imposto, ICMSType, PISType, COFINSType } from '../types/nfe.js';
import { formatDecimal } from './det-builder.js';

/**
 * Monta o grupo <imposto> de cada item
 */
export function buildImposto(imposto: Imposto): XmlObject {
  const obj: XmlObject = {};

  if (imposto.vTotTrib !== undefined) {
    obj.vTotTrib = formatDecimal(imposto.vTotTrib, 2);
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
  if ('vBC' in icms && icms.vBC !== undefined) obj.vBC = formatDecimal(icms.vBC, 2);
  if ('pRedBC' in icms && icms.pRedBC !== undefined) obj.pRedBC = formatDecimal(icms.pRedBC, 4);
  if ('pICMS' in icms && icms.pICMS !== undefined) obj.pICMS = formatDecimal(icms.pICMS, 4);
  if ('vICMS' in icms && icms.vICMS !== undefined) obj.vICMS = formatDecimal(icms.vICMS, 2);

  // ST
  if ('modBCST' in icms && icms.modBCST !== undefined) obj.modBCST = String(icms.modBCST);
  if ('pMVAST' in icms && icms.pMVAST !== undefined) obj.pMVAST = formatDecimal(icms.pMVAST, 4);
  if ('vBCST' in icms && icms.vBCST !== undefined) obj.vBCST = formatDecimal(icms.vBCST, 2);
  if ('pICMSST' in icms && icms.pICMSST !== undefined) obj.pICMSST = formatDecimal(icms.pICMSST, 4);
  if ('vICMSST' in icms && icms.vICMSST !== undefined) obj.vICMSST = formatDecimal(icms.vICMSST, 2);

  // FCP
  if ('pFCP' in icms && icms.pFCP !== undefined) obj.pFCP = formatDecimal(icms.pFCP, 4);
  if ('vFCP' in icms && icms.vFCP !== undefined) obj.vFCP = formatDecimal(icms.vFCP, 2);

  // Desoneração
  if ('vICMSDeson' in icms && icms.vICMSDeson !== undefined) obj.vICMSDeson = formatDecimal(icms.vICMSDeson, 2);
  if ('motDesICMS' in icms && icms.motDesICMS !== undefined) obj.motDesICMS = String(icms.motDesICMS);

  // Simples Nacional
  if ('pCredSN' in icms && icms.pCredSN !== undefined) obj.pCredSN = formatDecimal(icms.pCredSN, 4);
  if ('vCredICMSSN' in icms && icms.vCredICMSSN !== undefined) obj.vCredICMSSN = formatDecimal(icms.vCredICMSSN, 2);

  // ST Ret
  if ('vBCSTRet' in icms && icms.vBCSTRet !== undefined) obj.vBCSTRet = formatDecimal(icms.vBCSTRet, 2);
  if ('vICMSSTRet' in icms && icms.vICMSSTRet !== undefined) obj.vICMSSTRet = formatDecimal(icms.vICMSSTRet, 2);

  // ICMS51 specific
  if ('vICMSOp' in icms && icms.vICMSOp !== undefined) obj.vICMSOp = formatDecimal(icms.vICMSOp, 2);
  if ('pDif' in icms && icms.pDif !== undefined) obj.pDif = formatDecimal(icms.pDif, 4);
  if ('vICMSDif' in icms && icms.vICMSDif !== undefined) obj.vICMSDif = formatDecimal(icms.vICMSDif, 2);

  return obj;
}

function buildIPI(ipi: any): XmlObject {
  const obj: XmlObject = { cEnq: ipi.cEnq };

  if (ipi.IPITrib) {
    const trib: XmlObject = { CST: ipi.IPITrib.CST };
    if (ipi.IPITrib.vBC !== undefined) trib.vBC = formatDecimal(ipi.IPITrib.vBC, 2);
    if (ipi.IPITrib.pIPI !== undefined) trib.pIPI = formatDecimal(ipi.IPITrib.pIPI, 4);
    if (ipi.IPITrib.qUnid !== undefined) trib.qUnid = formatDecimal(ipi.IPITrib.qUnid, 4);
    if (ipi.IPITrib.vUnid !== undefined) trib.vUnid = formatDecimal(ipi.IPITrib.vUnid, 4);
    trib.vIPI = formatDecimal(ipi.IPITrib.vIPI, 2);
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

    if ('vBC' in value && value.vBC !== undefined) pisObj.vBC = formatDecimal(value.vBC, 2);
    if ('pPIS' in value && value.pPIS !== undefined) pisObj.pPIS = formatDecimal(value.pPIS, 4);
    if ('qBCProd' in value && value.qBCProd !== undefined) pisObj.qBCProd = formatDecimal(value.qBCProd, 4);
    if ('vAliqProd' in value && value.vAliqProd !== undefined) pisObj.vAliqProd = formatDecimal(value.vAliqProd, 4);
    if ('vPIS' in value && value.vPIS !== undefined) pisObj.vPIS = formatDecimal(value.vPIS, 2);

    obj[key] = pisObj;
  }

  return obj;
}

function buildCOFINS(cofins: { [K: string]: COFINSType }): XmlObject {
  const obj: XmlObject = {};

  for (const [key, value] of Object.entries(cofins)) {
    const cofObj: XmlObject = { CST: value.CST };

    if ('vBC' in value && value.vBC !== undefined) cofObj.vBC = formatDecimal(value.vBC, 2);
    if ('pCOFINS' in value && value.pCOFINS !== undefined) cofObj.pCOFINS = formatDecimal(value.pCOFINS, 4);
    if ('qBCProd' in value && value.qBCProd !== undefined) cofObj.qBCProd = formatDecimal(value.qBCProd, 4);
    if ('vAliqProd' in value && value.vAliqProd !== undefined) cofObj.vAliqProd = formatDecimal(value.vAliqProd, 4);
    if ('vCOFINS' in value && value.vCOFINS !== undefined) cofObj.vCOFINS = formatDecimal(value.vCOFINS, 2);

    obj[key] = cofObj;
  }

  return obj;
}
