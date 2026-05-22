import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { db } from '@platform/database';
import { CreateProjectInput, StartPipelineInput } from '@platform/shared';
import { runPipeline } from '@platform/pipeline';

export const projectRouter = router({
  list: protectedProcedure.query(async () => {
    return db.project.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { tasks: true } } } });
  }),

  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    return db.project.findUnique({ where: { id: input.id }, include: { tasks: true, sellingPoints: true } });
  }),

  create: protectedProcedure.input(CreateProjectInput).mutation(async ({ input, ctx }) => {
    return db.project.create({ data: { userId: ctx.userId, productName: input.productName, description: input.description || '' } });
  }),

  startPipeline: protectedProcedure.input(StartPipelineInput).mutation(async ({ input }) => {
    const task = await db.pipelineTask.create({
      data: { projectId: input.projectId, type: input.type, input: JSON.stringify(input.input || {}) },
    });

    runPipeline({ taskId: task.id, projectId: input.projectId, type: input.type }).catch(console.error);

    return task;
  }),
});

export type ProjectRouter = typeof projectRouter;
