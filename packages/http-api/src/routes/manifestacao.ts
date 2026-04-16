import { Router, type Request, type Response, type NextFunction, type Router as ExpressRouter } from 'express';
import type { TipoManifestacao } from '@acbr-node/nfe';
import { buildNFeClient, type NFeClientPayload } from '../factories/nfe-client-factory.js';

export const manifestacaoRouter: ExpressRouter = Router();

const TIPOS_VALIDOS: ReadonlySet<TipoManifestacao> = new Set([
  'confirmacao',
  'ciencia',
  'desconhecimento',
  'nao_realizada',
]);

const TIPOS_COM_JUSTIFICATIVA: ReadonlySet<TipoManifestacao> = new Set([
  'desconhecimento',
  'nao_realizada',
]);

const MIN_JUSTIFICATIVA = 15;

interface ManifestarPayload extends NFeClientPayload {
  chNFe: string;
  tipo: TipoManifestacao;
  xJust?: string;
}

interface ManifestarLotePayload extends NFeClientPayload {
  chaves: string[];
  tipo: TipoManifestacao;
  xJust?: string;
}

function validarPayload(tipo: TipoManifestacao, xJust: string | undefined): string | null {
  if (!TIPOS_VALIDOS.has(tipo)) return `tipo invalido: ${tipo}`;
  if (TIPOS_COM_JUSTIFICATIVA.has(tipo)) {
    if (!xJust || xJust.trim().length < MIN_JUSTIFICATIVA) {
      return `xJust obrigatoria (min ${MIN_JUSTIFICATIVA} chars) para tipo ${tipo}`;
    }
  }
  return null;
}

async function Manifestacao_Enviar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body as ManifestarPayload;
    if (!payload.chNFe || payload.chNFe.length !== 44) {
      res.status(400).json({ error: 'chNFe (44 digitos) obrigatoria' });
      return;
    }
    const erro = validarPayload(payload.tipo, payload.xJust);
    if (erro) { res.status(400).json({ error: erro }); return; }

    const client = await buildNFeClient(payload);
    const retorno = await client.manifestarDestinatario({
      chNFe: payload.chNFe,
      tipo: payload.tipo,
      xJust: payload.xJust?.trim(),
    });

    res.json({
      operacao: 'Manifestacao_Enviar',
      tipo: payload.tipo,
      chNFe: retorno.chNFe,
      cStat: retorno.cStat,
      xMotivo: retorno.xMotivo,
      nProt: retorno.nProt,
      dhRegEvento: retorno.dhRegEvento,
      tpEvento: retorno.tpEvento,
      nSeqEvento: retorno.nSeqEvento,
    });
  } catch (err) { next(err); }
}

async function Manifestacao_EnviarLote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body as ManifestarLotePayload;
    if (!Array.isArray(payload.chaves) || payload.chaves.length === 0) {
      res.status(400).json({ error: 'chaves (array) obrigatorio' });
      return;
    }
    const erro = validarPayload(payload.tipo, payload.xJust);
    if (erro) { res.status(400).json({ error: erro }); return; }

    const client = await buildNFeClient(payload);
    const xJust = payload.xJust?.trim();

    const resultados: Array<{
      chNFe: string;
      cStat?: string;
      xMotivo?: string;
      nProt?: string;
      dhRegEvento?: string;
      erro?: string;
    }> = [];
    let sucesso = 0;
    let falha = 0;

    const aceitosNaSefaz = new Set(['135', '136', '573']);

    for (const chNFe of payload.chaves) {
      if (!chNFe || chNFe.length !== 44) {
        falha++;
        resultados.push({ chNFe, erro: 'chNFe invalida' });
        continue;
      }
      try {
        const retorno = await client.manifestarDestinatario({ chNFe, tipo: payload.tipo, xJust });
        if (aceitosNaSefaz.has(retorno.cStat)) sucesso++;
        else falha++;
        resultados.push({
          chNFe: retorno.chNFe,
          cStat: retorno.cStat,
          xMotivo: retorno.xMotivo,
          nProt: retorno.nProt,
          dhRegEvento: retorno.dhRegEvento,
        });
      } catch (err) {
        falha++;
        resultados.push({ chNFe, erro: err instanceof Error ? err.message : String(err) });
      }
    }

    res.json({
      operacao: 'Manifestacao_EnviarLote',
      tipo: payload.tipo,
      total: payload.chaves.length,
      sucesso,
      falha,
      resultados,
    });
  } catch (err) { next(err); }
}

manifestacaoRouter.post('/enviar', Manifestacao_Enviar);
manifestacaoRouter.post('/enviar-lote', Manifestacao_EnviarLote);
