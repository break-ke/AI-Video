import { z } from "zod";
import { router, publicProcedure } from "../server";
import { db } from "@platform/database";

async function getOrCreateDefaultStoryboard() {
  let sb = await db.storyboard.findFirst({ where: { status: "active" } });
  if (sb) return sb;

  // Get or create a user (foreign key requirement for Project)
  let user = await db.user.findFirst();
  if (!user) {
    user = await db.user.create({ data: { clerkId: "default", email: "admin@videoforge.local", name: "管理员" } });
  }

  // Ensure parent records exist
  let project = await db.project.findFirst({ where: { productName: "故事板工作区" } });
  if (!project) {
    project = await db.project.create({ data: { userId: user.id, productName: "故事板工作区", status: "active" } });
  }
  let task = await db.pipelineTask.findFirst({ where: { projectId: project.id, type: "storyboard" } });
  if (!task) {
    task = await db.pipelineTask.create({ data: { projectId: project.id, type: "storyboard", status: "processing" } });
  }
  sb = await db.storyboard.create({ data: { taskId: task.id, status: "active" } });
  return sb;
}

export const storyboardRouter = router({
  listConfirmed: publicProcedure.query(async () => {
    const sb = await db.storyboard.findFirst({ where: { status: "active" } });
    if (!sb) return [];
    return db.storyboardScene.findMany({
      where: { storyboardId: sb.id, status: "confirmed" },
      orderBy: { sequence: "asc" },
    });
  }),

  createScene: publicProcedure
    .input(z.object({ description: z.string(), imagePrompt: z.string(), generatedImageUrl: z.string().optional(), referenceImageUrl: z.string().optional() }))
    .mutation(async ({ input }) => {
      const sb = await getOrCreateDefaultStoryboard();
      const maxSeq = await db.storyboardScene.findFirst({ where: { storyboardId: sb.id }, orderBy: { sequence: "desc" }, select: { sequence: true } });
      return db.storyboardScene.create({
        data: {
          storyboardId: sb.id,
          sequence: (maxSeq?.sequence || 0) + 1,
          description: input.description,
          imagePrompt: input.imagePrompt,
          generatedImageUrl: input.generatedImageUrl || "",
          referenceImageUrl: input.referenceImageUrl || "",
          status: "confirmed",
        },
      });
    }),

  deleteScene: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.storyboardScene.delete({ where: { id: input.id } });
    }),

  updateSceneStatus: publicProcedure
    .input(z.object({ id: z.string(), status: z.string() }))
    .mutation(async ({ input }) => {
      return db.storyboardScene.update({ where: { id: input.id }, data: { status: input.status } });
    }),
});

export type StoryboardRouter = typeof storyboardRouter;
