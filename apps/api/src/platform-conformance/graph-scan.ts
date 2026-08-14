import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { V2_PLATFORM_MODULE_CATALOG, type V2PlatformModuleId } from './v2-platform-modules';

export function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...listTsFiles(full));
    else if (full.endsWith('.ts') && !full.endsWith('.spec.ts')) out.push(full);
  }
  return out;
}

export function importPaths(source: string): string[] {
  const matches = source.matchAll(/from\s+['"]([^'"]+)['"]/g);
  return [...matches].map((match) => match[1]!);
}

export function resolveV2ImportTarget(
  importPath: string,
  from: V2PlatformModuleId,
): V2PlatformModuleId | null {
  const normalized = importPath.replace(/\\/g, '/');
  for (const id of Object.keys(V2_PLATFORM_MODULE_CATALOG) as V2PlatformModuleId[]) {
    if (id === from) continue;
    if (normalized.includes(`/${id}`) || normalized.endsWith(`/${id}`)) return id;
    if (normalized.includes(`../${id}/`) || normalized.includes(`../${id}'`)) return id;
    if (normalized === `../${id}` || normalized.startsWith(`../${id}/`)) return id;
    if (normalized === `../../${id}` || normalized.startsWith(`../../${id}/`)) return id;
  }
  return null;
}
