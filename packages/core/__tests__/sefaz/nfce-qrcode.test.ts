import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { gerarInfoQrCodeNFCe, definirOverrideUrlQrCodeNFCe } from '../../src/sefaz/nfce-qrcode.js';

describe('gerarInfoQrCodeNFCe', () => {
  const baseParams = {
    chaveAcesso: '35230308043291000155650010000010011003290410',
    ambiente: 2 as const,
    uf: 'SP',
    cscId: '1',
    csc: 'segredo-csc-da-empresa',
  };

  it('gera URL QR Code no formato Anexo II v4.00', () => {
    const { qrCode } = gerarInfoQrCodeNFCe(baseParams);
    // formato: {baseUrl}?p={chave}|{versao}|{tpAmb}|{cIdToken}|{hash}
    expect(qrCode).toMatch(/^https?:\/\/.+\?p=\d{44}\|2\|2\|000001\|[a-f0-9]{40}$/);
  });

  it('cIdToken eh zero-padded a 6 digitos', () => {
    const { qrCode } = gerarInfoQrCodeNFCe({ ...baseParams, cscId: '42' });
    expect(qrCode).toContain('|000042|');
  });

  it('hash SHA1 hex eh deterministico para mesma entrada', () => {
    const r1 = gerarInfoQrCodeNFCe(baseParams);
    const r2 = gerarInfoQrCodeNFCe(baseParams);
    expect(r1.qrCode).toBe(r2.qrCode);
  });

  it('hash SHA1 corresponde a SHA1(chave + versao + tpAmb + cIdToken + CSC)', () => {
    const { qrCode } = gerarInfoQrCodeNFCe(baseParams);
    const expectedHash = createHash('sha1')
      .update('35230308043291000155650010000010011003290410' + '2' + '2' + '000001' + 'segredo-csc-da-empresa', 'utf8')
      .digest('hex')
      .toLowerCase();
    expect(qrCode.endsWith(expectedHash)).toBe(true);
  });

  it('retorna urlChave correspondente ao portal SEFAZ-UF', () => {
    const { urlChave } = gerarInfoQrCodeNFCe(baseParams);
    expect(urlChave).toContain('fazenda.sp.gov.br');
  });

  it('lanca erro para UF nao configurada', () => {
    expect(() => gerarInfoQrCodeNFCe({ ...baseParams, uf: 'ZZ' }))
      .toThrow(/URLs de QR Code NFCe nao configuradas para UF=ZZ/);
  });

  it('respeita override de URL per UF', () => {
    definirOverrideUrlQrCodeNFCe('ZZ', 'homologacao', {
      qrCode: 'http://custom.example/qr',
      urlChave: 'http://custom.example/consulta',
    });
    const { qrCode, urlChave } = gerarInfoQrCodeNFCe({ ...baseParams, uf: 'ZZ' });
    expect(qrCode).toMatch(/^http:\/\/custom\.example\/qr\?p=/);
    expect(urlChave).toBe('http://custom.example/consulta');
  });

  it('aceita producao (ambiente=1) e usa URLs de producao', () => {
    const { qrCode } = gerarInfoQrCodeNFCe({ ...baseParams, ambiente: 1 });
    expect(qrCode).toContain('|1|'); // tpAmb=1 no payload
    expect(qrCode).not.toContain('homologacao');
  });
});
