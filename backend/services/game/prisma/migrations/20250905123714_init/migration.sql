-- CreateTable
CREATE TABLE "MatchSpectator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    CONSTRAINT "MatchSpectator_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MatchSpectator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchPlayer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "gmUserId" TEXT,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "isAI" BOOLEAN NOT NULL DEFAULT false,
    "finalScore" INTEGER NOT NULL DEFAULT 0,
    "isReady" BOOLEAN NOT NULL DEFAULT false,
    "isHost" BOOLEAN NOT NULL DEFAULT false,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "isResigned" BOOLEAN NOT NULL DEFAULT false,
    "characterId" TEXT NOT NULL,
    "paddleId" TEXT NOT NULL,
    "rankTier" TEXT NOT NULL,
    "rankDivision" TEXT NOT NULL,
    "rankChange" INTEGER,
    CONSTRAINT "MatchPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" DATETIME,
    "winnerId" TEXT,
    "opponent1Id" TEXT NOT NULL,
    "opponent2Id" TEXT,
    CONSTRAINT "Match_opponent1Id_fkey" FOREIGN KEY ("opponent1Id") REFERENCES "MatchPlayer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_opponent2Id_fkey" FOREIGN KEY ("opponent2Id") REFERENCES "MatchPlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "scoreLimit" INTEGER NOT NULL,
    "pauseTime" INTEGER NOT NULL,
    "allowPowerUps" BOOLEAN NOT NULL DEFAULT false,
    "aiDifficulty" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requiredCurrency" INTEGER NOT NULL,
    CONSTRAINT "MatchSetting_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "type" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "expiresAt" DATETIME,
    "scoreLimit" INTEGER NOT NULL,
    "pauseTime" INTEGER NOT NULL,
    "allowPowerUps" BOOLEAN NOT NULL,
    "requiredCurrency" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "matchId" TEXT,
    CONSTRAINT "Invitation_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invitation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invitation_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" INTEGER NOT NULL,
    "predictedWinnerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    CONSTRAINT "Bet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bet_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Match_opponent1Id_key" ON "Match"("opponent1Id");

-- CreateIndex
CREATE UNIQUE INDEX "Match_opponent2Id_key" ON "Match"("opponent2Id");

-- CreateIndex
CREATE UNIQUE INDEX "MatchSetting_matchId_key" ON "MatchSetting"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_inviteCode_key" ON "Invitation"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_matchId_key" ON "Invitation"("matchId");
