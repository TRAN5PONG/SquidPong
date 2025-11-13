import { MatchRoom } from "./MatchRoom";
import { ballResetMessage } from "../types/match";
import { prisma } from "../lib/prisma";

export class ScoringHandler {
  private SERVES_PER_TURN = 2;
  private serveCount = 0;
  private isProcessingPoint = false;

  constructor(private room: MatchRoom) { }

  incrementScore(playerId: string) {
    const current = this.room.state.scores.get(playerId) || 0;

    console.log(
      `➕ Incrementing score for player ${playerId}. Current score: ${current}`,
    );

    this.room.state.scores.set(playerId, current + 1);

    // const totalPoints = this.room.state.totalPointsScored;

    const totalPoints = 100;

    console.log(`🏆 Total points to win: ${totalPoints}`);

    console.log(`Player ${playerId} scored a point. New score: ${current + 1}`);

    // Check if game should end
    if (current + 1 >= totalPoints) {
      this.room.state.phase = "ended";
      this.room.state.winnerId = playerId;
      this.room.broadcast("game:ended", { winnerId: playerId });

      // Add match stats when game ends
      this.addMatchStats();
    }
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
    if (this.isProcessingPoint) {
      console.log("⚠️ Already processing point end - ignoring duplicate");
      return;
    }

    this.isProcessingPoint = true;
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
      this.isProcessingPoint = false;
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
      this.isProcessingPoint = false;
      this.resetBallForServe(this.room.state.currentServer!);
    }, 3000);
  }

  private async addMatchStats() {
    try {
      const matchId = this.room.metadata.matchId;
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          opponent1: { include: { User: { include: { stats: true } } } },
          opponent2: { include: { User: { include: { stats: true } } } },
        },
      });

      if (!match) {
        console.error("❌ Match not found in addMatchStats()");
        return;
      }

      // Determine winner and loser
      const winnerId = this.room.state.winnerId;
      const player1 = match.opponent1;
      const player2 = match.opponent2;

      if (!player1 || !player2) {
        console.error("❌ Missing one of the players");
        return;
      }

      const winner = [player1, player2].find((p) => p.id === winnerId);
      const loser = [player1, player2].find((p) => p.id !== winnerId);

      // Update MatchPlayers
      await prisma.matchPlayer.update({
        where: { id: player1.id },
        data: {
          finalScore: this.room.state.scores.get(player1.id) || 0,
          isWinner: player1.id === winnerId,
        },
      });

      await prisma.matchPlayer.update({
        where: { id: player2.id },
        data: {
          finalScore: this.room.state.scores.get(player2.id) || 0,
          isWinner: player2.id === winnerId,
        },
      });

      // Update Match itself
      await prisma.match.update({
        where: { id: matchId },
        data: { status: "COMPLETED", winnerId },
      });

      // Update stats if both have users
      const updates: Promise<any>[] = [];

      const updateUserStats = async (userId: string, won: boolean) => {
        const existing = await prisma.userStats.findUnique({
          where: { userId },
        });
        if (!existing) {
          // Create stats if missing
          await prisma.userStats.create({
            data: {
              userId,
              totalMatches: 1,
              played1v1: 1,
              won1v1: won ? 1 : 0,
              lost1v1: won ? 0 : 1,
            },
          });
        } else {
          // Update existing stats
          await prisma.userStats.update({
            where: { userId },
            data: {
              totalMatches: { increment: 1 },
              played1v1: { increment: 1 },
              won1v1: won ? { increment: 1 } : undefined,
              lost1v1: !won ? { increment: 1 } : undefined,
            },
          });
        }
      };

      if (winner?.userId) updates.push(updateUserStats(winner.userId, true));
      if (loser?.userId) updates.push(updateUserStats(loser.userId, false));

      await Promise.all(updates);

      console.log(`✅ Match stats updated for match ${matchId}`);
    } catch (err) {
      console.error("❌ Error updating match stats:", err);
    }
  }
}
