import { FastifyInstance } from "fastify";
import {
  createTournamentSchema,
  deleteTournamentSchema,
  joinTournamentSchema,
  LeaveTournamentSchema,
  reportMatchResultSchema,
  StartTournamentSchema,
  updateTournamentStatusSchema,
} from "../validators/tournamentValidator";
import {
  createTournament,
  deleteTournament,
  getTournament,
  getTournaments,
  joinTournament,
  leaveTournament,
  reportMatchResult,
  TournamentStart,
  updateTournamentStatus,
} from "../controllers/tournamentControllers";

export async function tournamentRoutes(fastify: FastifyInstance) {
  // Get Tournament (s)
  fastify.get("/tournaments", getTournaments);
  fastify.get("/tournaments/:id", getTournament);
  fastify.post(
    "/tournaments/:id/status",
    { schema: updateTournamentStatusSchema },
    updateTournamentStatus
  );

  // Tournament Management
  fastify.post(
    "/tournaments",
    {
      schema: createTournamentSchema,
    },
    createTournament
  );
  fastify.delete(
    "/tournaments/:id",
    {
      schema: deleteTournamentSchema,
    },
    deleteTournament
  );

  // Tournament Participation management
  fastify.post(
    "/tournaments/:tournamentId/join",
    { schema: joinTournamentSchema },
    joinTournament
  );
  fastify.post(
	"/tournaments/:tournamentId/leave",
	{ schema: LeaveTournamentSchema },
	leaveTournament
  );

  // Core
  fastify.post(
    "/tournaments/:id/start",
    { schema: StartTournamentSchema },
    TournamentStart
  );
  fastify.post(
	"/tournaments/:tournamentId/reportMatchResult/:matchId",
	{schema: reportMatchResultSchema},
  reportMatchResult
  )
  // fastify.post( // this endpoint is used by a user, whenever its opponent did not show up for a match whithin the time limit
	// "/tournaments/:id/claimMatchForfeit",
	// {}

  // )
}