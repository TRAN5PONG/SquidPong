export interface GameCharacter {
  id: string;
  name: string; // Name of the character
  description: string; // Description of the character
  image: string; // Image URL of the character
  avatar: string; // Avatar URL of the character
  price: number; // Price of the character in in-game currency
  spinControl: number; // Spin control value of the character
  reflexSpeed: number; // Reflex speed value of the character
  powerShot: number; // Power shot value of the character
}
export const characters: GameCharacter[] = [
  {
    id: "Zero",
    name: "Zero",
    description: "A mysterious character with unmatched speed and agility.",
    image: "/characters/master.webp",
    avatar: "/characters/master_avatar_.png",
    price: 1000,
    spinControl: 85,
    reflexSpeed: 90,
    powerShot: 80,
  },
  {
    id: "Taizen",
    name: "Taizen",
    description:
      "A powerful warrior with a strong will and unmatched strength.",
    image: "/characters/guard.webp",
    avatar: "/characters/guard_avatar.png",
    price: 1500,
    spinControl: 75,
    reflexSpeed: 80,
    powerShot: 95,
  },
  {
    id: "Kira",
    name: "Kira",
    description: "A skilled fighter with a sharp mind and quick reflexes.",
    image: "/characters/green_m1.webp",
    avatar: "/characters/green_m1_avatar.png",
    price: 1200,
    spinControl: 80,
    reflexSpeed: 85,
    powerShot: 90,
  },
  {
    id: "Ryu",
    name: "Ryu",
    description: "A legendary fighter known for his MASTERy of martial arts.",
    image: "/characters/green_f1.webp",
    avatar: "/characters/green_f1_avatar.png",
    price: 2000,
    spinControl: 90,
    reflexSpeed: 95,
    powerShot: 100,
  },
  {
    id: "Akira",
    name: "Akira",
    description: "A fierce warrior with a burning passion for victory.",
    image: "/characters/green_m2.webp",
    avatar: "/characters/green_m2_avatar.png",
    price: 1800,
    spinControl: 88,
    reflexSpeed: 92,
    powerShot: 85,
  },
  {
    id: "Sora",
    name: "Sora",
    description: "A brave hero with a heart of GOLD and a spirit of adventure.",
    image: "/characters/green_f2.webp",
    avatar: "/characters/green_f2_avatar.png",
    price: 1600,
    spinControl: 82,
    reflexSpeed: 87,
    powerShot: 90,
  },
  {
    id: "Sora",
    name: "Sora",
    description: "A brave hero with a heart of GOLD and a spirit of adventure.",
    image: "/characters/green_m3.webp",
    avatar: "/characters/green_m3_avatar.png",
    price: 1600,
    spinControl: 82,
    reflexSpeed: 87,
    powerShot: 90,
  },
  {
    id: "Sora",
    name: "Sora",
    description: "A brave hero with a heart of GOLD and a spirit of adventure.",
    image: "/characters/green_f3.webp",
    avatar: "/characters/green_f3_avatar.png",
    price: 1600,
    spinControl: 12,
    reflexSpeed: 87,
    powerShot: 90,
  },
];