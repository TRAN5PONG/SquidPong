import { Room } from "colyseus";
import { MatchState } from "./MatchRoom";
import { ballResetMessage } from "../types/match";

export class ScoringManager {
  private SERVES_PER_TURN = 2;
  private serveCount = 0;

  constructor(private room: Room<MatchState>) { }

  incrementScore(playerId: string) {
    const current = this.room.state.scores.get(playerId) || 0;
    this.room.state.scores.set(playerId, current + 1);

    const totalPoints = this.room.state.totalPointsScored;

    console.log(`Player ${playerId} scored a point. New score: ${current + 1}`);
    // if (current + 1 >= totalPoints) {
    //   this.room.state.phase = "ended";
    //   this.room.state.winnerId = playerId;
    //   this.room.broadcast("game:ended", { winnerId: playerId });
    // }
  }

  handleFailedServe(failingPlayerId: string) {
    console.log(`❌ Serve failed by player ${failingPlayerId}`);

    const playerIds = Array.from(this.room.state.players.keys());
    const opponentId = playerIds.find((id) => id !== failingPlayerId);

    if (!opponentId) {
      console.error("❌ Could not find opponent!");
      return;
    }

    // Opponent gets the point for failed serve
    this.incrementScore(opponentId);

    this.serveCount++;
    console.log(
      `📊 Failed serve counts. Serve count: ${this.serveCount}/${this.SERVES_PER_TURN} for server ${this.room.state.currentServer}`,
    );

    if (this.serveCount >= this.SERVES_PER_TURN) {
      this.room.state.currentServer = opponentId;
      this.serveCount = 0;
      console.log(
        `🔄 Switching server to ${this.room.state.currentServer} (completed ${this.SERVES_PER_TURN} serves)`,
      );
    }

    // Reset ball for next serve
    this.resetBallForServe(this.room.state.currentServer!);
  }

  resetBallForServe(nextServerId: string) {
    console.log(`🎾 Resetting ball for server: ${nextServerId}`);

    this.room.state.serveState = "waiting_for_serve";
    this.room.state.currentServer = nextServerId;
    this.room.state.lastHitPlayer = null;

    const serveMsg: ballResetMessage = {
      position: { x: 0, y: 4, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
    };

    this.room.broadcast("Ball:Reset", serveMsg);
  }

  handlePointEnd() {
    const lastHitter = this.room.state.lastHitPlayer;
    const playerIds = Array.from(this.room.state.players.keys());

    let pointWinner: string | null = null;

    if (!lastHitter) {
      // Ball went out without anyone hitting it - server fault
      const server = this.room.state.currentServer;
      pointWinner = playerIds.find((id) => id !== server) || null;
      console.log(`⚠️ Ball out with no hitter - Server ${server} faulted`);
    } else {
      // Last hitter hit it out - opponent gets the point
      pointWinner = playerIds.find((id) => id !== lastHitter) || null;
      console.log(
        `⚠️ Player ${lastHitter} hit ball out - Opponent ${pointWinner} gets point`,
      );
    }

    if (!pointWinner) {
      console.error("❌ Could not determine point winner!");
      return;
    }

    // Award the point
    this.incrementScore(pointWinner);

    this.serveCount++;
    console.log(
      `📊 Serve count: ${this.serveCount}/${this.SERVES_PER_TURN} for server ${this.room.state.currentServer}`,
    );

    if (this.serveCount >= this.SERVES_PER_TURN) {
      const nextServerId = playerIds.find(
        (id) => id !== this.room.state.currentServer,
      );
      this.room.state.currentServer =
        nextServerId || this.room.state.currentServer;
      this.serveCount = 0;
      console.log(
        `🔄 Switching server to ${this.room.state.currentServer} (completed ${this.SERVES_PER_TURN} serves)`,
      );
    }

    setTimeout(() => {
      this.resetBallForServe(this.room.state.currentServer!);
    }, 3000);
  }
}
