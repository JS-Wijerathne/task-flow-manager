import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod'; // We might not have a specific schema for this in shared yet, or we can create one on the fly
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { useUsers } from '../../users/hooks/useUsers'; // Reuse global users hook
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../../api/projectsApi';
import { ProjectRole } from '@temp-ops/shared';
import { useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

// Schema for adding member
const AddMemberSchema = z.object({
    userId: z.string().min(1, "Please select a user"),
    role: z.enum([ProjectRole.MEMBER, ProjectRole.VIEWER]),
});

type AddMemberInput = z.infer<typeof AddMemberSchema>;

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    existingMemberIds: string[]; // To filter out existing members
}

export const AddMemberModal = ({ isOpen, onClose, projectId, existingMemberIds }: AddMemberModalProps) => {
    // Fetch up to 100 users for the dropdown to ensure we see members/admins
    const { data, isLoading: isLoadingUsers } = useUsers({ page: 1, pageSize: 100 });
    const users = data?.users || [];

    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useState<string>("");

    const { mutate, isPending } = useMutation({
        mutationFn: (data: AddMemberInput) =>
            projectsApi.addMember(projectId, data.userId, data.role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
            onClose();
            reset();
            setSelectedUser("");
        },
    });

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<AddMemberInput>({
        resolver: zodResolver(AddMemberSchema),
        defaultValues: {
            role: ProjectRole.MEMBER,
        }
    });

    const availableUsers = users?.filter(u => !existingMemberIds.includes(u.id)) || [];

    const onSubmit = (data: AddMemberInput) => {
        mutate(data);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Team Member">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Select User</label>
                    {isLoadingUsers ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 p-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Loading users...
                        </div>
                    ) : availableUsers.length === 0 ? (
                        <div className="text-sm text-gray-500 p-2 border border-gray-200 rounded-md bg-gray-50">
                            No available users to add.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-1 border border-gray-200 rounded-lg">
                            {availableUsers.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => {
                                        setSelectedUser(user.id);
                                        setValue('userId', user.id);
                                    }}
                                    className={cn(
                                        "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors border",
                                        selectedUser === user.id
                                            ? "bg-primary-50 border-primary-500 ring-1 ring-primary-500"
                                            : "hover:bg-gray-50 border-transparent"
                                    )}
                                >
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                                    </div>
                                    {selectedUser === user.id && <UserPlus className="w-4 h-4 text-primary-600" />}
                                </div>
                            ))}
                        </div>
                    )}
                    {errors.userId && (
                        <p className="text-xs text-red-500">{errors.userId.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className={cn(
                            "flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all",
                            "hover:border-primary-300 hover:bg-primary-50/50",
                            // We can't easily access current form value without watch, so using radio logic mainly
                        )}>
                            <input
                                type="radio"
                                value={ProjectRole.MEMBER}
                                {...register('role')}
                                className="mb-2"
                            />
                            <span className="text-sm font-medium">Member</span>
                            <span className="text-xs text-gray-500 text-center">Can create and edit tasks</span>
                        </label>

                        <label className={cn(
                            "flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all",
                            "hover:border-primary-300 hover:bg-primary-50/50",
                        )}>
                            <input
                                type="radio"
                                value={ProjectRole.VIEWER}
                                {...register('role')}
                                className="mb-2"
                            />
                            <span className="text-sm font-medium">Viewer</span>
                            <span className="text-xs text-gray-500 text-center">Read-only access</span>
                        </label>
                    </div>
                    {errors.role && (
                        <p className="text-xs text-red-500">{errors.role.message}</p>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isPending} disabled={!selectedUser}>
                        Add Member
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
