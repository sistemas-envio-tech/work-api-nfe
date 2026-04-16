import type { XmlObject } from '@acbr-node/core';
import type { Identificacao } from '../types/nfe.js';

/**
 * Monta o grupo <ide> da NFe
 * Ordem dos elementos deve seguir o XSD rigorosamente
 */
export function buildIde(ide: Identificacao): XmlObject {
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

  return obj;
}
