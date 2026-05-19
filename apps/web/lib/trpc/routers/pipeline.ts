import { z } from 'zod';
import { router, publicProcedure } from '../server';
import { db } from '@platform/database';
import { SubmitFeedbackInput } from '@platform/shared';

export const pipelineRouter = router({
  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    return db.pipelineTask.findUnique({
      where: { id: input.id },
      include: { stages: { orderBy: { startedAt: 'asc' } }, videoAssets: true },
    });
  }),

  listByProject: publicProcedure.input(z.object({ projectId: z.string() })).query(async ({ input }) => {
    return db.pipelineTask.findMany({
      where: { projectId: input.projectId },
      orderBy: { createdAt: 'desc' },
      include: { stages: true },
    });
  }),

  progress: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const task = await db.pipelineTask.findUnique({
      where: { id: input.id },
      select: { id: true, progress: true, currentStage: true, status: true },
    });
    return task;
  }),

  submitFeedback: publicProcedure.input(SubmitFeedbackInput).mutation(async ({ input }) => {
    return db.feedback.create({
      data: {
        taskId: input.taskId, userId: 'admin', stage: input.stage,
        rating: input.rating, comment: input.comment, category: input.category,
      },
    });
  }),

  history: publicProcedure.query(async () => {
    return db.pipelineTask.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { project: { select: { productName: true } } },
    });
  }),
});

export type PipelineRouter = typeof pipelineRouter;
