import { Router, type Request, type Response, type NextFunction, type Router as ExpressRouter } from 'express';
import { DanfeGenerator, DanfceGenerator, extractDanfeData } from '@acbr-node/danfe';

export const danfeRouter: ExpressRouter = Router();

const danfeGen = new DanfeGenerator();
const danfceGen = new DanfceGenerator();

/**
 * POST /danfe/gerar — Gera o documento auxiliar (DANFE ou DANFCe) a partir do XML.
 *
 * Auto-detecta modelo:
 *   - NFe (mod=55): DANFE A4 tradicional
 *   - NFCe (mod=65): DANFCe cupom 80mm com QR Code
 *
 * Detecao via presenca de <infNFeSupl> no XML (so NFCe tem) ou via mod no XML.
 * Aceita override explicito via { xml, modelo: 55 | 65 } no body.
 */
async function Danfe_Gerar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { xml, modelo, mensagemRodape } = req.body as {
      xml?: string;
      modelo?: 55 | 65;
      mensagemRodape?: string;
    };
    if (!xml || typeof xml !== 'string' || xml.length < 100) {
      res.status(400).json({ error: 'xml (procNFe/NFe autorizada) obrigatorio' });
      return;
    }

    // Determinar modelo: override explicito > infNFeSupl presente > ide.mod parseado
    const usarNFCe = modelo === 65
      || (modelo === undefined && (xml.includes('<infNFeSupl>') || detectarModeloNoXml(xml) === 65));

    let pdf: Buffer;
    if (usarNFCe) {
      pdf = await danfceGen.gerarDanfce(xml, { mensagemRodape });
    } else {
      pdf = await danfeGen.gerarDanfe(xml);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(pdf.length));
    res.send(pdf);
  } catch (err) { next(err); }
}

/** Best-effort: extrai dados e checa data.mod. Caro porque parseia XML inteiro. */
function detectarModeloNoXml(xml: string): 55 | 65 | undefined {
  try {
    const data = extractDanfeData(xml);
    if (data.mod === '65') return 65;
    if (data.mod === '55') return 55;
    return undefined;
  } catch {
    return undefined;
  }
}

danfeRouter.post('/gerar', Danfe_Gerar);
