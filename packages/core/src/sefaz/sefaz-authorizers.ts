/**
 * Mapeamento UF â†’ Autorizador NFe
 *
 * Baseado no ACBrNFeServicos.ini e documentaÃ§Ã£o oficial SEFAZ
 * 11 autorizadores diretos + SVAN + SVRS
 */

export type Autorizador =
  | 'AM' | 'BA' | 'CE' | 'GO' | 'MG' | 'MS' | 'MT'
  | 'PE' | 'PR' | 'RS' | 'SP'
  | 'SVAN' | 'SVRS'
  | 'SVC-AN' | 'SVC-RS'
  | 'AN';

/** Mapeamento UF â†’ Autorizador em modo normal */
const UF_AUTORIZADOR: Record<string, Autorizador> = {
  AC: 'SVRS', AL: 'SVRS', AM: 'AM',  AP: 'SVRS',
  BA: 'BA',   CE: 'CE',   DF: 'SVRS', ES: 'SVRS',
  GO: 'GO',   MA: 'SVAN', MG: 'MG',   MS: 'MS',
  MT: 'MT',   PA: 'SVAN', PB: 'SVRS', PE: 'PE',
  PI: 'SVRS', PR: 'PR',   RJ: 'SVRS', RN: 'SVRS',
  RO: 'SVRS', RR: 'SVRS', RS: 'RS',   SC: 'SVRS',
  SE: 'SVRS', SP: 'SP',   TO: 'SVRS',
};

/** Mapeamento UF â†’ Autorizador em modo contingÃªncia SVC */
const UF_CONTINGENCIA: Record<string, Autorizador> = {
  // SVC-AN: estados autorizados por SP, MG, RS, SVRS
  AC: 'SVC-AN', AL: 'SVC-AN', AP: 'SVC-AN', DF: 'SVC-AN',
  ES: 'SVC-AN', MG: 'SVC-AN', PB: 'SVC-AN', RJ: 'SVC-AN',
  RN: 'SVC-AN', RO: 'SVC-AN', RR: 'SVC-AN', RS: 'SVC-AN',
  SC: 'SVC-AN', SE: 'SVC-AN', SP: 'SVC-AN', TO: 'SVC-AN',

  // SVC-RS: estados autorizados por AM, BA, CE, GO, MA, MS, MT, PA, PE, PI, PR
  AM: 'SVC-RS', BA: 'SVC-RS', CE: 'SVC-RS', GO: 'SVC-RS',
  MA: 'SVC-RS', MS: 'SVC-RS', MT: 'SVC-RS', PA: 'SVC-RS',
  PE: 'SVC-RS', PI: 'SVC-RS', PR: 'SVC-RS',
};

/**
 * Retorna o autorizador para a UF
 */
export function obterAutorizador(uf: string, contingencia: boolean = false): Autorizador {
  const ufUpper = uf.toUpperCase();

  if (contingencia) {
    const cont = UF_CONTINGENCIA[ufUpper];
    if (!cont) throw new Error(`UF sem mapeamento de contingÃªncia: ${uf}`);
    return cont;
  }

  const auth = UF_AUTORIZADOR[ufUpper];
  if (!auth) throw new Error(`UF invÃ¡lida: ${uf}`);
  return auth;
}

/**
 * Retorna todas as UFs de um autorizador
 */
export function obterUFsPorAutorizador(autorizador: Autorizador): string[] {
  return Object.entries(UF_AUTORIZADOR)
    .filter(([, auth]) => auth === autorizador)
    .map(([uf]) => uf);
}
