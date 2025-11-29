import { GameInvitation } from "./invite";
import { User } from "./user";

export type ChatType = "private" | "tournament";
export type ChatReactionType =
  | "LIKE"
  | "FUCK"
  | "LAUGH"
  | "SAD"
  | "ANGRY"
  | "WOW"
  | "LOVE";
export type ChatMessageType = "INVITE_TOURNAMENT" | "INVITE_MATCH" | "TEXT";
export type ChatMessageStatus = "SENT" | "DELIVERED" | "READ";

export interface ChatReaction {
  emoji: ChatReactionType;
  count: number;
  id: number;
  messageId: number;
  timestamp: Date;
  userId: string;
}

export interface ChatMessage {
  id: number;
  sender: User;
  timestamp: Date;
  content: string;
  status: ChatMessageStatus;
  reactions: ChatReaction[];
  type: ChatMessageType;
  invitationCode?: string;
  tournamentId?: string;
  replyTo?: ChatMessage;
  isDeleted?: boolean;
  isEdited?: boolean;
}

export interface ChatGroup {
  chatId: number;
  createdAt: Date;
  desc: string;
  id: number;
  imageUrl: string;
  name: string;
  type: "PRIVATE" | "PUBLIC";
  matchId?: string;
  members: {
    groupId: number;
    id: number;
    userId: string;
    role: "OWNER" | "MEMBER" | "ADMIN";
    status: "APPROVED" | "PENDING" | "REJECTED";
  }[];
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage: ChatMessage | null;
  unreadCount?: number;
  updatedAt?: Date;
  group?: ChatGroup;
}

export interface ConversationDetails extends Conversation {
  messages: ChatMessage[];
}
