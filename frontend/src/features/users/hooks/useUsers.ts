import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, UpdateUserInput, GetUsersOptions } from '../../../api/usersApi';

export const useUsers = (options: GetUsersOptions = {}) => {
    return useQuery({
        queryKey: ['users', options], // key changes with any option change
        queryFn: () => usersApi.getAll(options),
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
            usersApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => usersApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
};
