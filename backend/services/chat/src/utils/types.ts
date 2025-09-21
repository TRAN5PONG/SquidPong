
export interface Message {
  id: number;
  senderId: string;
  receiverId: string;
  message: string;
  reactions?: Reaction[];    // optional, array of reactions
  timestamp: Date;
}

export interface Reaction {
  id: number;
  userId: string;
  messageId: number;
  emoji: string;
  timestamp: Date;
  // You can optionally add the message property if you want to include the relation
  // message?: Message;
}
