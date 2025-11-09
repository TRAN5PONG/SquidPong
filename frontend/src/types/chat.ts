import { GameInvitation } from "./invite";
import { User } from "./user";

export type ChatType = "private" | "tournament";
export type ChatReactionType = "like" | "dislike" | "laugh" | "sad" | "angry";
export type ChatMessageType = "text" | "invite";
export type ChatMessageStatus = "sent" | "delivered" | "read";

export interface ChatReaction {
  from: User;
  type: ChatReactionType;
}

export interface ChatMessage {
  id: number;
  sender: User;
  timestamp: Date;
  content: string;
  status: ChatMessageStatus;
  reactions: ChatReaction[];
  type: ChatMessageType;
  invitation?: GameInvitation;
  replyTo?: ChatMessage;
  isEdited?: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage: ChatMessage | null;
  unreadCount?: number;
  updatedAt?: Date;
}

export interface ConversationDetails extends Conversation {
  messages: ChatMessage[];
}
