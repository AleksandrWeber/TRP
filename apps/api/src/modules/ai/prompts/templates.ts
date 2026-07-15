import type { AiTask } from '../ai.types';

const SYSTEM = `You are TRP AI Gateway. Summarize quantitative research. Never give trading orders. Respond in concise markdown.`;

export function buildPrompt(
  task: AiTask,
  context: Record<string, unknown>,
): { system: string; user: string } {
  const payload = JSON.stringify(context, null, 2);
  const taskLabel = task.replaceAll('_', ' ');
  return {
    system: SYSTEM,
    user: `Task: ${taskLabel}\n\nContext JSON:\n${payload}\n\nProvide a short explanation and key metrics.`,
  };
}
