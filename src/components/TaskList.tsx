import type { Task } from '@/types';
import { TaskCard } from '@/components/TaskCard';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TaskListProps {
  tasks: Task[];
  executionOrder: string[]; // IDs of tasks in order
  selectedTaskId?: string;
  onTaskSelect: (taskId: string) => void;
}

export function TaskList({ tasks, executionOrder, selectedTaskId, onTaskSelect }: TaskListProps) {
  const orderedTasks = executionOrder
    .map(id => tasks.find(t => t.id === id))
    .filter(Boolean) as Task[];

  if (orderedTasks.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No tasks to display.</div>;
  }
  
  return (
    <ScrollArea className="h-full p-1">
      <div className="space-y-3 p-3">
        {orderedTasks.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task}
            isSelected={task.id === selectedTaskId}
            onClick={() => onTaskSelect(task.id)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
