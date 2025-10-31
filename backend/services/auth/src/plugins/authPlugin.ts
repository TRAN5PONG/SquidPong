import { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import auth2 from '@fastify/oauth2';
import jwt from '@fastify/jwt';


const auth2_config:any = {
  name: 'googleOAuth2',
  scope: ['profile', 'email'],
  credentials: {
    client: {
      id: process.env.GOOGLE_CLIENT_ID,
      secret: process.env.GOOGLE_CLIENT_SECRET
    },
    auth: {
      authorizeHost: 'https://accounts.google.com',
      authorizePath: '/o/oauth2/v2/auth',
      tokenHost: 'https://oauth2.googleapis.com',
      tokenPath: '/token'
    }
  },
  startRedirectPath: '/api/auth/google',
  callbackUri: `${process.env.BACKEND_URL}/api/auth/google/callback`
}
  


  
const jwt_config:any = {
    secret: process.env.JWT_SECRET_KEY
  }




  export default async function registerPlugins(app: FastifyInstance) {

     app.register(cookie);
     app.register(jwt, jwt_config);
     app.register(auth2, auth2_config);
  }
  