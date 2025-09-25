import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';

export default async function registerPlugins(app:FastifyInstance) 
{
    app.register(multipart, {
    limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
    fields: 10,
  },
  attachFieldsToBody: true,
  });




  app.register(fastifyStatic, {
    root: '/chat/uploads/group',
    prefix: "/api/group/avatars/",
    decorateReply: false,
  });


}