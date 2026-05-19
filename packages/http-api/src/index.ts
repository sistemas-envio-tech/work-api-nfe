import { env } from './config/env.js';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { appLogger } from './logging/app-logger.js';
import { authMiddleware } from './middleware/auth.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { errorHandler } from './middleware/error-handler.js';
import { healthRouter } from './routes/health.js';
import { consultaNfeRouter } from './routes/consulta-nfe.js';
import { manifestacaoRouter } from './routes/manifestacao.js';
import { autorizacaoRouter } from './routes/autorizacao.js';
import { cancelamentoRouter } from './routes/cancelamento.js';
import { cartaCorrecaoRouter } from './routes/carta-correcao.js';
import { inutilizacaoRouter } from './routes/inutilizacao.js';
import { danfeRouter } from './routes/danfe.js';
import { certificadoRouter } from './routes/certificado.js';

// Startup warnings (movidos de config/env.ts para usar o logger com prefixo).
if (env.insecureTls) {
  appLogger.warn('NFE_API_INSECURE_TLS=true — verificacao da cadeia TLS desabilitada (INSEGURO em producao)');
}
if (!env.internalToken) {
  appLogger.warn('INTERNAL_TOKEN nao definido — usando fallback (INSEGURO em producao)');
}

const app: Express = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '10mb' }));
app.use(requestIdMiddleware);
app.use(authMiddleware);

app.use('/health', healthRouter);
app.use('/consulta-nfe', consultaNfeRouter);
app.use('/manifestacao', manifestacaoRouter);
app.use('/autorizacao', autorizacaoRouter);
app.use('/cancelamento', cancelamentoRouter);
app.use('/carta-correcao', cartaCorrecaoRouter);
app.use('/inutilizacao', inutilizacaoRouter);
app.use('/danfe', danfeRouter);
app.use('/certificado', certificadoRouter);

app.use(errorHandler);

app.listen(env.port, env.host, () => {
  appLogger.info(`listening on http://${env.host}:${env.port}`);
});

export default app;
