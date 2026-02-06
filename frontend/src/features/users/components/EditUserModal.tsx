import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserDTO, UserRole } from '@temp-ops/shared';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { useUpdateUser } from '../hooks/useUsers';
import { useEffect, useState } from 'react';
import { Shield, User, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const EditUserSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

type EditUserInput = z.infer<typeof EditUserSchema>;

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserDTO;
}

export const EditUserModal = ({ isOpen, onClose, user }: EditUserModalProps) => {
    const { mutate, isPending } = useUpdateUser();
    const [selectedRole, setSelectedRole] = useState<UserRole>(user.role as UserRole);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<EditUserInput>({
        resolver: zodResolver(EditUserSchema),
    });

    useEffect(() => {
        if (isOpen && user) {
            reset({ name: user.name });
            setSelectedRole(user.role as UserRole);
        }
    }, [isOpen, user, reset]);

    const onSubmit = (data: EditUserInput) => {
        mutate(
            { id: user.id, data: { name: data.name, role: selectedRole } },
            {
                onSuccess: () => onClose(),
            }
        );
    };

    const roles = [
        { value: UserRole.ADMIN, label: 'Admin', icon: Shield, bgActive: 'bg-purple-50', borderActive: 'border-purple-500', textActive: 'text-purple-600' },
        { value: UserRole.MEMBER, label: 'Member', icon: User, bgActive: 'bg-blue-50', borderActive: 'border-blue-500', textActive: 'text-blue-600' },
        { value: UserRole.VIEWER, label: 'Viewer', icon: Eye, bgActive: 'bg-gray-100', borderActive: 'border-gray-500', textActive: 'text-gray-600' },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit User" className="max-w-lg">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                    id="name"
                    label="Full Name"
                    placeholder="e.g. John Doe"
                    error={errors.name?.message}
                    {...register('name')}
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <div className="grid grid-cols-3 gap-3">
                        {roles.map((role) => (
                            <button
                                key={role.value}
                                type="button"
                                onClick={() => setSelectedRole(role.value)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-3 border-2 rounded-xl transition-all",
                                    selectedRole === role.value
                                        ? `${role.bgActive} ${role.borderActive} ring-1 ring-offset-1`
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                )}
                            >
                                <role.icon className={cn(
                                    "w-5 h-5 mb-1",
                                    selectedRole === role.value ? role.textActive : "text-gray-400"
                                )} />
                                <span className={cn(
                                    "text-sm font-medium",
                                    selectedRole === role.value ? role.textActive : "text-gray-700"
                                )}>{role.label}</span>
                            </button>
                        ))}
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
