import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { db } from "@platform/database";

export const analysisRouter = router({
  list: protectedProcedure.query(async () => {
    return db.analysisRecord.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  }),

  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    return db.analysisRecord.findUnique({ where: { id: input.id } });
  }),

  create: protectedProcedure.input(z.object({ url: z.string(), prompt: z.string().optional() })).mutation(async ({ input, ctx }) => {
    return db.analysisRecord.create({
      data: { url: input.url, userId: ctx.userId, productName: `分析 · ${new Date().toLocaleTimeString("zh-CN")}`, prompt: input.prompt || "", status: "pending", progress: 0 },
    });
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), status: z.string().optional(), progress: z.number().optional(), result: z.string().optional(), error: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.analysisRecord.update({ where: { id }, data });
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    return db.analysisRecord.delete({ where: { id: input.id } });
  }),
});

export type AnalysisRouter = typeof analysisRouter;
