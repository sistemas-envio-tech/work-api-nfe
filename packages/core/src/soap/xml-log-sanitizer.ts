/**
 * Sanitiza XML para log — mascara dados sensíveis
 */
export function sanitizeXmlForLog(xml: string): string {
  let sanitized = xml;

  // Mascarar conteúdo de tags sensíveis
  const sensitiveTags = [
    'CNPJ', 'CPF', 'IE', 'email', 'fone', 'xNome',
    'xLgr', 'nro', 'CEP',
  ];

  for (const tag of sensitiveTags) {
    const regex = new RegExp(`(<${tag}>)([^<]+)(</${tag}>)`, 'g');
    sanitized = sanitized.replace(regex, (_, open, content, close) => {
      if (content.length <= 4) return `${open}${content}${close}`;
      const visible = content.slice(0, 3);
      const masked = '*'.repeat(Math.min(content.length - 3, 10));
      return `${open}${visible}${masked}${close}`;
    });
  }

  return sanitized;
}

/**
 * Trunca XML longo para log (max chars)
 */
export function truncateXml(xml: string, maxLength: number = 2000): string {
  if (xml.length <= maxLength) return xml;
  return xml.slice(0, maxLength) + `... [truncado, ${xml.length} chars total]`;
}
