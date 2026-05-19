import { z } from 'zod';

export const PipelineTaskType = z.enum([
  'competitor_analysis',
  'full_pipeline',
  'clone_from_template',
]);
export type PipelineTaskType = z.infer<typeof PipelineTaskType>;

export const PipelineStatus = z.enum([
  'pending', 'running', 'waiting_feedback', 'completed', 'failed',
]);
export type PipelineStatus = z.infer<typeof PipelineStatus>;

export const StageType = z.enum([
  'research', 'analysis', 'storyboard', 'script',
  'image_gen', 'model_selection', 'video_gen',
  'voiceover', 'assembly', 'evaluation',
]);
export type StageType = z.infer<typeof StageType>;

export const StageStatus = z.enum([
  'pending', 'running', 'waiting_feedback', 'completed', 'failed',
]);
export type StageStatus = z.infer<typeof StageStatus>;

export const VideoAssetType = z.enum([
  'raw_clip', 'voiceover', 'bgm', 'draft', 'final', 'export',
]);
export type VideoAssetType = z.infer<typeof VideoAssetType>;

export const FeedbackCategory = z.enum([
  'tone', 'pacing', 'visual', 'script', 'voiceover', 'other',
]);
export type FeedbackCategory = z.infer<typeof FeedbackCategory>;

export const ProjectStatus = z.enum([
  'draft', 'active', 'completed', 'archived',
]);
export type ProjectStatus = z.infer<typeof ProjectStatus>;
