'use server';

import { resolveDeadlock, type ResolveDeadlockInput, type ResolveDeadlockOutput } from '@/ai/flows/deadlock-resolution';
import type { TaskDependenciesMap, ResourceUsageMap } from '@/types';

export interface ResolveDeadlockServerInput {
  taskDependencies: TaskDependenciesMap;
  failedTasks: string[];
  runningTasks: string[];
  completedTasks: string[];
  resourceUsage: ResourceUsageMap;
  pastExecutionData: string;
}

export async function resolveDeadlockAction(input: ResolveDeadlockServerInput): Promise<ResolveDeadlockOutput | { error: string }> {
  try {
    // The AI flow expects resourceUsage as Record<string, number>
    // The current input is also Record<string, number> due to type ResourceUsageMap
    const aiInput: ResolveDeadlockInput = {
      taskDependencies: input.taskDependencies,
      failedTasks: input.failedTasks,
      runningTasks: input.runningTasks,
      completedTasks: input.completedTasks,
      resourceUsage: input.resourceUsage, // This should be fine
      pastExecutionData: input.pastExecutionData,
    };
    
    const result = await resolveDeadlock(aiInput);
    return result;
  } catch (error) {
    console.error("Error in resolveDeadlockAction:", error);
    return { error: error instanceof Error ? error.message : "An unknown error occurred during deadlock resolution." };
  }
}
