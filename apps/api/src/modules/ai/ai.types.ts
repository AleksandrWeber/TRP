export type AiTask =
  | 'research_summary'
  | 'validation_explanation'
  | 'strategy_explanation'
  | 'market_summary'
  | 'report_generation';

export type AiRequest = {
  task: AiTask;
  context: Record<string, unknown>;
};

export type AiResponse = {
  content: string;
  provider: string;
  model: string;
  structured?: Record<string, unknown>;
};

export interface AiProvider {
  readonly name: string;
  complete(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<{
    content: string;
    model: string;
  }>;
}
