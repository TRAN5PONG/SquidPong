import { MatchRoom } from "./MatchRoom";
import { ballResetMessage } from "../types/match";
import { prisma } from "../lib/prisma";
import { EndMatch } from "../controllers/matchController";

export class ScoringHandler {
  private SERVES_PER_TURN = 2;
  private serveCount = 0;
  private isProcessingPoint = false;

  constructor(private room: MatchRoom) {}

  incrementScore(playerId: string) {
    const current = this.room.state.scores.get(playerId) || 0;

    this.room.state.scores.set(playerId, current + 1);

    const totalPoints = this.room.state.totalPointsScored;
    // const totalPoints = 1;

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

  handlePointEnd(bounceData?: {
    lastTableBounceSide: "LEFT" | "RIGHT" | null;
    serverSideBounced: boolean;
    lastHitPlayerId: string | null;
  }) {
    if (this.isProcessingPoint) {
      return;
    }

    this.isProcessingPoint = true;

    const lastHitter = this.room.state.lastHitPlayer;
    const playerIds = Array.from(this.room.state.players.keys());

    let pointWinner: string | null = null;

    if (!lastHitter) {
      const server = this.room.state.currentServer;
      pointWinner = playerIds.find((id) => id !== server) || null;
    } else {
      const lastHitterSide = this.getPlayerSide(lastHitter);
      const opponentSide = lastHitterSide === "LEFT" ? "RIGHT" : "LEFT";

      const bouncedOnOpponentSide =
        bounceData?.lastTableBounceSide === opponentSide;

      if (bouncedOnOpponentSide && bounceData?.serverSideBounced) {
        // Ball successfully bounced on opponent's side after bouncing on server's side
        // Last hitter wins the point
        pointWinner = lastHitter;
      } else {
        // Ball went out without bouncing on opponent's side correctly
        // Opponent gets the point
        pointWinner = playerIds.find((id) => id !== lastHitter) || null;
      }
    }

    if (!pointWinner) {
      this.isProcessingPoint = false;
      return;
    }

    this.incrementScore(pointWinner);

    this.serveCount++;

    if (this.serveCount >= this.SERVES_PER_TURN) {
      const nextServerId = playerIds.find(
        (id) => id !== this.room.state.currentServer
      );
      this.room.state.currentServer =
        nextServerId || this.room.state.currentServer;
      this.serveCount = 0;
    }

    setTimeout(() => {
      this.isProcessingPoint = false;
      this.resetBallForServe(this.room.state.currentServer!);
    }, 3000);
  }

  private getPlayerSide(playerId: string): "LEFT" | "RIGHT" | null {
    const player = this.room.state.players.get(playerId);
    if (!player) return null;

    // Host is always RIGHT, Guest is always LEFT
    return playerId === this.room.state.hostPlayerId ? "RIGHT" : "LEFT";
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

      // Calculate match duration
      const matchDuration = Math.floor(
        (Date.now() - this.room.state.gameStartAt) / 1000
      ); // in seconds

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

      if (match.tournamentId) {
        const resp = await fetch(
          `http://tournament:4006/api/tournament/tournaments/${match.tournamentId}/reportMatchResult/${match.tournamentMatchId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              winnerId: winner?.User?.userId,
              loserId: loser?.User?.userId,
              winnerScore: this.room.state.scores.get(winner?.id!) || 0,
              loserScore: this.room.state.scores.get(loser?.id!) || 0,
            }),
          }
        );
      }

      // Update Match itself
      await prisma.match.update({
        where: { id: matchId },
        data: { status: "COMPLETED", winnerId, confirmedAt: new Date() },
      });

      // Update comprehensive stats for both players
      const updates: Promise<any>[] = [];

      if (winner?.userId) {
        updates.push(
          this.updateUserStats(winner.userId, true, matchDuration, match.mode)
        );
      }
      if (loser?.userId) {
        updates.push(
          this.updateUserStats(loser.userId, false, matchDuration, match.mode)
        );
      }

      updates.push(
        (async () => {
          await fetch("/api/user/apply-match-result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              player1Id: player1.gmUserId,
              player2Id: player2.gmUserId,
              player1Result: winnerId === player1.id ? "WIN" : "LOSS",
              player2Result: winnerId === player2.id ? "WIN" : "LOSS",
            }),
          });
        })()
      );

      await Promise.all(updates);

      console.log(`✅ Match stats updated for match ${matchId}`);
    } catch (err) {
      console.error("❌ Error updating match stats:", err);
    }
  }

  private async updateUserStats(
    userId: string,
    won: boolean,
    matchDuration: number,
    gameMode: string
  ): Promise<void> {
    const existing = await prisma.userStats.findUnique({
      where: { userId },
    });

    if (!existing) {
      const isTournament = gameMode === "TOURNAMENT";
      const is1v1 = gameMode === "ONE_VS_ONE";

      await prisma.userStats.create({
        data: {
          userId,
          score: won ? 10 : 5,
          gamesPlayed: 1,
          // 1v1 Stats
          played1v1: is1v1 ? 1 : 0,
          won1v1: is1v1 && won ? 1 : 0,
          lost1v1: is1v1 && !won ? 1 : 0,
          // Tournament Stats
          playedTournament: isTournament ? 1 : 0,
          wonTournament: isTournament && won ? 1 : 0,
          lostTournament: isTournament && !won ? 1 : 0,
          // vs AI Stats (not applicable for 1v1)
          playedVsAI: 0,
          easyPlayed: 0,
          easyWins: 0,
          easyLosses: 0,
          mediumPlayed: 0,
          mediumWins: 0,
          mediumLosses: 0,
          hardPlayed: 0,
          hardWins: 0,
          hardLosses: 0,
          // Streak Stats
          winStreak: won ? 1 : 0,
          loseStreak: won ? 0 : 1,
          longestWinStreak: won ? 1 : 0,
          // Performance
          averageGameDuration: matchDuration,
          totalPlayTime: matchDuration,
        },
      });
    } else {
      const newWinStreak = won ? existing.winStreak + 1 : 0;
      const newLoseStreak = won ? 0 : existing.loseStreak + 1;
      const newLongestWinStreak = Math.max(
        existing.longestWinStreak,
        newWinStreak
      );

      const totalMatches = existing.gamesPlayed + 1;
      const totalDuration = existing.totalPlayTime + matchDuration;
      const newAverageDuration = Math.floor(totalDuration / totalMatches);

      const isTournament = gameMode === "TOURNAMENT";
      const is1v1 = gameMode === "ONE_VS_ONE";

      await prisma.userStats.update({
        where: { userId },
        data: {
          // Score update
          score: { increment: won ? 10 : 5 },

          // Total matches
          gamesPlayed: { increment: 1 },

          // 1v1 Stats
          played1v1: is1v1 ? { increment: 1 } : undefined,
          won1v1: is1v1 && won ? { increment: 1 } : undefined,
          lost1v1: is1v1 && !won ? { increment: 1 } : undefined,

          // Tournament Stats
          playedTournament: isTournament ? { increment: 1 } : undefined,
          wonTournament: isTournament && won ? { increment: 1 } : undefined,
          lostTournament: isTournament && !won ? { increment: 1 } : undefined,

          // Streak Stats
          winStreak: newWinStreak,
          loseStreak: newLoseStreak,
          longestWinStreak: newLongestWinStreak,

          // Performance
          totalPlayTime: { increment: matchDuration },
          averageGameDuration: newAverageDuration,
        },
      });
    }

    const scoreIncrement = won ? 15 : 5;
    await prisma.user.update({
      where: { id: userId },
      data: {
        score: { increment: scoreIncrement },
      },
    });

    console.log(
      `✅ Updated stats for user ${userId}: ${
        won ? "WIN" : "LOSS"
      }, Duration: ${matchDuration}s, Score: +${scoreIncrement}`
    );
  }
}
