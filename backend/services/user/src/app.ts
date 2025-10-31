import {fastify , FastifyInstance} from 'fastify';
import {userRoutes , friendRoutes} from './routes/user.routes';
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

const routes = [...userRoutes , ...friendRoutes]

app.register(async () => {routes.forEach(route => app.route(route))});

app.setErrorHandler(errorHandler)
