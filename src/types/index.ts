export type TaskStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'retrying';

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  dependencies: string[];
  retries: number;
  cpuUsage: number; 
  memoryUsage: number;
  dagPosition?: { x: number; y: number };
  error?: string;
  duration?: number; // in ms
  description?: string;
}

export interface TaskNode extends Task {
  x: number;
  y: number;
}

export interface TaskEdge {
  id: string;
  source: string;
  target: string;
}

// For AI Input
export interface TaskDependenciesMap {
  [taskId: string]: string[];
}
export interface ResourceUsageMap {
  [taskId: string]: number; 
}
