import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTaskSchema, CreateTaskInput, ProjectMemberDTO, ProjectRole } from '@temp-ops/shared';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { useCreateTask } from '../hooks/useTasks';
import { useEffect, useMemo } from 'react';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    projectMembers: ProjectMemberDTO[];
}

export const CreateTaskModal = ({ isOpen, onClose, projectId, projectMembers }: CreateTaskModalProps) => {
    const { mutate, isPending } = useCreateTask(projectId);

    // Business Logic: Only display assignable members (non-VIEWERs)
    // Viewers cannot be assigned tasks
    const assignableMembers = useMemo(() => {
        return projectMembers.filter(m => m.projectRole !== ProjectRole.VIEWER);
    }, [projectMembers]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateTaskInput>({
        resolver: zodResolver(CreateTaskSchema),
        defaultValues: {
            title: '',
            priority: 'Medium',
        }
    });

    useEffect(() => {
        if (isOpen) reset();
    }, [isOpen, reset]);

    const onSubmit = (data: CreateTaskInput) => {
        mutate(data, {
            onSuccess: () => {
                onClose();
                reset();
            }
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Task" className="max-w-xl">
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
                        <label className="text-sm font-medium text-gray-700">Priority</label>
                        <select
                            className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            {...register('priority')}
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Due Date</label>
                        <Input
                            type="date"
                            {...register('dueDate')}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Assignee (Optional)</label>
                    <div className="relative">
                        <select
                            className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                            {...register('assigneeId')}
                        >
                            <option value="">Unassigned</option>
                            {assignableMembers.map((m) => (
                                <option key={m.userId} value={m.userId}>
                                    {m.user?.name || m.userId} ({m.projectRole})
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">Only members with write access can be assigned tasks.</p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isPending}>
                        Create Task
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
