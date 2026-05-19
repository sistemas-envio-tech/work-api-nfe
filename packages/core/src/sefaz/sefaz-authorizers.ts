/**
 * Mapeamento UF -> Autorizador NFe / NFCe
 *
 * Baseado no ACBrNFeServicos.ini e documentacao oficial SEFAZ.
 *
 * NFe (modelo 55): 11 autorizadores diretos + SVAN + SVRS, + contingencias
 *   SVC-AN / SVC-RS.
 * NFCe (modelo 65): 12 autorizadores diretos + SVRS-NFCe. NFCe nao possui
 *   modo de contingencia SVC (em caso de indisponibilidade SEFAZ a NFCe
 *   pode ser emitida offline com tpEmis=9 e transmitida ate 24h depois).
 */

export type Autorizador =
  | 'AM' | 'BA' | 'CE' | 'GO' | 'MG' | 'MS' | 'MT'
  | 'PE' | 'PR' | 'RS' | 'SP'
  | 'SVAN' | 'SVRS'
  | 'SVC-AN' | 'SVC-RS'
  | 'AN'
  // ── Autorizadores NFCe ──
  | 'AM-NFCe' | 'BA-NFCe' | 'CE-NFCe' | 'GO-NFCe' | 'MG-NFCe'
  | 'MS-NFCe' | 'MT-NFCe' | 'PE-NFCe' | 'PR-NFCe' | 'RS-NFCe'
  | 'SP-NFCe' | 'SVRS-NFCe';

/** Mapeamento UF -> Autorizador NFe em modo normal */
const UF_AUTORIZADOR: Record<string, Autorizador> = {
  AC: 'SVRS', AL: 'SVRS', AM: 'AM',  AP: 'SVRS',
  BA: 'BA',   CE: 'CE',   DF: 'SVRS', ES: 'SVRS',
  GO: 'GO',   MA: 'SVAN', MG: 'MG',   MS: 'MS',
  MT: 'MT',   PA: 'SVAN', PB: 'SVRS', PE: 'PE',
  PI: 'SVRS', PR: 'PR',   RJ: 'SVRS', RN: 'SVRS',
  RO: 'SVRS', RR: 'SVRS', RS: 'RS',   SC: 'SVRS',
  SE: 'SVRS', SP: 'SP',   TO: 'SVRS',
};

/** Mapeamento UF -> Autorizador em modo contingencia SVC (NFe) */
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
 * Mapeamento UF -> Autorizador NFCe.
 *
 * UFs com NFCe propria: AM, BA, CE, GO, MG, MS, MT, PE, PR, RS, SP.
 * UFs que usam SVRS-NFCe: resto (cobre 16 estados, incluindo AC, AL, AP, DF,
 * ES, MA, PA, PB, PI, RJ, RN, RO, RR, SC, SE, TO).
 *
 * IMPORTANTE: este mapeamento eh baseado em documentacao publica SEFAZ.
 * Caso uma UF migre o servico NFCe, use definirOverrideUrlSefaz() pra
 * apontar a URL correta em runtime, sem esperar release.
 */
const UF_AUTORIZADOR_NFCE: Record<string, Autorizador> = {
  AC: 'SVRS-NFCe', AL: 'SVRS-NFCe', AM: 'AM-NFCe',   AP: 'SVRS-NFCe',
  BA: 'BA-NFCe',   CE: 'CE-NFCe',   DF: 'SVRS-NFCe', ES: 'SVRS-NFCe',
  GO: 'GO-NFCe',   MA: 'SVRS-NFCe', MG: 'MG-NFCe',   MS: 'MS-NFCe',
  MT: 'MT-NFCe',   PA: 'SVRS-NFCe', PB: 'SVRS-NFCe', PE: 'PE-NFCe',
  PI: 'SVRS-NFCe', PR: 'PR-NFCe',   RJ: 'SVRS-NFCe', RN: 'SVRS-NFCe',
  RO: 'SVRS-NFCe', RR: 'SVRS-NFCe', RS: 'RS-NFCe',   SC: 'SVRS-NFCe',
  SE: 'SVRS-NFCe', SP: 'SP-NFCe',   TO: 'SVRS-NFCe',
};

/**
 * Retorna o autorizador para a UF.
 *
 * @param uf - Sigla da UF (2 letras)
 * @param contingencia - Se true, retorna o autorizador SVC de contingencia
 *   (apenas NFe; NFCe nao tem SVC)
 * @param modelo - 55 (NFe, default) ou 65 (NFCe)
 */
export function obterAutorizador(
  uf: string,
  contingencia: boolean = false,
  modelo: 55 | 65 = 55,
): Autorizador {
  const ufUpper = uf.toUpperCase();

  if (modelo === 65) {
    if (contingencia) {
      throw new Error('NFCe nao possui modo de contingencia SVC. Use tpEmis=9 (offline).');
    }
    const auth = UF_AUTORIZADOR_NFCE[ufUpper];
    if (!auth) throw new Error(`UF invalida para NFCe: ${uf}`);
    return auth;
  }

  if (contingencia) {
    const cont = UF_CONTINGENCIA[ufUpper];
    if (!cont) throw new Error(`UF sem mapeamento de contingencia: ${uf}`);
    return cont;
  }

  const auth = UF_AUTORIZADOR[ufUpper];
  if (!auth) throw new Error(`UF invalida: ${uf}`);
  return auth;
}

/**
 * Retorna todas as UFs de um autorizador (NFe, mode normal).
 */
export function obterUFsPorAutorizador(autorizador: Autorizador): string[] {
  return Object.entries(UF_AUTORIZADOR)
    .filter(([, auth]) => auth === autorizador)
    .map(([uf]) => uf);
}
