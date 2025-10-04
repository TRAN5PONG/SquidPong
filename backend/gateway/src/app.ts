import { fastify, FastifyInstance } from 'fastify';
import { authenticateUser } from './validators/middleware';
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

app.addHook('onRequest', authenticateUser);
app.addHook('onError', errorHandler);
