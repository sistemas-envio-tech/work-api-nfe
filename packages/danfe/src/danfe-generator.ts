import PDFDocument from 'pdfkit';
import { extractDanfeData, type DanfeData } from './danfe-data.js';
import { gerarBarrasCode128 } from './utils/barcode.js';
import {
  fmtCNPJ, fmtCPF, fmtCEP, fmtFone, fmtMoney, fmtQtd,
  fmtChaveAcesso, fmtData, fmtDataHora, fmtIE,
} from './utils/formatters.js';

/** Margens e layout em pontos (pt). A4 = 595.28 x 841.89 */
const MARGIN = 20;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FONT_LABEL = 6;
const FONT_VALUE = 8;
const ROW_H = 22;
const ITEM_ROW_H = 12;

export interface DanfeOptions {
  /** Logo da empresa (Buffer PNG/JPEG) */
  logo?: Buffer;
  /** Largura do logo em pontos (padrão: 80) */
  logoWidth?: number;
}

export class DanfeGenerator {
  /**
   * Gera DANFE em PDF a partir do XML autorizado (nfeProc ou NFe assinada)
   * @returns Buffer do PDF
   */
  async gerarDanfe(xml: string, options?: DanfeOptions): Promise<Buffer> {
    const data = extractDanfeData(xml);
    return this.renderPdf(data, options);
  }

  /**
   * Gera DANFE a partir de dados já extraídos
   */
  async gerarDanfeFromData(data: DanfeData, options?: DanfeOptions): Promise<Buffer> {
    return this.renderPdf(data, options);
  }

  private renderPdf(data: DanfeData, options?: DanfeOptions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
        bufferPages: true,
        info: {
          Title: `DANFE - NFe ${data.nNF}`,
          Author: 'acbr-node',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      let y = MARGIN;
      const totalPages = this.calculatePages(data);

      for (let page = 1; page <= totalPages; page++) {
        if (page > 1) doc.addPage();
        y = MARGIN;

        y = this.drawHeader(doc, data, y, options, page, totalPages);
        y = this.drawDestinatario(doc, data, y);
        y = this.drawImpostos(doc, data, y);
        y = this.drawTransporte(doc, data, y);
        y = this.drawProdutosHeader(doc, y);
        y = this.drawProdutos(doc, data, y, page, totalPages);

        if (page === totalPages) {
          y = this.drawInfoAdicional(doc, data, y);
        }
      }

      doc.end();
    });
  }

  private calculatePages(data: DanfeData): number {
    // Espaço disponível para itens por página
    const headerSpace = 280; // header + dest + impostos + transp + produtos header
    const footerSpace = 80;  // info adicional
    const itemSpace = PAGE_H - MARGIN * 2 - headerSpace - footerSpace;
    const itemsPerPage = Math.floor(itemSpace / ITEM_ROW_H);

    if (data.itens.length <= itemsPerPage) return 1;
    return Math.ceil(data.itens.length / itemsPerPage);
  }

  // ─── HEADER ───

  private drawHeader(
    doc: PDFKit.PDFDocument, data: DanfeData, y: number,
    options?: DanfeOptions, page: number = 1, totalPages: number = 1
  ): number {
    const startY = y;
    const colLogoW = 250;
    const colDanfeW = 90;
    const colChaveW = CONTENT_W - colLogoW - colDanfeW;

    // Border do header
    doc.rect(MARGIN, y, CONTENT_W, 90).stroke();

    // ── Coluna 1: Logo + Emitente ──
    doc.rect(MARGIN, y, colLogoW, 90).stroke();

    if (options?.logo) {
      try {
        doc.image(options.logo, MARGIN + 5, y + 5, { width: options.logoWidth ?? 60, height: 30 });
      } catch { /* logo inválido, pular */ }
    }

    const emitX = MARGIN + (options?.logo ? (options.logoWidth ?? 60) + 10 : 5);
    doc.font('Helvetica-Bold').fontSize(8);
    doc.text(data.emitxNome, emitX, y + 5, { width: colLogoW - (emitX - MARGIN) - 5 });

    doc.font('Helvetica').fontSize(FONT_LABEL);
    let emitY = y + 20;
    doc.text(data.emitEndereco, MARGIN + 5, emitY, { width: colLogoW - 10 });
    emitY += 10;
    doc.text(`${data.emitBairro} - ${fmtCEP(data.emitCEP)}`, MARGIN + 5, emitY, { width: colLogoW - 10 });
    emitY += 8;
    doc.text(`${data.emitMunUF}  Fone: ${fmtFone(data.emitFone)}`, MARGIN + 5, emitY, { width: colLogoW - 10 });

    // ── Coluna 2: DANFE ──
    const danfeX = MARGIN + colLogoW;
    doc.rect(danfeX, y, colDanfeW, 90).stroke();
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('DANFE', danfeX, y + 5, { width: colDanfeW, align: 'center' });
    doc.font('Helvetica').fontSize(FONT_LABEL);
    doc.text('Documento Auxiliar da', danfeX, y + 22, { width: colDanfeW, align: 'center' });
    doc.text('Nota Fiscal Eletrônica', danfeX, y + 30, { width: colDanfeW, align: 'center' });

    doc.font('Helvetica-Bold').fontSize(FONT_VALUE);
    const tipoNF = data.tpNF === '0' ? '0 - ENTRADA' : '1 - SAÍDA';
    doc.text(tipoNF, danfeX, y + 45, { width: colDanfeW, align: 'center' });

    doc.font('Helvetica').fontSize(FONT_LABEL);
    doc.text(`Nº ${data.nNF}`, danfeX, y + 60, { width: colDanfeW, align: 'center' });
    doc.text(`Série ${data.serie}`, danfeX, y + 68, { width: colDanfeW, align: 'center' });
    doc.text(`Folha ${page}/${totalPages}`, danfeX, y + 76, { width: colDanfeW, align: 'center' });

    // ── Coluna 3: Barcode + Chave ──
    const chaveX = danfeX + colDanfeW;
    doc.rect(chaveX, y, colChaveW, 90).stroke();

    // Barcode
    if (data.chaveAcesso) {
      this.drawBarcode(doc, data.chaveAcesso, chaveX + 10, y + 5, colChaveW - 20, 30);
    }

    doc.font('Helvetica').fontSize(FONT_LABEL);
    doc.text('CHAVE DE ACESSO', chaveX + 5, y + 38, { width: colChaveW - 10 });
    doc.font('Helvetica-Bold').fontSize(7);
    doc.text(fmtChaveAcesso(data.chaveAcesso), chaveX + 5, y + 47, { width: colChaveW - 10 });

    doc.font('Helvetica').fontSize(FONT_LABEL);
    doc.text(`Protocolo de Autorização: ${data.nProt}`, chaveX + 5, y + 62, { width: colChaveW - 10 });
    doc.text(`Data: ${fmtDataHora(data.dhRecbto)}`, chaveX + 5, y + 72, { width: colChaveW - 10 });

    y = startY + 92;

    // Natureza da operação + IE + IE/ST + CNPJ
    const row2H = ROW_H;
    doc.rect(MARGIN, y, CONTENT_W, row2H).stroke();
    this.drawField(doc, 'NATUREZA DA OPERAÇÃO', data.natOp, MARGIN, y, CONTENT_W * 0.5, row2H);
    this.drawField(doc, 'INSCRIÇÃO ESTADUAL', fmtIE(data.emitIE), MARGIN + CONTENT_W * 0.5, y, CONTENT_W * 0.2, row2H);
    this.drawField(doc, 'I.E. DO SUBST. TRIB.', data.emitIEST, MARGIN + CONTENT_W * 0.7, y, CONTENT_W * 0.15, row2H);
    this.drawField(doc, 'CNPJ', fmtCNPJ(data.emitCNPJ), MARGIN + CONTENT_W * 0.85, y, CONTENT_W * 0.15, row2H);

    return y + row2H + 2;
  }

  // ─── DESTINATÁRIO ───

  private drawDestinatario(doc: PDFKit.PDFDocument, data: DanfeData, y: number): number {
    doc.font('Helvetica-Bold').fontSize(FONT_LABEL);
    doc.text('DESTINATÁRIO / REMETENTE', MARGIN + 2, y);
    y += 8;

    doc.rect(MARGIN, y, CONTENT_W, ROW_H).stroke();
    this.drawField(doc, 'NOME / RAZÃO SOCIAL', data.destxNome, MARGIN, y, CONTENT_W * 0.55, ROW_H);
    this.drawField(doc, 'CNPJ/CPF', this.fmtDoc(data.destCNPJCPF), MARGIN + CONTENT_W * 0.55, y, CONTENT_W * 0.25, ROW_H);
    this.drawField(doc, 'DATA DA EMISSÃO', fmtData(data.dhEmi), MARGIN + CONTENT_W * 0.8, y, CONTENT_W * 0.2, ROW_H);
    y += ROW_H;

    doc.rect(MARGIN, y, CONTENT_W, ROW_H).stroke();
    this.drawField(doc, 'ENDEREÇO', data.destEndereco, MARGIN, y, CONTENT_W * 0.4, ROW_H);
    this.drawField(doc, 'BAIRRO', data.destBairro, MARGIN + CONTENT_W * 0.4, y, CONTENT_W * 0.2, ROW_H);
    this.drawField(doc, 'CEP', fmtCEP(data.destCEP), MARGIN + CONTENT_W * 0.6, y, CONTENT_W * 0.1, ROW_H);
    this.drawField(doc, 'DATA SAÍDA/ENTRADA', fmtData(data.dhSaiEnt), MARGIN + CONTENT_W * 0.7, y, CONTENT_W * 0.3, ROW_H);
    y += ROW_H;

    doc.rect(MARGIN, y, CONTENT_W, ROW_H).stroke();
    this.drawField(doc, 'MUNICÍPIO', data.destMunUF, MARGIN, y, CONTENT_W * 0.4, ROW_H);
    this.drawField(doc, 'FONE/FAX', fmtFone(data.destFone), MARGIN + CONTENT_W * 0.4, y, CONTENT_W * 0.2, ROW_H);
    this.drawField(doc, 'UF', data.destMunUF.split(' - ').pop() || '', MARGIN + CONTENT_W * 0.6, y, CONTENT_W * 0.05, ROW_H);
    this.drawField(doc, 'INSCRIÇÃO ESTADUAL', fmtIE(data.destIE), MARGIN + CONTENT_W * 0.65, y, CONTENT_W * 0.2, ROW_H);
    this.drawField(doc, 'HORA DA SAÍDA', data.dhSaiEnt ? data.dhSaiEnt.slice(11, 19) : '', MARGIN + CONTENT_W * 0.85, y, CONTENT_W * 0.15, ROW_H);

    return y + ROW_H + 2;
  }

  // ─── IMPOSTOS ───

  private drawImpostos(doc: PDFKit.PDFDocument, data: DanfeData, y: number): number {
    doc.font('Helvetica-Bold').fontSize(FONT_LABEL);
    doc.text('CÁLCULO DO IMPOSTO', MARGIN + 2, y);
    y += 8;

    const cols = [
      { label: 'BASE DE CÁLC. DO ICMS', value: fmtMoney(data.vBC), w: 0.17 },
      { label: 'VALOR DO ICMS', value: fmtMoney(data.vICMS), w: 0.14 },
      { label: 'BASE DE CÁLC. ICMS ST', value: fmtMoney(data.vBCST), w: 0.17 },
      { label: 'VALOR DO ICMS ST', value: fmtMoney(data.vST), w: 0.14 },
      { label: 'V. IMP. IMPORTAÇÃO', value: '0,00', w: 0.12 },
      { label: 'VALOR DO PIS', value: '0,00', w: 0.12 },
      { label: 'VALOR TOTAL DA NF', value: fmtMoney(data.vNF), w: 0.14 },
    ];

    doc.rect(MARGIN, y, CONTENT_W, ROW_H).stroke();
    let x = MARGIN;
    for (const col of cols) {
      const w = CONTENT_W * col.w;
      this.drawField(doc, col.label, col.value, x, y, w, ROW_H);
      x += w;
    }
    y += ROW_H;

    const cols2 = [
      { label: 'VALOR DO FRETE', value: fmtMoney(data.vFrete), w: 0.17 },
      { label: 'VALOR DO SEGURO', value: fmtMoney(data.vSeg), w: 0.14 },
      { label: 'DESCONTO', value: fmtMoney(data.vDesc), w: 0.17 },
      { label: 'OUTRAS DESPESAS', value: fmtMoney(data.vOutro), w: 0.14 },
      { label: 'VALOR DO IPI', value: fmtMoney(data.vIPI), w: 0.12 },
      { label: 'V. APROX. TRIBUTOS', value: fmtMoney(data.vTotTrib), w: 0.12 },
      { label: 'VALOR TOTAL PRODUTOS', value: fmtMoney(data.vProd), w: 0.14 },
    ];

    doc.rect(MARGIN, y, CONTENT_W, ROW_H).stroke();
    x = MARGIN;
    for (const col of cols2) {
      const w = CONTENT_W * col.w;
      this.drawField(doc, col.label, col.value, x, y, w, ROW_H);
      x += w;
    }

    return y + ROW_H + 2;
  }

  // ─── TRANSPORTE ───

  private drawTransporte(doc: PDFKit.PDFDocument, data: DanfeData, y: number): number {
    doc.font('Helvetica-Bold').fontSize(FONT_LABEL);
    doc.text('TRANSPORTADOR / VOLUMES TRANSPORTADOS', MARGIN + 2, y);
    y += 8;

    const freteLabels: Record<string, string> = {
      '0': '0-Emitente', '1': '1-Destinatário', '2': '2-Terceiros',
      '3': '3-Próprio Rem.', '4': '4-Próprio Dest.', '9': '9-Sem Frete',
    };

    doc.rect(MARGIN, y, CONTENT_W, ROW_H).stroke();
    this.drawField(doc, 'NOME/RAZÃO SOCIAL', data.transpNome, MARGIN, y, CONTENT_W * 0.35, ROW_H);
    this.drawField(doc, 'FRETE POR CONTA', freteLabels[data.modFrete] || data.modFrete, MARGIN + CONTENT_W * 0.35, y, CONTENT_W * 0.15, ROW_H);
    this.drawField(doc, 'CÓDIGO ANTT', '', MARGIN + CONTENT_W * 0.5, y, CONTENT_W * 0.1, ROW_H);
    this.drawField(doc, 'PLACA DO VEÍCULO', '', MARGIN + CONTENT_W * 0.6, y, CONTENT_W * 0.1, ROW_H);
    this.drawField(doc, 'UF', '', MARGIN + CONTENT_W * 0.7, y, CONTENT_W * 0.05, ROW_H);
    this.drawField(doc, 'CNPJ/CPF', this.fmtDoc(data.transpCNPJCPF), MARGIN + CONTENT_W * 0.75, y, CONTENT_W * 0.25, ROW_H);
    y += ROW_H;

    // Volumes
    const vol = data.volumes[0] || { qVol: '', esp: '', marca: '', nVol: '', pesoL: '', pesoB: '' };
    doc.rect(MARGIN, y, CONTENT_W, ROW_H).stroke();
    this.drawField(doc, 'QUANTIDADE', vol.qVol, MARGIN, y, CONTENT_W * 0.12, ROW_H);
    this.drawField(doc, 'ESPÉCIE', vol.esp, MARGIN + CONTENT_W * 0.12, y, CONTENT_W * 0.18, ROW_H);
    this.drawField(doc, 'MARCA', vol.marca, MARGIN + CONTENT_W * 0.3, y, CONTENT_W * 0.18, ROW_H);
    this.drawField(doc, 'NUMERAÇÃO', vol.nVol, MARGIN + CONTENT_W * 0.48, y, CONTENT_W * 0.15, ROW_H);
    this.drawField(doc, 'PESO BRUTO', vol.pesoB ? fmtMoney(vol.pesoB, 3) : '', MARGIN + CONTENT_W * 0.63, y, CONTENT_W * 0.185, ROW_H);
    this.drawField(doc, 'PESO LÍQUIDO', vol.pesoL ? fmtMoney(vol.pesoL, 3) : '', MARGIN + CONTENT_W * 0.815, y, CONTENT_W * 0.185, ROW_H);

    return y + ROW_H + 2;
  }

  // ─── PRODUTOS HEADER ───

  private drawProdutosHeader(doc: PDFKit.PDFDocument, y: number): number {
    doc.font('Helvetica-Bold').fontSize(FONT_LABEL);
    doc.text('DADOS DOS PRODUTOS / SERVIÇOS', MARGIN + 2, y);
    y += 8;

    const h = 14;
    doc.rect(MARGIN, y, CONTENT_W, h).stroke();
    doc.fillColor('#f0f0f0').rect(MARGIN, y, CONTENT_W, h).fill().fillColor('#000');
    doc.rect(MARGIN, y, CONTENT_W, h).stroke();

    const headers = [
      { text: 'CÓDIGO', w: 0.08 },
      { text: 'DESCRIÇÃO DO PRODUTO/SERVIÇO', w: 0.26 },
      { text: 'NCM', w: 0.06 },
      { text: 'CST', w: 0.04 },
      { text: 'CFOP', w: 0.04 },
      { text: 'UN', w: 0.03 },
      { text: 'QTD', w: 0.08 },
      { text: 'V.UNIT', w: 0.08 },
      { text: 'V.TOTAL', w: 0.08 },
      { text: 'B.CÁLC ICMS', w: 0.07 },
      { text: 'V.ICMS', w: 0.06 },
      { text: '%ICMS', w: 0.04 },
      { text: 'V.IPI', w: 0.05 },
      { text: '%IPI', w: 0.03 },
    ];

    doc.font('Helvetica-Bold').fontSize(5);
    let x = MARGIN;
    for (const h2 of headers) {
      const w = CONTENT_W * h2.w;
      doc.text(h2.text, x + 1, y + 4, { width: w - 2, align: 'center' });
      x += w;
    }

    return y + h;
  }

  // ─── PRODUTOS ITENS ───

  private drawProdutos(
    doc: PDFKit.PDFDocument, data: DanfeData, y: number,
    page: number, totalPages: number
  ): number {
    const maxY = PAGE_H - MARGIN - (page === totalPages ? 90 : 20);
    const itemsPerPage = Math.floor((maxY - y) / ITEM_ROW_H);
    const startIdx = (page - 1) * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, data.itens.length);

    doc.font('Helvetica').fontSize(6);

    for (let i = startIdx; i < endIdx; i++) {
      if (y + ITEM_ROW_H > maxY) break;

      const item = data.itens[i];
      const isOdd = i % 2 === 1;
      if (isOdd) {
        doc.fillColor('#f9f9f9').rect(MARGIN, y, CONTENT_W, ITEM_ROW_H).fill().fillColor('#000');
      }

      const cols = [
        { text: item.cProd, w: 0.08, align: 'left' as const },
        { text: item.xProd, w: 0.26, align: 'left' as const },
        { text: item.NCM, w: 0.06, align: 'center' as const },
        { text: item.CST, w: 0.04, align: 'center' as const },
        { text: item.CFOP, w: 0.04, align: 'center' as const },
        { text: item.uCom, w: 0.03, align: 'center' as const },
        { text: fmtQtd(item.qCom), w: 0.08, align: 'right' as const },
        { text: fmtMoney(item.vUnCom, 4), w: 0.08, align: 'right' as const },
        { text: fmtMoney(item.vProd), w: 0.08, align: 'right' as const },
        { text: fmtMoney(item.vBC_ICMS), w: 0.07, align: 'right' as const },
        { text: fmtMoney(item.vICMS), w: 0.06, align: 'right' as const },
        { text: fmtMoney(item.pICMS), w: 0.04, align: 'right' as const },
        { text: fmtMoney(item.vIPI), w: 0.05, align: 'right' as const },
        { text: fmtMoney(item.pIPI), w: 0.03, align: 'right' as const },
      ];

      let x = MARGIN;
      for (const col of cols) {
        const w = CONTENT_W * col.w;
        doc.text(col.text, x + 1, y + 2, { width: w - 2, align: col.align, lineBreak: false });
        x += w;
      }

      y += ITEM_ROW_H;
    }

    // Borda da tabela de itens
    doc.rect(MARGIN, y - (endIdx - startIdx) * ITEM_ROW_H, CONTENT_W, (endIdx - startIdx) * ITEM_ROW_H).stroke();

    return y + 2;
  }

  // ─── INFO ADICIONAL ───

  private drawInfoAdicional(doc: PDFKit.PDFDocument, data: DanfeData, y: number): number {
    doc.font('Helvetica-Bold').fontSize(FONT_LABEL);
    doc.text('DADOS ADICIONAIS', MARGIN + 2, y);
    y += 8;

    const halfW = CONTENT_W * 0.6;
    const restW = CONTENT_W - halfW;
    const boxH = 60;

    doc.rect(MARGIN, y, halfW, boxH).stroke();
    doc.rect(MARGIN + halfW, y, restW, boxH).stroke();

    // Info complementar
    doc.font('Helvetica').fontSize(FONT_LABEL);
    doc.text('INFORMAÇÕES COMPLEMENTARES', MARGIN + 2, y + 2);
    doc.fontSize(6);
    const infText = [data.infAdFisco, data.infCpl].filter(Boolean).join('\n');
    doc.text(infText, MARGIN + 2, y + 10, { width: halfW - 4, height: boxH - 12 });

    // Reservado fisco
    doc.fontSize(FONT_LABEL);
    doc.text('RESERVADO AO FISCO', MARGIN + halfW + 2, y + 2);

    // Duplicatas
    if (data.duplicatas.length > 0) {
      doc.fontSize(5);
      let dupY = y + 10;
      for (const dup of data.duplicatas.slice(0, 6)) {
        doc.text(`${dup.nDup} - ${fmtData(dup.dVenc)} - R$ ${fmtMoney(dup.vDup)}`,
          MARGIN + halfW + 2, dupY, { width: restW - 4 });
        dupY += 8;
      }
    }

    return y + boxH;
  }

  // ─── HELPERS ───

  private drawField(
    doc: PDFKit.PDFDocument, label: string, value: string,
    x: number, y: number, w: number, h: number
  ): void {
    doc.rect(x, y, w, h).stroke();
    doc.font('Helvetica').fontSize(FONT_LABEL);
    doc.text(label, x + 2, y + 2, { width: w - 4 });
    doc.font('Helvetica-Bold').fontSize(FONT_VALUE);
    doc.text(value || '', x + 2, y + 10, { width: w - 4, lineBreak: false });
  }

  private drawBarcode(
    doc: PDFKit.PDFDocument, data: string,
    x: number, y: number, maxW: number, h: number
  ): void {
    const bars = gerarBarrasCode128(data);
    if (bars.length === 0) return;

    const barW = maxW / bars.length;

    for (let i = 0; i < bars.length; i++) {
      if (bars[i]) {
        doc.rect(x + i * barW, y, barW, h).fill('#000');
      }
    }
    doc.fillColor('#000');
  }

  private fmtDoc(v: string): string {
    if (!v) return '';
    const clean = v.replace(/\D/g, '');
    if (clean.length === 14) return fmtCNPJ(v);
    if (clean.length === 11) return fmtCPF(v);
    return v;
  }
}
