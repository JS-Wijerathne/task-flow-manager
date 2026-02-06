import { useTaskHistory } from '../hooks/useTasks';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, History, ArrowRight } from 'lucide-react';
import { AuditLogDTO, AuditAction } from '@temp-ops/shared';
import { cn } from '@/lib/utils';

interface TaskHistoryProps {
    taskId: string;
}

export const TaskHistory = ({ taskId }: TaskHistoryProps) => {
    const { data: logs, isLoading } = useTaskHistory(taskId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading history...
            </div>
        );
    }

    if (!logs || logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                <History className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">No activity recorded yet</p>
            </div>
        );
    }

    const renderChange = (key: string, value: any) => {
        // Handle explicit diff structure { old, new }
        if (value && typeof value === 'object' && 'old' in value && 'new' in value) {
            return (
                <div key={key} className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-gray-500 capitalize">{key}:</span>
                    <span className="line-through text-red-400">{String(value.old)}</span>
                    <ArrowRight className="w-3 h-3 text-gray-300" />
                    <span className="text-green-600 font-medium">{String(value.new)}</span>
                </div>
            );
        }
        // Handle simple value
        return (
            <div key={key} className="text-xs text-gray-600">
                <span className="font-semibold text-gray-500 capitalize">{key}:</span> {String(value)}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" />
                Activity Log
            </h3>

            <div className="relative border-l-2 border-gray-100 ml-4 space-y-8">
                {logs.map((log: AuditLogDTO) => (
                    <div key={log.id} className="relative pl-6 group">
                        {/* Timeline Dot */}
                        <div className={cn(
                            "absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm",
                            log.action === AuditAction.CREATE ? "bg-green-500" :
                                log.action === AuditAction.DELETE ? "bg-red-500" :
                                    "bg-blue-500"
                        )} />

                        <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 text-sm">
                                    {log.actor?.name || 'Unknown User'}
                                </span>
                                <span className="text-gray-500 text-xs">
                                    {log.action === AuditAction.CREATE ? 'created this task' :
                                        log.action === AuditAction.DELETE ? 'deleted this task' :
                                            'updated this task'}
                                </span>
                            </div>
                            <span className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                            </span>
                        </div>

                        {/* Details Card */}
                        {log.details && Object.keys(log.details).length > 0 && (
                            <div className="mt-2 bg-gray-50 rounded-md p-3 border border-gray-100 space-y-1">
                                {Object.entries(log.details).map(([key, value]) => renderChange(key, value))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
