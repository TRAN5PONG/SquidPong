import { ApiResponse } from "../utils/errorHandler";

function getNotifyServiceUrl(): string 
{
  return process.env.NOTIFY_SERVICE_URL || 'http://notify:4004';
}


function getSecretToken(): string 
{
  return process.env.SECRET_TOKEN || 'SquidPong_InterService_9f8e7d6c5b4a3928f6e5d4c3b2a19876543210abcdef';
}


export async function createNotificationInNotify(userId: number, message: string, type?: string)
{
    const notifyServiceUrl = getNotifyServiceUrl();
    const secretToken = getSecretToken();
        
    const response = await fetch(`${notifyServiceUrl}/api/notify/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-token': secretToken,
      },
      body: JSON.stringify({
        userId: userId.toString(),
        message,
        type: type || 'INFO'
      })
    });

    if (!response.ok) {
        console.error('Failed to create notification in notify service:', await response.text());
        throw new Error('Failed to create notification');
    }

    return await response.json();
}


export async function deleteAccountInNotify(userId: number)
{
    const notifyServiceUrl = getNotifyServiceUrl();
    const secretToken = getSecretToken();
        
    const response = await fetch(`${notifyServiceUrl}/api/notify/user/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId.toString(),
        'x-secret-token': secretToken,
      },
    });

    if (!response.ok)
        console.error('Failed to delete account in notify service:', await response.text());
}
