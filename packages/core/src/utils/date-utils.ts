/**
 * UtilitÃ¡rios de data para NFe
 * Todas as datas da NFe devem usar o formato ISO 8601 com offset de fuso horÃ¡rio brasileiro
 */

/** Offsets por UF (Brasil aboliu horÃ¡rio de verÃ£o em 2019) */
const UF_OFFSETS: Record<string, string> = {
  // UTC-5 (Acre)
  AC: '-05:00',
  // UTC-4 (Amazonas, Roraima, RondÃ´nia, Mato Grosso, Mato Grosso do Sul)
  AM: '-04:00', RR: '-04:00', RO: '-04:00', MT: '-04:00', MS: '-04:00',
  // UTC-3 (Maioria dos estados)
  AL: '-03:00', AP: '-03:00', BA: '-03:00', CE: '-03:00',
  DF: '-03:00', ES: '-03:00', GO: '-03:00', MA: '-03:00',
  MG: '-03:00', PA: '-03:00', PB: '-03:00',
  PE: '-03:00', PI: '-03:00', PR: '-03:00', RJ: '-03:00',
  RN: '-03:00', RS: '-03:00', SC: '-03:00', SE: '-03:00',
  SP: '-03:00', TO: '-03:00',
  // UTC-2 (Fernando de Noronha)
  FN: '-02:00',
};

/**
 * Retorna o offset de fuso horÃ¡rio para a UF
 */
export function obterOffsetTimezone(uf: string): string {
  return UF_OFFSETS[uf.toUpperCase()] || '-03:00';
}

/**
 * Formata data no padrÃ£o NFe: yyyy-MM-ddTHH:mm:ssXXX
 */
export function formatarDataNFe(date: Date, uf: string = 'SP'): string {
  const offset = obterOffsetTimezone(uf);
  const offsetHours = parseInt(offset.slice(0, 3), 10);
  const offsetMinutes = parseInt(offset.slice(4, 6), 10) * (offsetHours < 0 ? -1 : 1);

  const localDate = new Date(date.getTime() + (offsetHours * 60 + offsetMinutes) * 60 * 1000);

  const year = localDate.getUTCFullYear();
  const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localDate.getUTCDate()).padStart(2, '0');
  const hours = String(localDate.getUTCHours()).padStart(2, '0');
  const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(localDate.getUTCSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`;
}

/**
 * Retorna data/hora atual formatada para NFe
 */
export function agoraNFe(uf: string = 'SP'): string {
  return formatarDataNFe(new Date(), uf);
}
