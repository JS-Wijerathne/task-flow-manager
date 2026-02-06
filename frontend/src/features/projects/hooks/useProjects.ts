import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../../api/projectsApi';
import { CreateProjectInput, UpdateProjectInput } from '@temp-ops/shared';

export const useProjects = (page = 1, pageSize = 20) => {
    return useQuery({
        queryKey: ['projects', page, pageSize],
        queryFn: () => projectsApi.getAll(page, pageSize),
    });
};

export const useProject = (id: string) => {
    return useQuery({
        queryKey: ['projects', id],
        queryFn: () => projectsApi.getById(id),
        enabled: !!id,
    });
};

export const useCreateProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateProjectInput) => projectsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
};

export const useUpdateProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateProjectInput }) =>
            projectsApi.update(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['projects', data.id] });
        },
    });
};

export const useDeleteProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => projectsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
};

