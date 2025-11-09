import { Conversation, ConversationDetails } from "@/types/chat";
import { API_BASE_URL, ApiResponse } from "./auth";

/**
 * Conversations
 */
export const getConversations = async (): Promise<
  ApiResponse<Conversation[]>
> => {
  const resp = await fetch(`${API_BASE_URL}/chat/recent`, {
    method: "GET",
    credentials: "include",
  });

  return resp.json();
};
export const newConversation = async (
  friendId: string
): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/chat/new`, {
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
  const resp = await fetch(`${API_BASE_URL}/chat/remove`, {
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
): Promise<ApiResponse<ConversationDetails>> => {
  const resp = await fetch(`${API_BASE_URL}/chat/${conversationId}/messages`, {
    method: "GET",
    credentials: "include",
  });

  return resp.json();
};
export const sendMessage = async (
  chatId: number,
  content: string
): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/message/send`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chatId, content }),
  });

  return resp.json();
};
export const editMessage = async (
  messageId: number,
  content: string
): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/message/${messageId}/edit`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  return resp.json();
};
export const deleteMessage = async (
  messageId: number
): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/message/${messageId}`, {
    method: "DELETE",
    credentials: "include",
  });

  return resp.json();
};
export const replyToMessage = async (
  messageId: number,
  content: string
): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/message/${messageId}/reply`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  return resp.json();
};
export const getMessageReactions = async (
  messageId: number
): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/message/${messageId}/reactions`, {
    method: "GET",
    credentials: "include",
  });

  return resp.json();
};
/**
 * Reactions
 */
export const reactToMessage = async (
  messageId: number,
  emoji: string
): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/message/${messageId}/reaction`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ emoji }),
  });

  return resp.json();
};
export const removeReaction = async (
  messageId: number
): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/message/${messageId}/reaction`, {
    method: "DELETE",
    credentials: "include",
  });

  return resp.json();
};
