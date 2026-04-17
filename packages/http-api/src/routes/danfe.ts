import { Router, type Request, type Response, type NextFunction, type Router as ExpressRouter } from 'express';
import { DanfeGenerator } from '@acbr-node/danfe';

export const danfeRouter: ExpressRouter = Router();

const generator = new DanfeGenerator();

async function Danfe_Gerar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { xml } = req.body as { xml?: string };
    if (!xml || typeof xml !== 'string' || xml.length < 100) {
      res.status(400).json({ error: 'xml (procNFe/NFe autorizada) obrigatorio' });
      return;
    }
    const pdf = await generator.gerarDanfe(xml);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(pdf.length));
    res.send(pdf);
  } catch (err) { next(err); }
}

danfeRouter.post('/gerar', Danfe_Gerar);
