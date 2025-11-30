export interface PaddleTexture {
  id: string;
  name: string;
  image: string;
  description: string;
  price: number;
}
export interface PaddleColor {
  id: string;
  name: string;
  color: string; // Hex color code
}

export const paddleColors: PaddleColor[] = [
  { id: "Red", name: "Red", color: "#f22c2c" },
  { id: "Yellow", name: "Yellow", color: "#ffa500" },
  { id: "Orange", name: "Orange", color: "#FF5733" },
  { id: "Blue", name: "Blue", color: "#3498DB" },
  { id: "Purple", name: "Purple", color: "#9B59B6" },
];
export const paddleTextures: PaddleTexture[] = [
  {
    id: "Boss",
    name: "Boss",
    description: "Rule the game like the ultimate leader!",
    image: "/paddle/Boss.png",
    price: 500,
  },
  {
    id: "Survivor",
    name: "Survivor",
    description: "The last one standing from the deadly games.",
    image: "/paddle/Survivor.png",
    price: 600,
  },
  {
    id: "Guard",
    name: "Guard",
    description: "Dominate the table with this powerful elite paddle!",
    image: "/paddle/Guard.png",
    price: 700,
  },
  {
    id: "Army",
    name: "Army",
    description: "Crush opponents like an unstoppable force!",
    image: "/paddle/Army.png",
    price: 800,
  },
];
