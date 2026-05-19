import { NextResponse } from 'next/server';
import { db } from '@platform/database';
import { runPipeline } from '@platform/pipeline';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { projectId, type, input } = body;

  const task = await db.pipelineTask.create({
    data: { projectId, type, input: JSON.stringify(input || {}) },
  });

  // Run pipeline in background (non-blocking)
  runPipeline({ taskId: task.id, projectId, type }).catch(console.error);

  return NextResponse.json(task);
}
