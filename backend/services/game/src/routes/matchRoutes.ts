// | **Route**                  | **Method** | **Description**                                                                     |
// | -------------------------- | ---------- | ----------------------------------------------------------------------------------- |
// | `/matches`                 | `POST`     | Create a new match. Body includes mode, opponent IDs, and rules.                    |
// | `/matches/:matchId`        | `GET`      | Get match details including players, spectators, bets.                              |
// | `/matches`                 | `GET`      | List ongoing / waiting / completed matches. Use query params like `status=WAITING`. |
// | `/matches/:matchId/join`   | `POST`     | Join an existing match as a player.                                                 |
// | `/matches/:matchId/leave`  | `POST`     | Leave a match (before it starts).                                                   |
// | `/matches/:matchId/start`  | `POST`     | Mark match status as `IN_PROGRESS`. Only host can trigger.                          |
// | `/matches/:matchId/finish` | `POST`     | Finish the match, update scores, winner, rank points, etc.                          |
// | `/matches/:matchId/cancel` | `POST`     | Cancel a match (e.g., timeout, host quits).                                         |

// | **Route**                            | **Method** | **Description**                             |
// | ------------------------------------ | ---------- | ------------------------------------------- |
// | `/matches/:matchId/players`          | `GET`      | Get players in a match.                     |
// | `/matches/:matchId/players/:id`      | `GET`      | Get a specific player’s info.               |
// | `/matches/:matchId/ready`            | `POST`     | Set player ready status (`isReady = true`). |
// | `/matches/:matchId/unready`          | `POST`     | Set player unready (`isReady = false`).     |
// | `/matches/:matchId/player/character` | `PUT`      | Change selected character before start.     |
// | `/matches/:matchId/player/paddle`    | `PUT`      | Change selected paddle skin before start.   |

import { FastifyInstance } from "fastify";

import {
  createMatch,
  getMatch,
  getCurrenMatch,
  EndMatch,
  AiMatch,
  getActiveMatches,
} from "../controllers/matchController";
import {
  matchesParamsValidators,
  matchesValidators,
} from "../validators/matchesValidators";
import { getPlayerStats, getPlayerLastMatches } from "../controllers/statsController";

export async function matchRoutes(server: FastifyInstance) {
  // ai match
  server.post(
    "/api/game/ai/create",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            mode: { type: "string" },
            difficulty: { type: "string" },
          },
          required: ["mode", "difficulty"],
        },
      },
    },
    AiMatch
  );
  // get Match by ID
  server.get(
    "/api/game/match/:matchId",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            matchId: { type: "string" },
          },
          required: ["matchId"],
        },
      },
    },
    getMatch
  );
  // get all matches
  server.get(
    "/api/game/match/all",
    getActiveMatches
  )
  // current user's pending match (limited to one)
  server.get(
    "/api/game/match/current/:userId",
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
    getCurrenMatch
  );
  
  // Get last 5 matches for a player
  server.get(
    "/api/game/player/:playerId/last-matches",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            playerId: { type: "string" },
          },
          required: ["playerId"],
        },
      },
    },
    getPlayerLastMatches
  );

  server.get(
    "/api/game/player/:playerId/stats",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            playerId: { type: "string" },
          },
          required: ["playerId"],
        },
      },
    },
    getPlayerStats
  );
}
