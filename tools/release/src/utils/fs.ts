import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { constants } from 'node:fs';

export async function pathExists(target: string): Promise<boolean> {
  try {
    await access(target, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function readText(filePath: string): Promise<string> {
  return readFile(filePath, 'utf8');
}

export async function listFilesRecursive(
  dir: string,
  options: { extensions?: readonly string[]; maxFiles?: number } = {},
): Promise<string[]> {
  const extensions = options.extensions;
  const maxFiles = options.maxFiles ?? 20_000;
  const results: string[] = [];

  async function walk(current: string): Promise<void> {
    if (results.length >= maxFiles) return;
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (results.length >= maxFiles) return;
      if (
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === '.git' ||
        entry.name === 'coverage' ||
        entry.name === '.turbo'
      ) {
        continue;
      }
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (!extensions || extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(full);
      }
    }
  }

  await walk(dir);
  return results;
}

export async function grepFiles(
  root: string,
  pattern: RegExp,
  options: { extensions?: readonly string[]; maxMatches?: number } = {},
): Promise<Array<{ file: string; line: number; text: string }>> {
  const files = await listFilesRecursive(root, {
    extensions: options.extensions ?? ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
  });
  const matches: Array<{ file: string; line: number; text: string }> = [];
  const maxMatches = options.maxMatches ?? 200;

  for (const file of files) {
    if (matches.length >= maxMatches) break;
    let content: string;
    try {
      content = await readText(file);
    } catch {
      continue;
    }
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      if (pattern.test(lines[i]!)) {
        matches.push({ file, line: i + 1, text: lines[i]!.trim() });
        if (matches.length >= maxMatches) break;
      }
    }
  }
  return matches;
}
