import prisma from "../db/database";
import { GroupMessages } from "./RespondMessage";
import { fetchAndEnsureUser } from "./helper";



// change later to accept newMemberId and check if it's valid userId 
export async function checkUserAndFetchGroup( groupId: number) 
{
  
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
