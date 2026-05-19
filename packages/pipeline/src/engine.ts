import { db } from '@platform/database';
import { selectModel, estimateCost } from '@platform/ai';
import { MAX_SCRIPT_ITERATIONS } from '@platform/shared';

interface PipelineInput {
  taskId: string;
  projectId: string;
  type: string;
}

export async function runPipeline({ taskId, projectId, type }: PipelineInput) {
  const log = (msg: string) => console.log(`[Pipeline ${taskId}] ${msg}`);

  try {
    await db.pipelineTask.update({ where: { id: taskId }, data: { status: 'running', progress: 0 } });

    // ── Stage 1: Research (0→15%) ──
    log('Stage 1: Research');
    await advance(taskId, 'research', 0);
    const s1 = await createStage(taskId, 'research');
    const product = await db.project.findUnique({ where: { id: projectId }, select: { productName: true } });
    const model = selectModel({ domain: 'text_analysis', stage: 'research' });
    log(`Research: ${product?.productName} using ${model.primary.model}`);
    await completeStage(s1.id, { productName: product?.productName, status: 'done' });
    await advance(taskId, 'analysis', 15);

    // ── Stage 2: Analysis (15→30%) ──
    log('Stage 2: Analysis');
    const s2 = await createStage(taskId, 'analysis');
    await sleep(500);
    await completeStage(s2.id, { sellingPoints: [] });
    await advance(taskId, 'storyboard', 30);

    // ── Stage 3: Storyboard (30→50%) — waits for feedback ──
    log('Stage 3: Storyboard');
    const s3 = await createStage(taskId, 'storyboard');
    await db.pipelineTask.update({ where: { id: taskId }, data: { status: 'waiting_feedback' } });
    // Wait for user feedback via API
    await waitForUserAction(taskId, 'storyboard');
    await completeStage(s3.id, { scenes: [] });
    await advance(taskId, 'script', 50);

    // ── Stage 4: Script (50→60%) ──
    log('Stage 4: Script');
    const s4 = await createStage(taskId, 'script');
    for (let i = 1; i <= MAX_SCRIPT_ITERATIONS; i++) {
      log(`Script iteration ${i}/${MAX_SCRIPT_ITERATIONS}`);
      await sleep(300);
      if (i < MAX_SCRIPT_ITERATIONS) {
        const hasFeedback = await checkFeedback(taskId, 'script');
        if (!hasFeedback) break;
      }
    }
    await completeStage(s4.id, { content: '' });
    await advance(taskId, 'model_selection', 60);

    // ── Stage 5: Model Plan (60→65%) ──
    log('Stage 5: Model Plan');
    const s5 = await createStage(taskId, 'model_selection');
    const cost = estimateCost(selectModel({ domain: 'video_gen', stage: 'video_gen' }).primary, 100000);
    await db.generationPlan.create({ data: { taskId, selectedModel: 'jimeng', modelParams: '{}', estimatedCost: cost } });
    await completeStage(s5.id, { estimatedCost: cost });
    await advance(taskId, 'video_gen', 65);

    // ── Stage 6: Video Gen (65→80%) ──
    log('Stage 6: Video Generation');
    const s6 = await createStage(taskId, 'video_gen');
    await sleep(500);
    await completeStage(s6.id, { clipCount: 0 });
    await advance(taskId, 'voiceover', 80);

    // ── Stage 7: Voiceover (80→85%) ──
    log('Stage 7: Voiceover');
    const s7 = await createStage(taskId, 'voiceover');
    await completeStage(s7.id, { audioUrl: '' });
    await advance(taskId, 'assembly', 85);

    // ── Stage 8: Assembly (85→95%) ──
    log('Stage 8: Assembly');
    const s8 = await createStage(taskId, 'assembly');
    await completeStage(s8.id, { draftUrl: '' });
    await advance(taskId, 'evaluation', 95);

    // ── Stage 9: Evaluation (95→100%) ──
    log('Stage 9: Evaluation');
    const s9 = await createStage(taskId, 'evaluation');
    await completeStage(s9.id, { passed: true, score: 100 });

    await db.pipelineTask.update({
      where: { id: taskId },
      data: { status: 'completed', progress: 100, completedAt: new Date(), currentStage: 'completed' },
    });
    log('Pipeline complete');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`Pipeline failed: ${msg}`);
    await db.pipelineTask.update({
      where: { id: taskId },
      data: { status: 'failed', error: msg },
    });
  }
}

// ── Helpers ──

async function advance(taskId: string, stage: string, progress: number) {
  await db.pipelineTask.update({ where: { id: taskId }, data: { currentStage: stage, progress } });
}

async function createStage(taskId: string, stageType: string) {
  return db.pipelineStage.create({
    data: { taskId, stageType, status: 'running', startedAt: new Date() },
  });
}

async function completeStage(stageId: string, output: unknown) {
  await db.pipelineStage.update({
    where: { id: stageId },
    data: { status: 'completed', completedAt: new Date(), output: JSON.stringify(output) },
  });
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Poll database for user feedback on a stage
async function waitForUserAction(taskId: string, stage: string, timeoutMs = 7 * 24 * 3600 * 1000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await sleep(3000);
    const feedback = await db.feedback.findFirst({
      where: { taskId, stage },
      orderBy: { createdAt: 'desc' },
    });
    if (feedback) return feedback;
  }
  return null;
}

async function checkFeedback(taskId: string, stage: string) {
  const feedback = await db.feedback.findFirst({
    where: { taskId, stage },
    orderBy: { createdAt: 'desc' },
  });
  return !!feedback;
}
