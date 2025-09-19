import { fastify, FastifyInstance } from 'fastify';
import registerPlugins from './plugins/plugins';
import { chatRoutes } from './routes/auth';

const app: FastifyInstance = fastify();
export default app;


registerPlugins(app);

app.register(async () => {chatRoutes.forEach(route => app.route(route))});





