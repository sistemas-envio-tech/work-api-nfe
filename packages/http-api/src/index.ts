import { env } from './config/env.js';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/error-handler.js';
import { healthRouter } from './routes/health.js';
import { consultaNfeRouter } from './routes/consulta-nfe.js';
import { manifestacaoRouter } from './routes/manifestacao.js';
import { danfeRouter } from './routes/danfe.js';
import { certificadoRouter } from './routes/certificado.js';

const app: Express = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '10mb' }));
app.use(authMiddleware);

app.use('/health', healthRouter);
app.use('/consulta-nfe', consultaNfeRouter);
app.use('/manifestacao', manifestacaoRouter);
app.use('/danfe', danfeRouter);
app.use('/certificado', certificadoRouter);

app.use(errorHandler);

app.listen(env.port, env.host, () => {
  console.log(`[http-api] listening on http://${env.host}:${env.port}`);
});

export default app;
