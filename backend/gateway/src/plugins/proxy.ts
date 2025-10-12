import { FastifyInstance , FastifyRequest, FastifyReply } from 'fastify'
import fastifyHttpProxy from '@fastify/http-proxy'

interface ServiceConfig {
  name: string;
  prefix: string;
  upstream: string;
}


const services : ServiceConfig[]  = 
[
    { name: 'auth', prefix: '/api/auth', upstream: 'http://auth:4001' },
    { name: 'auth-2fa', prefix: '/api/2fa', upstream: 'http://auth:4001' },
    { name: 'user', prefix: '/api/user', upstream: 'http://user:4002' },
    { name: 'friend', prefix: '/api/friend', upstream: 'http://user:4002' },
    { name: 'blocked', prefix: '/api/blocked', upstream: 'http://user:4002' },
    { name: 'chat',  prefix: '/api/chat', upstream: 'http://chat:4003' },
    { name: 'group',  prefix: '/api/group', upstream: 'http://chat:4003' },
    // { name: 'game', prefix: '/api/game', upstream: 'http://game:4005' },
    // { name: 'room', prefix: '/api/room', upstream: 'http://game:4005' }
];



export default async function registerProxy(app: FastifyInstance)
{
  for (const service of services) 
    {
    try 
    {
      app.register(fastifyHttpProxy, {
        upstream: service.upstream,
        prefix: service.prefix,
        rewritePrefix: service.prefix,
        http2: false,

        preHandler: async (req: FastifyRequest, reply: FastifyReply) => {
          req.headers['x-user-id'] = req.id;
        },
      });
      
      console.log(`✅ Proxy registered for ${service.name} at ${service.upstream}`);
    } 
    catch (error) {
      console.error(`❌ Failed to register proxy for ${service.name}:`, error);
    }
  }


}
