import axios from './client';
import { TaskDTO, CreateTaskInput, UpdateTaskInput, AuditLogDTO } from '@temp-ops/shared';

interface TasksResponse {
    status: string;
    data: {
        tasks: TaskDTO[];
    };
}

interface TaskResponse {
    status: string;
    data: {
        task: TaskDTO;
    };
}

export const tasksApi = {
    // Get tasks for a specific project
    getAllByProject: async (projectId: string, page = 1, pageSize = 20) => {
        const response = await axios.get<TasksResponse>(`/projects/${projectId}/tasks`, {
            params: { page, pageSize }
        });
        return response.data.data.tasks;
    },

    getById: async (id: string) => {
        // Note: Backend might reuse getById if global, but tasks are typically project-scoped in URL
        const response = await axios.get<{ status: string; data: { task: TaskDTO } }>(`/tasks/${id}`);
        return response.data.data.task;
    },

    create: async (projectId: string, data: CreateTaskInput) => {
        const response = await axios.post<TaskResponse>(`/projects/${projectId}/tasks`, data);
        return response.data.data.task;
    },

    update: async (id: string, data: UpdateTaskInput) => {
        const response = await axios.patch<TaskResponse>(`/tasks/${id}`, data);
        return response.data.data.task;
    },

    delete: async (id: string) => {
        await axios.delete(`/tasks/${id}`);
    },

    getHistory: async (id: string) => {
        const response = await axios.get<{ status: string; data: { logs: AuditLogDTO[] } }>(`/tasks/${id}/history`);
        return response.data.data.logs;
    },

    // Maybe move status update to specific method if backend logic differs, 
    // but update() generic covers it
};
