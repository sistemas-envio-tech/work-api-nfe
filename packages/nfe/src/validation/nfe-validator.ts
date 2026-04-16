import { z } from 'zod';
import { ValidationError } from '@acbr-node/core';

// ─── Schemas Zod ───

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

const nfeSchema = z.object({
  ide: ideSchema,
  emit: emitenteSchema,
  dest: z.any().optional(),
  det: z.array(z.object({
    nItem: z.number().int().min(1),
    prod: produtoSchema,
    imposto: z.any(),
    infAdProd: z.string().optional(),
  })).min(1, 'NFe deve ter pelo menos 1 item').max(990, 'NFe pode ter no máximo 990 itens'),
  total: z.any(),
  transp: z.any(),
  cobr: z.any().optional(),
  pag: z.object({
    detPag: z.array(z.any()).min(1, 'Deve ter pelo menos 1 forma de pagamento'),
    vTroco: z.number().optional(),
  }),
  infAdic: z.any().optional(),
  infRespTec: z.any().optional(),
});

/**
 * Valida dados da NFe usando schemas Zod
 * @throws ValidationError com detalhes dos campos inválidos
 */
export function validateNFe(nfe: unknown): void {
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
export function validateBusinessRules(nfe: any): void {
  const errors: string[] = [];

  // Validar que vProd bate com soma dos itens
  if (nfe.det && nfe.total?.ICMSTot) {
    const somaItens = nfe.det.reduce(
      (sum: number, d: any) => sum + (d.prod?.vProd || 0), 0
    );
    const vProd = nfe.total.ICMSTot.vProd;
    if (Math.abs(somaItens - vProd) > 0.01) {
      errors.push(`total.ICMSTot.vProd (${vProd}) difere da soma dos itens (${somaItens.toFixed(2)})`);
    }
  }

  // Validar justificativa para contingência
  if (nfe.ide?.tpEmis > 1 && !nfe.ide?.xJust) {
    errors.push('ide.xJust é obrigatório para emissão em contingência');
  }

  // Validar xJust mínimo 15 chars (para cancelamento/inutilização)
  if (nfe.ide?.xJust && nfe.ide.xJust.length < 15) {
    errors.push('ide.xJust deve ter no mínimo 15 caracteres');
  }

  // Homologação: destinatário deve ser CNPJ 99999999000191 ou xNome fixo
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
