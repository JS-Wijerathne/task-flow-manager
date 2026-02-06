import { useProjectHistory } from '../hooks/useAudit';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, History, ArrowRight } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { AuditLogDTO, AuditAction } from '@temp-ops/shared';
import { cn } from '@/lib/utils';

export const HistoryPanel = () => {
    const { projectId } = useParams();
    const { data: logs, isLoading } = useProjectHistory(projectId!);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading history...
            </div>
        );
    }

    if (!logs || logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <History className="w-8 h-8 mb-2 opacity-50" />
                No activity recorded yet
            </div>
        );
    }

    const renderChange = (key: string, value: any) => {
        // Handle explicit diff structure { old, new }
        if (value && typeof value === 'object' && 'old' in value && 'new' in value) {
            return (
                <div key={key} className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-gray-500 capitalize min-w-[60px]">{key}:</span>
                    <span className="line-through text-red-400 bg-red-50 px-1.5 py-0.5 rounded">{String(value.old)}</span>
                    <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                    <span className="text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">{String(value.new)}</span>
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

    const getActionColor = (action: AuditAction) => {
        switch (action) {
            case AuditAction.CREATE: return 'bg-green-500';
            case AuditAction.DELETE: return 'bg-red-500';
            default: return 'bg-blue-500';
        }
    };

    const getActionLabel = (action: AuditAction, entityType: string) => {
        switch (action) {
            case AuditAction.CREATE: return `created a ${entityType.toLowerCase()}`;
            case AuditAction.DELETE: return `deleted a ${entityType.toLowerCase()}`;
            default: return `updated a ${entityType.toLowerCase()}`;
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-gray-500" />
                    Project Activity
                    <span className="ml-auto text-xs font-normal text-gray-400">{logs.length} events</span>
                </h3>
            </div>

            <div className="relative border-l-2 border-gray-100 ml-6 my-4">
                {logs.map((log: AuditLogDTO) => (
                    <div key={log.id} className="relative pl-6 pb-6 last:pb-0 group">
                        {/* Timeline Dot */}
                        <div className={cn(
                            "absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm",
                            getActionColor(log.action)
                        )} />

                        <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-900 text-sm">
                                    {log.actor?.name || 'System'}
                                </span>
                                <span className="text-gray-500 text-xs">
                                    {getActionLabel(log.action, log.entityType)}
                                </span>
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                            </span>
                        </div>

                        {/* Details Card - Enhanced Diff Visualization */}
                        {log.details && Object.keys(log.details).length > 0 && (
                            <div className="mt-2 bg-gray-50 rounded-md p-3 border border-gray-100 space-y-1.5">
                                {Object.entries(log.details).map(([key, value]) => renderChange(key, value))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

