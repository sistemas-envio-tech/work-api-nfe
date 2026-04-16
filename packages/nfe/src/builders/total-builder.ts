import type { XmlObject } from '@acbr-node/core';
import type { Total } from '../types/nfe.js';
import { formatDecimal } from './det-builder.js';

/**
 * Monta o grupo <total> da NFe
 */
export function buildTotal(total: Total): XmlObject {
  const t = total.ICMSTot;

  const icmsTot: XmlObject = {
    vBC: formatDecimal(t.vBC, 2),
    vICMS: formatDecimal(t.vICMS, 2),
    vICMSDeson: formatDecimal(t.vICMSDeson, 2),
  };

  if (t.vFCPUFDest !== undefined) icmsTot.vFCPUFDest = formatDecimal(t.vFCPUFDest, 2);
  if (t.vICMSUFDest !== undefined) icmsTot.vICMSUFDest = formatDecimal(t.vICMSUFDest, 2);
  if (t.vICMSUFRemet !== undefined) icmsTot.vICMSUFRemet = formatDecimal(t.vICMSUFRemet, 2);

  icmsTot.vFCP = formatDecimal(t.vFCP, 2);
  icmsTot.vBCST = formatDecimal(t.vBCST, 2);
  icmsTot.vST = formatDecimal(t.vST, 2);
  icmsTot.vFCPST = formatDecimal(t.vFCPST, 2);
  icmsTot.vFCPSTRet = formatDecimal(t.vFCPSTRet, 2);
  icmsTot.vProd = formatDecimal(t.vProd, 2);
  icmsTot.vFrete = formatDecimal(t.vFrete, 2);
  icmsTot.vSeg = formatDecimal(t.vSeg, 2);
  icmsTot.vDesc = formatDecimal(t.vDesc, 2);
  icmsTot.vII = formatDecimal(t.vII, 2);
  icmsTot.vIPI = formatDecimal(t.vIPI, 2);

  if (t.vIPIDevol !== undefined) icmsTot.vIPIDevol = formatDecimal(t.vIPIDevol, 2);

  icmsTot.vPIS = formatDecimal(t.vPIS, 2);
  icmsTot.vCOFINS = formatDecimal(t.vCOFINS, 2);
  icmsTot.vOutro = formatDecimal(t.vOutro, 2);
  icmsTot.vNF = formatDecimal(t.vNF, 2);

  if (t.vTotTrib !== undefined) icmsTot.vTotTrib = formatDecimal(t.vTotTrib, 2);

  return { ICMSTot: icmsTot };
}
