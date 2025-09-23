import prisma from "../db/database";
import { GroupMessages } from "./RespondMessage";
import { verifyUserId } from "./helper";



// change later to accept newMemberId and check if it's valid userId 
export async function checkUserAndFetchGroup( groupId: number, userId?: number, newMemberId?: number , checkNewMember = false ) 
{
  if (newMemberId !== undefined)
  {
      if (checkNewMember)
        await verifyUserId(`${newMemberId}`);
      if (userId !== undefined && userId === newMemberId)
        throw new Error(GroupMessages.MEMBER_ADDED_FAILED);
    }

      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          members: true,
          chat: {
            include: {
              members: true,
              messages: {
                include: {
                  reactions: true,
                },
                orderBy: {
                  timestamp: 'desc',
                },
                take: 20,
              },
            },
          },
        },
      });

  if (!group)
    throw new Error(GroupMessages.FETCH_NOT_FOUND);

  return group;
}
