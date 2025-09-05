// | **Route**                | **Method** | **Description**                                                |
// | ------------------------ | ---------- | -------------------------------------------------------------- |
// | `/matches/:matchId/bets` | `GET`      | Get all bets for a match.                                      |
// | `/matches/:matchId/bet`  | `POST`     | Place a bet on a match. Body: `{ amount, predictedWinnerId }`. |
// | `/bets/:betId`           | `GET`      | Get details of a specific bet.                                 |
// | `/bets/:betId/cancel`    | `POST`     | Cancel a pending bet (before match starts).                    |
