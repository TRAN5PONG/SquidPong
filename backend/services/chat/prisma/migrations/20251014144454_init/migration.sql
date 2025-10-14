/*
  Warnings:

  - Made the column `lastName` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "avatar" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("avatar", "createdAt", "firstName", "id", "isVerified", "lastName", "userId", "username") SELECT "avatar", "createdAt", "firstName", "id", "isVerified", "lastName", "userId", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
