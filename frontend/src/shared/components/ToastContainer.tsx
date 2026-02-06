import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToastStore, ToastType } from '../../stores/toastStore';
import { cn } from '../../lib/utils';

const iconMap: Record<ToastType, React.ElementType> = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

const colorMap: Record<ToastType, string> = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconColorMap: Record<ToastType, string> = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
};

export const ToastContainer = () => {
    const { toasts, removeToast } = useToastStore();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
            {toasts.map((toast) => {
                const Icon = iconMap[toast.type];
                return (
                    <div
                        key={toast.id}
                        className={cn(
                            "flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-5 duration-200",
                            colorMap[toast.type]
                        )}
                    >
                        <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", iconColorMap[toast.type])} />
                        <div className="flex-1 min-w-0">
                            {toast.title && (
                                <div className="font-semibold text-sm mb-1">{toast.title}</div>
                            )}
                            <div className="text-sm">{toast.message}</div>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
