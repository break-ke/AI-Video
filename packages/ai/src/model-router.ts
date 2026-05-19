import type { StageType } from '@platform/shared';

// ── Model Provider Types ──
export type ModelProvider = 'deepseek' | 'lingke-gpt' | 'lingke-gemini' | 'lingke-jimeng';
export type TaskDomain = 'text_analysis' | 'creative_writing' | 'structured_extraction' | 'image_gen' | 'video_gen' | 'multimodal_eval' | 'light_eval' | 'tts';

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ModelSelectionCriteria {
  domain: TaskDomain;
  stage: StageType;
  priority?: 'quality' | 'speed' | 'cost';
  language?: 'zh' | 'en' | 'auto';
}

// ── Model Registry ──
const modelRegistry: Record<TaskDomain, { primary: ModelConfig; fallback: ModelConfig }> = {
  text_analysis: {
    primary: { provider: 'deepseek', model: 'deepseek-v4-pro', maxTokens: 16000, temperature: 0.3 },
    fallback: { provider: 'lingke-gemini', model: 'gemini-3.1-pro-preview', maxTokens: 8000, temperature: 0.3 },
  },
  creative_writing: {
    primary: { provider: 'lingke-gpt', model: 'gpt-5.5-high', maxTokens: 8000, temperature: 0.8 },
    fallback: { provider: 'deepseek', model: 'deepseek-v4-pro', maxTokens: 16000, temperature: 0.7 },
  },
  structured_extraction: {
    primary: { provider: 'lingke-gpt', model: 'gpt-5.5-high', maxTokens: 4000, temperature: 0.1 },
    fallback: { provider: 'deepseek', model: 'deepseek-v4-pro', maxTokens: 8000, temperature: 0.1 },
  },
  image_gen: {
    primary: { provider: 'lingke-jimeng', model: 'jimeng-t2i', temperature: 1.0 },
    fallback: { provider: 'lingke-jimeng', model: 'jimeng-t2i-v2', temperature: 1.0 },
  },
  video_gen: {
    primary: { provider: 'lingke-jimeng', model: 'jimeng-t2v', temperature: 1.0 },
    fallback: { provider: 'lingke-jimeng', model: 'jimeng-i2v', temperature: 1.0 },
  },
  multimodal_eval: {
    primary: { provider: 'lingke-gemini', model: 'gemini-3.1-pro-preview', maxTokens: 4000, temperature: 0.2 },
    fallback: { provider: 'lingke-gpt', model: 'gpt-5.5-high', maxTokens: 4000, temperature: 0.2 },
  },
  light_eval: {
    primary: { provider: 'deepseek', model: 'deepseek-v4-flash', maxTokens: 2000, temperature: 0.1 },
    fallback: { provider: 'lingke-gemini', model: 'gemini-3.1-flash-lite-preview', maxTokens: 2000, temperature: 0.1 },
  },
  tts: {
    primary: { provider: 'lingke-gpt', model: 'gpt-tts', temperature: 0.6 },
    fallback: { provider: 'lingke-jimeng', model: 'jimeng-tts', temperature: 0.6 },
  },
};

// ── Stage → Domain Mapping ──
const stageDomainMap: Record<StageType, TaskDomain> = {
  research: 'text_analysis',
  analysis: 'text_analysis',
  storyboard: 'image_gen',
  script: 'creative_writing',
  image_gen: 'image_gen',
  model_selection: 'light_eval',
  video_gen: 'video_gen',
  voiceover: 'tts',
  assembly: 'light_eval',
  evaluation: 'multimodal_eval',
};

// ── Model Router ──
export function selectModel(criteria: ModelSelectionCriteria): { primary: ModelConfig; fallback: ModelConfig } {
  const domain = stageDomainMap[criteria.stage] || 'text_analysis';
  return modelRegistry[domain];
}

export function getDomainForStage(stage: StageType): TaskDomain {
  return stageDomainMap[stage];
}

export function estimateCost(config: ModelConfig, tokenCount: number): number {
  const rates: Record<string, number> = {
    'deepseek-v4-pro': 0.28,
    'deepseek-v4-flash': 0.05,
    'gpt-4o': 2.50,
    'gemini-2.5-pro': 3.50,
    'jimeng-t2i': 0.20,
    'jimeng-t2v': 1.00,
  };
  const rate = rates[config.model] || 1.0;
  return (tokenCount / 1_000_000) * rate;
}
