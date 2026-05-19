export const PIPELINE_STAGES = [
  { key: 'research', label: '竞品研究', progressRange: [0, 15] },
  { key: 'analysis', label: '分析报告', progressRange: [15, 30] },
  { key: 'storyboard', label: '分镜生成', progressRange: [30, 50] },
  { key: 'script', label: '脚本写作', progressRange: [50, 60] },
  { key: 'model_selection', label: '模型方案', progressRange: [60, 65] },
  { key: 'video_gen', label: '视频生成', progressRange: [65, 80] },
  { key: 'voiceover', label: '配音生成', progressRange: [80, 85] },
  { key: 'assembly', label: '视频组装', progressRange: [85, 95] },
  { key: 'evaluation', label: '质量评估', progressRange: [95, 100] },
] as const;

export const MAX_SCRIPT_ITERATIONS = 5;
export const FEEDBACK_TIMEOUT_DAYS = 7;
