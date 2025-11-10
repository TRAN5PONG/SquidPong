import { FastifyRequest, FastifyReply } from 'fastify';

import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { Readable } from 'stream';
import crypto from 'crypto';

import app from "../app";


export async function fetchIntraToken(code: string): Promise<string>
{
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.INTRA_CLIENT_ID!,
    client_secret: process.env.INTRA_CLIENT_SECRET!,
    code,
    redirect_uri: `${process.env.BACKEND_URL}/api/auth/intra/callback`,
  });

  const tokens = await fetch('https://api.intra.42.fr/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const tokensJSON = await tokens.json();
  return tokensJSON.access_token;
}

export async function fetchIntraUser(access_token: string): Promise<any> 
{

  const user = await fetch('https://api.intra.42.fr/v2/me', {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const userJSON = await user.json();

  // Map fields
  userJSON['firstName'] = userJSON.first_name;
  userJSON['lastName'] = userJSON.last_name;
  userJSON['avatar'] = userJSON.image.link;
  userJSON['username'] = userJSON.login;

  return userJSON;
}


export function sendResponseToFrontend(res: FastifyReply, respond: any)
{
  const FRONTEND_URL = process.env.FRONTEND_URL;
  const newRespond = { ...respond, type: 'google-auth-success' };

  res.type('text/html').send(`
    <script>
      window.opener.postMessage(${JSON.stringify(newRespond)}, "${FRONTEND_URL}");
      window.close();
    </script>
  `);

}




// ------------------ Helpers ------------------

export async function fetchGoogleUser(req: FastifyRequest): Promise<any>
{

  const tokengoogle: any = await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);

  const result = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokengoogle.token.access_token}` },
  });

  const data = await result.json();

  // Map fields
  data['avatar'] = data.picture;
  data['username'] = data.email.split('@')[0];
  data['fname'] = data.given_name;
  data['lname'] = data.family_name;

  return data;
}






const pipe = promisify(pipeline);

export async function fetchAvatarImagePipeline(imageUrl: string, username: string) 
{
  const res = await fetch(imageUrl);

  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
  if (!res.body) throw new Error('No response body');

  const ext = res.headers.get('content-type')?.split('/');
  const extension = ext ? ext[1] : 'jpg';
  
  const uploadDir = '/auth/uploads/avatar';
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  let physicalPath: string;
  let randomName: string;

  do {
    randomName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${extension}`;
    physicalPath = `${uploadDir}/${randomName}`;
  } while (fs.existsSync(physicalPath));
  
  console.log('Saving avatar to', physicalPath);
  const nodeStream = Readable.fromWeb(res.body as any);

  await pipe(nodeStream, fs.createWriteStream(physicalPath));
  const filePath = `${process.env.BACKEND_URL || 'http://localhost:4000'}:4433/api/user/avatars/${randomName}`;
  // const filePath = `${pro}/api/user/avatars/${randomName}`;
  return (filePath);
}