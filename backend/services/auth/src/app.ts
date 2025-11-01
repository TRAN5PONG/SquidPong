import { fastify, FastifyInstance } from 'fastify';
import { authRoutes , twofaRoutes } from './routes/auth.routes';
import { errorHandler } from './utils/errorHandler';
import registerPlugins from './plugins/plugins';


const app: FastifyInstance = fastify({
  ajv: {
    customOptions: {
      removeAdditional: false // Fix: Don't remove extra properties, throw errors instead
    }
  }
});
export default app;


registerPlugins(app);

app.setErrorHandler(errorHandler);

app.get('/api/auth/health', async (req:any, res:any) => {
  return { status: 'auth service is healthy' };
})

app.register(async () => {authRoutes.forEach(route => app.route(route))});
app.register(async () => { twofaRoutes.forEach(route => app.route(route)); });