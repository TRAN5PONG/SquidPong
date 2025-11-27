// Item pricing configuration
export const ITEM_PRICES = {
  // Character prices
  characters: {
    Tbib: 0,
    Med: 200,
    Ryu: 200  ,
    Hama9a: 200,
    Mnachit: 200,
    Mira: 200,
    Zero: 1000,
    Zenitsu: 1000,
    Xylar: 1000

  },
  
  // Paddle prices
  paddles: {
    Boss: 0,        // Default paddle - free
    Survivor: 800,
    Guard: 1200,
    Army: 1800
  }
} as const;


export type CharacterType = keyof typeof ITEM_PRICES.characters;
export type PaddleType = keyof typeof ITEM_PRICES.paddles;

export function getCharacterPrice(character: string): number {
  return ITEM_PRICES.characters[character as CharacterType] ?? 0;
}

export function getPaddlePrice(paddle: string): number 
{
  return ITEM_PRICES.paddles[paddle as PaddleType] ?? 0;
}

export function isValidCharacter(character: string): character is CharacterType {
  return character in ITEM_PRICES.characters;
}

export function isValidPaddle(paddle: string): paddle is PaddleType {
  return paddle in ITEM_PRICES.paddles;
}