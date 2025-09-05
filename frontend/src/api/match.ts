export async function getUserCurrentMatch(userId: string) {
  const response = await fetch(
    `http://localhost:4000/api/game/match/current/${userId}`,
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
