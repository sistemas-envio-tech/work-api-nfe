import { Router, type Request, type Response, type NextFunction, type Router as ExpressRouter } from 'express';
import { buildNFeClient, type NFeClientPayload } from '../factories/nfe-client-factory.js';

export const cartaCorrecaoRouter: ExpressRouter = Router();

/**
 * POST /carta-correcao/enviar — Carta de Correcao Eletronica (CC-e, tpEvento=110110).
 *
 * Wrapper HTTP sobre `NFeClient.cartaCorrecao()`. CC-e permite corrigir
 * informacoes da NF-e ja autorizada que NAO alterem valores, quantidades,
 * partes (emit/dest), data de emissao ou dados de tributacao. Limite de 20
 * CC-e por NF-e (nSeqEvento 1..20); apenas a ultima eh considerada vigente.
 *
 * Leiaute SEFAZ:
 *   - chNFe: 44 digitos
 *   - xCorrecao: texto da correcao (15-1000 chars)
 *   - nSeqEvento: 1..20 (cliente controla a sequencia)
 */
interface CartaCorrecaoPayload extends NFeClientPayload {
  chNFe: string;
  xCorrecao: string;
  nSeqEvento: number;
}

const MIN_CORRECAO = 15;
const MAX_CORRECAO = 1000;
const MAX_SEQ_EVENTO = 20;

async function CartaCorrecao_Enviar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body as CartaCorrecaoPayload;

    if (!payload?.chNFe || payload.chNFe.length !== 44) {
      res.status(400).json({ error: 'chNFe (44 digitos) obrigatoria' });
      return;
    }
    const xCorrecao = payload.xCorrecao?.trim() ?? '';
    if (xCorrecao.length < MIN_CORRECAO || xCorrecao.length > MAX_CORRECAO) {
      res.status(400).json({
        error: `xCorrecao deve ter entre ${MIN_CORRECAO} e ${MAX_CORRECAO} caracteres`,
      });
      return;
    }
    if (!Number.isInteger(payload.nSeqEvento) || payload.nSeqEvento < 1 || payload.nSeqEvento > MAX_SEQ_EVENTO) {
      res.status(400).json({
        error: `nSeqEvento deve ser inteiro entre 1 e ${MAX_SEQ_EVENTO}`,
      });
      return;
    }

    const client = await buildNFeClient(payload);
    const retorno = await client.cartaCorrecao({
      chNFe: payload.chNFe,
      xCorrecao,
      nSeqEvento: payload.nSeqEvento,
    });

    res.json({
      operacao: 'CartaCorrecao_Enviar',
      tpAmb: retorno.tpAmb,
      verAplic: retorno.verAplic,
      cOrgao: retorno.cOrgao,
      cStat: retorno.cStat,
      xMotivo: retorno.xMotivo,
      chNFe: retorno.chNFe,
      tpEvento: retorno.tpEvento,
      xEvento: retorno.xEvento,
      nSeqEvento: retorno.nSeqEvento,
      dhRegEvento: retorno.dhRegEvento,
      nProt: retorno.nProt,
    });
  } catch (err) { next(err); }
}

cartaCorrecaoRouter.post('/enviar', CartaCorrecao_Enviar);
