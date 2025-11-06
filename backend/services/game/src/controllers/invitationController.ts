import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma";
import { User } from "../types/users";
import { MatchFromInvitation } from "./matchController";
import { sendDataToQueue } from "../integration/rabbitmqClient";

interface CreateInvitationBody {
  receiverId: string | null;
  expiresAt: string;
  scoreLimit: 5 | 10 | 15 | 20;
  pauseTime: 30 | 60 | 90; // in seconds
  allowPowerUps: boolean;
  requiredCurrency: number;
  message?: string; // Optional message for the invitation
}
export function generateInviteCode(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result; // e.g., "A7B9C2X1"
}

// Create an invitation
export async function createInvitation(
  request: FastifyRequest<{ Body: CreateInvitationBody }>,
  reply: FastifyReply
) {
  const {
    receiverId,
    allowPowerUps,
    expiresAt,
    pauseTime,
    requiredCurrency,
    scoreLimit,
    message,
  } = request.body;

  try {
    // validate user data
    const userId = Number(request.headers["x-user-id"]);
    const res = await fetch(`http://user:4002/api/user/id/${userId}`);
    if (!res.ok) return reply.status(404).send({ error: "Sender not found" });

    const Resp = await res.json();
    const userData = Resp.data as User;

    if (userData.walletBalance < requiredCurrency) {
      return reply.status(400).send({
        error: "you do not have enough coins for this game.",
      });
    }

    // validate receiver if provided
    let receiverData = null;
    if (receiverId === userData.id) {
      return reply
        .status(400)
        .send({ error: "You cannot send an invitation to yourself." });
    }
    if (receiverId) {
      const res = await fetch(`http://user:4002/api/user/id/${receiverId}`);
      if (!res.ok)
        return reply.status(404).send({ error: "Receiver not found" });

      const receiverResp = await res.json();
      receiverData = receiverResp.data;

      if (receiverData?.walletBalance < requiredCurrency) {
        return reply.status(400).send({
          error: "Receiver does not have enough coins for this game.",
        });
      }
    }

    // Auto-expire old invitations first
    await prisma.invitation.updateMany({
      where: {
        status: "PENDING",
        expiresAt: { lte: new Date() },
      },
      data: {
        status: "EXPIRED",
      },
    });

    // validate user's create invitation limit
    const userInvitationsCount = await prisma.invitation.count({
      where: {
        senderId: userData.id,
        status: "PENDING",
        OR: [
          { expiresAt: { gt: new Date() } }, // not expired
          { expiresAt: null }, // never expires
        ],
      },
    });

    if (userInvitationsCount > 0)
      return reply.status(400).send({
        error: `You only can create one PENDING invitation at a time.`,
        userData,
      });

    // Create the invitation
    const result = await prisma.$transaction(async (tx) => {
      // Ensure sender exist locally
      await tx.user.upsert({
        where: { id: userData.id },
        update: {
          userId: userData.userId,
        },
        create: {
          id: userData.id,
          userId: userData.userId,
          stats: { create: {} },
        },
      });

      // Ensure receiver exists locally if provided
      if (receiverData) {
        await tx.user.upsert({
          where: { id: receiverData.id },
          update: {
            userId: receiverData.userId,
          },
          create: {
            id: receiverData.id,
            userId: receiverData.userId,
            stats: { create: {} },
          },
        });
      }

      // Create the invitation
      const inviteCode = generateInviteCode();
      const invitation = await tx.invitation.create({
        data: {
          senderId: userData.id,
          receiverId: receiverId ? receiverData.id : null,
          expiresAt,
          scoreLimit,
          pauseTime,
          allowPowerUps,
          requiredCurrency,
          message: message || null,
          inviteCode,
          type: receiverId ? "PRIVATE" : "PUBLIC",
        },
        include: {
          sender: true,
          receiver: true,
        },
      });

      // Send real-time notification to receiver if applicable
      if (receiverId) {
        try {
          await sendDataToQueue(
            {
              targetId: String(receiverData.userId),
              event: "game-invitation",
              data: {
                invitation: invitation,
              },
            },
            "broadcastData"
          );
        } catch (error) {
          console.error("Error sending invitation notification:", error);
        }
      }
      return invitation;
    });

    // Send the response
    return reply.status(201).send(result);
  } catch (error) {
    console.error("=============ERROR :", error);
    return reply.status(400).send({ error: "Error while creating invitation" });
  }
}

// Get an invitation by ID
export async function getInvitation(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params;

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: {
        sender: true,
        receiver: true,
      },
    });

    if (!invitation) {
      return reply.status(404).send({ error: "Invitation not found" });
    }

    return reply.status(200).send(invitation);
  } catch (error) {
    return reply.status(404).send({ error: "Invitation not found" });
  }
}
// Get an invitation by code
export async function getInvitationByCode(
  request: FastifyRequest<{ Params: { code: string } }>,
  reply: FastifyReply
) {
  const { code } = request.params;

  try {
    const invitation = await prisma.invitation.findFirst({
      where: { inviteCode: code },
      include: {
        sender: true,
        receiver: true,
      },
    });

    if (!invitation) {
      return reply.status(404).send({ error: "Invitation not found" });
    }

    return reply.status(200).send(invitation);
  } catch (error) {
    return reply.status(404).send({ error: "Invitation not found" });
  }
}

// Accept an invitation
export async function AcceptInvitation(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params;

  // validate user data
  const userId = Number(request.headers["x-user-id"]);

  const res = await fetch(`http://user:4002/api/user/id/${userId}`);

  if (!res.ok) return reply.status(404).send({ error: "User not found" });

  const Resp = await res.json();
  const userData: User = Resp.data;

  // Fetch invitation
  const invitation = await prisma.invitation.findUnique({ where: { id } });
  if (!invitation)
    return reply.status(404).send({ error: "Invitation not found" });

  // Make sure this user can accept
  if (invitation.receiverId && invitation.receiverId !== userData.id)
    return reply
      .status(403)
      .send({ error: "You can only accept invitations sent to you" });

  // Check status
  if (invitation.status !== "PENDING")
    return reply
      .status(400)
      .send({ error: "Only pending invitations can be accepted" });

  // Expiration handling
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    await prisma.invitation.update({
      where: { id },
      data: { status: "EXPIRED" },
    });
    return reply.status(400).send({ error: "Invitation has expired" });
  }

  // Ensure receiver exist locally
  await prisma.user.upsert({
    where: { id: userData.id },
    update: {
      userId: userData.userId,
    },
    create: {
      id: userData.id,
      userId: userData.userId,
      stats: { create: {} },
    },
  });

  // Accept
  const acceptedInvitation = await prisma.invitation.update({
    where: { id },
    data: { status: "ACCEPTED", receiverId: userData.id },
    include: { sender: true, receiver: true },
  });
  // create a match based on the invitation
  try {
    const match = await MatchFromInvitation(acceptedInvitation);

    if (!match) {
      throw new Error("Failed to create match from invitation");
    }

    // notify sender via rmq, while the receiver would notified by the response
    try {
      await sendDataToQueue(
        {
          targetId: String(acceptedInvitation.sender?.userId),
          event: "game-invitation",
          data: {
            invitation: acceptedInvitation,
            match,
          },
        },
        "broadcastData"
      );
    } catch (err) {
      console.error("Error sending match notification:", err);
    }

    return reply.status(200).send({
      message: "Invitation accepted and match created successfully",
      data: {
        invitation: acceptedInvitation,
        match,
      },
    });
  } catch (error) {
    console.error("Error creating match from invitation:", error);
    return reply
      .status(500)
      .send({ error: "Invitation accepted but failed to create match" });
  }
}

// Decline an invitation by ID
export async function DeclineInvitation(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params;

  // validate user data
  const userId = Number(request.headers["x-user-id"]);
  const res = await fetch(`http://user:4002/api/user/id/${userId}`);
  if (!res.ok) return reply.status(404).send({ error: "Sender not found" });

  const Resp = await res.json();
  const userData = Resp.data as User;

  // check if the user is the receiver of the invitation
  const invitation = await prisma.invitation.findUnique({
    where: { id: id },
  });
  if (!invitation) {
    return reply.status(404).send({ error: "Invitation not found" });
  }

  if (invitation.receiverId !== userData.id) {
    return reply
      .status(403)
      .send({ error: "You can only decline invitations sent to you" });
  }

  // check if the invitation is still pending
  if (invitation.status !== "PENDING") {
    return reply
      .status(400)
      .send({ error: "Only pending invitations can be declined" });
  }
  // check if the invitation is expired
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    // auto-expire the invitation
    await prisma.invitation.update({
      where: { id: id },
      data: { status: "EXPIRED" },
    });
    return reply.status(400).send({ error: "Invitation has expired" });
  }

  // Decline the invitation
  try {
    const declinedInvitation = await prisma.invitation.update({
      where: { id: id },
      data: { status: "DECLINED" },
      include: { sender: true, receiver: true },
    });
    // Notify sender
    try {
      await sendDataToQueue(
        {
          targetId: String(declinedInvitation.sender?.userId),
          event: "game-invitation",
          data: {
            invitation: declinedInvitation,
          },
        },
        "broadcastData"
      );
    } catch (error) {
      console.error("Error sending decline notification:", error);
    }

    // Send response
    return reply
      .status(200)
      .send({ message: "Invitation declined successfully" });
  } catch (error) {
    return reply
      .status(400)
      .send({ error: "Error while declining invitation" });
  }
}

// Cancel an invitation by ID (sender only)
export async function CancelInvitation(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params;

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id: id },
    });

    if (!invitation) {
      return reply.status(404).send({ error: "Invitation not found" });
    }

    if (invitation.status !== "PENDING") {
      return reply
        .status(400)
        .send({ error: "Only pending invitations can be cancelled" });
    }

    // validate user data
    const userId = Number(request.headers["x-user-id"]);
    const res = await fetch(`http://user:4002/api/user/id/${userId}`);

    if (!res.ok) return reply.status(404).send({ error: "Sender not found" });

    const Resp = await res.json();
    const userData = Resp.data as User;

    if (invitation.senderId !== userData.id) {
      return reply
        .status(403)
        .send({ error: "You can only cancel your own invitations" });
    }

    const cancelledInvitation = await prisma.invitation.update({
      where: { id: id },
      data: { status: "CANCELLED" },
      include: { sender: true, receiver: true },
    });

    // Notify receiver if applicable
    if (invitation.receiverId) {
      try {
        await sendDataToQueue(
          {
            targetId: String(cancelledInvitation.receiver?.userId),
            event: "game-invitation",
            data: {
              invitation: cancelledInvitation,
            },
          },
          "broadcastData"
        );
      } catch (error) {
        console.error("Error sending cancellation notification:", error);
      }
    }
    return reply
      .status(200)
      .send({ message: "Invitation cancelled successfully" });
  } catch (error) {
    return reply
      .status(400)
      .send({ error: "Error while cancelling invitation" });
  }
}

// List all invitations for a user
export async function listInvitations(
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) {
  const { userId } = request.params;

  try {
    const invitations = await prisma.invitation.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: true,
        receiver: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!invitations || invitations.length === 0) {
      return reply.status(404).send({ error: "No invitations found" });
    } else {
      return reply.status(200).send(invitations);
    }
  } catch (error) {
    console.error("=============ERROR :", error);
    return reply.status(400).send({ error: "Error while listing invitations" });
  }
}

// Delete an invitation by ID (admin only)
export async function deleteInvitation(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params;

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      return reply.status(404).send({ error: "Invitation not found" });
    }

    await prisma.invitation.delete({
      where: { id },
    });

    return reply
      .status(200)
      .send({ message: "Invitation deleted successfully" });
  } catch (error) {
    return reply.status(400).send({ error: "Error while deleting invitation" });
  }
}
