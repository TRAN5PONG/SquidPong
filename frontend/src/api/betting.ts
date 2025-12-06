import { API_BASE_URL, ApiResponse } from "./auth";

/**
 * Bets
 */
export const getBetsForMatch = async (
  matchId: number
): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/game/matches/${matchId}/bets`, {
    method: "GET",
    credentials: "include",
  });

  return resp.json();
};

export const placeBet = async (
  matchId: string,
  amount: number,
  predictedWinnerId: string
): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/game/matches/${matchId}/bet`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount, predictedWinnerId }),
  });

  return resp.json();
};

export const getBetDetails = async (betId: number): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/game/bets/${betId}`, {
    method: "GET",
    credentials: "include",
  });

  return resp.json();
};

export const cancelBet = async (betId: number): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/game/bets/${betId}/cancel`, {
    method: "POST",
    credentials: "include",
  });

  return resp.json();
};
