import { X, Calendar, User, Tag, Clock, AlertTriangle } from 'lucide-react';
import { TaskDTO, TaskStatus, ProjectMemberDTO } from '@temp-ops/shared';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useProjectPermissions } from '../../../shared/hooks/usePermissions';
import { EditTaskModal } from './EditTaskModal';

interface TaskDetailPanelProps {
    task: TaskDTO | null;
    onClose: () => void;
    isOpen: boolean;
    projectMembers: ProjectMemberDTO[];
}

export const TaskDetailPanel = ({ task, onClose, isOpen, projectMembers }: TaskDetailPanelProps) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const { canWrite } = useProjectPermissions(projectMembers);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Only users with write access (Admins, Members) can edit tasks
    const canEdit = canWrite;

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !task) return null;

    // Resolve assignee name
    const assigneeMember = projectMembers.find(m => m.userId === task.assigneeId);
    const assigneeName = assigneeMember?.user?.name || task.assigneeId || 'Unassigned';

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity"
                onClick={onClose}
            />

            <div
                ref={panelRef}
                className={cn(
                    "relative w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto transform transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="p-6 space-y-8">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-mono text-gray-400">#{task.id.slice(0, 8)}</span>
                            <h2 className="text-xl font-bold text-gray-900 leading-tight">{task.title}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Meta Bar */}
                    <div className="flex flex-wrap gap-4 pb-6 border-b border-gray-100">
                        <div className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                            task.status === TaskStatus.TODO ? "bg-gray-50 text-gray-700 border-gray-200" :
                                task.status === TaskStatus.IN_PROGRESS ? "bg-blue-50 text-blue-700 border-blue-200" :
                                    "bg-green-50 text-green-700 border-green-200"
                        )}>
                            <Clock className="w-3.5 h-3.5" />
                            {task.status.replace('_', ' ')}
                        </div>

                        {task.priority && (
                            <div className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                                task.priority === 'HIGH' ? "bg-red-50 text-red-700 border-red-200" :
                                    "bg-gray-50 text-gray-700 border-gray-200"
                            )}>
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {task.priority}
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            Due {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'No date'}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-gray-400" />
                            Description
                        </h3>
                        <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {task.description || "No description provided."}
                        </div>
                    </div>

                    {/* Assignee */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            Assignee
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                                {task.assigneeId ? assigneeName.charAt(0) : '?'}
                            </div>
                            <span className="text-sm text-gray-700">
                                {task.assigneeId ? assigneeName : 'Unassigned'}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    {canEdit && (
                        <div className="pt-8 border-t border-gray-100">
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Actions</h3>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => setIsEditOpen(true)}
                                    className="flex items-center justify-center gap-2 w-full p-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Edit Task
                                </button>
                                {/* Add more actions here */}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Task Modal */}
            <EditTaskModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                task={task}
                projectMembers={projectMembers}
            />
        </div>
    );
};
