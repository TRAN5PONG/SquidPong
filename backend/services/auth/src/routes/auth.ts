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
  // verify email
  {
    method: "POST",
    url: "/api/auth/verify-email",
    handler: authController.verifyEmailHandler,
    schema: verifyEmailSchema,
  },
  // password
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
  // oauth2
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

  // refresh token
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
  // 2fa
  {
    method: "GET",
    url: "/api/2fa/setup",
    schema: twofaSetupSchema,
    handler: twofaController.setupAuthenticatorHandler,
  },
  {
    method: "GET",
    url: "/api/2fa/status",
    schema: twofaStatusSchema,
    handler: twofaController.statusAuthenticatorHandler,
  },
  {
    method: "POST",
    url: "/api/2fa/verify",
    schema: twofaVerifySchema,
    handler: twofaController.verifyTwofaHandler,
  },
  {
    method: "POST",
    url: "/api/2fa/disable",
    schema: twofaDisableSchema,
    handler: twofaController.disable2FAHandler,
  },
  {
    method: "POST",
    url: "/api/2fa/enable",
    schema: twofaEnableSchema,
    handler: twofaController.enableTwoFAHandler,
  },
];


export {authRoutes , twofaRoutes}
