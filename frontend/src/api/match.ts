export async function getUserCurrentMatch(userId: string) {
  const response = await fetch(
    `http://10.11.11.1:4000/api/game/match/current/${userId}`,
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
    `http://10.11.11.1:4000/api/game/match/${matchId}`,
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
