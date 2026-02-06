import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../../../api/tasksApi';
import { CreateTaskInput, UpdateTaskInput } from '@temp-ops/shared';

export const useTasks = (projectId: string, page = 1, pageSize = 200) => {
    return useQuery({
        queryKey: ['tasks', projectId, page, pageSize],
        queryFn: () => tasksApi.getAllByProject(projectId, page, pageSize),
        enabled: !!projectId,
    });
};

export const useTask = (id: string) => {
    return useQuery({
        queryKey: ['task', id],
        queryFn: () => tasksApi.getById(id),
        enabled: !!id,
    });
};

export const useTaskHistory = (id: string) => {
    return useQuery({
        queryKey: ['task-history', id],
        queryFn: () => tasksApi.getHistory(id),
        enabled: !!id,
    });
};

export const useCreateTask = (projectId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateTaskInput) => tasksApi.create(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
        },
    });
};

export const useUpdateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) =>
            tasksApi.update(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task', data.id] });
            queryClient.invalidateQueries({ queryKey: ['task-history', data.id] });
        },
    });
};

export const useDeleteTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => tasksApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
};
