import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../db/database";
import { ApiResponse, sendError, verifyFriendship } from "../utils/helper";
import { Message } from "../utils/types";
import { chatMessages } from "../utils/RespondMessage";
import { findChatBetweenUsers } from "../utils/chat";
import { fetchAndEnsureUser } from "../utils/helper";
import { checkSecretToken } from "../utils/helper";
import { sendDataToQueue } from "../integration/rabbitmq.integration";
import { redis, getOnlineUsers } from "../integration/redis.integration";
import app from "../app";
import { ReactionType } from "./chat.rabbit.controller";

export async function createChat(req: FastifyRequest, res: FastifyReply) {
  const respond: ApiResponse<{ chatId: number }> = {
    success: true,
    message: chatMessages.CREATED_SUCCESS,
  };
  const headers = req.headers as { "x-user-id": string };
  const userId = headers["x-user-id"];

  const { friendId } = req.body as { friendId: string };

  try {
    if (userId === friendId) throw new Error(chatMessages.CANNOT_CHAT_SELF);
    await fetchAndEnsureUser(friendId);

    const existingChatId = await findChatBetweenUsers(
      Number(userId),
      Number(friendId)
    );
    if (existingChatId) {
      respond.data = { chatId: existingChatId };
      return res.send(respond);
    }

    const newChat = await prisma.chat.create({
      data: {
        members: {
          create: [
            { user: { connect: { userId } } },
            { user: { connect: { userId: friendId } } },
          ],
        },
      },
    });
    respond.data = { chatId: newChat.id };
  } catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

export async function removeChat(req: FastifyRequest, res: FastifyReply) {
  const respond: ApiResponse<null> = {
    success: true,
    message: chatMessages.DELETE_SUCCESS,
  };

  console.log(app.swagger());
  const { userId, friendId } = req.query as {
    userId: string;
    friendId: string;
  };

  try {
    const chatId = await findChatBetweenUsers(Number(userId), Number(friendId));
    await prisma.chat.delete({ where: { id: Number(chatId) } });
  } catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

export async function getChatById(req: FastifyRequest, res: FastifyReply) {
  const respond: ApiResponse<any> = {
    success: true,
    message: chatMessages.FETCH_SUCCESS,
  };
  const headers = req.headers as { "x-user-id": string };
  const userId = headers["x-user-id"];

  const { chatId } = req.params as { chatId: string };

  try {
    const fullChat = await prisma.chat.findUnique({
      where: { id: Number(chatId) },
      include: {
        members: { include: { user: true } },
        messages: {
          include: {
            reactions: true,
            sender: true,
            replyTo: { include: { sender: true } },
          },
        },
      },
    });
    if (!fullChat) throw new Error(chatMessages.FETCH_NOT_FOUND);

    const isMember = fullChat.members.some((m: any) => m.userId === userId);
    if (!isMember) throw new Error(chatMessages.FETCH_NOT_FOUND);

    const unreadCount = fullChat.messages.filter(
      (m: any) => m.senderId !== userId && m.status !== "READ"
    ).length;
    const newData = {
      id: fullChat.id,
      unreadCount,
      lastMessage: fullChat.messages[fullChat.messages.length - 1] || null,
      participants: fullChat.members.map((m: any) => m.user),
      messages: fullChat.messages,
    };

    respond.data = newData;
  } catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

export async function getRecentChats(req: FastifyRequest, res: FastifyReply) {
  const respond: ApiResponse<any> = {
    success: true,
    message: "Recent chats fetched successfully.",
  };

  const headers = req.headers as { "x-user-id": string };
  const userId = headers["x-user-id"];

  let dataRespond: any = [];
  try {
    const recentChats = await prisma.chat.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        members: { include: { user: true } },
        messages: {
          orderBy: { timestamp: "desc" },
          take: 1,
          include: {
            sender: true,
            reactions: { include: { user: true } },
            replyTo: { include: { sender: true } },
          },
        },
      },
    });

    for (const chat of recentChats) {
      const unreadCount = await prisma.message.count({
        where: {
          chatId: chat.id,
          senderId: { not: userId },
          status: { not: "READ" },
        },
      });

      dataRespond.push({
        id: chat.id,
        participants: chat.members.map((m: any) => m.user),
        lastMessage: chat.messages[0] || null,
        unreadCount: unreadCount,
      });
    }

    respond.data = dataRespond;
  } catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

export async function blockUserHandler(req: FastifyRequest, res: FastifyReply) {
  const respond: ApiResponse<null> = {
    success: true,
    message: "User blocked successfully",
  };
  const headers = req.headers as { "x-user-id": string };
  const userId = headers["x-user-id"];

  const { chatId } = req.params as { chatId: string };

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: Number(chatId) },
      include: { members: true },
    });

    if (!chat) throw new Error(`Chat not found: ${chatId}`);

    const isMember = chat.members.some((m: any) => m.userId === String(userId));
    if (!isMember)
      throw new Error(`User ${userId} is not a member of chat ${chatId}`);

    await prisma.chat.update({
      where: { id: Number(chatId) },
      data: {
        members: {
          updateMany: {
            where: { userId: userId },
            data: { isBlocked: true },
          },
        },
      },
    });
  } catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

export async function removeUserHandler(
  req: FastifyRequest,
  res: FastifyReply
) {
  const respond: ApiResponse<null> = {
    success: true,
    message: chatMessages.DELETE_SUCCESS,
  };
  const headers = req.headers as { "x-user-id": string };
  const userId = headers["x-user-id"];

  const { friendId } = req.params as { friendId: string };

  try {
    checkSecretToken(req);
    const chatId = await findChatBetweenUsers(Number(userId), Number(friendId));
    if (!chatId) throw new Error("Chat not found between users");

    await prisma.chat.delete({ where: { id: Number(chatId) } });
  } catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

export async function unblockUserHandler(
  req: FastifyRequest,
  res: FastifyReply
) {
  const respond: ApiResponse<null> = {
    success: true,
    message: "User unblocked successfully",
  };
  const headers = req.headers as { "x-user-id": string };
  const userId = headers["x-user-id"];

  const { chatId } = req.params as { chatId: string };

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: Number(chatId) },
      include: { members: true },
    });

    if (!chat) throw new Error(`Chat not found: ${chatId}`);

    const isMember = chat.members.some((m: any) => m.userId === String(userId));
    if (!isMember)
      throw new Error(`User ${userId} is not a member of chat ${chatId}`);

    await prisma.chat.update({
      where: { id: Number(chatId) },
      data: {
        members: {
          updateMany: {
            where: { userId: userId },
            data: { isBlocked: false },
          },
        },
      },
    });
  } catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

export async function deleteAccountHandler(
  req: FastifyRequest,
  res: FastifyReply
) {
  const respond: ApiResponse<null> = {
    success: true,
    message: "Account deleted successfully",
  };
  const headers = req.headers as { "x-user-id": string };
  const userId = headers["x-user-id"];

  try {
    checkSecretToken(req);

    await prisma.user.update({
      where: { userId },
      data: { isDeleted: true },
    });

    console.log(`User ${userId} marked as deleted in chat service`);
  } catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

// ------------------- Message Endpoints -------------------

export async function sendMessageHandler(
  req: FastifyRequest,
  res: FastifyReply
) {
  const respond: ApiResponse<any> = {
    success: true,
    message: "Message sent successfully",
  };
  const headers = req.headers as { "x-user-id": string };
  const senderId = headers["x-user-id"];

  const { chatId, content, matchId, tournamentId } = req.body as {
    chatId: number;
    content?: string;
    matchId?: string;
    tournamentId?: string;
  };

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: Number(chatId) },
      select: { members: true },
    });
    if (!chat) throw new Error("Chat not found or user is not a member");

    const type = matchId
      ? "INVITE_MATCH"
      : tournamentId
      ? "INVITE_TOURNAMENT"
      : "TEXT";

    const targetIds = chat.members
      .filter((m: any) => m.userId !== senderId)
      .map((m: any) => m.userId);
    const onlineUsers = await getOnlineUsers();
    const status = onlineUsers.includes(targetIds[0]) ? "DELIVERED" : "SENT";

    const data = await prisma.message.create({
      data: {
        chatId: Number(chatId),
        content: content || null,
        senderId,
        status,
        type,
        matchId: matchId ? String(matchId) : null,
        tournamentId: tournamentId ? String(tournamentId) : null,
      },
      include: { sender: true, reactions: true },
    });

    const dataToSend = {
      type: "newMessage",
      fromId: senderId,
      targetId: targetIds,
      data,
    };

    await sendDataToQueue(dataToSend, "eventhub");
    respond.data = data;
  } catch (error) {
    sendError(res, error);
  }
  return res.send(respond);
}

export async function editMessageHandler(
  req: FastifyRequest,
  res: FastifyReply
) {
  const respond: ApiResponse<null> = {
    success: true,
    message: "Message edited successfully",
  };
  const headers = req.headers as { "x-user-id": string };
  const userId = headers["x-user-id"];

  const { messageId } = req.params as { messageId: string };
  const { content, matchId, tournamentId } = req.body as {
    content?: string;
    matchId?: string;
    tournamentId?: string;
  };

  try {
    const message = await prisma.message.findUnique({
      where: { id: Number(messageId) },
      include: { chat: { include: { members: true } } },
    });

    if (!message) throw new Error("Message not found");
    if (message.senderId !== userId)
      throw new Error("Only the sender can edit the message");

    const type = matchId
      ? "INVITE_MATCH"
      : tournamentId
      ? "INVITE_TOURNAMENT"
      : "TEXT";
    if (type !== message.type)
      throw new Error("Cannot change message with different type");

    const targetIds = message.chat.members
      .filter((m: any) => m.userId !== userId)
      .map((m: any) => m.userId);
    const onlineUsers = await getOnlineUsers();
    const status = onlineUsers.includes(targetIds[0]) ? "DELIVERED" : "SENT";

    const data = await prisma.message.update({
      where: { id: Number(messageId) },
      data: {
        isEdited: true,
        status,
        content: content ? content : null,
        matchId: matchId ? String(matchId) : null,
        tournamentId: tournamentId ? String(tournamentId) : null,
      },
    });

    const dataToSend = {
      type: "editMessage",
      fromId: userId,
      targetId: targetIds,
      data,
    };
    await sendDataToQueue(dataToSend, "eventhub");
  } catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

export async function deleteMessageHandler(
  req: FastifyRequest,
  res: FastifyReply
) {
  const respond: ApiResponse<null> = {
    success: true,
    message: "Message deleted successfully",
  };
  const headers = req.headers as { "x-user-id": string };
  const userId = headers["x-user-id"];

  const { messageId } = req.params as { messageId: string };

  try {
    const message = await prisma.message.findUnique({
      where: { id: Number(messageId) },
      include: { chat: { include: { members: true } } },
    });
    if (!message) throw new Error("Message not found");
    if (message.senderId !== userId)
      throw new Error("Only the sender can delete the message");

    await prisma.message.delete({ where: { id: Number(messageId) } });

    const targetIds = message.chat.members
      .filter((m: any) => m.userId !== userId)
      .map((m: any) => m.userId);
    const dataToSend = {
      type: "deleteMessage",
      fromId: userId,
      targetId: targetIds,
      data: { messageId },
    };
    await sendDataToQueue(dataToSend, "eventhub");
  } catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

export async function replyToMessageHandler(
  req: FastifyRequest,
  res: FastifyReply
) {
  const headers = req.headers as { "x-user-id": string };
  const senderId = headers["x-user-id"];

  const { messageId } = req.params as { messageId: string };
  const { content } = req.body as { content: string };

  try {
    const originalMessage = await prisma.message.findUnique({
      where: { id: Number(messageId) },
      include: { chat: { include: { members: true } } },
    });

    if (!originalMessage) throw new Error("Original message not found");

    const targetIds = originalMessage.chat.members
      .filter((m: any) => m.userId !== senderId)
      .map((m: any) => m.userId);
    const onlineUsers = await getOnlineUsers();
    const status = onlineUsers.includes(targetIds[0]) ? "DELIVERED" : "SENT";

    const replyMessage = await prisma.message.create({
      data: {
        chatId: originalMessage.chatId,
        content,
        status,
        senderId,
        replyToId: Number(messageId),
      },
      include: {
        sender: true,
        reactions: true,
        replyTo: {
          include: { sender: true },
        },
      },
    });

    const dataToSend = {
      type: "newMessage",
      fromId: senderId,
      targetId: targetIds,
      data: replyMessage,
    };
    return res.send({
      success: true,
      message: "Reply sent successfully",
      data: replyMessage,
    });
    await sendDataToQueue(dataToSend, "eventhub");
  } catch (error) {
    sendError(res, error);
  }
}

export async function addReactionHandler(
  req: FastifyRequest,
  res: FastifyReply
) {
  const respond: ApiResponse<any> = {
    success: true,
    message: "Reaction added successfully",
    data: null,
  };

  const headers = req.headers as { "x-user-id": string };
  const userId = headers["x-user-id"];

  const { messageId } = req.params as { messageId: string };
  const { emoji } = req.body as { emoji: string };

  try {
    const message = await prisma.message.findUnique({
      where: { id: Number(messageId) },
      include: { chat: { include: { members: true } } },
    });
    if (!message) throw new Error("Message not found");

    await prisma.reaction.upsert({
      where: {
        messageId_userId: {
          messageId: Number(messageId),
          userId,
        },
      },
      update: { emoji: emoji as ReactionType },
      create: {
        messageId: Number(messageId),
        userId,
        emoji: emoji as ReactionType,
      },
    });

    const updatedMessage = await prisma.message.findUnique({
      where: { id: Number(messageId) },
      include: {
        sender: { select: { id: true, username: true, avatar: true } },
        reactions: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    });

    respond.data = updatedMessage;

    const targetIds = message.chat.members
      .filter((m: any) => m.userId !== userId)
      .map((m: any) => m.userId);

    const dataToSend = {
      type: "newReaction",
      fromId: userId,
      targetId: targetIds,
      data: updatedMessage,
    };

    await sendDataToQueue(dataToSend, "eventhub");
  } catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

export async function removeReactionHandler(
  req: FastifyRequest,
  res: FastifyReply
) {
  const respond: ApiResponse<null> = {
    success: true,
    message: "Reaction removed successfully",
  };
  const headers = req.headers as { "x-user-id": string };
  const userId = headers["x-user-id"];

  const { messageId } = req.params as { messageId: string };

  try {
    const message = await prisma.message.findUnique({
      where: { id: Number(messageId) },
      include: { chat: { include: { members: true } } },
    });
    if (!message) throw new Error("Message not found");

    await prisma.reaction.delete({
      where: {
        messageId_userId: {
          messageId: Number(messageId),
          userId: userId,
        },
      },
    });

    const targetIds = message.chat.members
      .filter((m: any) => m.userId !== userId)
      .map((m: any) => m.userId);
    const dataToSend = {
      type: "removeReaction",
      fromId: userId,
      targetId: targetIds,
      data: { messageId },
    };
    await sendDataToQueue(dataToSend, "eventhub");
  } catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

export async function markMessagesAsRead(
  req: FastifyRequest,
  res: FastifyReply
) {
  const respond: ApiResponse<{ updatedCount: number }> = {
    success: true,
    message: "Messages marked as read successfully",
  };
  const headers = req.headers as { "x-user-id": string };
  const userId = headers["x-user-id"];

  const { chatId } = req.params as { chatId: string };

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: Number(chatId) },
      include: { members: true },
    });
    if (!chat) throw new Error("Chat not found");

    const isMember = chat.members.some((m: any) => m.userId === userId);
    if (!isMember) throw new Error("You are not a member of this chat");

    const result = await prisma.message.updateMany({
      where: {
        chatId: Number(chatId),
        senderId: { not: userId },
        status: { not: "READ" },
      },
      data: { status: "READ" },
    });

    respond.data = { updatedCount: result.count };
  } catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}
