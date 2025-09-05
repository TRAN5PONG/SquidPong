export const matchesValidators = {
  Body: {
    oneOf: [
      // ONE_VS_ONE → requires full game settings
      {
        type: "object",
        required: [
          "mode",
          "opponentId",
          "scoreLimit",
          "pauseTime",
          "allowPowerUps",
          "requiredCurrency",
        ],
        properties: {
          mode: { type: "string", const: "ONE_VS_ONE" },
          opponentId: { type: "string" },
          scoreLimit: { type: "integer", enum: [5, 10, 15, 20] },
          pauseTime: { type: "integer", enum: [30, 60, 90] },
          allowPowerUps: { type: "boolean" },
          requiredCurrency: { type: "integer", minimum: 0 },
        },
      },
      // TOURNAMENT → no gameSettings, inherits from tournament
      {
        type: "object",
        required: ["mode", "tournamentId"],
        properties: {
          mode: { type: "string", const: "TOURNAMENT" },
          tournamentId: { type: "string" },
        },
      },
      // ONE_VS_AI → difficulty only
      {
        type: "object",
        required: ["mode", "difficulty"],
        properties: {
          mode: { type: "string", const: "ONE_VS_AI" },
          difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] },
        },
      },
      // BOUNCE_CHALLENGE → mini-game, no settings allowed
      {
        type: "object",
        required: ["mode"],
        properties: {
          mode: { type: "string", const: "BOUNCE_CHALLENGE" },
        },
      },
    ],
  },
};

export const matchesParamsValidators = {
  params: {
    type: "object",
    properties: {
      matchId: { type: "string" },
    },
    required: ["matchId"],
  },
};
