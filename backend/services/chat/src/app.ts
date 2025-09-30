import { fastify, FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import registerPlugins from './plugins/plugins';

import {chatRoutes , groupRoutes , pollRoutes , reactionRoutes } from './routes/chat';


const app: FastifyInstance = fastify();
export default app;


registerPlugins(app);


app.register(async () => {chatRoutes.forEach(route => app.route(route))});
app.register(async () => {groupRoutes.forEach(route => app.route(route))});
app.register(async () => {pollRoutes.forEach(route => app.route(route))});
app.register(async () => {reactionRoutes.forEach(route => app.route(route))});



// Add Swagger JSON documentation endpoint
app.get('/api/chat/docs', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log("Swagger JSON requested");
  return app.swagger();
});



