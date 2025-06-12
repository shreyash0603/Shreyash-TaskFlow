import type { TaskStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Loader2, Clock, RefreshCw, PlayCircle } from 'lucide-react';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  isCompact?: boolean;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-status-pending text-status-pending-foreground hover:bg-status-pending/90',
  },
  running: {
    label: 'Running',
    icon: PlayCircle, // Loader2 for animated if preferred
    className: 'bg-status-running text-status-running-foreground hover:bg-status-running/90 animate-pulse',
  },
  succeeded: {
    label: 'Succeeded',
    icon: CheckCircle2,
    className: 'bg-status-succeeded text-status-succeeded-foreground hover:bg-status-succeeded/90',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    className: 'bg-status-failed text-status-failed-foreground hover:bg-status-failed/90',
  },
  retrying: {
    label: 'Retrying',
    icon: RefreshCw,
    className: 'bg-status-retrying text-status-retrying-foreground hover:bg-status-retrying/90 animate-spin',
  },
};

export function TaskStatusBadge({ status, isCompact = false }: TaskStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  if (isCompact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn("p-1 rounded-full", config.className.split(' ').find(c => c.startsWith('bg-')))}>
              <Icon className={cn("h-4 w-4", config.className.split(' ').find(c => c.startsWith('text-')))} />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{config.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <Badge className={cn('flex items-center gap-1.5 transition-all duration-300 ease-in-out', config.className)}>
      <Icon className={cn("h-3.5 w-3.5", status === 'retrying' ? 'animate-spin' : '')} />
      <span>{config.label}</span>
    </Badge>
  );
}

// Minimal Tooltip components to avoid circular dependencies or if not globally available
// For production, ensure TooltipProvider is at a higher level
const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>; // Simplified
const Tooltip = ({ children }: { children: React.ReactNode }) => <>{children}</>; // Simplified
const TooltipTrigger = ({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) => asChild ? children : <>{children}</> ; // Simplified
const TooltipContent = ({ children }: { children: React.ReactNode }) => <div className="hidden">{children}</div>; // Simplified
