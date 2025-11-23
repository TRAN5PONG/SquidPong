import { RouteHandlerMethod, FastifySchema } from "fastify";
import * as tournamentController from "../controllers/tournamentControllers";
import {
  createTournamentSchema,
  deleteTournamentSchema,
  joinTournamentSchema,
  LeaveTournamentSchema,
  reportMatchResultSchema,
  StartTournamentSchema,
  updateTournamentStatusSchema,
} from "../validators/tournamentValidators";

type Route = {
  method: "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
  url: string;
  handler: RouteHandlerMethod;
  schema?: FastifySchema;
};

const tournamentRoutes: Route[] = [
  // Get tournaments
  {
    method: "GET",
    url: "/api/tournament/tournaments",
    handler: tournamentController.getTournaments,
  },
  {
    method: "GET",
    url: "/api/tournament/tournaments/:id",
    handler: tournamentController.getTournament,
  },

  // Update status
  {
    method: "POST",
    url: "/api/tournament/tournaments/:id/status",
    handler: tournamentController.updateTournamentStatus,
    schema: updateTournamentStatusSchema,
  },

  // Tournament management
  {
    method: "POST",
    url: "/api/tournament/tournaments",
    handler: tournamentController.createTournament,
    schema: createTournamentSchema,
  },
  {
    method: "DELETE",
    url: "/api/tournament/tournaments/:id",
    handler: tournamentController.deleteTournament,
    schema: deleteTournamentSchema,
  },

  // Participation
  {
    method: "POST",
    url: "/api/tournament/tournaments/:tournamentId/join",
    handler: tournamentController.joinTournament,
    schema: joinTournamentSchema,
  },
  {
    method: "POST",
    url: "/api/tournament/tournaments/:tournamentId/leave",
    handler: tournamentController.leaveTournament,
    schema: LeaveTournamentSchema,
  },

  // Core
  {
    method: "POST",
    url: "/api/tournament/tournaments/:tournamentId/launch",
    handler: tournamentController.launchTournament,
    schema: StartTournamentSchema,
  },
  {
    method: "POST",
    url: "/api/tournament/tournaments/:tournamentId/reset",
    handler: tournamentController.resetTournament,
    schema: {
      params: {
        type: "object",
        properties: {
          tournamentId: { type: "string" },
        },
        required: ["tournamentId"],
      },
    },
  },
  // this should be fire by game service
  {
    method: "PUT",
    url: "/api/tournament/tournaments/:tournamentId/matches/:tournamentMatchId/link",
    handler: tournamentController.setTournamentMatchId,
    schema: {
      params: {
        type: "object",
        properties: {
          tournamentId: { type: "string" },
          tournamentMatchId: { type: "string" },
        },
        required: ["tournamentId", "tournamentMatchId"],
      },
      body: {
        type: "object",
        properties: {
          matchId: { type: "string" },
        },
        required: ["matchId"],
      },
    },
  },
  {
    method: "POST",
    url: "/api/tournament/tournaments/:tournamentId/reportMatchResult/:matchId",
    handler: tournamentController.reportMatchResult,
    schema: reportMatchResultSchema,
  },
{
  method: "GET",
  url: "/api/tournament/tournaments/search",
  schema: {
    querystring: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
  },
  handler: tournamentController.searchTournaments,
}
];

export { tournamentRoutes };
