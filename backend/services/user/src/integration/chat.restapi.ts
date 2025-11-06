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
        
    const response = await fetch(`${chatServiceUrl}/api/chat/user/${friendId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId.toString(),
        'x-secret-token': secretToken,
      },
    });

    if (!response.ok)
        console.error('Failed to remove friend from chat service:', await response.text());
}




export async function blockUserInChat(userId: number, friendId: number)
{
    const chatServiceUrl = getChatServiceUrl();
    const secretToken = getSecretToken();
    
    const response = await fetch(`${chatServiceUrl}/api/chat/block/${friendId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId.toString(),
        'x-secret-token': secretToken,
      },
    });

    if (!response.ok)
        console.error('Failed to block user in chat service:', await response.text());
}




export async function unblockUserInChat(userId: number, friendId: number)
{
    const chatServiceUrl = getChatServiceUrl();
    const secretToken = getSecretToken();
    
    const response = await fetch(`${chatServiceUrl}/api/chat/unblock/${friendId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId.toString(),
        'x-secret-token': secretToken,
      },
    });

    if (!response.ok)
        console.error('Failed to unblock user in chat service:', await response.text());
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
