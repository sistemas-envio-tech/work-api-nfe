import { create, fragment } from 'xmlbuilder2';
import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces.js';

export type XmlObject = Record<string, unknown>;

/**
 * Builder XML type-safe usando xmlbuilder2
 * Garante ordenação de elementos conforme XSD
 */
export class XmlBuilder {
  /**
   * Cria um documento XML a partir de um objeto estruturado
   * A ordem das chaves do objeto define a ordem dos elementos no XML
   */
  static build(rootName: string, data: XmlObject, namespace?: string): string {
    const doc = create({ version: '1.0', encoding: 'UTF-8' });
    const root = doc.ele(namespace || '', rootName);

    if (namespace) {
      root.att('xmlns', namespace);
    }

    XmlBuilder.addElements(root, data);

    return doc.end({ prettyPrint: false });
  }

  /**
   * Cria um fragmento XML (sem declaração XML)
   */
  static buildFragment(rootName: string, data: XmlObject, namespace?: string): string {
    const frag = fragment();
    const root = frag.ele(namespace || '', rootName);

    if (namespace) {
      root.att('xmlns', namespace);
    }

    XmlBuilder.addElements(root, data);

    return frag.end({ prettyPrint: false });
  }

  /**
   * Adiciona elementos recursivamente mantendo a ordem
   */
  private static addElements(parent: XMLBuilder, data: XmlObject): void {
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || value === null) continue;

      // Atributos começam com '@'
      if (key.startsWith('@')) {
        parent.att(key.slice(1), String(value));
        continue;
      }

      if (Array.isArray(value)) {
        // Array: repete o elemento para cada item
        for (const item of value) {
          if (typeof item === 'object' && item !== null) {
            const child = parent.ele(key);
            XmlBuilder.addElements(child, item as XmlObject);
          } else {
            parent.ele(key).txt(String(item));
          }
        }
      } else if (typeof value === 'object') {
        const child = parent.ele(key);
        XmlBuilder.addElements(child, value as XmlObject);
      } else {
        parent.ele(key).txt(String(value));
      }
    }
  }

  /**
   * Cria envelope enviNFe para lote de autorização
   */
  static buildEnviNFe(signedNFeXmls: string[], idLote: string, indSinc: 0 | 1 = 1): string {
    const NFE_NS = 'http://www.portalfiscal.inf.br/nfe';

    // Construir via string concatenation para preservar assinatura digital intacta
    // (DOM manipulation pode alterar canonicalização e invalidar a assinatura)
    const nfeXmlsConcat = signedNFeXmls
      .map(xml => xml.replace(/<\?xml[^?]*\?>\s*/g, '')) // remover declaração XML
      .join('');

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<enviNFe xmlns="${NFE_NS}" versao="4.00">`,
      `<idLote>${idLote}</idLote>`,
      `<indSinc>${indSinc}</indSinc>`,
      nfeXmlsConcat,
      '</enviNFe>',
    ].join('');
  }
}
