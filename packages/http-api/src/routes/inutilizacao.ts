import { Router, type Request, type Response, type NextFunction, type Router as ExpressRouter } from 'express';
import { buildNFeClient, type NFeClientPayload } from '../factories/nfe-client-factory.js';

export const inutilizacaoRouter: ExpressRouter = Router();

/**
 * POST /inutilizacao/enviar — Inutilizacao de faixa de numeracao da NF-e.
 *
 * Wrapper HTTP sobre `NFeClient.inutilizar()`. Usado quando ha quebra de
 * sequencia na numeracao (ex.: nNF 1..50 emitidos, nNF 51..60 nao usados
 * por erro, dispara inutilizacao da faixa). Resposta cStat esperada: 102.
 *
 * Leiaute SEFAZ (campos obrigatorios):
 *   - ano: ultimos 2 digitos do ano (ex.: 26 para 2026)
 *   - serie: 0..999
 *   - nNFIni / nNFFin: 1..999999999, com nNFFin >= nNFIni
 *   - xJust: 15..255 chars
 */
interface InutilizacaoPayload extends NFeClientPayload {
  ano: number;
  serie: number;
  nNFIni: number;
  nNFFin: number;
  xJust: string;
}

const MIN_JUSTIFICATIVA = 15;
const MAX_JUSTIFICATIVA = 255;

async function Inutilizacao_Enviar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body as InutilizacaoPayload;

    if (!Number.isInteger(payload?.ano) || payload.ano < 0 || payload.ano > 99) {
      res.status(400).json({ error: 'ano deve ser inteiro 0..99 (ultimos 2 digitos)' });
      return;
    }
    if (!Number.isInteger(payload.serie) || payload.serie < 0 || payload.serie > 999) {
      res.status(400).json({ error: 'serie deve ser inteiro 0..999' });
      return;
    }
    if (!Number.isInteger(payload.nNFIni) || payload.nNFIni < 1) {
      res.status(400).json({ error: 'nNFIni deve ser inteiro positivo' });
      return;
    }
    if (!Number.isInteger(payload.nNFFin) || payload.nNFFin < payload.nNFIni) {
      res.status(400).json({ error: 'nNFFin deve ser inteiro >= nNFIni' });
      return;
    }
    const xJust = payload.xJust?.trim() ?? '';
    if (xJust.length < MIN_JUSTIFICATIVA || xJust.length > MAX_JUSTIFICATIVA) {
      res.status(400).json({
        error: `xJust deve ter entre ${MIN_JUSTIFICATIVA} e ${MAX_JUSTIFICATIVA} caracteres`,
      });
      return;
    }

    const client = await buildNFeClient(payload);
    const retorno = await client.inutilizar({
      ano: payload.ano,
      serie: payload.serie,
      nNFIni: payload.nNFIni,
      nNFFin: payload.nNFFin,
      xJust,
    });

    res.json({
      operacao: 'Inutilizacao_Enviar',
      tpAmb: retorno.tpAmb,
      verAplic: retorno.verAplic,
      cStat: retorno.cStat,
      xMotivo: retorno.xMotivo,
      cUF: retorno.cUF,
      ano: retorno.ano,
      CNPJ: retorno.CNPJ,
      mod: retorno.mod,
      serie: retorno.serie,
      nNFIni: retorno.nNFIni,
      nNFFin: retorno.nNFFin,
      dhRecbto: retorno.dhRecbto,
      nProt: retorno.nProt,
    });
  } catch (err) { next(err); }
}

inutilizacaoRouter.post('/enviar', Inutilizacao_Enviar);
