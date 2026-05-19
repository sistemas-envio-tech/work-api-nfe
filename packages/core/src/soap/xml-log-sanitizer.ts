/**
 * Sanitiza XML para log â€” mascara dados sensÃ­veis
 */
export function sanearXmlParaLog(xml: string): string {
  let sanitized = xml;

  // Mascarar conteÃºdo de tags sensÃ­veis
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
export function truncarXml(xml: string, maxLength: number = 2000): string {
  if (xml.length <= maxLength) return xml;
  return xml.slice(0, maxLength) + `... [truncado, ${xml.length} chars total]`;
}
