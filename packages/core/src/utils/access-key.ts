/**
 * Gera a chave de acesso de 44 dígitos da NFe
 *
 * Composição: cUF(2) + AAMM(4) + CNPJ(14) + mod(2) + serie(3) + nNF(9) + tpEmis(1) + cNF(8) + cDV(1)
 */
export function generateAccessKey(params: {
  cUF: number;
  dataEmissao: Date;
  cnpj: string;
  mod: number;
  serie: number;
  nNF: number;
  tpEmis: number;
  cNF: number;
}): string {
  const { cUF, dataEmissao, cnpj, mod, serie, nNF, tpEmis, cNF } = params;

  const aamm = `${String(dataEmissao.getFullYear()).slice(2)}${String(dataEmissao.getMonth() + 1).padStart(2, '0')}`;
  const cnpjClean = cnpj.replace(/\D/g, '');

  const keyWithoutDV = [
    String(cUF).padStart(2, '0'),
    aamm,
    cnpjClean.padStart(14, '0'),
    String(mod).padStart(2, '0'),
    String(serie).padStart(3, '0'),
    String(nNF).padStart(9, '0'),
    String(tpEmis),
    String(cNF).padStart(8, '0'),
  ].join('');

  const cDV = calculateMod11(keyWithoutDV);
  return keyWithoutDV + cDV;
}

/**
 * Calcula dígito verificador módulo 11
 * Pesos de 2 a 9 da direita para esquerda, cíclico
 */
export function calculateMod11(value: string): number {
  const digits = value.split('').map(Number).reverse();
  let sum = 0;
  let weight = 2;

  for (const digit of digits) {
    sum += digit * weight;
    weight = weight >= 9 ? 2 : weight + 1;
  }

  const remainder = sum % 11;
  if (remainder === 0 || remainder === 1) return 0;
  return 11 - remainder;
}

/**
 * Valida chave de acesso NFe (44 dígitos + dígito verificador)
 */
export function validateAccessKey(key: string): boolean {
  if (!/^\d{44}$/.test(key)) return false;

  const keyWithoutDV = key.slice(0, 43);
  const expectedDV = calculateMod11(keyWithoutDV);
  return Number(key[43]) === expectedDV;
}

/**
 * Gera código numérico aleatório de 8 dígitos para compor a chave de acesso
 */
export function generateRandomCode(): number {
  return Math.floor(10000000 + Math.random() * 89999999);
}
