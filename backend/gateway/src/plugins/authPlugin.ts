import { FastifyInstance } from 'fastify';
import jwt, { FastifyJWTOptions } from '@fastify/jwt';
import cors from '@fastify/cors' 






  
const jwt_config:FastifyJWTOptions = { secret: process.env.JWTSECRET || 'defaultsecret' };



export default async function registerPlugins(app: FastifyInstance) 
{
  app.register(cors, {
    origin: ['http://localhost:8080', 'http://localhost:9090'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ["Content-Type", "x-user-id"]
    });

  app.register(jwt, jwt_config);
}
  