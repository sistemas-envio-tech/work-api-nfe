import type { XmlObject } from '@acbr-node/core';
import type { Identificacao, NFref } from '../types/nfe.js';
import { buildNFref } from './nfref-builder.js';

/**
 * Monta o grupo <ide> da NFe
 * Ordem dos elementos deve seguir o XSD rigorosamente:
 *   cUF, cNF, natOp, mod, serie, nNF, dhEmi, dhSaiEnt?, tpNF, idDest,
 *   cMunFG, tpImp, tpEmis, cDV, tpAmb, finNFe, indFinal, indPres,
 *   indIntermed?, procEmi, verProc, dhCont?, xJust?, NFref* (0..999).
 *
 * NFref vem do parametro `nfRef` (vive no NFe.nfRef, nao em Identificacao
 * — caller passa explicito pra deixar claro que nao e parte do tipo
 * Identificacao do dominio). Cada entrada vira um <NFref>.
 */
export function buildIde(ide: Identificacao, nfRef?: NFref[]): XmlObject {
  const obj: XmlObject = {
    cUF: String(ide.cUF),
    cNF: String(ide.cNF ?? 0).padStart(8, '0'),
    natOp: ide.natOp,
    mod: String(ide.mod),
    serie: String(ide.serie),
    nNF: String(ide.nNF),
    dhEmi: ide.dhEmi,
  };

  if (ide.dhSaiEnt !== undefined) {
    obj.dhSaiEnt = ide.dhSaiEnt;
  }

  obj.tpNF = String(ide.tpNF);
  obj.idDest = String(ide.idDest);
  obj.cMunFG = String(ide.cMunFG);
  obj.tpImp = String(ide.tpImp);
  obj.tpEmis = String(ide.tpEmis);
  obj.cDV = String(ide.cDV ?? 0);
  obj.tpAmb = String(ide.tpAmb);
  obj.finNFe = String(ide.finNFe);
  obj.indFinal = String(ide.indFinal);
  obj.indPres = String(ide.indPres);

  if (ide.indIntermed !== undefined) {
    obj.indIntermed = String(ide.indIntermed);
  }

  obj.procEmi = String(ide.procEmi);
  obj.verProc = ide.verProc;

  // Contingência
  if (ide.dhCont) {
    obj.dhCont = ide.dhCont;
    obj.xJust = ide.xJust ?? '';
  }

  // NFs referenciadas (vai DEPOIS de xJust, conforme XSD).
  // fast-xml-parser serializa array como N tags com mesmo nome.
  if (nfRef && nfRef.length > 0) {
    obj.NFref = nfRef.map((r) => buildNFref(r));
  }

  return obj;
}
