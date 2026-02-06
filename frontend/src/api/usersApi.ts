import axios from './client';
import { UserDTO, UserRole } from '@temp-ops/shared';

// Response type for getAll users
interface UsersResponse {
    status: string;
    data: {
        users: UserDTO[];
        meta: { total: number; page: number; pageSize: number; totalPages: number };
    };
}

interface UserResponse {
    status: string;
    data: {
        user: UserDTO;
    };
}

export interface UpdateUserInput {
    name?: string;
    role?: UserRole;
}

export interface GetUsersOptions {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: 'name' | 'role' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

export const usersApi = {
    getAll: async (options: GetUsersOptions = {}) => {
        const { page = 1, pageSize = 20, search, sortBy, sortOrder } = options;
        const response = await axios.get<UsersResponse>('/users', {
            params: { page, pageSize, search, sortBy, sortOrder }
        });
        return response.data.data;
    },

    getById: async (id: string) => {
        const response = await axios.get<UserResponse>(`/users/${id}`);
        return response.data.data.user;
    },

    update: async (id: string, data: UpdateUserInput) => {
        const response = await axios.put<UserResponse>(`/users/${id}`, data);
        return response.data.data.user;
    },

    delete: async (id: string) => {
        await axios.delete(`/users/${id}`);
    },
};
