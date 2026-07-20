import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ArchitectureValidator } from '../../../tools/release/src/validators/architecture-validator.js';
import { createReleaseConfig } from '../../../tools/release/src/utils/config.js';
import { mkdir } from 'node:fs/promises';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const config = createReleaseConfig(rootDir, ['--no-git']);
await mkdir(path.join(rootDir, '.github/reports/ci'), { recursive: true });
const result = await new ArchitectureValidator().run(config);
process.stdout.write(`Architecture: ${result.status}\n`);
if (result.status === 'FAIL') {
  for (const issue of result.criticalIssues) process.stderr.write(`- ${issue}\n`);
  process.exit(1);
}
