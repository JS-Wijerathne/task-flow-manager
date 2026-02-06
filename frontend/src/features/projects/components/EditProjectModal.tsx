import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProjectDTO } from '@temp-ops/shared';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { useUpdateProject } from '../hooks/useProjects';
import { useEffect } from 'react';
import { z } from 'zod';

const EditProjectSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100),
    description: z.string().max(500).optional().nullable(),
});

type EditProjectInput = z.infer<typeof EditProjectSchema>;

interface EditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: ProjectDTO;
}

export const EditProjectModal = ({ isOpen, onClose, project }: EditProjectModalProps) => {
    const { mutate, isPending } = useUpdateProject();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<EditProjectInput>({
        resolver: zodResolver(EditProjectSchema),
    });

    useEffect(() => {
        if (isOpen && project) {
            reset({
                name: project.name,
                description: project.description || '',
            });
        }
    }, [isOpen, project, reset]);

    const onSubmit = (data: EditProjectInput) => {
        mutate(
            {
                id: project.id,
                data: {
                    name: data.name,
                    description: data.description || null,
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
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Project" className="max-w-lg">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    id="name"
                    label="Project Name"
                    placeholder="e.g. Marketing Campaign"
                    error={errors.name?.message}
                    {...register('name')}
                />

                <div className="space-y-1.5">
                    <label htmlFor="description" className="text-sm font-medium text-gray-700">
                        Description
                    </label>
                    <textarea
                        id="description"
                        className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
                        placeholder="Add project description..."
                        {...register('description')}
                    />
                    {errors.description?.message && (
                        <p className="text-sm text-red-500">{errors.description.message}</p>
                    )}
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
