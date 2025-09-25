import { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors' 



const session_option = {
    secret: 'this_is_a_very_long_secret_key_that_is_secure',
    cookie: {
    secure: true,
    maxAge: 1000 * 60 * 10,
    },
    saveUninitialized: false,
  }


  
const jwt_config:any = {
    secret: process.env.JWTSECRET
  }




  export default async function registerPlugins(app: FastifyInstance) {
    app.register(cors, {
        origin: ['http://localhost:8080', 'http://localhost:5173' , 'http://localhost:9090'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ["Content-Type", "x-user-id"]
      });

     app.register(cookie);
     app.register(session, session_option);
     app.register(jwt, jwt_config);

  }
  