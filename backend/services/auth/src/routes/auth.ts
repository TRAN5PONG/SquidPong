import { RouteHandlerMethod , FastifySchema } from 'fastify';
import * as authController from '../controllers/auth.controller';
import * as twofaController from '../controllers/2fa.controller';

import {  signupSchema, loginSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema} from '../validators/authSchemas';
import {  twofaSetupSchema, twofaStatusSchema, twofaVerifySchema, twofaDisableSchema, twofaEnableSchema } from '../validators/twofaSchema';


type Route = {
    method  : 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH'; 
    url     : string;
    handler : RouteHandlerMethod;
    schema? : FastifySchema;
};



const authRoutes: Route[] = [
  {
    method: "GET",
    url: "/",
    handler: authController.getRootHandler,
  },
  // user registration and login
  {
    method: "POST",
    url: "/api/auth/signup",
    handler: authController.postSignupHandler,
    schema: signupSchema,
  },
  {
    method: "POST",
    url: "/api/auth/login",
    handler: authController.postLoginHandler,
    schema: loginSchema
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
    schema: verifyEmailSchema,
  },
  // password management
  {
    method: "POST",
    url: "/api/auth/forgot-password",
    handler: authController.postForgotPasswordHandler,
    schema: forgotPasswordSchema
  },
  {
    method: "POST",
    url: "/api/auth/reset-password",
    handler: authController.postResetPasswordHandler,
    schema: resetPasswordSchema
  },
  {
    method: "POST",
    url: "/api/auth/change-password",
    handler: authController.postChangePasswordHandler,
    schema: changePasswordSchema
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
    schema: twofaSetupSchema,
    handler: twofaController.setupTwoFAHandler,
  },

  {
    method: "POST",
    url: "/api/2fa/:method/verify",
    schema: twofaVerifySchema,
    handler: twofaController.verifyTwoFAHandler,
  },

  {
    method: "POST",
    url: "/api/2fa/:method/enable",
    schema: twofaEnableSchema,
    handler: twofaController.enableTwoFAHandler,
  },

  {
    method: "POST",
    url: "/api/2fa/:method/disable",
    schema: twofaDisableSchema,
    handler: twofaController.disableTwoFAHandler,
  },

  {
    method: "GET",
    url: "/api/2fa/:method/status",
    schema: twofaStatusSchema,
    handler: twofaController.statusTwoFAHandler,
  },
];



export {authRoutes , twofaRoutes}
