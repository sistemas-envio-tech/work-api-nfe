import { Router, type Request, type Response, type NextFunction, type Router as ExpressRouter } from 'express';
import { Buffer } from 'node:buffer';
import { CertificateManager } from '@acbr-node/core';

export const certificadoRouter: ExpressRouter = Router();

/**
 * POST /certificado/info — parseia o PFX e retorna dados reais do X509
 * (CN, CNPJ, validade efetiva, dias para vencer). Sem persistencia, stateless.
 */
async function Certificado_Info(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { pfxBase64, senha } = req.body as { pfxBase64?: string; senha?: string };
    if (!pfxBase64 || !senha) {
      res.status(400).json({ error: 'pfxBase64 e senha sao obrigatorios' });
      return;
    }
    const pfxBuffer = Buffer.from(pfxBase64, 'base64');
    const manager = new CertificateManager();
    const data = await manager.load({ pfxBuffer, password: senha });
    res.json({
      subject: data.info.subject,
      validFrom: data.info.validFrom,
      validTo: data.info.validTo,
      daysUntilExpiry: data.daysUntilExpiry,
      isExpired: data.isExpired,
      issuer: data.info.issuer ?? null,
      serialNumber: data.info.serialNumber ?? null,
    });
  } catch (err) { next(err); }
}

certificadoRouter.post('/info', Certificado_Info);
