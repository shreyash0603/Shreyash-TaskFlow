import type { Task } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskStatusBadge } from '@/components/TaskStatusBadge';
import { Separator } from '@/components/ui/separator';
import { Cpu, MemoryStick, Timer, AlertTriangle, ListCollapse } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  isSelected?: boolean;
  onClick?: () => void;
}

export function TaskCard({ task, isSelected, onClick }: TaskCardProps) {
  return (
    <Card 
      className={cn(
        "w-full shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer",
        isSelected ? "ring-2 ring-primary border-primary" : "border-border"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-headline">{task.name}</CardTitle>
          <TaskStatusBadge status={task.status} />
        </div>
        {task.description && <CardDescription className="text-xs pt-1">{task.description}</CardDescription>}
      </CardHeader>
      <CardContent className="pb-4 text-sm space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4" />
            <span>CPU: {task.cpuUsage}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MemoryStick className="w-4 h-4" />
            <span>Mem: {task.memoryUsage}MB</span>
          </div>
        </div>
        {task.duration !== undefined && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Timer className="w-4 h-4" />
            <span>Duration: {task.duration / 1000}s</span>
          </div>
        )}
        {task.dependencies.length > 0 && (
          <div className="flex items-start gap-1.5 text-muted-foreground pt-1">
            <ListCollapse className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="text-xs">Depends on: {task.dependencies.join(', ')}</span>
          </div>
        )}
      </CardContent>
      { (task.retries > 0 || task.error) && <Separator />}
      <CardFooter className="pt-3 pb-3 text-xs flex flex-col items-start gap-1">
        {task.retries > 0 && (
          <div className="flex items-center gap-1.5 text-status-retrying">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Retries: {task.retries}</span>
          </div>
        )}
        {task.status === 'failed' && task.error && (
          <p className="text-status-failed overflow-hidden text-ellipsis whitespace-nowrap w-full">
            Error: {task.error}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}

// cn utility if not globally available in this context (should be)
const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');
