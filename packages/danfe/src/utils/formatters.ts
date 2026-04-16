/**
 * Formata CNPJ: 12345678000199 → 12.345.678/0001-99
 */
export function fmtCNPJ(v: string): string {
  const c = v.replace(/\D/g, '');
  if (c.length !== 14) return v;
  return c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Formata CPF: 12345678901 → 123.456.789-01
 */
export function fmtCPF(v: string): string {
  const c = v.replace(/\D/g, '');
  if (c.length !== 11) return v;
  return c.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

/**
 * Formata CEP: 01001000 → 01001-000
 */
export function fmtCEP(v: string): string {
  const c = v.replace(/\D/g, '');
  if (c.length !== 8) return v;
  return c.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

/**
 * Formata telefone
 */
export function fmtFone(v: string): string {
  const c = v.replace(/\D/g, '');
  if (c.length === 11) return c.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  if (c.length === 10) return c.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  return v;
}

/**
 * Formata valor monetário: 1234.56 → 1.234,56
 */
export function fmtMoney(v: number | string, decimals: number = 2): string {
  const num = typeof v === 'string' ? parseFloat(v) : v;
  if (isNaN(num)) return '0,00';
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formata quantidade: 1.0000 → 1,0000
 */
export function fmtQtd(v: number | string, decimals: number = 4): string {
  return fmtMoney(v, decimals);
}

/**
 * Formata chave de acesso com espaços: 3523 0308 0432 ...
 */
export function fmtChaveAcesso(chave: string): string {
  return chave.replace(/(\d{4})/g, '$1 ').trim();
}

/**
 * Formata data ISO para dd/mm/yyyy
 */
export function fmtData(iso: string): string {
  if (!iso) return '';
  const d = iso.slice(0, 10);
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

/**
 * Formata data/hora ISO para dd/mm/yyyy HH:mm:ss
 */
export function fmtDataHora(iso: string): string {
  if (!iso) return '';
  const data = fmtData(iso);
  const hora = iso.slice(11, 19);
  return `${data} ${hora}`;
}

/**
 * Formata IE
 */
export function fmtIE(v: string): string {
  if (!v || v === 'ISENTO') return v || '';
  return v;
}
