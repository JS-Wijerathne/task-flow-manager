import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTask, useUpdateTask, useDeleteTask } from './hooks/useTasks';
import { useProject } from '../projects/hooks/useProjects';
import { useProjectPermissions } from '../../shared/hooks/usePermissions';
import { TaskHistory } from './components/TaskHistory';
import { EditTaskModal } from './components/EditTaskModal';
import { Button } from '../../shared/components/Button';
import {
    Calendar, User, Tag, ArrowLeft, MoreHorizontal,
    Share2, Trash2, CheckCircle2, Circle, Clock, AlertTriangle, Edit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskStatus } from '@temp-ops/shared';
import { format } from 'date-fns';
import { useState } from 'react';
import { usePermissions } from '../../shared/hooks/usePermissions';

export const TaskDetailPage = () => {
    const { projectId, taskId } = useParams();
    const navigate = useNavigate();

    // Fetch Data
    const { data: task, isLoading: isTaskLoading, isError } = useTask(taskId!);
    const { data: project, isLoading: isProjectLoading } = useProject(projectId!);

    // Global permissions (for Admin fallback)
    const { isAdmin } = usePermissions();

    // Project-level Permissions - once project is loaded
    const { canWrite, canDeleteTask } = useProjectPermissions(project?.members || []);

    // Mutations
    const { mutate: updateTask } = useUpdateTask();
    const { mutate: deleteTask } = useDeleteTask();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Wait for both task AND project to load before rendering actions
    if (isTaskLoading || isProjectLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (isError || !task) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Task Not Found</h2>
                <Button variant="outline" onClick={() => navigate(`/projects/${projectId}`)}>
                    Back to Project
                </Button>
            </div>
        );
    }

    // Use global admin OR project-level canWrite permission
    const hasWriteAccess = isAdmin || canWrite;

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
            deleteTask(task.id, {
                onSuccess: () => navigate(`/projects/${projectId}`)
            });
        }
    };

    const handleStatusChange = (newStatus: TaskStatus) => {
        updateTask({ id: task.id, data: { status: newStatus } });
    };

    const priorityColors = {
        HIGH: 'bg-red-50 text-red-700 border-red-200',
        MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
        LOW: 'bg-blue-50 text-blue-700 border-blue-200',
    };

    const statusIcons = {
        [TaskStatus.TODO]: Circle,
        [TaskStatus.IN_PROGRESS]: Clock,
        [TaskStatus.DONE]: CheckCircle2,
    };

    const StatusIcon = statusIcons[task.status];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb & Back */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    to={`/projects/${projectId}`}
                    className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <nav className="flex items-center text-sm font-medium text-gray-500">
                    <Link to="/projects" className="hover:text-gray-900">Projects</Link>
                    <span className="mx-2">/</span>
                    <Link to={`/projects/${projectId}`} className="hover:text-gray-900">{project?.name || 'Project'}</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900">Tasks</span>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900">#{task.id.slice(0, 6)}</span>
                </nav>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Header Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:p-8">
                        <div className="flex items-start justify-between mb-6">
                            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                                {task.title}
                            </h1>

                            {/* Actions Dropdown */}
                            {hasWriteAccess && (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>

                                    {isMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                                            {/* Status Actions */}
                                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Change Status
                                            </div>
                                            {Object.values(TaskStatus).map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => {
                                                        handleStatusChange(status);
                                                        setIsMenuOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2",
                                                        task.status === status ? "text-primary-600 font-medium" : "text-gray-700"
                                                    )}
                                                >
                                                    {status === TaskStatus.DONE && <CheckCircle2 className="w-4 h-4" />}
                                                    {status === TaskStatus.IN_PROGRESS && <Clock className="w-4 h-4" />}
                                                    {status === TaskStatus.TODO && <Circle className="w-4 h-4" />}
                                                    {status.replace('_', ' ')}
                                                </button>
                                            ))}

                                            <div className="border-t border-gray-100 my-1"></div>

                                            {/* Edit/Delete Actions */}
                                            <button
                                                onClick={() => {
                                                    setIsEditOpen(true);
                                                    setIsMenuOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <Edit className="w-4 h-4" />
                                                Edit Task
                                            </button>
                                            {canDeleteTask && (
                                                <button
                                                    onClick={() => {
                                                        handleDelete();
                                                        setIsMenuOpen(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete Task
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Status/Priority Badges */}
                        <div className="flex flex-wrap items-center gap-3 mb-8">
                            <span className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border",
                                task.status === TaskStatus.DONE ? "bg-green-50 text-green-700 border-green-200" :
                                    task.status === TaskStatus.IN_PROGRESS ? "bg-blue-50 text-blue-700 border-blue-200" :
                                        "bg-gray-50 text-gray-700 border-gray-200"
                            )}>
                                <StatusIcon className="w-4 h-4" />
                                {task.status.replace('_', ' ')}
                            </span>

                            {task.priority && (
                                <span className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border",
                                    priorityColors[task.priority as keyof typeof priorityColors] || "bg-gray-100"
                                )}>
                                    <AlertTriangle className="w-4 h-4" />
                                    {task.priority} Priority
                                </span>
                            )}
                        </div>

                        <div className="prose prose-gray max-w-none">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Tag className="w-4 h-4" /> Description
                            </h3>
                            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                                {task.description || (
                                    <span className="text-gray-400 italic">No description provided.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* History Section */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <TaskHistory taskId={task.id} />
                    </div>
                </div>

                {/* Right Column: Meta Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
                        <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">
                            Details
                        </h3>

                        <div className="space-y-4">
                            {/* Assignee */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Assignee
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                                        {task.assignee?.name.charAt(0) || <User className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {task.assignee?.name || 'Unassigned'}
                                        </div>
                                        {task.assignee && (
                                            <div className="text-xs text-gray-500">{task.assignee.email}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Reporter */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Reporter
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold border border-gray-200">
                                        {task.reporter?.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {task.reporter?.name}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="pt-4 border-t border-gray-100 space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                                        Due Date
                                    </label>
                                    {task.dueDate ? (
                                        <>
                                            <div className={cn(
                                                "flex items-center gap-2 text-sm",
                                                new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE
                                                    ? "text-red-600 font-medium"
                                                    : "text-gray-700"
                                            )}>
                                                <Calendar className={cn(
                                                    "w-4 h-4",
                                                    new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE
                                                        ? "text-red-500"
                                                        : "text-gray-400"
                                                )} />
                                                {format(new Date(task.dueDate), 'MMMM d, yyyy')}
                                            </div>
                                            {new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE && (
                                                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    <span className="font-medium">Overdue</span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Calendar className="w-4 h-4" />
                                            No due date
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                                        Created
                                    </label>
                                    <div className="text-sm text-gray-600">
                                        {format(new Date(task.createdAt), 'MMM d, yyyy h:mm a')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Share/Copy Link Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                alert('Link copied to clipboard!');
                            }}
                            className="w-full flex items-center justify-center gap-2 p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-dashed border-gray-300"
                        >
                            <Share2 className="w-4 h-4" />
                            Copy Task Link
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Task Modal */}
            <EditTaskModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                task={task}
                projectMembers={project?.members || []}
            />
        </div>
    );
};
