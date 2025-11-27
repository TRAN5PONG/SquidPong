import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../db/database";
import { ApiResponse, sendError, verifyFriendship } from "../utils/helper";
import { Message } from "../utils/types";
import { chatMessages } from "../utils/RespondMessage";
import { findChatBetweenUsers } from "../utils/chat";
import { fetchAndEnsureUser } from "../utils/helper";
import { checkSecretToken } from "../utils/helper";
import { sendDataToQueue } from "../integration/rabbitmq.integration";
import { getOnlineUsers } from "../integration/redis.integration";
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

  const headers = req.headers as { "x-user-id": string };
  const userId = headers["x-user-id"];

  const { friendId } = req.body as { friendId: string };

  try {
    checkSecretToken(req);

    const chatId = await findChatBetweenUsers(Number(userId), Number(friendId));
    if (!chatId) throw new Error("Chat not found between users");

    // Check if it's a private chat (not a group)
    const chat = await prisma.chat.findUnique({
      where: { id: Number(chatId) },
      include: { group: true },
    });

    if (chat?.group)
      throw new Error(
        "Cannot delete group chat. Use remove group endpoint instead"
      );

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
        group: { include: { members: true } },
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
      group: fullChat.group || null,
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
  try 
  {
    const recentChats = await prisma.chat.findMany({
      where: {
        members: { some: { userId } },
        OR: [
          { group: { is: null } },
          { group: { is: { matchId: null } } },
        ],
      },
      orderBy: {},
      include: {
        members: { include: { user: true } },
        group: true,
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
        group: chat.group || null,
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

export async function blockFriendInChatHandler(
  req: FastifyRequest,
  res: FastifyReply
) {
  const respond: ApiResponse<null> = {
    success: true,
    message: "Friend blocked in chat successfully",
  };

  const { userId, friendId } = req.body as { userId: string; friendId: string };

  try {
    checkSecretToken(req);

    const chatId = await findChatBetweenUsers(Number(userId), Number(friendId));
    if (!chatId) throw new Error("No chat found between users");

    await prisma.chat.update({
      where: { id: Number(chatId) },
      data: {
        members: {
          updateMany: {
            where: { userId },
            data: { isBlocked: true },
          },
        },
      },
    });

    console.log(
      `User ${userId} blocked in chat ${chatId} with friend ${friendId}`
    );
  } catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

export async function unblockFriendInChatHandler(
  req: FastifyRequest,
  res: FastifyReply
) {
  const respond: ApiResponse<null> = {
    success: true,
    message: "Friend unblocked in chat successfully",
  };

  const { userId, friendId } = req.body as { userId: string; friendId: string };

  try {
    checkSecretToken(req);

    const chatId = await findChatBetweenUsers(Number(userId), Number(friendId));
    if (!chatId) throw new Error("No chat found between users");

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

    console.log(
      `User ${userId} unblocked in chat ${chatId} with friend ${friendId}`
    );
  } catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

// ------------------- Message Endpoints -------------------
async function getOrCreateChat(userId: string, receiverId: string) {
  let chat = await prisma.chat.findFirst({
    where: {
      members: {
        every: { userId: { in: [userId, receiverId] } },
      },
    },
  });

  if (!chat) {
    chat = await prisma.chat.create({
      data: {
        members: {
          create: [{ userId }, { userId: receiverId }],
        },
      },
    });
  }

  return chat.id;
}

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

  const { chatId, receiverId, content, invitationCode, tournamentId } = req.body as {
    chatId?: number;
    receiverId?: string;
    content?: string;
    invitationCode?: string;
    tournamentId?: string;
  };

  try {
    let finalChatId = chatId;

    // --- NEW PART ---
    // If chatId is not provided but receiverId is
    if (!finalChatId && receiverId) {
      finalChatId = await getOrCreateChat(senderId, receiverId);
    }

    if (!finalChatId)
      throw new Error("Must provide either chatId or receiverId");

    // ----------------

    const chat = await prisma.chat.findUnique({
      where: { id: Number(finalChatId) },
      select: { members: true },
    });

    if (!chat) throw new Error("Chat not found");

    // Check if sender is blocked
    const isSenderBlocked = chat.members.some(
      (m: any) => m.userId === senderId && m.isBlocked
    );
    if (isSenderBlocked) throw new Error("You are blocked in this chat");

    const type = invitationCode
      ? "INVITE_MATCH"
      : tournamentId
      ? "INVITE_TOURNAMENT"
      : "TEXT";

    // Check if receiver blocked the sender
    const receiverBlockedSender = chat.members.some(
      (m: any) => m.userId !== senderId && m.isBlocked
    );

    let status: "SENT" | "DELIVERED" | "BLOCKED" = "SENT";
    let shouldDeliver = true;

    if (receiverBlockedSender) {
      status = "BLOCKED";
      shouldDeliver = false;
    } else {
      const targetIds = chat.members
        .filter((m: any) => m.userId !== senderId && !m.isBlocked)
        .map((m: any) => m.userId);

      const online = await getOnlineUsers();
      status = online.includes(targetIds[0]) ? "DELIVERED" : "SENT";
    }

    const data = await prisma.message.create({
      data: {
        chatId: Number(finalChatId),
        content: content || null,
        senderId,
        status,
        type,
        invitationCode: invitationCode ?? null,
        tournamentId: tournamentId ?? null,
      },
      include: { sender: true, reactions: true },
    });

    if (shouldDeliver) {
      const targetIds = chat.members
        .filter((m: any) => m.userId !== senderId && !m.isBlocked)
        .map((m: any) => m.userId);

      await sendDataToQueue(
        {
          type: "newMessage",
          fromId: senderId,
          targetId: targetIds,
          data,
        },
        "eventhub"
      );
    }

    respond.data = data;
  } catch (error) {
    return sendError(res, error);
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
  const { content, invitationCode, tournamentId } = req.body as {
    content?: string;
    invitationCode?: string;
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

    // Blocked messages cannot be edited or change status
    if (message.status === "BLOCKED")
      throw new Error("Cannot edit blocked messages");

    const type = invitationCode
      ? "INVITE_MATCH"
      : tournamentId
      ? "INVITE_TOURNAMENT"
      : "TEXT";
    if (type !== message.type)
      throw new Error("Cannot change message with different type");

    const targetIds = message.chat.members
      .filter((m: any) => m.userId !== userId && !m.isBlocked)
      .map((m: any) => m.userId);
    const onlineUsers = await getOnlineUsers();
    const status = onlineUsers.includes(targetIds[0]) ? "DELIVERED" : "SENT";

    const data = await prisma.message.update({
      where: { id: Number(messageId) },
      data: {
        isEdited: true,
        status,
        content: content ? content : null,
        invitationCode: invitationCode ? String(invitationCode) : null,
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

    const data = await prisma.message.update({
      where: { id: Number(messageId) },
      data: { isDeleted: true, content: `message deleted.` },
    });

    const targetIds = message.chat.members
      .filter((m: any) => m.userId !== userId && !m.isBlocked)
      .map((m: any) => m.userId);
    const dataToSend = {
      type: "deleteMessage",
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

    const isBlocked = originalMessage.chat.members.some(
      (m: any) => m.userId === senderId && m.isBlocked
    );
    if (isBlocked) throw new Error("You are blocked in this chat");

    const targetIds = originalMessage.chat.members
      .filter((m: any) => m.userId !== senderId && !m.isBlocked)
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
    await sendDataToQueue(dataToSend, "eventhub");

    return res.send({
      success: true,
      message: "Reply sent successfully",
      data: replyMessage,
    });
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

    const isBlocked = message.chat.members.some(
      (m: any) => m.userId === userId && m.isBlocked
    );
    if (isBlocked) throw new Error("You are blocked in this chat");

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
        sender: true,
        reactions: {
          include: {
            user: true,
          },
        },
      },
    });

    respond.data = updatedMessage;

    const targetIds = message.chat.members
      .filter((m: any) => m.userId !== userId && !m.isBlocked)
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

    const isBlocked = message.chat.members.some(
      (m: any) => m.userId === userId && m.isBlocked
    );
    if (isBlocked) throw new Error("You are blocked in this chat");

    await prisma.reaction.delete({
      where: {
        messageId_userId: {
          messageId: Number(messageId),
          userId: userId,
        },
      },
    });

    const targetIds = message.chat.members
      .filter((m: any) => m.userId !== userId && !m.isBlocked)
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
  const respond: ApiResponse<null> = {
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

    // Update messages to READ, but exclude BLOCKED messages (they must stay BLOCKED permanently)
    const result = await prisma.message.updateMany({
      where: {
        chatId: Number(chatId),
        senderId: { not: userId },
        status: { notIn: ["READ", "BLOCKED"] },
      },
      data: { status: "READ" },
    });

    const targetIds = chat.members
      .filter((m: any) => m.userId !== userId && !m.isBlocked)
      .map((m: any) => m.userId);
    const dataToSend = {
      type: "messagesRead",
      fromId: userId,
      targetId: targetIds,
      data: { chatId: Number(chatId) },
    };
    await sendDataToQueue(dataToSend, "eventhub");
  } catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}
