import { ProjectAnalyticsDTO } from '@temp-ops/shared';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { User, ArrowRight } from 'lucide-react';


interface OverdueTasksListProps {
    tasks: ProjectAnalyticsDTO['overdueTasks'];
    projectId: string; // Needed for linking
}

export const OverdueTasksList = ({ tasks, projectId }: OverdueTasksListProps) => {
    if (!tasks || tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                <CheckCircle2 className="w-12 h-12 mb-3 text-green-100" />
                <p className="text-sm font-medium text-gray-500">No overdue tasks!</p>
                <p className="text-xs text-gray-400">Great job keeping up.</p>
            </div>
        );
    }

    return (
        <div className="h-[300px] overflow-y-auto pr-2 space-y-3">
            {tasks.map((task) => (
                <Link
                    key={task.id}
                    to={`/projects/${projectId}/tasks/${task.id}`}
                    className="block p-3 bg-red-50/50 border border-red-100 rounded-lg hover:bg-red-50 transition-colors group"
                >
                    <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-red-700 transition-colors">
                            {task.title}
                        </h4>
                        <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded flex-shrink-0 whitespace-nowrap">
                            {formatDistanceToNow(new Date(task.dueDate!), { addSuffix: true })}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{task.assignee?.name || 'Unassigned'}</span>
                            </div>
                        </div>
                        <ArrowRight className="w-3 h-3 text-red-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
            ))}
        </div>
    );
};

// Start Icon helper
import { CheckCircle2 } from 'lucide-react';
