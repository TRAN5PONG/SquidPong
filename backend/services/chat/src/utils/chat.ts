
import prisma from "../db/database"


export async function findChatBetweenUsers (userId1:number, userId2:number) : Promise<number | null>
{
  const user1Chats = await prisma.chatMember.findMany({
    where: { userId: String(userId1) },
    select: { chatId: true }
  })
  
  if (user1Chats.length === 0) throw new Error("No chats found for userId1")
  
  const chatIds = user1Chats.map((chat:any) => chat.chatId)
  
  const sharedChat = await prisma.chatMember.findFirst({
    where: {
      userId: String(userId2),
      chatId: { in: chatIds }
    },
    select: { chatId: true }
  })
  
  if(!sharedChat) throw new Error("No shared chat found between the two users")
  
  return sharedChat?.chatId;
}




export async function checkChatMembershipAndGetOthers(chatId: number, userId: number)
{
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { 
      members: true,
      messages: true
    },
  });

  if (!chat) throw new Error(`Chat not found: ${chatId}`);

  const isMember = chat.members.some((m: any) => m.userId === String(userId));
  if (!isMember) throw new Error(`User ${userId} is not a member of chat ${chatId}`);

  const targetId : number[] = chat.members
    .filter((m: any) => m.userId !== String(userId))
    .map((m: any) => Number(m.userId));

  return {  chat, targetId };
}