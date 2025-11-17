import { RouteHandlerMethod, FastifySchema } from 'fastify';
import * as tournamentController from '../controllers/tournamentControllers';
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
  method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH';
  url: string;
  handler: RouteHandlerMethod;
  schema?: FastifySchema;
};

const tournamentRoutes: Route[] = [
  // Get tournaments
  { method: 'GET', url: '/api/tournament/tournaments', handler: tournamentController.getTournaments },
  { method: 'GET', url: '/api/tournament/tournaments/:id', handler: tournamentController.getTournament },

  // Update status
  { method: 'POST', url: '/api/tournament/tournaments/:id/status', handler: tournamentController.updateTournamentStatus, schema: updateTournamentStatusSchema },

  // Tournament management
  { method: 'POST', url: '/api/tournament/tournaments', handler: tournamentController.createTournament, schema: createTournamentSchema },
  { method: 'DELETE', url: '/api/tournament/tournaments/:id', handler: tournamentController.deleteTournament, schema: deleteTournamentSchema },

  // Participation
  { method: 'POST', url: '/api/tournament/tournaments/:tournamentId/join', handler: tournamentController.joinTournament, schema: joinTournamentSchema },
  { method: 'POST', url: '/api/tournament/tournaments/:tournamentId/leave', handler: tournamentController.leaveTournament, schema: LeaveTournamentSchema },

  // Core
  { method: 'POST', url: '/api/tournament/tournaments/:id/start', handler: tournamentController.TournamentStart, schema: StartTournamentSchema },
  { method: 'POST', url: '/api/tournament/tournaments/:tournamentId/reportMatchResult/:matchId', handler: tournamentController.reportMatchResult, schema: reportMatchResultSchema },
];

export { tournamentRoutes };