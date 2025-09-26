-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ONLINE',
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatar" TEXT NOT NULL DEFAULT 'http://localhost:4000/api/user/avatars/default.png',
    "banner" TEXT NOT NULL DEFAULT 'http://localhost:4000/api/user/banners/default.png',
    "bio" TEXT NOT NULL DEFAULT 'Just here to have fun, level up, and make some epic memories!',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "walletBalance" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "rankDivision" TEXT NOT NULL DEFAULT 'BRONZE',
    "rankTier" TEXT NOT NULL DEFAULT 'I',
    "playerCharacters" JSONB NOT NULL DEFAULT ["Zero"],
    "playerSelectedCharacter" TEXT NOT NULL DEFAULT 'Zero',
    "playerPaddles" JSONB NOT NULL DEFAULT ["Boss"],
    "playerSelectedPaddle" TEXT NOT NULL DEFAULT 'Boss'
);

-- CreateTable
CREATE TABLE "ProfilePreferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "musicEnabled" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ProfilePreferences_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "preferencesId" TEXT NOT NULL,
    "friendRequests" BOOLEAN NOT NULL DEFAULT true,
    "chatMessages" BOOLEAN NOT NULL DEFAULT true,
    "gameInvites" BOOLEAN NOT NULL DEFAULT true,
    "tournamentUpdates" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "NotificationSettings_preferencesId_fkey" FOREIGN KEY ("preferencesId") REFERENCES "ProfilePreferences" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_username_key" ON "Profile"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePreferences_profileId_key" ON "ProfilePreferences"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSettings_preferencesId_key" ON "NotificationSettings"("preferencesId");
