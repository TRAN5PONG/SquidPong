import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';

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

}