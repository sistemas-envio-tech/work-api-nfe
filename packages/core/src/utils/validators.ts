/**
 * Valida CNPJ (14 dígitos)
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const digits = cleaned.split('').map(Number);

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += digits[i] * weights1[i];
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digits[12] !== digit1) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) sum += digits[i] * weights2[i];
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  return digits[13] === digit2;
}

/**
 * Valida CPF (11 dígitos)
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  const digits = cleaned.split('').map(Number);

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (digits[9] !== remainder) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return digits[10] === remainder;
}

/**
 * Valida Inscrição Estadual genérica (verifica se contém apenas dígitos e tem tamanho razoável)
 * Validação completa depende do estado - implementar por UF se necessário
 */
export function isValidIE(ie: string, _uf?: string): boolean {
  const cleaned = ie.replace(/\D/g, '');
  if (cleaned === 'ISENTO') return true;
  if (cleaned.length < 2 || cleaned.length > 14) return false;
  return /^\d+$/.test(cleaned);
}

/**
 * Formata CNPJ: 12345678000199 → 12.345.678/0001-99
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Formata CPF: 12345678901 → 123.456.789-01
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    '$1.$2.$3-$4'
  );
}
