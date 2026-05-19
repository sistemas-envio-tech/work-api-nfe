import { XMLParser, type X2jOptions } from 'fast-xml-parser';

/**
 * Tipos para navegacao em arvore XML parseada por fast-xml-parser.
 * Substitui `any` em codigo que percorre o resultado do parse.
 */
export type XmlScalar = string | number | boolean;
export interface XmlNode {
  [key: string]: XmlValue;
}
export type XmlValue = XmlScalar | XmlNode | XmlNode[] | XmlScalar[] | undefined;

/** Narrowing seguro: retorna o XmlNode se for objeto, senao um objeto vazio. */
export function comoNoXml(v: XmlValue): XmlNode {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}

/** Narrowing seguro: retorna sempre um array (envolve escalar/objeto em [v], ou [] se undefined). */
export function comoArrayXml<T extends XmlNode = XmlNode>(v: XmlValue): T[] {
  if (v === undefined || v === null) return [];
  return (Array.isArray(v) ? v : [v]) as T[];
}

const DEFAULT_OPTIONS: Partial<X2jOptions> = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: false,
  numberParseOptions: { hex: false, leadingZeros: false, skipLike: /.*/ },
  trimValues: true,
  isArray: (name: string, _jpath: string, _isLeaf: boolean, _isAttr: boolean) => {
    // Elementos que sempre devem ser arrays
    const arrayElements = [
      'det', 'NFe', 'protNFe', 'retEvento', 'procEvento',
      'evento', 'vol', 'dup', 'detPag', 'lacres',
      'infNFeSupl', 'obsCont', 'obsFisco', 'procRef',
    ];
    return arrayElements.includes(name);
  },
};

export class XmlParser {
  private parser: XMLParser;

  constructor(options?: Partial<X2jOptions>) {
    this.parser = new XMLParser({ ...DEFAULT_OPTIONS, ...options });
  }

  /**
   * Parse XML string para objeto JavaScript
   */
  parse<T = Record<string, unknown>>(xml: string): T {
    return this.parser.parse(xml) as T;
  }

  /**
   * Extrai o conteÃºdo do body de um envelope SOAP
   */
  parseSoapResponse(soapXml: string): Record<string, unknown> {
    const parsed = this.parse<Record<string, unknown>>(soapXml);

    // Navegar na estrutura SOAP: Envelope > Body > ...
    const envelope = this.findKey(parsed, 'Envelope') || this.findKey(parsed, 'soap:Envelope') || this.findKey(parsed, 'soap12:Envelope');
    if (!envelope || typeof envelope !== 'object') {
      return parsed;
    }

    const body = this.findKey(envelope as Record<string, unknown>, 'Body') || this.findKey(envelope as Record<string, unknown>, 'soap:Body') || this.findKey(envelope as Record<string, unknown>, 'soap12:Body');
    if (!body || typeof body !== 'object') {
      return envelope as Record<string, unknown>;
    }

    return body as Record<string, unknown>;
  }

  /**
   * Extrai valor de um campo em qualquer nÃ­vel do objeto
   */
  extractValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part] ?? this.findKey(current as Record<string, unknown>, part);
    }

    return current;
  }

  /**
   * Busca uma chave em um objeto, ignorando prefixos de namespace
   */
  private findKey(obj: Record<string, unknown>, key: string): unknown {
    if (key in obj) return obj[key];

    // Buscar ignorando namespace prefix
    for (const k of Object.keys(obj)) {
      const localName = k.includes(':') ? k.split(':').pop()! : k;
      if (localName === key) return obj[k];
    }

    return undefined;
  }
}
