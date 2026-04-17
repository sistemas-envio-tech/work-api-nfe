import { Router, type Request, type Response, type NextFunction, type Router as ExpressRouter } from 'express';
import { buildNFeClient, type NFeClientPayload } from '../factories/nfe-client-factory.js';

export const consultaNfeRouter: ExpressRouter = Router();

interface DistribuicaoPayload extends NFeClientPayload {
  ultNSU?: string;
  NSU?: string;
  chNFe?: string;
}

async function ConsultaNFE_StatusServico(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body as NFeClientPayload;
    const client = await buildNFeClient(payload);
    const retorno = await client.statusServico();
    res.json({ operacao: 'ConsultaNFE_StatusServico', ...retorno });
  } catch (err) { next(err); }
}

async function ConsultaNFE_DistribuicaoDFe_PorUltNSU(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body as DistribuicaoPayload;
    const ultNSU = (payload.ultNSU ?? '0').padStart(15, '0');

    const client = await buildNFeClient(payload);
    const retorno = await client.distribuicaoDFe({ ultNSU });

    res.json({
      operacao: 'ConsultaNFE_DistribuicaoDFe_PorUltNSU',
      cStat: retorno.cStat,
      xMotivo: retorno.xMotivo,
      tpAmb: retorno.tpAmb,
      ultNSU: retorno.ultNSU,
      maxNSU: retorno.maxNSU,
      dhResp: retorno.dhResp,
      docs: retorno.docs,
    });
  } catch (err) { next(err); }
}

async function ConsultaNFE_DistribuicaoDFe_PorChaveAcesso(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body as DistribuicaoPayload;
    if (!payload.chNFe || payload.chNFe.length !== 44) {
      res.status(400).json({ error: 'chNFe (44 digitos) obrigatoria' });
      return;
    }

    const client = await buildNFeClient(payload);
    const retorno = await client.distribuicaoDFe({ chNFe: payload.chNFe });

    res.json({
      operacao: 'ConsultaNFE_DistribuicaoDFe_PorChaveAcesso',
      cStat: retorno.cStat,
      xMotivo: retorno.xMotivo,
      tpAmb: retorno.tpAmb,
      ultNSU: retorno.ultNSU,
      maxNSU: retorno.maxNSU,
      dhResp: retorno.dhResp,
      docs: retorno.docs,
    });
  } catch (err) { next(err); }
}

consultaNfeRouter.post('/status-servico', ConsultaNFE_StatusServico);
consultaNfeRouter.post('/distribuicao-dfe-por-ult-nsu', ConsultaNFE_DistribuicaoDFe_PorUltNSU);
consultaNfeRouter.post('/distribuicao-dfe-por-chave-acesso', ConsultaNFE_DistribuicaoDFe_PorChaveAcesso);
