'use client';

import type { Task, TaskNode, TaskEdge } from '@/types';
import React, { useMemo, useEffect, useState }from 'react';
import { TaskStatusBadge } from './TaskStatusBadge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DagVisualizationProps {
  tasks: Task[];
  selectedTaskId?: string;
  onNodeClick: (taskId: string) => void;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const LEVEL_GAP = 250;
const NODE_VERTICAL_GAP = 40;

const statusColors: Record<Task['status'], string> = {
  pending: 'hsl(var(--status-pending))',
  running: 'hsl(var(--status-running))',
  succeeded: 'hsl(var(--status-succeeded))',
  failed: 'hsl(var(--status-failed))',
  retrying: 'hsl(var(--status-retrying))',
};
const statusTextColors: Record<Task['status'], string> = {
  pending: 'hsl(var(--status-pending-foreground))',
  running: 'hsl(var(--status-running-foreground))',
  succeeded: 'hsl(var(--status-succeeded-foreground))',
  failed: 'hsl(var(--status-failed-foreground))',
  retrying: 'hsl(var(--status-retrying-foreground))',
};

export function DagVisualization({ tasks, selectedTaskId, onNodeClick }: DagVisualizationProps) {
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setContainerSize({ width, height });
      }
    });
    const container = document.getElementById('dag-container');
    if (container) {
      resizeObserver.observe(container);
    }
    return () => {
      if (container) {
        resizeObserver.unobserve(container);
      }
    };
  }, []);
  
  const { nodes, edges, dagWidth, dagHeight } = useMemo(() => {
    if (tasks.length === 0) return { nodes: [], edges: [], dagWidth: 0, dagHeight: 0 };

    const taskMap = new Map(tasks.map(task => [task.id, task]));
    const adj: Record<string, string[]> = {};
    const revAdj: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};

    tasks.forEach(task => {
      adj[task.id] = [];
      revAdj[task.id] = [];
      inDegree[task.id] = 0;
    });

    tasks.forEach(task => {
      task.dependencies.forEach(depId => {
        if (taskMap.has(depId)) {
          adj[depId]?.push(task.id);
          revAdj[task.id]?.push(depId);
          inDegree[task.id]++;
        }
      });
    });
    
    const levels: string[][] = [];
    let queue = tasks.filter(task => inDegree[task.id] === 0).map(task => task.id);
    
    let currentLevel = 0;
    while(queue.length > 0) {
        levels[currentLevel] = queue;
        const nextQueue: string[] = [];
        for (const u of queue) {
            for (const v of adj[u] || []) {
                inDegree[v]--;
                if (inDegree[v] === 0) {
                    nextQueue.push(v);
                }
            }
        }
        queue = nextQueue;
        currentLevel++;
    }

    // Handle cycles: add remaining nodes to a final level or distribute
    const remainingNodes = tasks.filter(task => !levels.flat().includes(task.id));
    if (remainingNodes.length > 0) {
      levels[currentLevel] = remainingNodes.map(n => n.id);
    }


    const positionedNodes: TaskNode[] = [];
    let maxNodesInLevel = 0;

    levels.forEach((levelTasks, levelIndex) => {
      maxNodesInLevel = Math.max(maxNodesInLevel, levelTasks.length);
      levelTasks.forEach((taskId, taskIndexInLevel) => {
        const task = taskMap.get(taskId);
        if (task) {
          positionedNodes.push({
            ...task,
            x: levelIndex * LEVEL_GAP + NODE_WIDTH / 2,
            y: taskIndexInLevel * (NODE_HEIGHT + NODE_VERTICAL_GAP) + NODE_HEIGHT / 2,
          });
        }
      });
    });
    
    const calculatedDagWidth = levels.length * LEVEL_GAP;
    const calculatedDagHeight = maxNodesInLevel * (NODE_HEIGHT + NODE_VERTICAL_GAP);

    const finalEdges: TaskEdge[] = [];
    positionedNodes.forEach(targetNode => {
      targetNode.dependencies.forEach(sourceId => {
        const sourceNode = positionedNodes.find(n => n.id === sourceId);
        if (sourceNode) {
          finalEdges.push({
            id: `edge-${sourceNode.id}-${targetNode.id}`,
            source: sourceNode.id,
            target: targetNode.id,
          });
        }
      });
    });

    return { nodes: positionedNodes, edges: finalEdges, dagWidth: calculatedDagWidth, dagHeight: calculatedDagHeight };
  }, [tasks]);

  if (tasks.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">No tasks to visualize.</div>;
  }
  
  const viewBoxWidth = Math.max(dagWidth, containerSize.width);
  const viewBoxHeight = Math.max(dagHeight, containerSize.height);

  return (
    <div id="dag-container" className="w-full h-full overflow-auto bg-muted/30 rounded-lg shadow-inner">
      <svg width={viewBoxWidth} height={viewBoxHeight} className="min-w-full min-h-full">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="0"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--muted-foreground))" />
          </marker>
        </defs>
        <g transform={`translate(${NODE_WIDTH/2 + 20}, ${NODE_VERTICAL_GAP})`}> {/* Padding around DAG */}
          <AnimatePresence>
            {edges.map(edge => {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              // Calculate end point for arrow to be just outside target node
              const dx = targetNode.x - sourceNode.x;
              const dy = targetNode.y - sourceNode.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const unitDx = dx / dist;
              const unitDy = dy / dist;
              
              const targetX = targetNode.x - unitDx * (NODE_WIDTH / 2 + 5); // 5 for arrowhead space
              const targetY = targetNode.y - unitDy * (NODE_HEIGHT / 2 + 5);


              return (
                <motion.line
                  key={edge.id}
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetX}
                  y2={targetY}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="1.5"
                  markerEnd="url(#arrowhead)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              );
            })}
          </AnimatePresence>
          <AnimatePresence>
            {nodes.map(node => (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                transform={`translate(${node.x - NODE_WIDTH / 2}, ${node.y - NODE_HEIGHT / 2})`}
                onClick={() => onNodeClick(node.id)}
                className="cursor-pointer group"
              >
                <rect
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx="8"
                  ry="8"
                  fill={statusColors[node.status] || 'hsl(var(--muted))'}
                  stroke={node.id === selectedTaskId ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                  strokeWidth={node.id === selectedTaskId ? 3 : 1.5}
                  className="transition-all duration-300 group-hover:shadow-lg"
                />
                <foreignObject width={NODE_WIDTH} height={NODE_HEIGHT}>
                  <div 
                    className="flex flex-col items-center justify-center h-full p-2 overflow-hidden"
                    style={{ color: statusTextColors[node.status] || 'hsl(var(--foreground))' }}
                  >
                    <span className="text-sm font-medium font-headline truncate w-full text-center">{node.name}</span>
                    <div className="mt-1 transform scale-[0.8]">
                       <TaskStatusBadge status={node.status} />
                    </div>
                  </div>
                </foreignObject>
              </motion.g>
            ))}
          </AnimatePresence>
        </g>
      </svg>
    </div>
  );
}
