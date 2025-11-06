import { API_BASE_URL, ApiResponse } from "./auth";

/**
 * Conversations
 */
export const getConversations = async (): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/api/chat/recent`, {
    method: "GET",
    credentials: "include",
  });

  return resp.json();
};

export const newConversation = async (
  friendId: number
): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/api/chat/new`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ friendId }),
  });

  return resp.json();
};

export const removeConversation = async (
  userId: number,
  friendId: number
): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/api/chat/remove`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, friendId }),
  });

  return resp.json();
};

/**
 * Messages
 */
export const getMessages = async (
  conversationId: number
): Promise<ApiResponse> => {
  const resp = await fetch(
    `${API_BASE_URL}/api/chat/${conversationId}/messages`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  return resp.json();
};
