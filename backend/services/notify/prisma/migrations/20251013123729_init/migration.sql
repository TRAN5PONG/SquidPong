-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "preferencesId" TEXT NOT NULL,
    "friendRequests" BOOLEAN NOT NULL DEFAULT true,
    "chatMessages" BOOLEAN NOT NULL DEFAULT true,
    "gameInvites" BOOLEAN NOT NULL DEFAULT true,
    "tournamentUpdates" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "NotificationSettings_preferencesId_fkey" FOREIGN KEY ("preferencesId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSettings_preferencesId_key" ON "NotificationSettings"("preferencesId");
