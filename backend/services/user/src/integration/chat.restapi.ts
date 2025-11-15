import { ApiResponse } from "../utils/errorHandler";

function getChatServiceUrl(): string 
{
  return process.env.CHAT_SERVICE_URL || 'http://chat:4003';
}


function getSecretToken(): string 
{
  return process.env.SECRET_TOKEN || 'SquidPong_InterService_9f8e7d6c5b4a3928f6e5d4c3b2a19876543210abcdef';
}


export async function removeFriendFromChat(userId: number, friendId: number)
{
    const chatServiceUrl = getChatServiceUrl();
    const secretToken = getSecretToken();
        
    const response = await fetch(`${chatServiceUrl}/api/chat/remove`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId.toString(),
        'x-secret-token': secretToken,
      },
      body: JSON.stringify({ friendId: friendId.toString() }),
    });

    if (!response.ok)
      console.error('Failed to remove chat between users:', await response.text());
}



export async function blockUserInChat(userId: number , friendId: number)
{
  const url = `http://chat:4003/api/chat/block-friend`;

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-secret-token': getSecretToken(),
    },
    body: JSON.stringify({ userId: userId.toString(), friendId: friendId.toString() }),
  })

}




export async function unblockUserInChat(userId: number, friendId: number)
{
  const url = `http://chat:4003/api/chat/unblock-friend`;

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-secret-token': getSecretToken(),
    },
    body: JSON.stringify({ userId: userId.toString(), friendId: friendId.toString() }),
  });
}


export async function deleteAccountInChat(userId: number)
{
    const chatServiceUrl = getChatServiceUrl();
    const secretToken = getSecretToken();
        
    const response = await fetch(`${chatServiceUrl}/api/chat/user/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId.toString(),
        'x-secret-token': secretToken,
      },
    });

    if (!response.ok)
        console.error('Failed to delete account in chat service:', await response.text());
}
