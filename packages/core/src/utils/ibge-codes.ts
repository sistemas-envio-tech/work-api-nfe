/**
 * CÃ³digos IBGE das UFs brasileiras
 */
export const IBGE_UF: Record<string, number> = {
  RO: 11, AC: 12, AM: 13, RR: 14, PA: 15, AP: 16, TO: 17,
  MA: 21, PI: 22, CE: 23, RN: 24, PB: 25, PE: 26, AL: 27,
  SE: 28, BA: 29, MG: 31, ES: 32, RJ: 33, SP: 35,
  PR: 41, SC: 42, RS: 43, MS: 50, MT: 51, GO: 52, DF: 53,
};

const CODE_TO_UF = Object.fromEntries(
  Object.entries(IBGE_UF).map(([uf, code]) => [code, uf])
);

/**
 * Retorna o cÃ³digo IBGE da UF
 */
export function obterCodigoUF(uf: string): number {
  const code = IBGE_UF[uf.toUpperCase()];
  if (!code) throw new Error(`UF invÃ¡lida: ${uf}`);
  return code;
}

/**
 * Retorna a sigla da UF pelo cÃ³digo IBGE
 */
export function obterUFPorCodigo(code: number): string {
  const uf = CODE_TO_UF[code];
  if (!uf) throw new Error(`CÃ³digo IBGE invÃ¡lido: ${code}`);
  return uf;
}
