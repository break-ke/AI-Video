import { router } from '../server';
import { projectRouter } from './project';
import { pipelineRouter } from './pipeline';
import { analysisRouter } from './analysis';
import { storyboardRouter } from './storyboard';

export const appRouter = router({
  project: projectRouter,
  pipeline: pipelineRouter,
  analysis: analysisRouter,
  storyboard: storyboardRouter,
});

export type AppRouter = typeof appRouter;
