import { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import auth2 from '@fastify/oauth2';
import session from '@fastify/session';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors' 
import fastifyStatic from '@fastify/static';



const auth2_config:any = {
  name: 'googleOAuth2',
  scope: ['profile', 'email'],
  credentials: {
    client: {
      id: process.env.ID,
      secret: process.env.SECRET
    },
    auth: {
      authorizeHost: 'https://accounts.google.com',
      authorizePath: '/o/oauth2/v2/auth',
      tokenHost: 'https://oauth2.googleapis.com',
      tokenPath: '/token'
    }
  },
  startRedirectPath: '/api/auth/google',
  callbackUri: `${process.env.URL}/api/auth/google/callback`
}
  

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

     app.register(cookie);
     app.register(session, session_option);
     app.register(jwt, jwt_config);
     app.register(auth2, auth2_config);
  }
  