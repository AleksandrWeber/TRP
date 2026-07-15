-- CreateTable
CREATE TABLE "StrategyDeployment" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "strategyVersion" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "exchange" TEXT NOT NULL DEFAULT 'binance',
    "mode" TEXT NOT NULL DEFAULT 'paper',
    "status" TEXT NOT NULL DEFAULT 'active',
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gitCommit" TEXT,

    CONSTRAINT "StrategyDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionPosition" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "side" TEXT NOT NULL DEFAULT 'flat',
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "entryPrice" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "actedOn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Signal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Execution" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "fee" DOUBLE PRECISION NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'paper',
    "status" TEXT NOT NULL,
    "rejectReason" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Execution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StrategyDeployment_experimentId_key" ON "StrategyDeployment"("experimentId");

-- CreateIndex
CREATE INDEX "StrategyDeployment_status_idx" ON "StrategyDeployment"("status");

-- CreateIndex
CREATE INDEX "StrategyDeployment_symbol_timeframe_idx" ON "StrategyDeployment"("symbol", "timeframe");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionPosition_deploymentId_key" ON "ProductionPosition"("deploymentId");

-- CreateIndex
CREATE INDEX "Signal_deploymentId_createdAt_idx" ON "Signal"("deploymentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Execution_signalId_key" ON "Execution"("signalId");

-- CreateIndex
CREATE INDEX "Execution_deploymentId_executedAt_idx" ON "Execution"("deploymentId", "executedAt");

-- AddForeignKey
ALTER TABLE "StrategyDeployment" ADD CONSTRAINT "StrategyDeployment_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionPosition" ADD CONSTRAINT "ProductionPosition_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "StrategyDeployment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "StrategyDeployment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Execution" ADD CONSTRAINT "Execution_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "StrategyDeployment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Execution" ADD CONSTRAINT "Execution_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
