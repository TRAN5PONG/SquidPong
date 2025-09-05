export interface User {
  username: string;
}

export type ChatReactionType = 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'thanks';
export type ChatMessageType = 'text';
export type ChatMessageStatus = 'sent' | 'delivered' | 'read';

export interface ChatReaction {
  from: User;
  type: ChatReactionType;
}

export interface ChatMessage {
  id: number;
  from: User;
  date: Date;
  message: string;
  status: ChatMessageStatus;
  reactions: ChatReaction[];
  type: ChatMessageType;
}

export interface HistoryMessage {
  type: 'history';
  messages: ChatMessage[];
}

export interface NewChatMessage {
  type: 'chat';
  id: number;
  message: ChatMessage;
}

export interface ReactionMessage {
  type: 'reaction';
  messageId: number;
  reactions: { emoji: string; user: string; }[];
}

export type ServerMessage = HistoryMessage | NewChatMessage | ReactionMessage;