import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskDTO, ProjectMemberDTO, TaskStatus } from '@temp-ops/shared';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { useUpdateTask } from '../hooks/useTasks';
import { useEffect, useMemo } from 'react';
import { z } from 'zod';

// Local schema for edit form (simplified for UI)
const EditTaskSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().max(2000).optional().nullable(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
    priority: z.enum(['Low', 'Medium', 'High']).nullable().optional(),
    dueDate: z.string().optional().nullable(),
    assigneeId: z.string().uuid().nullable().optional(),
});

type EditTaskInput = z.infer<typeof EditTaskSchema>;

interface EditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: TaskDTO;
    projectMembers: ProjectMemberDTO[];
}

export const EditTaskModal = ({ isOpen, onClose, task, projectMembers }: EditTaskModalProps) => {
    console.log('EditTaskModal render, isOpen:', isOpen);
    const { mutate, isPending } = useUpdateTask();

    // Business Logic: Only display assignable members (non-VIEWERs)
    // Using string literal 'VIEWER' to be safe against potential enum import issues
    const assignableMembers = useMemo(() => {
        return projectMembers.filter(m => m.projectRole !== 'VIEWER');
    }, [projectMembers]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<EditTaskInput>({
        resolver: zodResolver(EditTaskSchema),
    });

    useEffect(() => {
        if (isOpen && task) {
            let formattedDate = '';
            try {
                if (task.dueDate) {
                    formattedDate = new Date(task.dueDate).toISOString().split('T')[0];
                }
            } catch (e) {
                console.error('Error parsing date:', e);
            }

            reset({
                title: task.title,
                description: task.description || '',
                status: task.status as 'TODO' | 'IN_PROGRESS' | 'DONE',
                priority: task.priority as 'Low' | 'Medium' | 'High' | null,
                dueDate: formattedDate,
                assigneeId: task.assigneeId || '',
            });
        }
    }, [isOpen, task, reset]);

    const onSubmit = (data: EditTaskInput) => {
        mutate(
            {
                id: task.id,
                data: {
                    title: data.title,
                    description: data.description || null,
                    status: data.status as TaskStatus,
                    priority: data.priority,
                    dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
                    assigneeId: data.assigneeId || null,
                },
            },
            {
                onSuccess: () => {
                    onClose();
                },
            }
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Task" className="max-w-xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    id="title"
                    label="Task Title"
                    placeholder="e.g. Implement Login API"
                    error={errors.title?.message}
                    {...register('title')}
                />

                <div className="space-y-1.5">
                    <label htmlFor="description" className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        id="description"
                        className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
                        placeholder="Add details..."
                        {...register('description')}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Status</label>
                        <select
                            className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            {...register('status')}
                        >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Priority</label>
                        <select
                            className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            {...register('priority')}
                        >
                            <option value="">None</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Due Date</label>
                        <Input
                            type="date"
                            {...register('dueDate')}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Assignee</label>
                        <select
                            className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            {...register('assigneeId')}
                        >
                            <option value="">Unassigned</option>
                            {assignableMembers.map((m) => (
                                <option key={m.userId} value={m.userId}>
                                    {m.user?.name || m.userId} ({m.projectRole})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isPending}>
                        Save Changes
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
