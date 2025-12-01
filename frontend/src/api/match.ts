import { API_BASE_URL } from "./auth";

export async function getUserCurrentMatch(userId: string) {
  const response = await fetch(`${API_BASE_URL}/game/match/current/${userId}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await response.json();
}

export async function getMatchById(matchId: string) {
  const response = await fetch(`${API_BASE_URL}/game/match/${matchId}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch match");
  }

  return await response.json();
}

export async function getAllMatches() {
  const resp = await fetch(`${API_BASE_URL}/game/match/all`, {
    method: "GET",
    credentials: "include"
  })

  if (!resp.ok)
    throw new Error("error getting matches")
  return await resp.json();
}

export async function createAIMatch(difficulty: string) {
  const resp = await fetch(`${API_BASE_URL}/game/ai/create`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode: "ONE_VS_AI",
      difficulty,
    }),
  });

  if (!resp.ok) {
    throw new Error("Failed to fetch match");
  }

  return await resp.json();
}

export async function getPlayerLastMatches(playerId: string) {
  const response = await fetch(`${API_BASE_URL}/game/player/${playerId}/last-matches`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch player last matches");
  }

  return await response.json();
}
