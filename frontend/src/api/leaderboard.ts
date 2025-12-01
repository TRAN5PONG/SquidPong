import { API_BASE_URL } from "./auth";

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  score: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: string;
}

export async function getLeaderboard(limit: number = 100) {
  const response = await fetch(`${API_BASE_URL}/game/leaderboard?limit=${limit}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard");
  }

  return await response.json();
}

export async function getUserRank(userId: string) {
  const response = await fetch(`${API_BASE_URL}/game/user/${userId}/rank`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user rank");
  }

  return await response.json();
}
