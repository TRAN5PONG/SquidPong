export const createTournamentSchema = {
  body: {
    type: "object",
    required: ["name", "organizerId", "maxPlayers"],
    properties: {
      name: { type: "string" },
      organizerId: { type: "string" },
      maxPlayers: { type: "number", enum: [4, 8, 16, 32] },
      description: { type: "string", nullable: true },
      participationFee: { type: "number" },
    },
  },
};
export const deleteTournamentSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
};
export const joinTournamentSchema = {
  params: {
    type: "object",
    required: ["tournamentId"],
    properties: {
      tournamentId: { type: "string" },
    },
  },
  body: {
    type: "object",
    required: ["participantId"],
    properties: {
      participantId: { type: "string" },
    },
  },
};
export const updateTournamentStatusSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  body: {
    type: "object",
    required: ["nextStatus"],
    properties: {
      nextStatus: {
        type: "string",
        enum: [
          "REGISTRATION",
          "READY",
          "IN_PROGRESS",
          "COMPLETED",
          "CANCELLED",
        ],
      },
    },
  },
};
export const StartTournamentSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
};
export const LeaveTournamentSchema = {
  params: {
    type: "object",
    required: ["tournamentId"],
    properties: {
      tournamentId: { type: "string" },
    },
  },
  body: {
    type: "object",
    required: ["participantId"],
    properties: {
      participantId: { type: "string" },
    },
  },
};
export const reportMatchResultSchema = {
  params: {
    type: "object",
    required: ["tournamentId", "matchId"],
    properties: {
      tournamentId: { type: "string" },
      matchId: { type: "string" },
    },
  },
  body: {
    type: "object",
    required: ["winnerId", "loserId", "winnerScore", "loserScore"],
    properties: {
      winnerId: { type: "string" },
      loserId: { type: "string" },
      winnerScore: { type: "number" },
      loserScore: { type: "number" },
    },
  },
};
