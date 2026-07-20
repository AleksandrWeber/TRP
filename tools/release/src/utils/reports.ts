import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import prettier from 'prettier';
import type { PhaseResult, ReleaseConfig } from '../types.js';

export function reportsDir(config: ReleaseConfig): string {
  return config.reportsDir;
}

export async function ensureReportsDir(config: ReleaseConfig): Promise<void> {
  await mkdir(config.reportsDir, { recursive: true });
  await mkdir(path.join(config.rootDir, 'docs', 'releases'), { recursive: true });
}

async function writeFormattedMarkdown(target: string, body: string): Promise<void> {
  const raw = `${body.trimEnd()}\n`;
  const formatted = await prettier.format(raw, {
    filepath: target,
  });
  await writeFile(target, formatted, 'utf8');
}

export async function writeReport(
  config: ReleaseConfig,
  fileName: string,
  body: string,
): Promise<string> {
  await ensureReportsDir(config);
  const target = path.join(config.reportsDir, fileName);
  await writeFormattedMarkdown(target, body);
  return target;
}

export async function writeRootReleaseDoc(
  config: ReleaseConfig,
  fileName: string,
  body: string,
): Promise<string> {
  const dir = path.join(config.rootDir, 'docs', 'releases');
  await mkdir(dir, { recursive: true });
  const target = path.join(dir, fileName);
  await writeFormattedMarkdown(target, body);
  return target;
}

export function statusLine(label: string, status: string, width = 18): string {
  const dots = '.'.repeat(Math.max(1, width - label.length));
  return `${label} ${dots} ${status}`;
}

export function formatPhaseMarkdown(
  title: string,
  config: ReleaseConfig,
  result: PhaseResult,
  extraSections: string[] = [],
): string {
  const lines = [
    `# RC-${config.rcVersion} — ${title}`,
    '',
    `**Date:** ${new Date().toISOString().slice(0, 10)}`,
    `**Status:** ${result.status}`,
    `**Duration:** ${result.durationMs} ms`,
    '',
    '## Summary',
    '',
    result.summary,
    '',
  ];

  if (result.metrics && Object.keys(result.metrics).length > 0) {
    lines.push('## Metrics', '');
    lines.push('| Metric | Value |', '|--------|-------|');
    for (const [key, value] of Object.entries(result.metrics)) {
      lines.push(`| ${key} | ${String(value)} |`);
    }
    lines.push('');
  }

  if (result.criticalIssues.length > 0) {
    lines.push('## Critical Issues', '');
    for (const issue of result.criticalIssues) lines.push(`- ${issue}`);
    lines.push('');
  }

  if (result.warnings.length > 0) {
    lines.push('## Warnings', '');
    for (const warning of result.warnings) lines.push(`- ${warning}`);
    lines.push('');
  }

  if (result.recommendations.length > 0) {
    lines.push('## Recommendations', '');
    for (const recommendation of result.recommendations) lines.push(`- ${recommendation}`);
    lines.push('');
  }

  for (const section of extraSections) {
    lines.push(section.trimEnd(), '');
  }

  lines.push('## Verdict', '', `**${result.status}**`, '');
  return lines.join('\n');
}

export function truncate(text: string, max = 4000): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n…[truncated ${text.length - max} chars]`;
}
