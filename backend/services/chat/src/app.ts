import { fastify, FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import registerPlugins from './plugins/plugins';
import { errorHandler } from './utils/errorHandler';

import {chatRoutes , groupRoutes  , messageRoutes } from './routes/chat.routes';


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


app.register(async () => {chatRoutes.forEach(route => app.route(route))});
app.register(async () => {groupRoutes.forEach(route => app.route(route))});
app.register(async () => {messageRoutes.forEach(route => app.route(route))});


app.get('/api/chat/health', async (req:any, res:any) => {
  return { status: 'auth service is healthy' };
})


