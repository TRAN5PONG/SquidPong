import { FastifyInstance , FastifyRequest, FastifyReply } from 'fastify'
import fastifyHttpProxy, { FastifyHttpProxyOptions } from '@fastify/http-proxy';
import fastifySwagger , {FastifySwaggerOptions} from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';



async function buildProxyOptions(service:string , port : number , proxyPath : string) : Promise<FastifyHttpProxyOptions>
{

  const option:FastifyHttpProxyOptions  = {
  upstream: `http://${service}:${port}`,
  prefix: `${proxyPath}`,
  rewritePrefix: `${proxyPath}`,
  http2: false,

  preHandler: async (req:FastifyRequest, res:FastifyReply) => { req.headers['x-user-id'] = req.id; },
  }

  return option;
}



const swaggerConfig  = {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Test swagger',
        description: 'Testing the Fastify swagger API',
        version: '0.1.0'
      },
      servers: [
        {
          url: 'http://localhost:4000',
        }
      ],
    }
  }


export default async function registerProxy(app: FastifyInstance)
{

  app.register(fastifySwagger, swaggerConfig)
  app.register(fastifySwaggerUi, { routePrefix: '/api/auth/docs', });
  
  app.register(fastifyHttpProxy, await buildProxyOptions('user' , 4001 , '/api/user'));
  app.register(fastifyHttpProxy, await buildProxyOptions('auth' , 4444 , '/api/auth'));
  app.register(fastifyHttpProxy, await buildProxyOptions('auth' , 4444 , '/api/2fa'));
  app.register(fastifyHttpProxy, await buildProxyOptions('user' , 4001 , '/api/friend'));
  app.register(fastifyHttpProxy, await buildProxyOptions('user' , 4001 , '/api/blocked'));
  app.register(fastifyHttpProxy, await buildProxyOptions('game' , 3000 , '/api/game'));
  app.register(fastifyHttpProxy, await buildProxyOptions('game' , 3000 , '/api/room'));

}
