/*
  Warnings:

  - You are about to alter the column `receiverId` on the `Friendship` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `senderId` on the `Friendship` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Friendship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Friendship" ("createdAt", "id", "receiverId", "senderId", "status", "updatedAt") SELECT "createdAt", "id", "receiverId", "senderId", "status", "updatedAt" FROM "Friendship";
DROP TABLE "Friendship";
ALTER TABLE "new_Friendship" RENAME TO "Friendship";
CREATE UNIQUE INDEX "Friendship_senderId_receiverId_key" ON "Friendship"("senderId", "receiverId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
