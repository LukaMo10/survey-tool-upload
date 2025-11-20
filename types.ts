export interface Quote {
  text: string;
  source: string; // The user identifier, e.g., "[User 1]"
}

export interface CorePoint {
  label: string;
  description: string;
  percentage: number;
  quotes: Quote[];
}

export interface QuestionInsight {
  question: string;
  corePoints: CorePoint[];
}

export interface UserCluster {
  name: string;
  description: string;
  percentage: number;
  characteristics: string[];
  userIds: string[];
}

export interface LogicalModule {
  title: string;
  content: string;
}

export interface CoreConclusions {
  overallConclusion: string;
  logicalModules: LogicalModule[];
  actionableInsights: string[];
  logicDiagramMermaid: string;
}

export interface AnalysisResult {
  coreConclusions: CoreConclusions;
  questionInsights: QuestionInsight[];
  userClusters: UserCluster[];
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}