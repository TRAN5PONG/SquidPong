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
  chatId?: number,
  content?: string,
  receiverId?: string,
  invitationCode?: string,
  tournamentId?: number
): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/message/send`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chatId,
      content,
      receiverId,
      invitationCode,
      tournamentId,
    }),
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
export const markConversationAsRead = async (
  conversationId: number
): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/chat/${conversationId}/read`, {
    method: "PATCH",
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

/**
 * Groups
 */
export const createGroupChat = async (
  name: string,
  desc: string,
  type: string
): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/group/create`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, desc, type }),
  });

  return resp.json();
};
export const updateGroupChat = async (
  groupId: number,
  name: string,
  desc: string
): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/group/${groupId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, desc }),
  });

  return resp.json();
};
export const deleteGroupChat = async (
  groupId: number
): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/group/${groupId}`, {
    method: "DELETE",
    credentials: "include",
  });

  return resp.json();
};
export const searchGroupChats = async (query: string): Promise<ApiResponse> => {
  const resp = await fetch(
    `${API_BASE_URL}/group?search=${encodeURIComponent(query)}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  return resp.json();
};
export const listGroupMembers = async (
  groupId: number
): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/group/${groupId}/members`, {
    method: "GET",
    credentials: "include",
  });

  return resp.json();
};
export const inviteToGroup = async (
  groupId: number,
  targetUserId: number
): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/group/${groupId}/invite`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ targetUserId }),
  });

  return resp.json();
};
export const leaveGroup = async (groupId: number): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/group/${groupId}/members/leave`, {
    method: "POST",
    credentials: "include",
  });

  return resp.json();
};
