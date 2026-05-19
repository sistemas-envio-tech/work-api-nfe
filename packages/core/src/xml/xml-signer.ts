import { SignedXml } from 'xml-crypto';

export interface XmlSignOptions {
  privateKeyPem: string;
  certificatePem: string;
  /** ID do elemento a assinar (ex: 'infNFe', 'infEvento', 'infInut') */
  referenceUri: string;
}

/**
 * Assina XML usando XML Digital Signature (XML-DSig)
 *
 * Padrão NFe:
 * - Canonicalization: C14N (http://www.w3.org/TR/2001/REC-xml-c14n-20010315)
 * - Signature: RSA-SHA1 (NFe 3.10) ou RSA-SHA256 (NFe 4.00, usado aqui)
 * - Digest: SHA-256
 * - Transform: enveloped-signature + C14N
 */
export class XmlSigner {
  /**
   * Assina um XML NFe
   *
   * @param xml - XML a ser assinado
   * @param options - Opções de assinatura (chave privada, certificado, URI de referência)
   * @returns XML assinado
   */
  static sign(xml: string, options: XmlSignOptions): string {
    const { privateKeyPem, certificatePem, referenceUri } = options;

    const sig = new SignedXml({
      privateKey: privateKeyPem,
      canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
      signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
    });

    // Referência ao elemento a ser assinado
    sig.addReference({
      xpath: `//*[local-name(.)='${referenceUri}']`,
      transforms: [
        'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
        'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
      ],
      digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
    });

    // Incluir certificado X509 na assinatura
    const certBase64 = certificatePem
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\s/g, '');

    sig.getKeyInfoContent = () =>
      `<X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data>`;

    // **Importante**: action='after' coloca a <Signature> como IRMA do
    // elemento referenciado (depois dele). Antes estava 'append', que fazia
    // a Signature ser FILHA de infNFe — viola o schema NFe 4.00, que exige:
    //   <NFe>
    //     <infNFe>...</infNFe>            ← fecha aqui
    //     <Signature>...</Signature>      ← irma de infNFe
    //   </NFe>
    // Com 'append' o XML virava:
    //   <NFe>
    //     <infNFe>
    //       ... campos ...
    //       <Signature>...</Signature>    ← ERRADO: dentro de infNFe
    //     </infNFe>
    //   </NFe>
    // SEFAZ rejeitava com cStat=225 "Falha no Schema XML do lote de NFe".
    sig.computeSignature(xml, {
      location: {
        reference: `//*[local-name(.)='${referenceUri}']`,
        action: 'after',
      },
    });

    return sig.getSignedXml();
  }

  /**
   * Verifica a assinatura de um XML
   */
  static verify(signedXml: string): boolean {
    const sig = new SignedXml();

    // Extrair certificado do XML para verificação
    const certMatch = signedXml.match(
      /<X509Certificate>([\s\S]*?)<\/X509Certificate>/
    );

    if (!certMatch) return false;

    const certBase64 = certMatch[1].replace(/\s/g, '');
    const certPem = `-----BEGIN CERTIFICATE-----\n${certBase64}\n-----END CERTIFICATE-----`;

    sig.publicCert = certPem;

    // Encontrar a assinatura
    const signatureMatch = signedXml.match(/<Signature[\s>][\s\S]*?<\/Signature>/);
    if (!signatureMatch) return false;

    sig.loadSignature(signatureMatch[0]);

    return sig.checkSignature(signedXml);
  }

  /**
   * Extrai o DigestValue de um XML assinado
   */
  static extractDigestValue(signedXml: string): string | null {
    const match = signedXml.match(/<DigestValue>([\s\S]*?)<\/DigestValue>/);
    return match ? match[1].trim() : null;
  }

  /**
   * Extrai o SignatureValue de um XML assinado
   */
  static extractSignatureValue(signedXml: string): string | null {
    const match = signedXml.match(/<SignatureValue>([\s\S]*?)<\/SignatureValue>/);
    return match ? match[1].trim() : null;
  }
}
