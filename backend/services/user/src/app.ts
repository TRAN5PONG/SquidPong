import {fastify , FastifyInstance} from 'fastify';
import {userRoutes , friendRoutes} from './routes/user.routes';
import { errorHandler } from './utils/errorHandler';
import registerPlugins from './plugins/plugins'
import prisma from './db/database'

const app: FastifyInstance = fastify();


export default app;

registerPlugins(app);

const routes = [...userRoutes , ...friendRoutes]

app.register(async (instance : FastifyInstance) => {
  routes.forEach(route => instance.route(route));
});

app.setErrorHandler(errorHandler);