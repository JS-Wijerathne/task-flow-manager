// Enums mirroring Prisma schema
export enum UserRole {
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER',
    VIEWER = 'VIEWER',
}

export enum ProjectRole {
    MEMBER = 'MEMBER',
    VIEWER = 'VIEWER',
}

export enum TaskStatus {
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE',
}

export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
}

// User DTOs
export interface UserDTO {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: string;
}

export interface UserWithPasswordDTO extends UserDTO {
    password: string;
}

// Project DTOs
export interface ProjectDTO {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ProjectWithMembersDTO extends ProjectDTO {
    members: ProjectMemberDTO[];
    _count?: {
        tasks: number;
    };
}

// ProjectMember DTOs
export interface ProjectMemberDTO {
    id: string;
    projectId: string;
    userId: string;
    projectRole: ProjectRole;
    joinedAt: string;
    user?: UserDTO;
}

// Task DTOs
export interface TaskDTO {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: string | null;
    dueDate: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    projectId: string;
    assigneeId: string | null;
    reporterId: string;
    assignee?: UserDTO | null;
    reporter?: UserDTO;
}

// AuditLog DTOs
export interface AuditLogDTO {
    id: string;
    entityType: string;
    entityId: string;
    action: AuditAction;
    actorId: string;
    timestamp: string;
    details: Record<string, unknown> | null;
    actor?: UserDTO;
}

// Analytics DTOs
export interface ProjectAnalyticsDTO {
    projectId: string;
    tasksByStatus: {
        TODO: number;
        IN_PROGRESS: number;
        DONE: number;
    };
    overdueCount: number;
    overdueTasks: TaskDTO[];
    avgCompletionTimeHours: number | null;
    completionTimeDistribution: Record<string, number>;
}

// Pagination
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

// Auth DTOs
export interface LoginRequestDTO {
    email: string;
    password: string;
}

export interface LoginResponseDTO {
    token: string;
    user: UserDTO;
}

export interface AuthenticatedUserDTO {
    id: string;
    email: string;
    role: UserRole;
}
