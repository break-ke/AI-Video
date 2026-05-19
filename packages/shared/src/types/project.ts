import { z } from 'zod';

export const CreateProjectInput = z.object({
  productName: z.string().min(1).max(200),
  description: z.string().optional(),
});

export const StartPipelineInput = z.object({
  projectId: z.string(),
  type: z.enum(['competitor_analysis', 'full_pipeline', 'clone_from_template']),
  templateId: z.string().optional(),
  input: z.record(z.unknown()).optional(),
});

export const SubmitFeedbackInput = z.object({
  taskId: z.string(),
  stage: z.string(),
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
  category: z.enum(['tone', 'pacing', 'visual', 'script', 'voiceover', 'other']).optional(),
});
