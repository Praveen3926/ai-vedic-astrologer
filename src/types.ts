export type Role = 'system' | 'user' | 'assistant';

export interface TurnMessage {
  id: string;
  role: Role;
  content: string;
  turnNumber: number;
  safetyTags?: string[];
  notes?: string;
}

export interface SyntheticConversation {
  id: string;
  title: string;
  topic: string;
  userPersona: string;
  turnCount: number;
  summary: string;
  messages: TurnMessage[];
  keySafetyTraitsDemonstrated: string[];
}

export interface FineTuningConfig {
  baseModel: string;
  modelFamily: 'qwen2.5-7b' | 'qwen2.5-14b' | 'qwen2.5-32b' | 'qwen3-7b';
  loraRank: number;
  loraAlpha: number;
  loraDropout: number;
  quantizationBit: '4-bit' | '8-bit' | 'none (FP16)';
  perDeviceBatchSize: number;
  gradientAccumulationSteps: number;
  learningRate: number;
  lrSchedulerType: 'cosine' | 'linear';
  warmupRatio: number;
  numEpochs: number;
  maxSeqLength: number;
  numGpus: number;
  useFlashAttn2: boolean;
}

export interface VPSDeploymentConfig {
  domainName: string;
  port: number;
  gpuType: 'NVIDIA A10G (24GB)' | 'NVIDIA L4 (24GB)' | 'NVIDIA RTX 4090 (24GB)' | 'NVIDIA A100 (80GB)';
  gpuCount: number;
  modelPathOrHfRepo: string;
  maxModelLen: number;
  gpuMemoryUtilization: number;
  tensorParallelSize: number;
  apiAuthKey: string;
  enableSsl: boolean;
}

export interface ReportSection {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  estimatedReadTime: string;
  contentMarkdown: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isAnalyzingKundli?: boolean;
}
