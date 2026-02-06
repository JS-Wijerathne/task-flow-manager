import { useParams } from 'react-router-dom';
import { Plus, Clock, CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TaskDTO, TaskStatus, ProjectMemberDTO } from '@temp-ops/shared';
import { useTasks } from './hooks/useTasks';
import { Button } from '../../shared/components/Button';
import { useState } from 'react';
import { TaskDetailPanel } from './components/TaskDetailPanel';
import { CreateTaskModal } from './components/CreateTaskModal';
import { useProjectPermissions } from '../../shared/hooks/usePermissions';

// Mapping for columns
const COLUMNS = [
    { id: TaskStatus.TODO, label: 'To Do', icon: Circle, color: 'text-gray-500' },
    { id: TaskStatus.IN_PROGRESS, label: 'In Progress', icon: Clock, color: 'text-blue-500' },
    { id: TaskStatus.DONE, label: 'Done', icon: CheckCircle2, color: 'text-green-500' },
];

interface TaskBoardProps {
    projectMembers: ProjectMemberDTO[];
}

export const TaskBoard = ({ projectMembers }: TaskBoardProps) => {
    const { projectId } = useParams();
    const { canCreateTask } = useProjectPermissions(projectMembers);
    const { data: tasks, isLoading, isError } = useTasks(projectId!);

    // Task Detail State
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

    // Derive selected task from live data
    const selectedTask = tasks?.find(t => t.id === selectedTaskId) || null;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-600">
                <AlertCircle className="w-8 h-8 mb-2" />
                <p>Failed to load tasks</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Task Board</h2>
                {canCreateTask && (
                    <Button size="sm" onClick={() => setIsCreateTaskOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Task
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
                {COLUMNS.map((col) => {
                    const columnTasks = tasks?.filter((t: TaskDTO) => t.status === col.id) || [];

                    return (
                        <div key={col.id} className="bg-gray-50 rounded-xl p-4 flex flex-col min-h-[300px] max-h-[calc(100vh-16rem)] border border-gray-100">
                            <div className="flex items-center justify-between mb-4 px-1">
                                <div className="flex items-center gap-2">
                                    <col.icon className={cn("w-4 h-4", col.color)} />
                                    <h3 className="font-semibold text-sm text-gray-700">{col.label}</h3>
                                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                                        {columnTasks.length}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 overflow-y-auto flex-1 pr-1 min-h-[100px]">
                                {columnTasks.map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => setSelectedTaskId(task.id)}
                                        className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                {task.priority && (
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide",
                                                        task.priority === 'HIGH' ? "bg-red-100 text-red-700" :
                                                            task.priority === 'MEDIUM' ? "bg-blue-100 text-blue-700" :
                                                                "bg-gray-100 text-gray-700"
                                                    )}>
                                                        {task.priority}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-3 line-clamp-2">{task.title}</h4>
                                        <div className="flex items-center justify-between">
                                            {task.assigneeId ? (
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                                                    U
                                                </div>
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-gray-100 border border-dashed border-gray-300" />
                                            )}
                                            <span className="text-xs text-gray-400">#{task.id.slice(0, 4)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <TaskDetailPanel
                isOpen={!!selectedTaskId}
                onClose={() => setSelectedTaskId(null)}
                task={selectedTask}
                projectMembers={projectMembers}
            />

            <CreateTaskModal
                isOpen={isCreateTaskOpen}
                onClose={() => setIsCreateTaskOpen(false)}
                projectId={projectId!}
                projectMembers={projectMembers}
            />
        </div>
    );
};
