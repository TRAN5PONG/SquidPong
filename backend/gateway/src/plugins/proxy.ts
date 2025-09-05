import { FastifyInstance , FastifyRequest, FastifyReply } from 'fastify'
import fastifyHttpProxy from '@fastify/http-proxy'
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

export default async function registerProxy(app: FastifyInstance)
{



app.register(fastifySwagger, {
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
  })


app.register(fastifySwaggerUi, { routePrefix: '/api/auth/docs', });


app.register(fastifyHttpProxy, {

  upstream: 'http://user:4001',
  prefix: '/api/user',
  rewritePrefix: '/api/user',
  http2: false,

  preHandler: async (req:any, reply:any) => {
    req.headers['x-user-id'] = req.id;
  },

}
);


app.register(fastifyHttpProxy, {

  upstream: 'http://auth:4444',
  prefix: '/api/auth',
  rewritePrefix: '/api/auth',
  http2: false,

  preHandler: async (req:any, reply:any) => {
    req.headers['x-user-id'] = req.id;
  },

}
);




app.register(fastifyHttpProxy, {

  upstream: 'http://user:4001',
  prefix: '/api/friend',
  rewritePrefix: '/api/friend',
  http2: false,

  preHandler: async (req:any, reply:any) => {
    req.headers['x-user-id'] = req.id;
  },

}
);


app.register(fastifyHttpProxy, {

  upstream: 'http://user:4001',
  prefix: '/api/blocked',
  rewritePrefix: '/api/blocked',
  http2: false,

  preHandler: async (req:any, reply:any) => {
    req.headers['x-user-id'] = req.id;
  },

}
);


app.register(fastifyHttpProxy, {

  upstream: 'http://game:3000',
  prefix: '/api/game',
  rewritePrefix: '/api/game',
  http2: false,

  preHandler: async (req:any, reply:any) => {
    req.headers['x-user-id'] = req.id;
  },

}
);



app.register(fastifyHttpProxy, {

  upstream: 'http://game:3000',
  prefix: '/api/room',
  rewritePrefix: '/api/room',
  http2: false,

  preHandler: async (req:any, reply:any) => {
    req.headers['x-user-id'] = req.id;
  },

}
);


}
