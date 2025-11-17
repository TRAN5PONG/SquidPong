import { fastify, FastifyInstance } from 'fastify';
import registerPlugins from './plugins/plugins';
import { errorHandler } from './utils/errorHandler';
import { tournamentRoutes } from './routes/tournamentRoutes';

const app: FastifyInstance = fastify({
  ajv: {
    customOptions: {
      removeAdditional: false,
    },
  },
});

export default app;

registerPlugins(app);

app.setErrorHandler(errorHandler);


app.register(async () => {tournamentRoutes.forEach(route => app.route(route as any));});



app.get('/api/tournament/health', async (req: any, res: any) => {
  return { status: 'tournament service is healthy' };
});
