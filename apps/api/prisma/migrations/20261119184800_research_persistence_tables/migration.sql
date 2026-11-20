-- Research OS domain persistence (US104).
-- Creates the five payload tables already declared in schema.prisma.
-- Candidate snapshots and workspace identity stay inside payload JSON.

-- CreateTable
CREATE TABLE "research_campaign_records" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "research_campaign_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_domain_knowledge" (
    "knowledge_id" TEXT NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "research_domain_knowledge_pkey" PRIMARY KEY ("knowledge_id")
);

-- CreateTable
CREATE TABLE "research_insights" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "research_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_recommendations" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "research_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_report_aggregates" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "research_report_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "research_domain_knowledge_experiment_id_key" ON "research_domain_knowledge"("experiment_id");
