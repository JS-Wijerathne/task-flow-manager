import axios from './client';
import {
    ProjectDTO,
    CreateProjectInput,
    UpdateProjectInput,
    ProjectMemberDTO,
    ProjectWithMembersDTO
} from '@temp-ops/shared';

export const projectsApi = {
    getAll: async (page = 1, pageSize = 20) => {
        const response = await axios.get<{
            status: string;
            data: {
                projects: ProjectWithMembersDTO[];
                meta: { total: number; page: number; pageSize: number; totalPages: number };
            }
        }>(`/projects`, { params: { page, pageSize } });
        return response.data.data;
    },

    getById: async (id: string) => {
        const response = await axios.get<{ status: string; data: { project: ProjectWithMembersDTO } }>(`/projects/${id}`);
        return response.data.data.project;
    },

    create: async (data: CreateProjectInput) => {
        const response = await axios.post<{ status: string; data: { project: ProjectDTO } }>('/projects', data);
        return response.data.data.project;
    },

    update: async (id: string, data: UpdateProjectInput) => {
        const response = await axios.put<{ status: string; data: { project: ProjectDTO } }>(`/projects/${id}`, data);
        return response.data.data.project;
    },

    delete: async (id: string) => {
        await axios.delete(`/projects/${id}`);
    },

    addMember: async (projectId: string, userId: string, projectRole: 'MEMBER' | 'VIEWER') => {
        const response = await axios.post<{ status: string; data: { member: ProjectMemberDTO } }>(
            `/projects/${projectId}/members`,
            { userId, projectRole }
        );
        return response.data.data.member;
    },

    removeMember: async (projectId: string, memberId: string) => {
        await axios.delete(`/projects/${projectId}/members/${memberId}`);
    },

    updateMemberRole: async (projectId: string, memberId: string, projectRole: 'MEMBER' | 'VIEWER') => {
        const response = await axios.patch<{ status: string; data: { member: ProjectMemberDTO } }>(
            `/projects/${projectId}/members/${memberId}`,
            { projectRole }
        );
        return response.data.data.member;
    },
};
