import {fastify , FastifyInstance} from 'fastify';
import notifyRoutes from './routes/notify.routes';
import { errorHandler } from './utils/errorHandler';
import registerPlugins from './plugins/plugins'
import prisma from './db/database'

const app: FastifyInstance = fastify({
  ajv: {
    customOptions: {
      removeAdditional: false // Fix: Don't remove extra properties, throw errors instead
    }
  }
});
export default app;

registerPlugins(app);

const routes = [...notifyRoutes]

routes.forEach(route => {app.route(route)})
app.setErrorHandler(errorHandler)




