import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { db } from "@platform/database";

export const storyboardRouter = router({
  listConfirmed: protectedProcedure.query(async () => {
    const sb = await db.storyboard.findFirst({ where: { status: "active" } });
    if (!sb) return [];
    return db.storyboardScene.findMany({
      where: { storyboardId: sb.id, status: "confirmed" },
      orderBy: { sequence: "asc" },
    });
  }),

  createScene: protectedProcedure
    .input(z.object({ description: z.string(), imagePrompt: z.string(), generatedImageUrl: z.string().optional(), referenceImageUrl: z.string().optional() }))
    .mutation(async ({ input }) => {
      const sb = await db.storyboard.findFirst({ where: { status: "active" } });
      if (!sb) throw new Error("没有活跃的故事板，请先创建项目");
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

  deleteScene: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.storyboardScene.delete({ where: { id: input.id } });
    }),

  updateSceneStatus: protectedProcedure
    .input(z.object({ id: z.string(), status: z.string() }))
    .mutation(async ({ input }) => {
      return db.storyboardScene.update({ where: { id: input.id }, data: { status: input.status } });
    }),
});

export type StoryboardRouter = typeof storyboardRouter;
