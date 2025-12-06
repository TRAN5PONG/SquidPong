// | **Route**                | **Method** | **Description**                                                |
// | ------------------------ | ---------- | -------------------------------------------------------------- |
// | `/matches/:matchId/bets` | `GET`      | Get all bets for a match.                                      |
// | `/matches/:matchId/bet`  | `POST`     | Place a bet on a match. Body: `{ amount, predictedWinnerId }`. |
// | `/bets/:betId`           | `GET`      | Get details of a specific bet.                                 |
// | `/bets/:betId/cancel`    | `POST`     | Cancel a pending bet (before match starts).                    |
import { FastifyInstance } from "fastify";

import {
  cancelBet,
  getBetDetails,
  getBetsForMatch,
  placeBet,
} from "../controllers/betsController";


export async function betsRoutes(fastify: FastifyInstance) {
  fastify.get(
	"/api/game/matches/:matchId/bets",
	getBetsForMatch
  );

  fastify.post(
	"/api/game/matches/:matchId/bet",
	placeBet
  );

  fastify.get(
	"/api/game/bets/:betId",
	getBetDetails
  );

  fastify.post(
	"/api/game/bets/:betId/cancel",
	cancelBet
  );
}