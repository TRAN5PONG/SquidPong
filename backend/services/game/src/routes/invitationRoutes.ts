import { FastifyInstance } from "fastify";

import {
  AcceptInvitation,
  CancelInvitation,
  createInvitation,
  DeclineInvitation,
  deleteInvitation,
  getInvitation,
  getInvitationByCode,
  listInvitations,
} from "../controllers/invitationController";
import { createInvitationValidator } from "../validators/invitationValidators";

export async function invitationRoutes(server: FastifyInstance) {
  server.post(
    "/api/game/invitations",
    {
      schema: {
        body: createInvitationValidator.body,
      },
    },
    createInvitation
  );
  // Get invitation by ID
  server.get(
    "/invitations/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
      },
    },

    getInvitation
  );
  // Get invitation by code
  server.get(
    "/api/game/invitations/code/:code",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            code: { type: "string" },
          },
          required: ["code"],
        },
      },
    },
    getInvitationByCode
  );
  // List invitations for a user
  server.get(
    "/api/game/invitations/user/:userId",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            userId: { type: "string" },
          },
          required: ["userId"],
        },
      },
    },
    listInvitations
  );
  // Cancel invitation
  server.post(
    "/api/game/invitations/:id/cancel",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
      },
    },
    CancelInvitation
  );
  // Delete invitation (dev mode only)
  server.post(
    "/api/game/invitations/:id/delete",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
      },
    },
    deleteInvitation
  );
  // Accept invit
  server.post(
    "/api/game/invitations/:id/accept",
    {
      schema: {
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
      },
    },
    AcceptInvitation
  );

  // decline invitation
  server.post(
    "/api/game/invitations/:id/decline",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
      },
    },
    DeclineInvitation
  );
}
