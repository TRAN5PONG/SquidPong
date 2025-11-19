import { Tournament } from "@/types/game/tournament";
import { API_BASE_URL, ApiResponse } from "./auth";

/**
 * fetch tournaments
 */
export const getTournaments = async (): Promise<ApiResponse<Tournament[]>> => {
  const response = await fetch(`${API_BASE_URL}/tournament/tournaments`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  return data;
};
export const getTournament = async (
  tournamentId: string
): Promise<ApiResponse<Tournament>> => {
  const response = await fetch(
    `${API_BASE_URL}/tournament/tournaments/${tournamentId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();
  return data;
};

/**
 * Tournament management
 */
export const createTournament = async (
  name: string,
  organizerId: string,
  maxPlayers: number,
  description?: string,
  participationFee?: number
): Promise<ApiResponse> => {
  const response = await fetch(`${API_BASE_URL}/tournament/tournaments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      organizerId,
      maxPlayers,
      description,
      participationFee,
    }),
  });

  const data = await response.json();
  return data;
};
export const joinTournament = async (
  tournamentId: string,
  participantId: string
): Promise<ApiResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/tournament/tournaments/${tournamentId}/join`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        participantId,
      }),
    }
  );

  const data = await response.json();
  return data;
};
export const leaveTournament = async (
  tournamentId: string,
  participantId: string
): Promise<ApiResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/tournament/tournaments/${tournamentId}/leave`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        participantId,
      }),
    }
  );

  const data = await response.json();
  return data;
};
export const launchTournament = async (id: string): Promise<ApiResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/tournament/tournaments/${id}/start`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  const data = await response.json();
  return data;
};
