export type CreateMatchBody =
  | {
    mode: "ONE_VS_ONE";
    opponentId: string;
    scoreLimit: 5 | 10 | 15 | 20;
    pauseTime: 30 | 60 | 90;
    allowPowerUps: boolean;
    requiredCurrency: number;
  }
  | {
    mode: "TOURNAMENT";
    tournamentId: string;
  }
  | {
    mode: "ONE_VS_AI";
    difficulty: "EASY" | "MEDIUM" | "HARD";
  }
  | {
    mode: "BOUNCE_CHALLENGE";
  };

export interface BallState {
  x: number;
  y: number;
  z: number;
}

export interface ballResetMessage {
  position: BallState;
  velocity: BallState;
}
