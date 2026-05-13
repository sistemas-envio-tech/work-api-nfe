import { Router, type Request, type Response, type NextFunction, type Router as ExpressRouter } from 'express';
import type { NFe } from '@acbr-node/nfe';
import { buildNFeClient, type NFeClientPayload } from '../factories/nfe-client-factory.js';

export const autorizacaoRouter: ExpressRouter = Router();

/**
 * POST /autorizacao/enviar — Emissao de NF-e modelo 55 (autorizacao SEFAZ).
 *
 * Wrapper HTTP sobre `NFeClient.autorizarNFe()`. O cliente do work-manager
 * (`nfe-api-client.ts`) chama esta rota passando o certificado (PFX base64
 * + senha), os dados da empresa emitente e o objeto NFe ja montado (todos
 * os grupos do leiaute 4.00: ide, emit, dest, det[], total, transp, pag,
 * infAdic). Resposta carrega chave, protocolo, status SEFAZ e XML
 * autorizado (nfeProc) quando cStat=100.
 *
 * Modo sincrono (default): SEFAZ devolve resultado na mesma requisicao.
 * Modo assincrono (sincrono=false): SEFAZ devolve recibo e o cliente
 * (NFeClient.consultarRecibo) faz polling automatico ate ter resposta.
 *
 * Validacoes de input minimas (estrutura completa eh validada pelo
 * validateNFe interno do @acbr-node/nfe, via Zod + regras de negocio):
 *   - certificado (pfxBase64 + senha) obrigatorio
 *   - cnpj/uf/ambiente obrigatorios (mesma validação de buildNFeClient)
 *   - nfe.ide + nfe.emit + nfe.det[] minimo nao-vazio
 */
interface AutorizarPayload extends NFeClientPayload {
  /** Objeto NFe completo conforme @acbr-node/nfe/types/nfe.ts (interface NFe). */
  nfe: NFe;
  /** true (default) = aguarda resposta SEFAZ; false = recibo + polling. */
  sincrono?: boolean;
}

async function Autorizacao_Enviar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body as AutorizarPayload;

    // Validacoes minimas antes de construir o client (que ja valida cert).
    if (!payload?.nfe) {
      res.status(400).json({ error: 'nfe obrigatoria (objeto com ide/emit/det[])' });
      return;
    }
    if (!payload.nfe.ide || !payload.nfe.emit) {
      res.status(400).json({ error: 'nfe.ide e nfe.emit obrigatorios' });
      return;
    }
    if (!Array.isArray(payload.nfe.det) || payload.nfe.det.length === 0) {
      res.status(400).json({ error: 'nfe.det (itens) obrigatorio e nao-vazio' });
      return;
    }

    const client = await buildNFeClient(payload);
    const sincrono = payload.sincrono !== false;
    const retorno = await client.autorizarNFe(payload.nfe, sincrono);

    res.json({
      operacao: 'Autorizacao_Enviar',
      sincrono,
      tpAmb: retorno.tpAmb,
      verAplic: retorno.verAplic,
      cStat: retorno.cStat,
      xMotivo: retorno.xMotivo,
      cUF: retorno.cUF,
      dhRecbto: retorno.dhRecbto,
      // Modo sincrono (autorizado): protocolo + XML nfeProc.
      protNFe: retorno.protNFe,
      xmlAutorizado: retorno.xmlAutorizado,
      // Modo assincrono: recibo (cliente nao chegou a fazer polling automatico,
      // chamador pode consultar depois).
      nRec: retorno.nRec,
    });
  } catch (err) { next(err); }
}

autorizacaoRouter.post('/enviar', Autorizacao_Enviar);
