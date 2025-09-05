// I added primsma
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface DbMessageRow {
    id: number;
    timestamp: Date;
    senderId: string;
    receiverId: string;
    message: string;
}

export interface DbReactionRow {
    id: number;
    messageId: number;
    emoji: string;
    user: string;
    timestamp: Date;
}

export async function getMessages(): Promise<DbMessageRow[]> {
    const messages = await prisma.message.findMany({
        orderBy: {
            timestamp: 'asc'
        }
    });
    return messages;
}

export async function getReactions(messageId: number): Promise<DbReactionRow[]> {
    const reactions = await prisma.reaction.findMany({
        where: {
            messageId: messageId
        }
    });
    return reactions;
}

export async function addMessage(senderId: string, message: string , receiverId : string): Promise<DbMessageRow> {
    const newMessage = await prisma.message.create({
        data: {
            senderId,
            receiverId,
            message,
            timestamp: new Date()
        }
    });
    return newMessage;
}



export async function addReaction(messageId: number, emoji: string, user: string): Promise<DbReactionRow> {
    const newReaction = await prisma.reaction.create({
        data: {
            messageId,
            emoji,
            user,
            timestamp: new Date()
        }
    });
    return newReaction;
}

export async function toggleReaction(messageId: number, emoji: string, username: string): Promise<void> {
    try {
        const existingReaction = await prisma.reaction.findFirst({
            where: {
                messageId: messageId,
                emoji: emoji,
                user: username
            }
        });

        if (existingReaction) {
            await prisma.reaction.delete({
                where: {
                    id: existingReaction.id
                }
            });
        } else {
            await prisma.reaction.create({
                data: {
                    messageId: messageId,
                    emoji: emoji,
                    user: username,
                    timestamp: new Date()
                }
            });
        }
    } catch (error) {
        console.error('Error in toggleReaction:', error);
        throw error;
    }
}

export async function getReactionsForMessage(messageId: number): Promise<DbReactionRow[]> {
    return getReactions(messageId);
}

export async function closeDb() {
    await prisma.$disconnect();
}

export async function initDb() {
    // No-op for Prisma as it automatically handles connections
}
