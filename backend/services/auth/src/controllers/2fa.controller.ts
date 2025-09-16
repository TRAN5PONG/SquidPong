import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { TwoFA  , UserProfileMessage ,  TwoFaEmaiL } from '../utils/messages';
import { ApiResponse, sendError } from '../utils/errorHandler';


import { NONE , AUTHENTICATOR , EMAIL } from '../utils/twofa.helper';
import { setupAuthenticatorApp  , setupEmail2FA  ,verifyAuthenticatorCode , verifyEmailCode , enableAuthenticatorCode , enableEmailCode  } from '../utils/twofa.helper';






// STEP 1 - Setup 2FA (App or Email)
export async function setupTwoFAHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<{ twoFAQRCode: string; twoFAKey: string } | null> = { success: true, message: TwoFA.TWO_FA_SETUP_SUCCESS};
  const { method } = req.params as any;

  const id = Number((req.headers as any)["x-user-id"]);

  try 
  {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error(UserProfileMessage.USER_NOT_FOUND);

    if (user.twoFAMethod != NONE)
    {
      if(method != user.twoFAMethod)
        throw new Error(`2FA is already enabled via ${user.twoFAMethod}.`);
    }

    if(method === AUTHENTICATOR)
    {
      const { twoFAQRCode, twoFAKey } = await setupAuthenticatorApp(id, user.username);
      respond.data = { twoFAQRCode, twoFAKey };
    }
    else
    {
      await setupEmail2FA(id, user.email);
      respond.data = null;
    }

  }
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}









// STEP 2 - Enable 2FA (App or Email)
export async function enableTwoFAHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message: TwoFA.TWO_FA_ENABLE_SUCCESS };
  const {code} = req.body as any;
  const id = Number((req.headers as any)["x-user-id"]);

  const method = (req.params as any).method;

  try 
  {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error(UserProfileMessage.USER_NOT_FOUND);


    if (user.twoFAMethod != NONE)
    {
      if(user.twoFAMethod == EMAIL)
        throw new Error(TwoFaEmaiL.TWO_FA_ALREADY_ENABLED);
      throw new Error(TwoFA.TWO_FA_ALREADY_ENABLED);
    }

    if(method == AUTHENTICATOR)
      enableAuthenticatorCode(id, user.twoFASecret!, code);
    else
      enableEmailCode(id, code);

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
  const {code} = req.body as any;
  const id = Number((req.headers as any)["x-user-id"]);

  const method = (req.params as any).method;

  try 
  {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error(UserProfileMessage.USER_NOT_FOUND);


    if(user.twoFAMethod == NONE)
      throw new Error("2FA is not setup. Please setup 2FA first.");
    else if(user.twoFAMethod != method)
      throw new Error(`2FA is enabled via ${user.twoFAMethod} .`);

    if(method == AUTHENTICATOR)
      verifyAuthenticatorCode(id, user.twoFASecret!, code);
    else
      verifyEmailCode(id, code);

  } 
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

















export async function disableTwoFAHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message: TwoFA.TWO_FA_DISABLE_SUCCESS };
  const id = Number((req.headers as any)["x-user-id"]);

  try 
  {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) throw new Error(UserProfileMessage.USER_NOT_FOUND);
    if (user.twoFAMethod == NONE) throw new Error(TwoFA.TWO_FA_DESABLED);

    await prisma.user.update({ where: { id }, data: {twoFAMethod : NONE } });
  }
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}



export async function statusTwoFAHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<{twoFAMethod : string}> = { success: true, message: TwoFA.TWO_FA_ENABLED };
  const id = Number((req.headers as any)["x-user-id"]);

  try 
  {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error(UserProfileMessage.USER_NOT_FOUND);

    if (user.twoFAMethod == "NONE") throw new Error(TwoFA.TWO_FA_DESABLED);
    respond.data = { twoFAMethod : user.twoFAMethod };
  } 
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}
