import { RouteHandlerMethod , FastifySchema } from 'fastify';
import * as authController from '../controllers/auth.controller';
import * as twofaController from '../controllers/2fa.controller';


type Route = {
    method  : 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH'; 
    url     : string;
    handler : RouteHandlerMethod;
    schema? : FastifySchema;
};



const authRoutes: Route[] = [
  // user registration and login
  {
    method: "POST",
    url: "/api/auth/signup",
    handler: authController.postSignupHandler,
  },
  {
    method: "POST",
    url: "/api/auth/login",
    handler: authController.postLoginHandler,
  },
  {
    method: "POST",
    url: "/api/auth/logout",
    handler: authController.postLogoutHandler,
  },
  // email verification
  {
    method: "POST",
    url: "/api/auth/verify-email",
    handler: authController.verifyEmailHandler,
  },
  // password management
  {
    method: "POST",
    url: "/api/auth/forgot-password",
    handler: authController.postForgotPasswordHandler,
  },
  {
    method: "POST",
    url: "/api/auth/reset-password",
    handler: authController.postResetPasswordHandler,
  },
  {
    method: "POST",
    url: "/api/auth/change-password",
    handler: authController.postChangePasswordHandler,
  },
  // OAuth routes
  {
    method: "GET",
    url: "/api/auth/google/callback",
    handler: authController.getGooglCallbackehandler,
  },
  {
    method: "GET",
    url: "/api/auth/intra",
    handler: authController.getIntrahandler,
  },
  {
    method: "GET",
    url: "/api/auth/intra/callback",
    handler: authController.getIntracallbackhandler,
  },

  // token refresh and account deletion
  {
    method: "POST",
    url: "/api/auth/refresh",
    handler: authController.postRefreshTokenHandler,
  },

  {
    method: "DELETE",
    url: "/api/auth/delete-account",
    handler: authController.deleteAccountHandler,
  },
];



const twofaRoutes: Route[] = [

  {
    method: "GET",
    url: "/api/2fa/:method/setup",
    handler: twofaController.setupTwoFAHandler,
  },

  {
    method: "POST",
    url: "/api/2fa/:method/verify",
    handler: twofaController.verifyTwoFAHandler,
  },

  {
    method: "POST",
    url: "/api/2fa/:method/enable",
    handler: twofaController.enableTwoFAHandler,
  },

  {
    method: "POST",
    url: "/api/2fa/:method/disable",
    handler: twofaController.disableTwoFAHandler,
  },

  {
    method: "GET",
    url: "/api/2fa/:method/status",
    handler: twofaController.statusTwoFAHandler,
  },
];



export {authRoutes , twofaRoutes}
