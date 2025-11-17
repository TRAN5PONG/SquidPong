import prisma from "../db/database";
import { GroupMessages } from "./RespondMessage";
import { fetchAndEnsureUser } from "./helper";



// change later to accept newMemberId and check if it's valid userId 
export async function checkUserAndFetchGroup( groupId: number , matchId? : string  ) 
{
  
  if(matchId !== undefined)
  {
     const groupWithMatch = await prisma.group.findUnique({
        where: { matchId  },
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
          },
        },
      },
    },
      });
  
      if (!groupWithMatch)
        throw new Error(GroupMessages.FETCH_NOT_FOUND);
  
      return groupWithMatch;
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
          },
        },
      },
    },
  });

  if (!group)
    throw new Error(GroupMessages.FETCH_NOT_FOUND);

  return group;
}
