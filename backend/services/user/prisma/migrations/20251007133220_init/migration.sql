/*
  Warnings:

  - You are about to alter the column `level` on the `Profile` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ONLINE',
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatar" TEXT NOT NULL DEFAULT '/api/user/avatars/default.png',
    "banner" TEXT NOT NULL DEFAULT 'http://localhost:4000/api/user/banners/default.png',
    "bio" TEXT NOT NULL DEFAULT 'Just here to have fun, level up, and make some epic memories!',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "walletBalance" INTEGER NOT NULL DEFAULT 0,
    "level" REAL NOT NULL DEFAULT 0,
    "rankDivision" TEXT NOT NULL DEFAULT 'BRONZE',
    "rankTier" TEXT NOT NULL DEFAULT 'I',
    "playerCharacters" JSONB NOT NULL DEFAULT ["Zero"],
    "playerSelectedCharacter" TEXT NOT NULL DEFAULT 'Zero',
    "playerPaddles" JSONB NOT NULL DEFAULT ["Boss"],
    "playerSelectedPaddle" TEXT NOT NULL DEFAULT 'Boss'
);
INSERT INTO "new_Profile" ("avatar", "banner", "bio", "createdAt", "firstName", "id", "isVerified", "lastName", "lastSeen", "level", "playerCharacters", "playerPaddles", "playerSelectedCharacter", "playerSelectedPaddle", "rankDivision", "rankTier", "status", "updatedAt", "userId", "username", "walletBalance") SELECT "avatar", "banner", "bio", "createdAt", "firstName", "id", "isVerified", "lastName", "lastSeen", "level", "playerCharacters", "playerPaddles", "playerSelectedCharacter", "playerSelectedPaddle", "rankDivision", "rankTier", "status", "updatedAt", "userId", "username", "walletBalance" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
CREATE UNIQUE INDEX "Profile_username_key" ON "Profile"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
