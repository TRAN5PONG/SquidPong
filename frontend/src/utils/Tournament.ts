import {
  Tournament,
  TournamentMaxPlayers,
  TournamentPlayer,
} from "@/types/tournament";

// Get players in specific round
const getPlayersInRound = (
  tournament: Tournament,
  round: number
): (TournamentPlayer | null)[] => {
  const playersInRound: (TournamentPlayer | null)[] = [];


  return playersInRound;
};

// Get number of rounds in the tournament
const getNumberOfRounds = (max_players: TournamentMaxPlayers): number => {
  return Math.ceil(Math.log2(max_players)); // Calculate number of rounds based on max players
};

// isRoundReached
const isRoundReached = (tournament: Tournament, round: number): boolean => {
	if (round === 0) return true; // First round is always reached

	const PreviousRoundPlayers = getPlayersInRound(tournament, round - 1);
	return PreviousRoundPlayers.some((player) => player !== null);
}


// Get number of players in a specific round
const getRoundSize = (max_players: TournamentMaxPlayers, round: number): number => {
	return Math.floor(max_players / Math.pow(2, round));
}

export {
  getNumberOfRounds,
  getPlayersInRound,
  getRoundSize,
  isRoundReached
};
