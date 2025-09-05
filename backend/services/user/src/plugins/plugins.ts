import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';



export default async function registerPlugins(app:FastifyInstance) 
{


app.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Test swagger',
        description: 'Testing the Fastify swagger API',
        version: '1.0.0'
      },
      servers: [
        {
          url: 'http://localhost:4001',
        }
      ],
    }
  })


app.register(fastifySwaggerUi, { routePrefix: '/api/user/docs', });


  app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
    fields: 5
  },
  attachFieldsToBody: true,
  });



}