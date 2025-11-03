import { API_BASE_URL } from "./auth";

export async function getUserCurrentMatch(userId: string) {
  const response = await fetch(
    `${API_BASE_URL}/game/match/current/${userId}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) return null; // no pending match
    throw new Error("Failed to fetch pending match");
  }

  return await response.json();
}

export async function getMatchById(matchId: string) {
  const response = await fetch(
    `${API_BASE_URL}/game/match/${matchId}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch match");
  }

  return await response.json();
}
