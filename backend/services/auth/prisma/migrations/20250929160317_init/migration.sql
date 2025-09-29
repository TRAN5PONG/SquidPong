-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "twoFAMethod" TEXT NOT NULL DEFAULT 'none',
    "twoFASecret" TEXT,
    "twoFAQRCode" TEXT,
    "twoFAKey" TEXT,
    "twoFAEmailCode" TEXT,
    "twoFAEmailExpiry" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "password", "twoFAEmailCode", "twoFAEmailExpiry", "twoFAKey", "twoFAMethod", "twoFAQRCode", "twoFASecret", "updatedAt", "username") SELECT "createdAt", "email", "id", "password", "twoFAEmailCode", "twoFAEmailExpiry", "twoFAKey", "twoFAMethod", "twoFAQRCode", "twoFASecret", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
