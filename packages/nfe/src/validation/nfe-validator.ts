import { z } from 'zod';
import { ValidationError } from '@acbr-node/core';
import type { NFe } from '../types/nfe.js';

// ─── Schemas Zod ───
//
// Os schemas espelham as interfaces em ../types/nfe.ts. Para grupos cujo
// shape varia muito (ICMS/PIS/COFINS dentro de imposto — uma chave por
// CST/CSOSN com formato diferente), usamos z.record(...) ao inves de
// discriminated union exaustivo. Isso ainda bloqueia tipos errados ("imposto
// como string", "ICMS como number") sem listar 30+ variantes de CST.

const enderecoSchema = z.object({
  xLgr: z.string().min(1).max(60),
  nro: z.string().min(1).max(60),
  xCpl: z.string().max(60).optional(),
  xBairro: z.string().min(1).max(60),
  cMun: z.number().int(),
  xMun: z.string().min(1).max(60),
  UF: z.string().length(2),
  CEP: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
  cPais: z.number().int().optional(),
  xPais: z.string().optional(),
  fone: z.string().optional(),
});

const emitenteSchema = z.object({
  CNPJ: z.string().regex(/^\d{14}$/).optional(),
  CPF: z.string().regex(/^\d{11}$/).optional(),
  xNome: z.string().min(1).max(60),
  xFant: z.string().max(60).optional(),
  enderEmit: enderecoSchema,
  IE: z.string().min(2).max(14),
  IEST: z.string().optional(),
  IM: z.string().optional(),
  CNAE: z.string().optional(),
  CRT: z.union([z.literal(1), z.literal(2), z.literal(3)]),
}).refine(d => d.CNPJ || d.CPF, { message: 'CNPJ ou CPF do emitente é obrigatório' });

const destinatarioSchema = z.object({
  CNPJ: z.string().regex(/^\d{14}$/).optional(),
  CPF: z.string().regex(/^\d{11}$/).optional(),
  idEstrangeiro: z.string().max(20).optional(),
  xNome: z.string().min(2).max(60).optional(),
  enderDest: enderecoSchema.optional(),
  indIEDest: z.union([z.literal(1), z.literal(2), z.literal(9)]),
  IE: z.string().optional(),
  ISUF: z.string().optional(),
  IM: z.string().optional(),
  email: z.string().email().max(60).optional(),
}).refine(
  (d) => d.CNPJ || d.CPF || d.idEstrangeiro,
  { message: 'dest deve ter CNPJ, CPF ou idEstrangeiro' },
);

const produtoSchema = z.object({
  cProd: z.string().min(1).max(60),
  cEAN: z.string(),
  xProd: z.string().min(1).max(120),
  NCM: z.string().regex(/^\d{8}$/, 'NCM deve ter 8 dígitos'),
  CEST: z.string().optional(),
  CFOP: z.string().regex(/^\d{4}$/, 'CFOP deve ter 4 dígitos'),
  uCom: z.string().min(1).max(6),
  qCom: z.number().min(0),
  vUnCom: z.number().min(0),
  vProd: z.number().min(0),
  cEANTrib: z.string(),
  uTrib: z.string().min(1).max(6),
  qTrib: z.number().min(0),
  vUnTrib: z.number().min(0),
  vFrete: z.number().min(0).optional(),
  vSeg: z.number().min(0).optional(),
  vDesc: z.number().min(0).optional(),
  vOutro: z.number().min(0).optional(),
  indTot: z.union([z.literal(0), z.literal(1)]),
  nItemPed: z.string().optional(),
  xPed: z.string().optional(),
  infAdProd: z.string().optional(),
});

const ideSchema = z.object({
  cUF: z.number().int().min(11).max(53),
  cNF: z.number().int().optional(),
  natOp: z.string().min(1).max(60),
  mod: z.union([z.literal(55), z.literal(65)]),
  serie: z.number().int().min(0).max(999),
  nNF: z.number().int().min(1).max(999999999),
  dhEmi: z.string().min(19),
  dhSaiEnt: z.string().optional(),
  tpNF: z.union([z.literal(0), z.literal(1)]),
  idDest: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  cMunFG: z.number().int(),
  tpImp: z.number().int().min(0).max(5),
  tpEmis: z.number().int().min(1).max(9),
  cDV: z.number().int().optional(),
  tpAmb: z.union([z.literal(1), z.literal(2)]),
  finNFe: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  indFinal: z.union([z.literal(0), z.literal(1)]),
  indPres: z.number().int().min(0).max(9),
  indIntermed: z.union([z.literal(0), z.literal(1)]).optional(),
  procEmi: z.number().int().min(0).max(3),
  verProc: z.string().min(1).max(20),
  dhCont: z.string().optional(),
  xJust: z.string().optional(),
});

// Imposto: ICMS/PIS/COFINS sao dicts indexados por CST/CSOSN/etc. O shape
// interno varia (ICMS00 vs ICMS10 vs ICMSSN101 sao diferentes). Mantemos
// record/unknown na estrutura; validacao por CST acontece via
// superRefine no nfeSchema (vide validarBlocoIcms abaixo).
const impostoSchema = z.object({
  vTotTrib: z.number().optional(),
  ICMS: z.record(z.string(), z.unknown()).optional(),
  IPI: z.object({
    cEnq: z.string(),
    IPITrib: z.unknown().optional(),
    IPINT: z.unknown().optional(),
  }).optional(),
  PIS: z.record(z.string(), z.unknown()).optional(),
  COFINS: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================
// VALIDACAO POR CST/CSOSN — campos obrigatorios por bloco.
//
// XSD da NFe v4.00 define campos obrigatorios diferentes por CST. Ex:
//   - ICMS00: vBC + pICMS + vICMS
//   - ICMS10: tudo de 00 + modBCST + vBCST + pICMSST + vICMSST
//   - ICMS20: pRedBC + vBC + pICMS + vICMS
//   - ICMS30: modBCST + vBCST + pICMSST + vICMSST (sem ICMS proprio)
//   - ICMS40/41/50: so orig + CST (isencao/nao trib/suspensao)
//   - ICMS51: vBC + pICMS + vICMSOp + vICMSDif + vICMS
//   - ICMS60: vBCSTRet + vICMSSTRet (ST ja recolhido na origem)
//   - ICMS70: redBC do 20 + ST do 10
//   - ICMS90: vBC + pICMS + vICMS (generico — outras operacoes)
//
// Esse helper recebe o objeto `ICMS` do imposto e retorna erros se faltar
// algum campo obrigatorio do CST presente. Roda no superRefine do det
// loop, pra cada item ter erro com path correto.
// ============================================================
type IssueAdder = (path: (string | number)[], message: string) => void;

function ehNumeroPreenchido(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return false;
    return !isNaN(Number(s));
  }
  return false;
}

const CAMPOS_OBRIGATORIOS_POR_CST: Record<string, readonly string[]> = {
  ICMS00: ['orig', 'CST', 'modBC', 'vBC', 'pICMS', 'vICMS'],
  ICMS10: [
    'orig', 'CST', 'modBC', 'vBC', 'pICMS', 'vICMS',
    'modBCST', 'vBCST', 'pICMSST', 'vICMSST',
  ],
  ICMS20: ['orig', 'CST', 'modBC', 'pRedBC', 'vBC', 'pICMS', 'vICMS'],
  ICMS30: ['orig', 'CST', 'modBCST', 'vBCST', 'pICMSST', 'vICMSST'],
  ICMS40: ['orig', 'CST'], // 40/41/50 idem
  ICMS51: ['orig', 'CST', 'modBC', 'vBC', 'pICMS', 'vICMSOp', 'vICMSDif', 'vICMS'],
  // ICMS60 / ICMSSN500: o grupo do ST retido (vBCSTRet, pST, vICMSSubstituto?,
  // vICMSSTRet) e uma <sequence minOccurs="0"> no XSD — ou vai inteiro, ou
  // nao vai. Ate 12/09/2026 este mapa exigia vBCSTRet+vICMSSTRet sempre, e a
  // NF-e nº 901 da Sabor saiu com os dois em "0.00" sem pST (cStat 225).
  // Tratado em GRUPOS_CONDICIONAIS abaixo.
  ICMS60: ['orig', 'CST'],
  ICMS70: [
    'orig', 'CST', 'modBC', 'pRedBC', 'vBC', 'pICMS', 'vICMS',
    'modBCST', 'vBCST', 'pICMSST', 'vICMSST',
  ],
  ICMS90: ['orig', 'CST', 'modBC', 'vBC', 'pICMS', 'vICMS'],
  // CSOSN — Simples Nacional. Validacao mais frouxa (esses campos sao
  // bastante variaveis por cenario), mas exige pelo menos orig + CSOSN.
  ICMSSN101: ['orig', 'CSOSN', 'pCredSN', 'vCredICMSSN'],
  ICMSSN102: ['orig', 'CSOSN'],
  ICMSSN103: ['orig', 'CSOSN'],
  ICMSSN201: ['orig', 'CSOSN', 'modBCST', 'vBCST', 'pICMSST', 'vICMSST'],
  ICMSSN202: ['orig', 'CSOSN', 'modBCST', 'vBCST', 'pICMSST', 'vICMSST'],
  ICMSSN203: ['orig', 'CSOSN', 'modBCST', 'vBCST', 'pICMSST', 'vICMSST'],
  ICMSSN300: ['orig', 'CSOSN'],
  ICMSSN400: ['orig', 'CSOSN'],
  ICMSSN500: ['orig', 'CSOSN'],
  ICMSSN900: ['orig', 'CSOSN'],
};

/**
 * Grupos opcionais do XSD que, quando QUALQUER campo aparece, exigem os
 * campos marcados. `gatilho` = campos que ligam o grupo; `exige` = o que o
 * XSD obriga dentro dele.
 */
const GRUPOS_CONDICIONAIS: Record<string, ReadonlyArray<{ gatilho: readonly string[]; exige: readonly string[] }>> = {
  ICMS60: [{ gatilho: ['vBCSTRet', 'pST', 'vICMSSubstituto', 'vICMSSTRet'], exige: ['vBCSTRet', 'vICMSSTRet', 'pST'] }],
  ICMSSN500: [{ gatilho: ['vBCSTRet', 'pST', 'vICMSSubstituto', 'vICMSSTRet'], exige: ['vBCSTRet', 'vICMSSTRet', 'pST'] }],
};

function validarBlocoIcms(
  icms: unknown,
  basePath: (string | number)[],
  addIssue: IssueAdder,
): void {
  if (!icms || typeof icms !== 'object') return;
  const obj = icms as Record<string, unknown>;
  // ICMS40 do builder tambem aceita CST 41 e 50 — mesma estrutura.
  const alias: Record<string, string> = { ICMS41: 'ICMS40', ICMS50: 'ICMS40' };
  for (const chave of Object.keys(obj)) {
    const tipo = alias[chave] || chave;
    const requisitos = CAMPOS_OBRIGATORIOS_POR_CST[tipo];
    if (!requisitos) continue; // CST nao reconhecido — passa
    const bloco = obj[chave];
    if (!bloco || typeof bloco !== 'object') {
      addIssue([...basePath, chave], `Bloco ${chave} deve ser objeto`);
      continue;
    }
    const blocoObj = bloco as Record<string, unknown>;
    for (const campo of requisitos) {
      const valor = blocoObj[campo];
      // orig/CST/CSOSN/modBC: aceita 0 como valido (origem 0=Nacional,
      // CST '00', modBC 0..3). Pra esses, basta nao-undefined.
      if (campo === 'orig' || campo === 'CST' || campo === 'CSOSN' || campo === 'modBC' || campo === 'modBCST') {
        if (valor === undefined || valor === null || valor === '') {
          addIssue([...basePath, chave, campo], `${chave}.${campo} obrigatorio`);
        }
        continue;
      }
      // Demais: precisa ser numero preenchido (string numerica conta).
      if (!ehNumeroPreenchido(valor)) {
        addIssue([...basePath, chave, campo], `${chave}.${campo} obrigatorio (numero)`);
      }
    }
    for (const grupo of GRUPOS_CONDICIONAIS[tipo] ?? []) {
      const ligado = grupo.gatilho.some((c) => blocoObj[c] !== undefined && blocoObj[c] !== null && blocoObj[c] !== '');
      if (!ligado) continue;
      for (const campo of grupo.exige) {
        if (!ehNumeroPreenchido(blocoObj[campo])) {
          addIssue([...basePath, chave, campo], `${chave}.${campo} obrigatorio (numero) quando o grupo do ST retido e informado`);
        }
      }
    }
  }
}

const icmsTotSchema = z.object({
  vBC: z.number().optional(),
  vICMS: z.number().optional(),
  vICMSDeson: z.number().optional(),
  vFCPUFDest: z.number().optional(),
  vICMSUFDest: z.number().optional(),
  vICMSUFRemet: z.number().optional(),
  vFCP: z.number().optional(),
  vBCST: z.number().optional(),
  vST: z.number().optional(),
  vFCPST: z.number().optional(),
  vFCPSTRet: z.number().optional(),
  vProd: z.number().min(0),
  vFrete: z.number().optional(),
  vSeg: z.number().optional(),
  vDesc: z.number().optional(),
  vII: z.number().optional(),
  vIPI: z.number().optional(),
  vIPIDevol: z.number().optional(),
  vPIS: z.number().optional(),
  vCOFINS: z.number().optional(),
  vOutro: z.number().optional(),
  vNF: z.number().min(0),
  vTotTrib: z.number().optional(),
});

const totalSchema = z.object({
  ICMSTot: icmsTotSchema,
});

const transportadorSchema = z.object({
  CNPJ: z.string().regex(/^\d{14}$/).optional(),
  CPF: z.string().regex(/^\d{11}$/).optional(),
  xNome: z.string().max(60).optional(),
  IE: z.string().max(14).optional(),
  xEnder: z.string().max(60).optional(),
  xMun: z.string().max(60).optional(),
  UF: z.string().length(2).optional(),
});

const volumeSchema = z.object({
  qVol: z.number().optional(),
  esp: z.string().max(60).optional(),
  marca: z.string().max(60).optional(),
  nVol: z.string().max(60).optional(),
  pesoL: z.number().optional(),
  pesoB: z.number().optional(),
});

const transporteSchema = z.object({
  modFrete: z.number().int().min(0).max(9),
  transporta: transportadorSchema.optional(),
  vol: z.array(volumeSchema).optional(),
});

const cobrancaSchema = z.object({
  fat: z.object({
    nFat: z.string().optional(),
    vOrig: z.number().optional(),
    vDesc: z.number().optional(),
    vLiq: z.number().optional(),
  }).optional(),
  dup: z.array(z.object({
    nDup: z.string(),
    dVenc: z.string(),
    vDup: z.number().min(0),
  })).optional(),
});

const detalhePagamentoSchema = z.object({
  indPag: z.union([z.literal(0), z.literal(1)]).optional(),
  tPag: z.string().regex(/^\d{2}$/, 'tPag deve ter 2 digitos'),
  xPag: z.string().max(60).optional(),
  vPag: z.number().min(0),
  card: z.object({
    tpIntegra: z.union([z.literal(1), z.literal(2)]),
    CNPJ: z.string().regex(/^\d{14}$/).optional(),
    tBand: z.string().optional(),
    cAut: z.string().optional(),
  }).optional(),
});

const infAdicSchema = z.object({
  infAdFisco: z.string().max(2000).optional(),
  infCpl: z.string().max(5000).optional(),
  obsCont: z.array(z.object({
    xCampo: z.string().max(20),
    xTexto: z.string().max(60),
  })).optional(),
  obsFisco: z.array(z.object({
    xCampo: z.string().max(20),
    xTexto: z.string().max(60),
  })).optional(),
});

const infRespTecSchema = z.object({
  CNPJ: z.string().regex(/^\d{14}$/),
  xContato: z.string().min(2).max(60),
  email: z.string().email().max(60),
  fone: z.string().min(6).max(20),
  idCSRT: z.number().int().optional(),
  hashCSRT: z.string().optional(),
});

// NFref — exatamente 1 de refNFe/refNFeSig/refCTe deve estar set.
// Validacao runtime no buildNFref tambem; aqui a Zod garante schema.
const nfRefSchema = z.object({
  refNFe: z.string().regex(/^\d{44}$/, 'refNFe deve ter 44 digitos').optional(),
  refNFeSig: z.string().regex(/^\d{44}$/, 'refNFeSig deve ter 44 digitos').optional(),
  refCTe: z.string().regex(/^\d{44}$/, 'refCTe deve ter 44 digitos').optional(),
}).refine(
  (v) => (v.refNFe ? 1 : 0) + (v.refNFeSig ? 1 : 0) + (v.refCTe ? 1 : 0) === 1,
  { message: 'NFref deve ter EXATAMENTE 1 referencia (refNFe, refNFeSig ou refCTe).' },
);

const nfeSchema = z.object({
  ide: ideSchema,
  emit: emitenteSchema,
  dest: destinatarioSchema.optional(),
  det: z.array(z.object({
    nItem: z.number().int().min(1),
    prod: produtoSchema,
    imposto: impostoSchema,
    infAdProd: z.string().optional(),
  })).min(1, 'NFe deve ter pelo menos 1 item').max(990, 'NFe pode ter no máximo 990 itens'),
  total: totalSchema,
  transp: transporteSchema,
  cobr: cobrancaSchema.optional(),
  pag: z.object({
    detPag: z.array(detalhePagamentoSchema).min(1, 'Deve ter pelo menos 1 forma de pagamento'),
    vTroco: z.number().optional(),
  }),
  infAdic: infAdicSchema.optional(),
  infRespTec: infRespTecSchema.optional(),
  nfRef: z.array(nfRefSchema).max(999, 'NFref aceita ate 999 entradas').optional(),
}).superRefine((nfe, ctx) => {
  // Regra de negocio: finNFe=4 (DEVOLUCAO) EXIGE pelo menos 1 NFref.
  // Backend SEFAZ rejeita NFe de devolucao sem refNFe.
  if (nfe.ide?.finNFe === 4 && (!nfe.nfRef || nfe.nfRef.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'finNFe=4 (DEVOLUCAO) exige pelo menos 1 nfRef apontando pra NF original.',
      path: ['nfRef'],
    });
  }

  // Validacao por CST/CSOSN — campos obrigatorios em cada bloco ICMS.
  // Detecta cedo erros que ate hoje passavam o Zod e so quebravam na
  // SEFAZ (ex: ICMS10 sem vBCST, ICMS20 sem pRedBC). Vide a tabela
  // CAMPOS_OBRIGATORIOS_POR_CST acima.
  if (Array.isArray(nfe.det)) {
    nfe.det.forEach((item, idx) => {
      const icms = item?.imposto?.ICMS;
      if (icms) {
        validarBlocoIcms(icms, ['det', idx, 'imposto', 'ICMS'], (path, message) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message,
            path,
          });
        });
      }
    });
  }
});

/**
 * Valida dados da NFe usando schemas Zod
 * @throws ValidationError com detalhes dos campos inválidos
 */
export function validarNFe(nfe: unknown): void {
  const result = nfeSchema.safeParse(nfe);

  if (!result.success) {
    const issues = result.error.issues;
    const details = issues.map(i =>
      `${i.path.join('.')}: ${i.message}`
    );
    const firstField = issues[0]?.path.join('.') || 'unknown';

    throw new ValidationError(
      `Validação NFe falhou: ${details[0]}`,
      firstField,
      details
    );
  }
}

/**
 * Validações de regras de negócio (não cobertas pelo schema)
 */
export function validarRegrasNegocio(nfe: NFe): void {
  const errors: string[] = [];

  if (nfe.det && nfe.total?.ICMSTot) {
    const somaItens = nfe.det.reduce(
      (sum, d) => sum + (d.prod?.vProd ?? 0),
      0,
    );
    const vProd = nfe.total.ICMSTot.vProd;
    if (Math.abs(somaItens - vProd) > 0.01) {
      errors.push(`total.ICMSTot.vProd (${vProd}) difere da soma dos itens (${somaItens.toFixed(2)})`);
    }
  }

  if (nfe.ide?.tpEmis > 1 && !nfe.ide?.xJust) {
    errors.push('ide.xJust é obrigatório para emissão em contingência');
  }

  if (nfe.ide?.xJust && nfe.ide.xJust.length < 15) {
    errors.push('ide.xJust deve ter no mínimo 15 caracteres');
  }

  // -- Regras especificas de NFCe (modelo 65) --
  // Conforme leiaute SEFAZ NFCe v4.00, certas restricoes que nao se aplicam a NFe.
  if (nfe.ide?.mod === 65) {
    if (nfe.ide.idDest !== 1) {
      errors.push('NFCe (mod=65) so permite operacao interna (ide.idDest=1)');
    }
    if (nfe.ide.indFinal !== 1) {
      errors.push('NFCe (mod=65) exige consumidor final (ide.indFinal=1)');
    }
    if (nfe.ide.indPres === 0) {
      errors.push('NFCe (mod=65) nao permite operacao nao-presencial (ide.indPres=0)');
    }
    if (nfe.transp?.modFrete !== undefined && nfe.transp.modFrete !== 9) {
      errors.push('NFCe (mod=65) nao suporta frete — use transp.modFrete=9');
    }
    if (nfe.cobr?.dup && nfe.cobr.dup.length > 0) {
      errors.push('NFCe (mod=65) nao suporta cobranca/duplicatas (venda a vista)');
    }
  }

  if (nfe.ide?.tpAmb === 2 && nfe.dest?.xNome) {
    const expected = 'NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL';
    if (nfe.dest.xNome !== expected) {
      errors.push(`Em homologação, dest.xNome deve ser "${expected}"`);
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(
      `Regras de negócio: ${errors[0]}`,
      'businessRules',
      errors
    );
  }
}
