import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { extractDanfeData, type DanfeData } from './danfe-data.js';
import {
  fmtCNPJ, fmtCPF, fmtMoney, fmtQtd, fmtChaveAcesso, fmtDataHora,
} from './utils/formatters.js';

/**
 * DANFCe (DANFE da NFCe) — leiaute simplificado em cupom 80mm, conforme Anexo II
 * do Manual da NFCe v4.00.
 *
 * Diferenças do DANFE A4 (mod 55):
 * - Largura fixa 80mm (227pt) — papel termico de impressora fiscal
 * - Altura dinamica conforme numero de itens
 * - QR Code obrigatorio (consumer escaneia para validar no portal SEFAZ)
 * - Layout simplificado: header, itens, totais, pagamento, consumidor, chave, QR, footer
 * - Sem campos de transportador, frete, ICMS detalhado, duplicatas
 */

const PAGE_W = 227;           // 80mm
const MARGIN = 8;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FONT_TINY = 6;
const FONT_SMALL = 7;
const FONT_BASE = 8;
const FONT_BOLD = 8;
const LINE_GAP = 2;
const ROW_H = 10;

export interface DanfceOptions {
  /** Mensagem opcional no rodape (ex.: politica de troca da loja). */
  mensagemRodape?: string;
  /** Dimensao do QR Code em pontos (default 130). */
  qrCodeSize?: number;
}

export class DanfceGenerator {
  /**
   * Gera DANFCe em PDF a partir do XML autorizado da NFCe.
   * O XML deve conter <infNFeSupl> com qrCode + urlChave (presente em NFCe assinada).
   */
  async gerarDanfce(xml: string, options?: DanfceOptions): Promise<Buffer> {
    const data = extractDanfeData(xml);
    if (!data.qrCode || !data.urlChave) {
      throw new Error(
        'DANFCe exige <infNFeSupl> com qrCode e urlChave no XML. Esse XML parece ser NFe (mod=55), use DanfeGenerator.',
      );
    }
    return this.renderPdf(data, options);
  }

  async gerarDanfceFromData(data: DanfeData, options?: DanfceOptions): Promise<Buffer> {
    if (!data.qrCode || !data.urlChave) {
      throw new Error('DanfeData sem qrCode/urlChave — nao parece ser NFCe.');
    }
    return this.renderPdf(data, options);
  }

  private async renderPdf(data: DanfeData, options?: DanfceOptions): Promise<Buffer> {
    const qrSize = options?.qrCodeSize ?? 130;
    const pageHeight = this.calcularAltura(data, qrSize);

    // Gerar QR Code como PNG buffer pra embed no pdfkit
    const qrCodePng = await QRCode.toBuffer(data.qrCode!, {
      errorCorrectionLevel: 'M',
      type: 'png',
      margin: 0,
      width: qrSize,
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: [PAGE_W, pageHeight],
        margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
        bufferPages: true,
        info: {
          Title: `DANFCe - NFCe ${data.nNF}`,
          Author: 'acbr-node',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      let y = MARGIN;
      y = this.drawHeader(doc, data, y);
      y = this.drawSubtitulo(doc, y);
      y = this.drawItensHeader(doc, y);
      y = this.drawItens(doc, data, y);
      y = this.drawTotais(doc, data, y);
      y = this.drawPagamento(doc, data, y);
      y = this.drawConsumidor(doc, data, y);
      y = this.drawChaveAcesso(doc, data, y);
      y = this.drawMensagemAutorizacao(doc, data, y);
      y = this.drawQrCode(doc, data, qrCodePng, qrSize, y);
      if (options?.mensagemRodape) {
        this.drawMensagemRodape(doc, options.mensagemRodape, y);
      }

      doc.end();
    });
  }

  /** Calcula altura aproximada do cupom em pontos. */
  private calcularAltura(data: DanfeData, qrSize: number): number {
    const headerH = 60;
    const subtH = 12;
    const itensHeaderH = 12;
    const itensH = data.itens.length * ROW_H + 6;
    const totaisH = 70;
    const pagH = data.pagamentos.length * (FONT_BASE + LINE_GAP) + 10;
    const consumidorH = 30;
    const chaveH = 26;
    const mensagemH = 20;
    const qrH = qrSize + 30;
    const buffer = 40;
    return headerH + subtH + itensHeaderH + itensH + totaisH + pagH + consumidorH + chaveH + mensagemH + qrH + buffer;
  }

  private drawHeader(doc: PDFKit.PDFDocument, data: DanfeData, y: number): number {
    doc.font('Helvetica-Bold').fontSize(FONT_BOLD);
    doc.text(data.emitxNome, MARGIN, y, { width: CONTENT_W, align: 'center' });
    y += FONT_BOLD + LINE_GAP;

    doc.font('Helvetica').fontSize(FONT_SMALL);
    doc.text(`CNPJ: ${fmtCNPJ(data.emitCNPJ)}`, MARGIN, y, { width: CONTENT_W, align: 'center' });
    y += FONT_SMALL + LINE_GAP;
    if (data.emitIE) {
      doc.text(`IE: ${data.emitIE}`, MARGIN, y, { width: CONTENT_W, align: 'center' });
      y += FONT_SMALL + LINE_GAP;
    }
    if (data.emitEndereco) {
      doc.text(data.emitEndereco, MARGIN, y, { width: CONTENT_W, align: 'center' });
      y += FONT_SMALL + LINE_GAP;
    }
    if (data.emitMunUF || data.emitCEP) {
      doc.text(`${data.emitMunUF}${data.emitCEP ? ' CEP: ' + data.emitCEP : ''}`,
        MARGIN, y, { width: CONTENT_W, align: 'center' });
      y += FONT_SMALL + LINE_GAP;
    }
    y += 4;
    this.drawLinhaTracejada(doc, y);
    return y + 4;
  }

  private drawSubtitulo(doc: PDFKit.PDFDocument, y: number): number {
    doc.font('Helvetica-Bold').fontSize(FONT_BASE);
    doc.text('DANFE NFC-e - Documento Auxiliar da NFC-e', MARGIN, y, {
      width: CONTENT_W, align: 'center',
    });
    y += FONT_BASE + LINE_GAP;
    doc.font('Helvetica').fontSize(FONT_TINY);
    doc.text('Nao permite aproveitamento de credito de ICMS', MARGIN, y, {
      width: CONTENT_W, align: 'center',
    });
    y += FONT_TINY + 4;
    this.drawLinhaTracejada(doc, y);
    return y + 4;
  }

  private drawItensHeader(doc: PDFKit.PDFDocument, y: number): number {
    doc.font('Helvetica-Bold').fontSize(FONT_TINY);
    const col = {
      code: MARGIN,
      desc: MARGIN + 26,
      qtd: MARGIN + 110,
      un: MARGIN + 135,
      vUn: MARGIN + 150,
      total: MARGIN + 185,
    };
    doc.text('CODIGO', col.code, y);
    doc.text('DESCRICAO', col.desc, y);
    doc.text('QTD', col.qtd, y);
    doc.text('UN', col.un, y);
    doc.text('VL UN', col.vUn, y);
    doc.text('VL TOT', col.total, y, { width: CONTENT_W - 177, align: 'right' });
    y += FONT_TINY + LINE_GAP;
    this.drawLinhaTracejada(doc, y);
    return y + 2;
  }

  private drawItens(doc: PDFKit.PDFDocument, data: DanfeData, y: number): number {
    doc.font('Helvetica').fontSize(FONT_TINY);
    const col = {
      code: MARGIN,
      desc: MARGIN + 26,
      qtd: MARGIN + 110,
      un: MARGIN + 135,
      vUn: MARGIN + 150,
      total: MARGIN + 185,
    };
    for (const item of data.itens) {
      const vTotal = (Number(item.qCom) * Number(item.vUnCom)).toFixed(2);
      doc.text(item.cProd.slice(0, 5), col.code, y);
      doc.text(item.xProd, col.desc, y, { width: 80, ellipsis: true, lineBreak: false });
      doc.text(fmtQtd(item.qCom), col.qtd, y, { width: 22, align: 'right' });
      doc.text(item.uCom, col.un, y);
      doc.text(fmtMoney(item.vUnCom), col.vUn, y, { width: 30, align: 'right' });
      doc.text(fmtMoney(vTotal), col.total, y, { width: CONTENT_W - 177, align: 'right' });
      y += ROW_H;
    }
    y += 2;
    this.drawLinhaTracejada(doc, y);
    return y + 4;
  }

  private drawTotais(doc: PDFKit.PDFDocument, data: DanfeData, y: number): number {
    const linha = (label: string, valor: string, bold: boolean = false, size: number = FONT_BASE) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size);
      doc.text(label, MARGIN, y);
      doc.text(valor, MARGIN, y, { width: CONTENT_W, align: 'right' });
      y += size + LINE_GAP;
    };
    linha('Qtd. total de itens', String(data.itens.length));
    linha('Valor total', `R$ ${fmtMoney(data.vProd)}`);
    if (Number(data.vDesc) > 0) linha('Desconto', `R$ ${fmtMoney(data.vDesc)}`);
    if (Number(data.vOutro) > 0) linha('Acrescimo', `R$ ${fmtMoney(data.vOutro)}`);
    linha('VALOR A PAGAR', `R$ ${fmtMoney(data.vNF)}`, true, FONT_BASE + 1);
    y += 2;
    this.drawLinhaTracejada(doc, y);
    return y + 4;
  }

  private drawPagamento(doc: PDFKit.PDFDocument, data: DanfeData, y: number): number {
    doc.font('Helvetica-Bold').fontSize(FONT_SMALL);
    doc.text('FORMA DE PAGAMENTO', MARGIN, y);
    y += FONT_SMALL + LINE_GAP;
    doc.font('Helvetica').fontSize(FONT_SMALL);
    for (const p of data.pagamentos) {
      const desc = describeFormaPagamento(p.tPag);
      doc.text(desc, MARGIN, y);
      doc.text(`R$ ${fmtMoney(p.vPag)}`, MARGIN, y, { width: CONTENT_W, align: 'right' });
      y += FONT_SMALL + LINE_GAP;
    }
    y += 2;
    this.drawLinhaTracejada(doc, y);
    return y + 4;
  }

  private drawConsumidor(doc: PDFKit.PDFDocument, data: DanfeData, y: number): number {
    doc.font('Helvetica-Bold').fontSize(FONT_SMALL);
    doc.text('CONSUMIDOR', MARGIN, y, { width: CONTENT_W, align: 'center' });
    y += FONT_SMALL + LINE_GAP;
    doc.font('Helvetica').fontSize(FONT_SMALL);
    if (data.destCNPJCPF) {
      const doc_ = data.destCNPJCPF;
      const docFmt = doc_.length === 14 ? fmtCNPJ(doc_) : doc_.length === 11 ? fmtCPF(doc_) : doc_;
      doc.text(`CPF/CNPJ: ${docFmt}`, MARGIN, y, { width: CONTENT_W, align: 'center' });
      y += FONT_SMALL + LINE_GAP;
      if (data.destxNome) {
        doc.text(data.destxNome, MARGIN, y, { width: CONTENT_W, align: 'center' });
        y += FONT_SMALL + LINE_GAP;
      }
    } else {
      doc.text('Consumidor nao identificado', MARGIN, y, { width: CONTENT_W, align: 'center' });
      y += FONT_SMALL + LINE_GAP;
    }
    y += 2;
    this.drawLinhaTracejada(doc, y);
    return y + 4;
  }

  private drawChaveAcesso(doc: PDFKit.PDFDocument, data: DanfeData, y: number): number {
    doc.font('Helvetica-Bold').fontSize(FONT_SMALL);
    doc.text(`NFC-e n. ${data.nNF} Serie ${data.serie}`, MARGIN, y, {
      width: CONTENT_W, align: 'center',
    });
    y += FONT_SMALL + LINE_GAP;
    doc.font('Helvetica').fontSize(FONT_TINY);
    doc.text(`Emissao: ${fmtDataHora(data.dhEmi)}`, MARGIN, y, {
      width: CONTENT_W, align: 'center',
    });
    y += FONT_TINY + LINE_GAP;
    doc.text(`Chave de acesso:`, MARGIN, y, { width: CONTENT_W, align: 'center' });
    y += FONT_TINY + LINE_GAP;
    doc.font('Helvetica').fontSize(FONT_TINY);
    doc.text(fmtChaveAcesso(data.chaveAcesso), MARGIN, y, {
      width: CONTENT_W, align: 'center',
    });
    y += FONT_TINY + 4;
    this.drawLinhaTracejada(doc, y);
    return y + 4;
  }

  private drawMensagemAutorizacao(doc: PDFKit.PDFDocument, data: DanfeData, y: number): number {
    if (data.nProt) {
      doc.font('Helvetica').fontSize(FONT_TINY);
      doc.text(`Protocolo autorizacao: ${data.nProt}`, MARGIN, y, {
        width: CONTENT_W, align: 'center',
      });
      y += FONT_TINY + LINE_GAP;
      if (data.dhRecbto) {
        doc.text(fmtDataHora(data.dhRecbto), MARGIN, y, { width: CONTENT_W, align: 'center' });
        y += FONT_TINY + LINE_GAP;
      }
    }
    y += 4;
    return y;
  }

  private drawQrCode(
    doc: PDFKit.PDFDocument,
    data: DanfeData,
    qrCodePng: Buffer,
    qrSize: number,
    y: number,
  ): number {
    const x = (PAGE_W - qrSize) / 2;
    doc.image(qrCodePng, x, y, { width: qrSize, height: qrSize });
    y += qrSize + 4;

    doc.font('Helvetica').fontSize(FONT_TINY);
    doc.text('Consulta via leitor de QR Code', MARGIN, y, { width: CONTENT_W, align: 'center' });
    y += FONT_TINY + LINE_GAP;
    if (data.urlChave) {
      doc.fillColor('blue');
      doc.text(data.urlChave, MARGIN, y, { width: CONTENT_W, align: 'center', link: data.urlChave });
      doc.fillColor('black');
      y += FONT_TINY + LINE_GAP;
    }
    return y + 4;
  }

  private drawMensagemRodape(doc: PDFKit.PDFDocument, mensagem: string, y: number): number {
    this.drawLinhaTracejada(doc, y);
    y += 4;
    doc.font('Helvetica').fontSize(FONT_TINY);
    doc.text(mensagem, MARGIN, y, { width: CONTENT_W, align: 'center' });
    return y + FONT_TINY + LINE_GAP;
  }

  private drawLinhaTracejada(doc: PDFKit.PDFDocument, y: number): void {
    doc.save();
    doc.dash(1, { space: 1 });
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).stroke();
    doc.restore();
  }
}

/** Mapeia tPag (SEFAZ leiaute 4.00) para descricao. */
function describeFormaPagamento(tPag: string): string {
  const map: Record<string, string> = {
    '01': 'Dinheiro',
    '02': 'Cheque',
    '03': 'Cartao de Credito',
    '04': 'Cartao de Debito',
    '05': 'Credito Loja',
    '10': 'Vale Alimentacao',
    '11': 'Vale Refeicao',
    '12': 'Vale Presente',
    '13': 'Vale Combustivel',
    '14': 'Duplicata Mercantil',
    '15': 'Boleto Bancario',
    '16': 'Deposito Bancario',
    '17': 'PIX',
    '18': 'Transferencia Bancaria',
    '19': 'Programa de Fidelidade',
    '90': 'Sem Pagamento',
    '99': 'Outros',
  };
  return map[tPag] ?? tPag;
}
