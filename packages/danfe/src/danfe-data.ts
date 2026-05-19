import { XmlParser, asXmlNode, asXmlArray, type XmlNode, type XmlValue } from '@acbr-node/core';

const parser = new XmlParser();

/**
 * Dados extraídos do XML da NFe/nfeProc para renderizar o DANFE
 */
export interface DanfeData {
  chaveAcesso: string;
  nProt: string;
  dhRecbto: string;

  // ide
  natOp: string;
  mod: string;
  serie: string;
  nNF: string;
  dhEmi: string;
  dhSaiEnt: string;
  tpNF: string;
  tpEmis: string;

  // emit
  emitCNPJ: string;
  emitxNome: string;
  emitxFant: string;
  emitIE: string;
  emitIEST: string;
  emitIM: string;
  emitCNAE: string;
  emitEndereco: string;
  emitBairro: string;
  emitCEP: string;
  emitMunUF: string;
  emitFone: string;

  // dest
  destCNPJCPF: string;
  destxNome: string;
  destIE: string;
  destEndereco: string;
  destBairro: string;
  destCEP: string;
  destMunUF: string;
  destFone: string;

  // totais
  vBC: string;
  vICMS: string;
  vICMSDeson: string;
  vBCST: string;
  vST: string;
  vProd: string;
  vFrete: string;
  vSeg: string;
  vDesc: string;
  vOutro: string;
  vIPI: string;
  vNF: string;
  vTotTrib: string;

  // transporte
  modFrete: string;
  transpNome: string;
  transpCNPJCPF: string;
  transpIE: string;
  transpEndereco: string;
  transpMunUF: string;
  volumes: Array<{
    qVol: string;
    esp: string;
    marca: string;
    nVol: string;
    pesoL: string;
    pesoB: string;
  }>;

  // itens
  itens: Array<{
    nItem: string;
    cProd: string;
    xProd: string;
    NCM: string;
    CST: string;
    CFOP: string;
    uCom: string;
    qCom: string;
    vUnCom: string;
    vProd: string;
    vDesc: string;
    vBC_ICMS: string;
    vICMS: string;
    pICMS: string;
    vIPI: string;
    pIPI: string;
  }>;

  // pagamento
  pagamentos: Array<{ tPag: string; vPag: string }>;

  // duplicatas
  duplicatas: Array<{ nDup: string; dVenc: string; vDup: string }>;

  // info adicional
  infAdFisco: string;
  infCpl: string;
}

/**
 * Extrai dados do XML da nfeProc ou NFe assinada para gerar o DANFE
 */
export function extractDanfeData(xml: string): DanfeData {
  const parsed = parser.parse<XmlNode>(xml);

  // Navegar: nfeProc > NFe > infNFe  ou  NFe > infNFe
  const nfeProc = asXmlNode(parsed.nfeProc);
  const nfeArr = asXmlArray(nfeProc.NFe ?? parsed.NFe);
  const nfe = nfeArr[0] ?? {};
  const infNFe = asXmlNode(nfe.infNFe ?? nfe);

  // Protocolo
  const protArr = asXmlArray(nfeProc.protNFe);
  const prot = protArr[0] ?? {};
  const infProt = asXmlNode(prot.infProt ?? prot);

  // Chave de acesso do Id (ex.: "NFe35230612345...")
  const chave = str(infNFe['@_Id']).replace('NFe', '');

  const ide = asXmlNode(infNFe.ide);
  const emit = asXmlNode(infNFe.emit);
  const enderEmit = asXmlNode(emit.enderEmit);
  const dest = asXmlNode(infNFe.dest);
  const enderDest = asXmlNode(dest.enderDest);
  const total = asXmlNode(asXmlNode(infNFe.total).ICMSTot);
  const transp = asXmlNode(infNFe.transp);
  const transporta = asXmlNode(transp.transporta);
  const pag = asXmlNode(infNFe.pag);
  const cobr = asXmlNode(infNFe.cobr);
  const infAdic = asXmlNode(infNFe.infAdic);

  // Items
  const dets = asXmlArray(infNFe.det);

  const itens = dets.map((d) => {
    const prod = asXmlNode(d.prod);
    const imposto = asXmlNode(d.imposto);
    const icms = asXmlNode(imposto.ICMS);
    // ICMS tem 1 chave por CST/CSOSN (ICMS00, ICMSSN101, etc.). Pegamos a primeira.
    const icmsObj = asXmlNode(Object.values(icms)[0]);
    const ipi = asXmlNode(imposto.IPI);
    const ipiTrib = asXmlNode(ipi.IPITrib);

    return {
      nItem: str(d['@_nItem']),
      cProd: str(prod.cProd),
      xProd: str(prod.xProd),
      NCM: str(prod.NCM),
      CST: str(icmsObj.CST ?? icmsObj.CSOSN ?? ''),
      CFOP: str(prod.CFOP),
      uCom: str(prod.uCom),
      qCom: str(prod.qCom),
      vUnCom: str(prod.vUnCom),
      vProd: str(prod.vProd),
      vDesc: str(prod.vDesc ?? '0'),
      vBC_ICMS: str(icmsObj.vBC ?? '0'),
      vICMS: str(icmsObj.vICMS ?? '0'),
      pICMS: str(icmsObj.pICMS ?? '0'),
      vIPI: str(ipiTrib.vIPI ?? '0'),
      pIPI: str(ipiTrib.pIPI ?? '0'),
    };
  });

  const dups = asXmlArray(cobr.dup);
  const detPags = asXmlArray(pag.detPag);
  const vols = asXmlArray(transp.vol);

  return {
    chaveAcesso: chave,
    nProt: str(infProt.nProt),
    dhRecbto: str(infProt.dhRecbto),

    natOp: str(ide.natOp),
    mod: str(ide.mod),
    serie: str(ide.serie),
    nNF: str(ide.nNF),
    dhEmi: str(ide.dhEmi),
    dhSaiEnt: str(ide.dhSaiEnt),
    tpNF: str(ide.tpNF),
    tpEmis: str(ide.tpEmis),

    emitCNPJ: str(emit.CNPJ ?? emit.CPF),
    emitxNome: str(emit.xNome),
    emitxFant: str(emit.xFant),
    emitIE: str(emit.IE),
    emitIEST: str(emit.IEST),
    emitIM: str(emit.IM),
    emitCNAE: str(emit.CNAE),
    emitEndereco: `${str(enderEmit.xLgr)}, ${str(enderEmit.nro)}${enderEmit.xCpl ? ' - ' + str(enderEmit.xCpl) : ''}`,
    emitBairro: str(enderEmit.xBairro),
    emitCEP: str(enderEmit.CEP),
    emitMunUF: `${str(enderEmit.xMun)} - ${str(enderEmit.UF)}`,
    emitFone: str(enderEmit.fone),

    destCNPJCPF: str(dest.CNPJ ?? dest.CPF ?? dest.idEstrangeiro),
    destxNome: str(dest.xNome),
    destIE: str(dest.IE),
    destEndereco: enderDest.xLgr ? `${str(enderDest.xLgr)}, ${str(enderDest.nro)}${enderDest.xCpl ? ' - ' + str(enderDest.xCpl) : ''}` : '',
    destBairro: str(enderDest.xBairro),
    destCEP: str(enderDest.CEP),
    destMunUF: enderDest.xMun ? `${str(enderDest.xMun)} - ${str(enderDest.UF)}` : '',
    destFone: str(enderDest.fone),

    vBC: str(total.vBC ?? '0'),
    vICMS: str(total.vICMS ?? '0'),
    vICMSDeson: str(total.vICMSDeson ?? '0'),
    vBCST: str(total.vBCST ?? '0'),
    vST: str(total.vST ?? '0'),
    vProd: str(total.vProd ?? '0'),
    vFrete: str(total.vFrete ?? '0'),
    vSeg: str(total.vSeg ?? '0'),
    vDesc: str(total.vDesc ?? '0'),
    vOutro: str(total.vOutro ?? '0'),
    vIPI: str(total.vIPI ?? '0'),
    vNF: str(total.vNF ?? '0'),
    vTotTrib: str(total.vTotTrib ?? '0'),

    modFrete: str(transp.modFrete),
    transpNome: str(transporta.xNome),
    transpCNPJCPF: str(transporta.CNPJ ?? transporta.CPF),
    transpIE: str(transporta.IE),
    transpEndereco: str(transporta.xEnder),
    transpMunUF: transporta.xMun ? `${str(transporta.xMun)} - ${str(transporta.UF)}` : '',
    volumes: vols.map((v) => ({
      qVol: str(v.qVol),
      esp: str(v.esp),
      marca: str(v.marca),
      nVol: str(v.nVol),
      pesoL: str(v.pesoL),
      pesoB: str(v.pesoB),
    })),

    itens,

    pagamentos: detPags.map((p) => ({
      tPag: str(p.tPag),
      vPag: str(p.vPag),
    })),

    duplicatas: dups.map((d) => ({
      nDup: str(d.nDup),
      dVenc: str(d.dVenc),
      vDup: str(d.vDup),
    })),

    infAdFisco: str(infAdic.infAdFisco),
    infCpl: str(infAdic.infCpl),
  };
}

function str(v: XmlValue): string {
  if (v === null || v === undefined) return '';
  return String(v);
}
