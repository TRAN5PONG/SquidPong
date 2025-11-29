import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import fastifyStatic from '@fastify/static';
import path from 'path';

export default async function registerPlugins(app:FastifyInstance) 
{
  app.register(swagger, {
      swagger: {
          info: {
              title: 'Chat Service API',
              version: '1.0.0'
          },
          tags: [
              { name: 'chat', description: 'Chat endpoints' },
              { name: 'group', description: 'Group chat endpoints' },
              { name: 'poll', description: 'Poll endpoints' },
              { name: 'reaction', description: 'Reaction endpoints' }
          ]
      }
  });

  app.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
  attachFieldsToBody: true,
  });


    app.register(fastifyStatic, {
    root: path.join(process.cwd(), 'uploads', 'avatar'),
    prefix: "/api/group/avatars/",
    decorateReply: false,
  });


}