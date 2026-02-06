import { BarChart3, Clock, AlertTriangle, CheckCircle2, Loader2, BarChart as ChartIcon } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useProjectAnalytics } from '../../analytics/hooks/useAnalytics';
import { TaskStatusChart } from './analytics/TaskStatusChart';
import { CompletionTimeChart } from './analytics/CompletionTimeChart';
import { OverdueTasksList } from './analytics/OverdueTasksList';

export const AnalyticsPanel = () => {
    const { projectId } = useParams();
    const { data: stats, isLoading, isError } = useProjectAnalytics(projectId!);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[300px] text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                Loading analytics...
            </div>
        );
    }

    if (isError || !stats) {
        // Fallback if analytics fails
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <ChartIcon className="w-8 h-8 mb-2 opacity-50" />
                Unable to load analytics
            </div>
        );
    }

    const totalTasks = (stats.tasksByStatus.TODO || 0) + (stats.tasksByStatus.IN_PROGRESS || 0) + (stats.tasksByStatus.DONE || 0);
    const completionRate = totalTasks > 0 ? Math.round(((stats.tasksByStatus.DONE || 0) / totalTasks) * 100) : 0;

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Project Analytics</h3>

            {/* Row 1: Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 text-gray-500 mb-2">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Total Tasks</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{totalTasks}</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 text-green-600 mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Completed</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.tasksByStatus.DONE || 0}</div>
                    <div className="text-xs text-green-600 mt-1">{completionRate}% completion rate</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 text-amber-600 mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Avg. Time</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.avgCompletionTimeHours ? stats.avgCompletionTimeHours + 'h' : 'N/A'}</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 text-red-600 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Overdue</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.overdueCount}</div>
                </div>
            </div>

            {/* Row 2: Status Chart & Overdue List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-900 mb-6">Task Distribution</h4>
                    <TaskStatusChart data={stats.tasksByStatus} />
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-sm font-medium text-gray-900">Overdue Tasks</h4>
                        <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                            {stats.overdueCount} Total
                        </span>
                    </div>
                    <OverdueTasksList tasks={stats.overdueTasks || []} projectId={projectId!} />
                </div>
            </div>

            {/* Row 3: Completion Time Distribution */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Completion Time Distribution</h4>
                </div>
                <p className="text-xs text-gray-500 mb-6">How long it takes to close tickets (from creation to completion)</p>
                <CompletionTimeChart data={stats.completionTimeDistribution || {}} />
            </div>
        </div>
    );
};
