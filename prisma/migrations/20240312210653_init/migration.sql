-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('SETUP', 'STARTING', 'STARTED', 'ENDED');

-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('CLASSIC', 'TEAM', 'HIDDEN');

-- CreateEnum
CREATE TYPE "Team" AS ENUM ('RED', 'BLUE', 'GREEN', 'YELLOW');

-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('WALK', 'POINT_ADD', 'POINT_SUBTRACT', 'RANGE_INCREASE', 'ATTACK', 'KILL', 'GIFT', 'END', 'INFO', 'LIFE_ADD', 'LIFE_REMOVE');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "GameStatus" NOT NULL,
    "type" "GameType" NOT NULL,
    "pointInterval" INTEGER NOT NULL,
    "nextPointAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL,
    "type" "LogType" NOT NULL,
    "data" TEXT NOT NULL,
    "gameId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "range" INTEGER NOT NULL,
    "lives" INTEGER NOT NULL,
    "kills" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL,
    "team" "Team",
    "coordsId" TEXT NOT NULL,
    "gameId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coordinates" (
    "id" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coordinates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_threadId_key" ON "Game"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_coordsId_key" ON "Player"("coordsId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_userId_gameId_key" ON "Player"("userId", "gameId");

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_coordsId_fkey" FOREIGN KEY ("coordsId") REFERENCES "Coordinates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
