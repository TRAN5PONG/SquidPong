// | **Route**             | **Method** | **Description**                           |
// | --------------------- | ---------- | ----------------------------------------- |
// | `/leaderboard`        | `GET`      | Global leaderboard based on score.        |
// | `/users/:userId/rank` | `GET`      | Get user's current rank & stats.          |

import { FastifyInstance } from "fastify";
import { getLeaderboard, getUserRank } from "../controllers/leaderboardController";

export async function leaderboardRoutes(server: FastifyInstance) {
  // Get global leaderboard
  server.get(
    "/api/game/leaderboard",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            limit: { type: "string" },
          },
        },
      },
    },
    getLeaderboard
  );

  // Get user rank
  server.get(
    "/api/game/user/:userId/rank",
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
    getUserRank
  );
}
