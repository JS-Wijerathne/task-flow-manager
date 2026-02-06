import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, UserRole } from '@temp-ops/shared';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { register as registerUser } from '../../../api/authApi';
import { useEffect, useState } from 'react';
import { Shield, User, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';

// Define input type locally with role
type CreateUserInput = z.infer<typeof RegisterSchema>;

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateUserModal = ({ isOpen, onClose }: CreateUserModalProps) => {
    const queryClient = useQueryClient();
    const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.MEMBER);

    const { mutate, isPending } = useMutation({
        mutationFn: registerUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            onClose();
            reset();
            setSelectedRole(UserRole.MEMBER);
        },
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateUserInput>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {
            role: UserRole.MEMBER,
        }
    });

    useEffect(() => {
        if (isOpen) {
            reset({ role: UserRole.MEMBER });
            setSelectedRole(UserRole.MEMBER);
        }
    }, [isOpen, reset]);

    const onSubmit = (data: CreateUserInput) => {
        mutate({ ...data, role: selectedRole });
    };

    const roles = [
        { value: UserRole.ADMIN, label: 'Admin', icon: Shield, description: 'Full system access', bgActive: 'bg-purple-50', borderActive: 'border-purple-500', textActive: 'text-purple-600' },
        { value: UserRole.MEMBER, label: 'Member', icon: User, description: 'Manage tasks', bgActive: 'bg-blue-50', borderActive: 'border-blue-500', textActive: 'text-blue-600' },
        { value: UserRole.VIEWER, label: 'Viewer', icon: Eye, description: 'Read-only', bgActive: 'bg-gray-100', borderActive: 'border-gray-500', textActive: 'text-gray-600' },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New User" className="max-w-lg">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                    id="name"
                    label="Full Name"
                    placeholder="e.g. John Doe"
                    error={errors.name?.message}
                    {...register('name')}
                />

                <Input
                    id="email"
                    label="Email Address"
                    type="email"
                    placeholder="e.g. john@tempops.com"
                    error={errors.email?.message}
                    {...register('email')}
                />

                <Input
                    id="password"
                    label="Password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    error={errors.password?.message}
                    {...register('password')}
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
                                <span className="text-[10px] text-gray-500 text-center mt-0.5">{role.description}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isPending}>
                        Create User
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
