import { fastify, FastifyInstance } from 'fastify';
import registerPlugins from './plugins/plugins';

import {chatRoutes , groupRoutes , pollRoutes , attachmentRoutes} from './routes/chat';


const app: FastifyInstance = fastify();
export default app;


registerPlugins(app);


app.register(async () => {chatRoutes.forEach(route => app.route(route))});
app.register(async () => {groupRoutes.forEach(route => app.route(route))});
app.register(async () => {pollRoutes.forEach(route => app.route(route))});
app.register(async () => {attachmentRoutes.forEach(route => app.route(route))});




