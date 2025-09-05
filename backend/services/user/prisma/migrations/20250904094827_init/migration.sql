/*
  Warnings:

  - You are about to drop the `Match` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlayerStats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProfileMatchHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tournament` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TournamentEntry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VSAIStats` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Match";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PlayerStats";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProfileMatchHistory";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Tournament";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TournamentEntry";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "VSAIStats";
PRAGMA foreign_keys=on;
