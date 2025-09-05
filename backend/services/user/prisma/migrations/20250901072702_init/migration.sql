-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ONLINE',
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatar" TEXT NOT NULL DEFAULT 'testing.png',
    "banner" TEXT NOT NULL DEFAULT 'testing.png',
    "bio" TEXT NOT NULL DEFAULT 'Just here to have fun, level up, and make some epic memories!',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "walletBalance" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "rankDivision" TEXT NOT NULL DEFAULT 'I',
    "rankTier" TEXT NOT NULL DEFAULT 'BRONZE',
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
CREATE TABLE "PlayerStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "gamesWon" INTEGER NOT NULL DEFAULT 0,
    "gamesLost" INTEGER NOT NULL DEFAULT 0,
    "tournamentsPlayed" INTEGER NOT NULL DEFAULT 0,
    "tournamentsWon" INTEGER NOT NULL DEFAULT 0,
    "tournamentsLost" INTEGER NOT NULL DEFAULT 0,
    "winStreak" INTEGER NOT NULL DEFAULT 0,
    "loseStreak" INTEGER NOT NULL DEFAULT 0,
    "longestWinStreak" INTEGER NOT NULL DEFAULT 0,
    "averageGameDuration" INTEGER NOT NULL DEFAULT 0,
    "totalPlayTime" INTEGER NOT NULL DEFAULT 0,
    "friendsCount" INTEGER NOT NULL DEFAULT 0,
    "bounceChallengeBestScore" INTEGER NOT NULL DEFAULT 0,
    "bounceChallengeGamesPlayed" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PlayerStats_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VSAIStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerStatsId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "gamesWon" INTEGER NOT NULL DEFAULT 0,
    "gamesLost" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "VSAIStats_playerStatsId_fkey" FOREIGN KEY ("playerStatsId") REFERENCES "PlayerStats" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "gameMode" TEXT NOT NULL,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "winnerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProfileMatchHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProfileMatchHistory_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxPlayers" INTEGER NOT NULL,
    "prizePool" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'REGISTRATION',
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TournamentEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "position" INTEGER,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TournamentEntry_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Friendship_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Friendship_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePreferences_profileId_key" ON "ProfilePreferences"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSettings_preferencesId_key" ON "NotificationSettings"("preferencesId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStats_profileId_key" ON "PlayerStats"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "VSAIStats_playerStatsId_difficulty_key" ON "VSAIStats"("playerStatsId", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileMatchHistory_profileId_matchId_key" ON "ProfileMatchHistory"("profileId", "matchId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentEntry_profileId_tournamentId_key" ON "TournamentEntry"("profileId", "tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_senderId_receiverId_key" ON "Friendship"("senderId", "receiverId");
