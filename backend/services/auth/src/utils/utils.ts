import prisma from '../db/database';
import { sendToService } from '../integration/restfullApi.integration';




export async function createAccount(data: any): Promise<any> 
{
  const { email, username, password, firstName, lastName, avatar, banner, rankDivision, rankTier, playerSelectedCharacter, paddleColor } = data;
  const existingUser = await prisma.user.findUnique({ where: { email } });

  const user = await prisma.user.upsert({
    where: { email },
    update: (password != undefined) ? { password } : {},
    create: { email, password, username },
  });

  if (!existingUser) 
   {
      const profile = { userId: user.id, username, firstName, lastName, avatar, banner, rankDivision, rankTier, playerSelectedCharacter };
      await fetch(`http://user:4002/api/user/me`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'x-secret-token': process.env.SECRET_TOKEN || '' },
        body: JSON.stringify(profile),
      });

      // Seed in chat service
      await fetch(`http://chat:4003/api/chat/create`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'x-secret-token': process.env.SECRET_TOKEN || '' },
        body: JSON.stringify({
          userId: String(user.id),
          username,
          firstName,
          lastName,
          avatar: avatar || "/uploads/user/avatar/default.png",
          isVerified: true
        }),
      });

      // Seed in notify service
      await fetch(`http://notify:4004/api/notify/create`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'x-secret-token': process.env.SECRET_TOKEN || '' },
        body: JSON.stringify({
          userId: String(user.id),
          username,
          firstName,
          lastName,
          avatar: avatar || "/uploads/user/avatar/default.png",
          isVerified: true
        }),
      });

      
   }

  return user;
}


