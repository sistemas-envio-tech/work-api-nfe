import { Router, type Request, type Response, type NextFunction, type Router as ExpressRouter } from 'express';
import { buildNFeClient, type NFeClientPayload } from '../factories/nfe-client-factory.js';

export const cancelamentoRouter: ExpressRouter = Router();

/**
 * POST /cancelamento/enviar — Cancelamento de NF-e via evento (tpEvento=110111).
 *
 * Wrapper HTTP sobre `NFeClient.cancelarNFe()`. SEFAZ aceita cancelamento ate
 * 24h apos autorizacao (algumas UFs ate 168h em homologacao). Resposta cStat
 * esperada: 135 (evento registrado e vinculado) ou 136 (registrado mas nao
 * vinculado, geralmente lote sem confirmacao).
 *
 * Leiaute SEFAZ (campos obrigatorios):
 *   - chNFe: 44 digitos da chave de acesso
 *   - nProt: numero do protocolo de autorizacao (15 digitos)
 *   - xJust: justificativa do cancelamento (15-255 chars)
 */
interface CancelarPayload extends NFeClientPayload {
  chNFe: string;
  nProt: string;
  xJust: string;
}

const MIN_JUSTIFICATIVA = 15;
const MAX_JUSTIFICATIVA = 255;

async function Cancelamento_Enviar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body as CancelarPayload;

    if (!payload?.chNFe || payload.chNFe.length !== 44) {
      res.status(400).json({ error: 'chNFe (44 digitos) obrigatoria' });
      return;
    }
    if (!payload.nProt || payload.nProt.trim().length === 0) {
      res.status(400).json({ error: 'nProt (protocolo de autorizacao) obrigatorio' });
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
    const retorno = await client.cancelarNFe({
      chNFe: payload.chNFe,
      nProt: payload.nProt.trim(),
      xJust,
    });

    res.json({
      operacao: 'Cancelamento_Enviar',
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

cancelamentoRouter.post('/enviar', Cancelamento_Enviar);
