/*
  Warnings:

  - You are about to drop the `HealthCheck` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "HealthCheck";

-- CreateTable
CREATE TABLE "Dataset" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "exchange" TEXT NOT NULL DEFAULT 'binance',
    "contentHash" TEXT NOT NULL,
    "barCount" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "gitCommit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OhlcvBar" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OhlcvBar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "strategyVersion" TEXT NOT NULL,
    "configHash" TEXT NOT NULL,
    "gitCommit" TEXT,
    "verdict" TEXT NOT NULL,
    "report" JSONB NOT NULL,
    "metrics" JSONB NOT NULL,
    "validation" JSONB NOT NULL,
    "trades" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dataset_contentHash_key" ON "Dataset"("contentHash");

-- CreateIndex
CREATE INDEX "Dataset_symbol_timeframe_idx" ON "Dataset"("symbol", "timeframe");

-- CreateIndex
CREATE INDEX "OhlcvBar_datasetId_timestamp_idx" ON "OhlcvBar"("datasetId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "OhlcvBar_datasetId_timestamp_key" ON "OhlcvBar"("datasetId", "timestamp");

-- CreateIndex
CREATE INDEX "Experiment_datasetId_idx" ON "Experiment"("datasetId");

-- CreateIndex
CREATE INDEX "Experiment_createdAt_idx" ON "Experiment"("createdAt");

-- CreateIndex
CREATE INDEX "Experiment_verdict_idx" ON "Experiment"("verdict");

-- AddForeignKey
ALTER TABLE "OhlcvBar" ADD CONSTRAINT "OhlcvBar_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experiment" ADD CONSTRAINT "Experiment_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
