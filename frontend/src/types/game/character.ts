export interface GameCharacter {
  id: string;
  name: string;
  description: string;
  image: string;
  avatar: string;
  price: number;
  spinControl: number;
  reflexSpeed: number;
  powerShot: number;
}

export const characters: GameCharacter[] = [
  {
    id: "Tbib",
    name: "Tbib",
    description: "A fierce warrior with a burning passion for victory.",
    image: "/characters/green_m2.webp",
    avatar: "/characters/green_m2_avatar.png",
    price: 0,
    spinControl: 88,
    reflexSpeed: 92,
    powerShot: 85,
  },
  {
    id: "Bssita",
    name: "Bssita",
    description: "A skilled fighter with a sharp mind and quick reflexes.",
    image: "/characters/green_m1.webp",
    avatar: "/characters/green_m1_avatar.png",
    price: 200,
    spinControl: 80,
    reflexSpeed: 85,
    powerShot: 90,
  },
  {
    id: "Ryu",
    name: "Ryu",
    description: "A legendary fighter known for his mastery of martial arts.",
    image: "/characters/green_f1.webp",
    avatar: "/characters/green_f1_avatar.png",
    price: 200,
    spinControl: 90,
    reflexSpeed: 95,
    powerShot: 100,
  },
  {
    id: "Hama9a",
    name: "Hama9a",
    description: "A brave hero with a heart of gold and a spirit of adventure.",
    image: "/characters/green_f2.webp",
    avatar: "/characters/green_f2_avatar.png",
    price: 200,
    spinControl: 82,
    reflexSpeed: 87,
    powerShot: 90,
  },
  {
    id: "Mnachit",
    name: "M-nachit",
    description: "A lightning-fast prodigy who dominates the court with style.",
    image: "/characters/green_m3.webp",
    avatar: "/characters/green_m3_avatar.png",
    price: 200,
    spinControl: 89,
    reflexSpeed: 84,
    powerShot: 93,
  },
  {
    id: "Mira",
    name: "Mira",
    description:
      "A master of precision and grace, striking with perfect timing.",
    image: "/characters/green_f3.webp",
    avatar: "/characters/green_f3_avatar.png",
    price: 200,
    spinControl: 95,
    reflexSpeed: 80,
    powerShot: 88,
  },
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
    id: "Zenitsu",
    name: "Zenitsu",
    description:
      "A powerful warrior with a strong will and unmatched strength.",
    image: "/characters/guard.webp",
    avatar: "/characters/guard_avatar.png",
    price: 1000,
    spinControl: 75,
    reflexSpeed: 80,
    powerShot: 95,
  },
  {
    id: "Xylar",
    name: "Xylar",
    description:
      "An eerie doll-like challenger that mimics every move you make.",
    image: "/characters/doll.png",
    avatar: "/characters/doll_avatar.png",
    price: 1000,
    spinControl: 90,
    reflexSpeed: 92,
    powerShot: 85,
  },
];
