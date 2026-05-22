import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function createTRPCContext(opts: { headers: Headers }) {
  return { headers: opts.headers };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// ── Protected procedure (requires authentication) ──
export const protectedProcedure = t.procedure.use(async (opts) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录后再操作' });
  }
  return opts.next({
    ctx: { session, userId: session.user.email },
  });
});
