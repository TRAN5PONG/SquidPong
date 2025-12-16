import { RouteHandlerMethod , FastifySchema } from 'fastify';
import * as authController from '../controllers/auth.controller';
import * as twofaController from '../controllers/2fa.controller';
import { 
  signupSchema, 
  loginSchema, 
  logoutSchema, 
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema,
  deleteAccountSchema,
  googleCallbackSchema,
  intraSchema,
  intraCallbackSchema
} from '../schemas/auth.schemas';

import {
  setup2FASchema,
  enable2FASchema,
  verify2FASchema,
  disable2FASchema,
  status2FASchema
} from '../schemas/2fa.schemas';


type Route = {
    method  : 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH'; 
    url     : string;
    handler : RouteHandlerMethod;
    schema? : FastifySchema;
};



const authRoutes: Route[] = [
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
    schema: loginSchema,
  },
  {
    method: "POST",
    url: "/api/auth/logout",
    handler: authController.postLogoutHandler,
    schema: logoutSchema,
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
    schema: forgotPasswordSchema,
  },
  {
    method: "POST",
    url: "/api/auth/reset-password",
    handler: authController.postResetPasswordHandler,
    schema: resetPasswordSchema,
  },
  {
    method: "POST",
    url: "/api/auth/change-password",
    handler: authController.postChangePasswordHandler,
    schema: changePasswordSchema,
  },
  // OAuth routes
  {
    method: "GET",
    url: "/api/auth/google/callback",
    handler: authController.getGooglCallbackehandler,
    schema: googleCallbackSchema,
  },
  {
    method: "GET",
    url: "/api/auth/intra",
    handler: authController.getIntrahandler,
    schema: intraSchema,
  },
  {
    method: "GET",
    url: "/api/auth/intra/callback",
    handler: authController.getIntracallbackhandler,
    schema: intraCallbackSchema,
  },

  // token refresh and account deletion
  {
    method: "POST",
    url: "/api/auth/refresh",
    handler: authController.postRefreshTokenHandler,
    schema: refreshTokenSchema,
  },
  {
    method: "DELETE",
    url: "/api/auth/delete-account",
    handler: authController.deleteAccountHandler,
    schema: deleteAccountSchema,
  },
  {
    method: "PUT",
    url: "/api/auth/update",
    handler: authController.postUpdateAuthHandler,
    // Optionally add schema validation here
  },
];



const twofaRoutes: Route[] = [

  {
    method: "GET",
    url: "/api/2fa/:method/setup",
    handler: twofaController.setupTwoFAHandler,
    // schema: setup2FASchema,
  },

  {
    method: "POST",
    url: "/api/2fa/:method/verify",
    handler: twofaController.verifyTwoFAHandler,
    schema: verify2FASchema,
  },

  {
    method: "POST",
    url: "/api/2fa/:method/enable",
    handler: twofaController.enableTwoFAHandler,
    // schema: enable2FASchema,
  },

  {
    method: "POST",
    url: "/api/2fa/:method/disable",
    handler: twofaController.disableTwoFAHandler,
    // schema: disable2FASchema,
  },

];



export {authRoutes , twofaRoutes}
