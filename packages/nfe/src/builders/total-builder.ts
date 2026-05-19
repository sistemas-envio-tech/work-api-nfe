import type { XmlObject } from '@acbr-node/core';
import type { Total } from '../types/nfe.js';
import { formatarDecimal } from './det-builder.js';

/**
 * Monta o grupo <total> da NFe
 */
export function buildTotal(total: Total): XmlObject {
  const t = total.ICMSTot;

  const icmsTot: XmlObject = {
    vBC: formatarDecimal(t.vBC, 2),
    vICMS: formatarDecimal(t.vICMS, 2),
    vICMSDeson: formatarDecimal(t.vICMSDeson, 2),
  };

  if (t.vFCPUFDest !== undefined) icmsTot.vFCPUFDest = formatarDecimal(t.vFCPUFDest, 2);
  if (t.vICMSUFDest !== undefined) icmsTot.vICMSUFDest = formatarDecimal(t.vICMSUFDest, 2);
  if (t.vICMSUFRemet !== undefined) icmsTot.vICMSUFRemet = formatarDecimal(t.vICMSUFRemet, 2);

  icmsTot.vFCP = formatarDecimal(t.vFCP, 2);
  icmsTot.vBCST = formatarDecimal(t.vBCST, 2);
  icmsTot.vST = formatarDecimal(t.vST, 2);
  icmsTot.vFCPST = formatarDecimal(t.vFCPST, 2);
  icmsTot.vFCPSTRet = formatarDecimal(t.vFCPSTRet, 2);
  icmsTot.vProd = formatarDecimal(t.vProd, 2);
  icmsTot.vFrete = formatarDecimal(t.vFrete, 2);
  icmsTot.vSeg = formatarDecimal(t.vSeg, 2);
  icmsTot.vDesc = formatarDecimal(t.vDesc, 2);
  icmsTot.vII = formatarDecimal(t.vII, 2);
  icmsTot.vIPI = formatarDecimal(t.vIPI, 2);

  if (t.vIPIDevol !== undefined) icmsTot.vIPIDevol = formatarDecimal(t.vIPIDevol, 2);

  icmsTot.vPIS = formatarDecimal(t.vPIS, 2);
  icmsTot.vCOFINS = formatarDecimal(t.vCOFINS, 2);
  icmsTot.vOutro = formatarDecimal(t.vOutro, 2);
  icmsTot.vNF = formatarDecimal(t.vNF, 2);

  if (t.vTotTrib !== undefined) icmsTot.vTotTrib = formatarDecimal(t.vTotTrib, 2);

  return { ICMSTot: icmsTot };
}
