import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { KnowledgeService } from '../src/modules/knowledge/knowledge.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const knowledge = app.get(KnowledgeService);
  const result = await knowledge.backfillFromExperiments();
  console.log(JSON.stringify(result, null, 2));
  await app.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
