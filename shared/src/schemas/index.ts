import { z } from 'zod';
import { ProjectRole, TaskStatus, UserRole } from '../types';

// ============================================
// Auth Schemas
// ============================================

export const LoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterSchema = z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.nativeEnum(UserRole).optional(),
});

// ============================================
// Project Schemas
// ============================================

export const CreateProjectSchema = z.object({
    name: z.string().min(3, 'Project name must be at least 3 characters').max(100),
    description: z.string().max(500).optional(),
});

export const UpdateProjectSchema = z.object({
    name: z.string().min(3).max(100).optional(),
    description: z.string().max(500).nullable().optional(),
});

export const AddProjectMemberSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
    projectRole: z.nativeEnum(ProjectRole),
});

export const UpdateProjectMemberRoleSchema = z.object({
    projectRole: z.nativeEnum(ProjectRole),
});

// ============================================
// Task Schemas
// ============================================

export const CreateTaskSchema = z.object({
    title: z.string().min(3, 'Task title must be at least 3 characters').max(200),
    description: z.string().max(2000).optional(),
    priority: z.enum(['Low', 'Medium', 'High']).optional(),
    dueDate: z.string().datetime().optional(),
    assigneeId: z.string().uuid().nullable().optional(),
});

export const UpdateTaskSchema = z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.enum(['Low', 'Medium', 'High']).nullable().optional(),
    dueDate: z.string().datetime().nullable().optional(),
    assigneeId: z.string().uuid().nullable().optional(),
});

// ============================================
// Query Params Schemas
// ============================================

export const PaginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const TaskFilterSchema = PaginationSchema.extend({
    status: z.nativeEnum(TaskStatus).optional(),
    assigneeId: z.string().uuid().optional(),
    search: z.string().optional(),
});

// ============================================
// Type exports from schemas
// ============================================

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type AddProjectMemberInput = z.infer<typeof AddProjectMemberSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type TaskFilterInput = z.infer<typeof TaskFilterSchema>;
