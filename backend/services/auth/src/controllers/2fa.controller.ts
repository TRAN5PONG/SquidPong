import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import redis from '../integration/redis.integration';
import { TwoFA, UserProfileMessage, TwoFaEmaiL } from '../utils/messages';
import { ApiResponse, sendError } from '../utils/errorHandler';
import { setJwtTokens } from '../validators/2faValidator';

import { NONE, AUTHENTICATOR, EMAIL } from '../utils/twofa.helper';
import { setupAuthenticatorApp, setupEmail2FA, verifyAuthenticatorCode, verifyEmailCode, enableAuthenticatorCode, enableEmailCode } from '../utils/twofa.helper';









export async function setupTwoFAHandler(req: FastifyRequest, res: FastifyReply) {
  const respond: ApiResponse<{ twoFAQRCode: string; twoFAKey: string } | null> = { success: true, message: TwoFA.TWO_FA_SETUP_SUCCESS };
  const { method } = req.params as any;

  const id = Number((req.headers as any)["x-user-id"]);

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error(UserProfileMessage.USER_NOT_FOUND);

    if (user.twoFAMethod != NONE) {
      if (method != user.twoFAMethod)
        throw new Error(`2FA is already enabled via ${user.twoFAMethod}.`);
    }

    if (method === AUTHENTICATOR) {
      const { twoFAQRCode, twoFAKey } = await setupAuthenticatorApp(user);
      respond.data = { twoFAQRCode, twoFAKey };
    }
    else {
      await setupEmail2FA(user.email);
      respond.data = null;
    }

  }
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}









// STEP 2 - Enable 2FA (App or Email)
export async function enableTwoFAHandler(req: FastifyRequest, res: FastifyReply) {
  const respond: ApiResponse<null> = { success: true, message: TwoFA.TWO_FA_ENABLE_SUCCESS };
  const { code } = req.body as any;
  const id = Number((req.headers as any)["x-user-id"]);

  const method = (req.params as any).method;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error(UserProfileMessage.USER_NOT_FOUND);


    if (user.twoFAMethod != NONE) {
      if (user.twoFAMethod == EMAIL)
        throw new Error(TwoFaEmaiL.TWO_FA_ALREADY_ENABLED);
      throw new Error(TwoFA.TWO_FA_ALREADY_ENABLED);
    }

    if (method == AUTHENTICATOR)
      enableAuthenticatorCode(id, user.twoFASecret!, code);
    else
      enableEmailCode(user.email, code);

  }
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

// STEP 2 - Verify TwoFA (App or Email)
export async function verifyTwoFAHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message: TwoFA.TWO_FA_ENABLE_SUCCESS };
  const { code, twoFAToken } = req.body as { code: string, twoFAToken: string };

  let userId: number;
  let twoFAMethod: string;

  try 
  {
    const redisKey = `2fa:token:${twoFAToken}`;
    const tokenData = await redis.get(redisKey);
    if (!tokenData) throw new Error("Invalid or expired 2FA token");
    const parsedData = JSON.parse(tokenData);

    userId = parsedData.userId;
    twoFAMethod = parsedData.twoFAMethod;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error(UserProfileMessage.USER_NOT_FOUND);

    if (twoFAMethod == AUTHENTICATOR)
      verifyAuthenticatorCode(userId, user.twoFASecret!, code);
    else
      verifyEmailCode(userId, code);

    await redis.del(redisKey);
    await setJwtTokens(res, userId);
    respond.message = TwoFA.TWO_FA_VERIFY_SUCCESS;
  }
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

export async function disableTwoFAHandler(req: FastifyRequest, res: FastifyReply) {
  const respond: ApiResponse<null> = { success: true, message: TwoFA.TWO_FA_DISABLE_SUCCESS };
  const id = Number((req.headers as any)["x-user-id"]);

  try {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) throw new Error(UserProfileMessage.USER_NOT_FOUND);
    if (user.twoFAMethod == NONE) throw new Error(TwoFA.TWO_FA_DESABLED);

    await prisma.user.update({ where: { id }, data: { twoFAMethod: NONE } });
  }
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}



export async function statusTwoFAHandler(req: FastifyRequest, res: FastifyReply) {
  const respond: ApiResponse<{ twoFAMethod: string }> = { success: true, message: TwoFA.TWO_FA_ENABLED };
  const id = Number((req.headers as any)["x-user-id"]);

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error(UserProfileMessage.USER_NOT_FOUND);

    if (user.twoFAMethod == NONE) throw new Error(TwoFA.TWO_FA_DESABLED);
    respond.data = { twoFAMethod: user.twoFAMethod };
  }
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}
