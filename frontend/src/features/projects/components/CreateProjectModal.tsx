import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateProjectSchema, CreateProjectInput } from '@temp-ops/shared';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { useCreateProject } from '../hooks/useProjects';
import { useEffect } from 'react';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateProjectModal = ({ isOpen, onClose }: CreateProjectModalProps) => {
    const { mutate, isPending } = useCreateProject();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateProjectInput>({
        resolver: zodResolver(CreateProjectSchema),
    });

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            reset();
        }
    }, [isOpen, reset]);

    const onSubmit = (data: CreateProjectInput) => {
        mutate(data, {
            onSuccess: () => {
                onClose();
                reset();
            },
            // You might want to handle error here or in the hook
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    id="name"
                    label="Project Name"
                    placeholder="e.g. Website Redesign"
                    error={errors.name?.message}
                    {...register('name')}
                />

                <div className="space-y-1.5">
                    <label htmlFor="description" className="text-sm font-medium text-gray-700">
                        Description
                    </label>
                    <textarea
                        id="description"
                        className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent min-h-[100px]"
                        placeholder="Briefly describe the project goals..."
                        {...register('description')}
                    />
                    {errors.description && (
                        <p className="text-xs text-red-500">{errors.description.message}</p>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isPending}>
                        Create Project
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
