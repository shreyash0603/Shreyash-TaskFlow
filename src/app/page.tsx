'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Task, TaskStatus, TaskNode, TaskEdge, TaskDependenciesMap, ResourceUsageMap } from '@/types';
import { resolveDeadlockAction, type ResolveDeadlockServerInput } from './actions';
import type { ResolveDeadlockOutput } from '@/ai/flows/deadlock-resolution';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaskList } from '@/components/TaskList';
import { DagVisualization } from '@/components/DagVisualization';
import { TaskCard } from '@/components/TaskCard'; // For displaying selected task details

import { AlertTriangle, Brain, Check, Copy, ExternalLink, GanttChartSquare, Loader2, Play, RefreshCw, SquareTerminal, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';

const initialTasks: Task[] = [
  { id: 'T1', name: 'Extract Data', status: 'pending', dependencies: [], retries: 0, cpuUsage: 20, memoryUsage: 128, description: "Fetches raw data from source systems." },
  { id: 'T2', name: 'Transform Data', status: 'pending', dependencies: ['T1'], retries: 0, cpuUsage: 50, memoryUsage: 256, description: "Cleans and structures extracted data." },
  { id: 'T3', name: 'Load Stage Data', status: 'pending', dependencies: ['T2'], retries: 0, cpuUsage: 30, memoryUsage: 180, description: "Loads transformed data to staging area." },
  { id: 'T4', name: 'Analyze Stage Data', status: 'pending', dependencies: ['T3'], retries: 0, cpuUsage: 60, memoryUsage: 300, description: "Performs initial analysis on staged data." },
  { id: 'T5', name: 'Generate Report', status: 'pending', dependencies: ['T4'], retries: 0, cpuUsage: 25, memoryUsage: 150, description: "Creates final report from analyzed data." },
  { id: 'T6', name: 'Archive Data', status: 'pending', dependencies: ['T5'], retries: 0, cpuUsage: 10, memoryUsage: 100, description: "Archives processed data and reports." },
  // Deadlock potential tasks (initially out of normal flow)
  { id: 'T7', name: 'Resource Hog A', status: 'pending', dependencies: ['T3'], retries: 0, cpuUsage: 90, memoryUsage: 500, description: "A task that consumes many resources." },
  { id: 'T8', name: 'Resource Hog B', status: 'pending', dependencies: ['T7'], retries: 0, cpuUsage: 85, memoryUsage: 450, description: "Another resource-intensive task depending on A." },
  { id: 'T9', name: 'Self-dependent Task', status: 'pending', dependencies: ['T9'], retries: 0, cpuUsage: 5, memoryUsage: 50, description: "A task creating an immediate cycle."},
];

const AppHeader = () => (
  <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container flex h-16 items-center">
      <GanttChartSquare className="h-7 w-7 mr-3 text-primary" />
      <h1 className="text-2xl font-bold font-headline tracking-tight">TaskFlow</h1>
    </div>
  </header>
);

export default function TaskFlowPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [executionOrder, setExecutionOrder] = useState<string[]>(initialTasks.map(t => t.id));
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
  
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState<ResolveDeadlockOutput | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isDeadlocked, setIsDeadlocked] = useState(false);

  const { toast } = useToast();

  const updateTaskStatus = useCallback((taskId: string, status: TaskStatus, error?: string, retries?: number) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status, error: error || task.error, retries: retries !== undefined ? retries : task.retries } : task
      )
    );
  }, []);
  
  // Simulate task execution and deadlock detection
  useEffect(() => {
    let deadlockDetected = false;
    const runningOrPendingTasks = tasks.filter(t => t.status === 'running' || t.status === 'pending');
    if (runningOrPendingTasks.length > 0) {
      const completableTasks = runningOrPendingTasks.filter(task => 
        task.dependencies.every(depId => tasks.find(d => d.id === depId)?.status === 'succeeded')
      );
      if (completableTasks.length === 0 && runningOrPendingTasks.length > 0) {
         // Basic deadlock: tasks are pending/running but none can proceed.
        const hasCycle = tasks.some(task => task.id === 'T9' && task.status !== 'succeeded' && task.status !== 'failed'); // Specific check for T9 cycle
        if(hasCycle) {
            deadlockDetected = true;
            updateTaskStatus('T9', 'failed', 'Cyclic dependency detected');
        } else if (tasks.some(t => t.id.startsWith('T7') || t.id.startsWith('T8'))) { // check for resource hogs potentially blocking
             const t7 = tasks.find(t => t.id === 'T7');
             const t8 = tasks.find(t => t.id === 'T8');
             if (t7?.status === 'running' && t8?.status === 'running') { // Both hogs running can be a deadlock
                deadlockDetected = true;
             }
        }
      }
    }
    setIsDeadlocked(deadlockDetected);
  }, [tasks, updateTaskStatus]);

  const handleResolveDeadlock = async () => {
    setIsLoadingAi(true);
    setAiResponse(null);
    setIsAiModalOpen(true);

    const taskDependencies: TaskDependenciesMap = tasks.reduce((acc, task) => {
      acc[task.id] = task.dependencies;
      return acc;
    }, {} as TaskDependenciesMap);

    const resourceUsage: ResourceUsageMap = tasks.reduce((acc, task) => {
      acc[task.id] = task.cpuUsage + task.memoryUsage / 10; // Simple combined metric
      return acc;
    }, {} as ResourceUsageMap);

    const input: ResolveDeadlockServerInput = {
      taskDependencies,
      failedTasks: tasks.filter(t => t.status === 'failed').map(t => t.id),
      runningTasks: tasks.filter(t => t.status === 'running').map(t => t.id),
      completedTasks: tasks.filter(t => t.status === 'succeeded').map(t => t.id),
      resourceUsage,
      pastExecutionData: "Task T9 has a self-dependency. Tasks T7 and T8 are known resource hogs and have caused system slowdowns in previous runs. Other tasks generally perform well.",
    };

    const result = await resolveDeadlockAction(input);
    setIsLoadingAi(false);
    if ('error' in result) {
      setAiResponse(null); // Clear previous valid response if any
      toast({
        variant: "destructive",
        title: "AI Resolution Failed",
        description: result.error,
      });
      // Keep modal open to show error, or close it. For now, let's allow manual close.
    } else {
      setAiResponse(result);
    }
  };
  
  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  // Simple simulation logic
  const simulateStep = () => {
    // For demonstration, pick a pending task whose dependencies are met and run it.
    // Or fail a task to show highlighting.
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const runnableTask = pendingTasks.find(task => 
      task.dependencies.every(depId => tasks.find(d => d.id === depId)?.status === 'succeeded')
    );

    if (runnableTask) {
      updateTaskStatus(runnableTask.id, 'running');
      setTimeout(() => {
        // Simulate success or failure
        const success = Math.random() > 0.2 || runnableTask.id === 'T9'; // T9 will always fail due to cycle in this simple sim
        if (runnableTask.id === 'T9') {
             updateTaskStatus(runnableTask.id, 'failed', 'Cyclic dependency');
        } else if (success) {
          updateTaskStatus(runnableTask.id, 'succeeded');
        } else {
          updateTaskStatus(runnableTask.id, 'failed', 'Simulated failure');
        }
      }, 1500 + Math.random() * 1000);
    } else {
      // If no runnable tasks but still pending/running tasks, it might be a deadlock
      // This is handled by the isDeadlocked useEffect.
      // If T7 and T8 are involved and T3 is done, try to run T7.
      const t3 = tasks.find(t=> t.id === 'T3');
      const t7 = tasks.find(t=> t.id === 'T7');
      if (t3?.status === 'succeeded' && t7?.status === 'pending') {
        updateTaskStatus('T7', 'running');
         setTimeout(() => updateTaskStatus('T7', 'running'), 2000); // keep it running to simulate hog
      }
    }
  };

  const resetSimulation = () => {
    setTasks(initialTasks);
    setExecutionOrder(initialTasks.map(t => t.id));
    setSelectedTaskId(undefined);
    setIsDeadlocked(false);
    toast({ title: "Simulation Reset", description: "Task states have been reset to initial values."});
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied to clipboard!" });
    }).catch(err => {
      toast({ variant: "destructive", title: "Failed to copy", description: String(err) });
    });
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Left Panel: DAG Visualization and Controls */}
          <div className="lg:w-2/3 flex flex-col gap-4">
            <Card className="shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-headline text-xl">Task Dependencies (DAG)</CardTitle>
                <div className="flex gap-2">
                   <Button onClick={simulateStep} size="sm" variant="outline"><Play className="mr-2 h-4 w-4" />Simulate Step</Button>
                   <Button onClick={resetSimulation} size="sm" variant="outline"><RefreshCw className="mr-2 h-4 w-4" />Reset</Button>
                </div>
              </CardHeader>
              <CardContent className="h-[400px] md:h-[500px] lg:h-[600px] p-2">
                <DagVisualization tasks={tasks} selectedTaskId={selectedTaskId} onNodeClick={setSelectedTaskId} />
              </CardContent>
            </Card>
            {isDeadlocked && (
              <Card className="border-destructive bg-destructive/10 shadow-md">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle />Deadlock Detected!</CardTitle>
                  <CardDescription className="text-destructive/80">
                    The task flow seems to be in a deadlock state. Some tasks cannot proceed.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleResolveDeadlock} disabled={isLoadingAi} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    {isLoadingAi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                    Resolve with AI
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel: Task List and Details */}
          <div className="lg:w-1/3 flex flex-col gap-4">
            <Card className="flex-1 flex flex-col shadow-md max-h-[calc(100vh-12rem)]">
              <CardHeader className="pb-2">
                <CardTitle className="font-headline text-xl">Task Execution Order</CardTitle>
                <CardDescription>Live status updates for each task.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                 <TaskList tasks={tasks} executionOrder={executionOrder} selectedTaskId={selectedTaskId} onTaskSelect={setSelectedTaskId} />
              </CardContent>
            </Card>
            
            {selectedTask && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Task Details: {selectedTask.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <TaskCard task={selectedTask} isSelected={true} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="max-w-2xl w-[90vw] shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline flex items-center gap-2">
              <Brain className="text-primary w-7 h-7" /> AI Deadlock Resolution
            </DialogTitle>
            <DialogDescription>
              AI-powered suggestions to resolve the current task flow deadlock.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-1 pr-4 custom-scrollbar">
            {isLoadingAi && (
              <div className="flex flex-col items-center justify-center h-48 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Analyzing deadlock and generating suggestions...</p>
              </div>
            )}
            {aiResponse && !isLoadingAi && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 font-headline">Suggested Strategies</h3>
                  <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                    {aiResponse.suggestedStrategies.map((strategy, index) => (
                      <li key={index}>{strategy}</li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold font-headline">Re-evaluated Task Execution Order</h3>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(aiResponse.reevaluatedTaskExecutionOrder.join(', '))}>
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Order
                    </Button>
                  </div>
                  <ScrollArea className="max-h-40 w-full rounded-md border p-3 bg-muted/50">
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      {aiResponse.reevaluatedTaskExecutionOrder.map((taskId, index) => (
                        <li key={index} className="font-mono">{taskId}</li>
                      ))}
                    </ol>
                  </ScrollArea>
                </div>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2 font-headline">Explanation</h3>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{aiResponse.explanation}</p>
                </div>
              </div>
            )}
            {!aiResponse && !isLoadingAi && (
                 <div className="flex flex-col items-center justify-center h-48 gap-4">
                    <SquareTerminal className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">AI analysis results will appear here.</p>
                  </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
             {aiResponse && !isLoadingAi && (
                 <Button onClick={() => {
                     setExecutionOrder(aiResponse.reevaluatedTaskExecutionOrder);
                     setIsAiModalOpen(false);
                     toast({ title: "Task Order Updated", description: "AI suggested order has been applied." });
                 }}>
                     <Check className="mr-2 h-4 w-4"/> Apply New Order
                 </Button>
             )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
