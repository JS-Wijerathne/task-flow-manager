import { TaskStatus, ProjectRole } from '@prisma/client';
import { prisma } from '../config/database';
import { taskRepository, auditRepository, projectRepository } from '../repositories';
import { AppError } from '../utils/AppError';
import { ErrorCodes } from '../utils/errorCodes';

interface CreateTaskData {
    title: string;
    description?: string;
    priority?: string;
    dueDate?: Date;
    projectId: string;
    assigneeId?: string | null;
}

interface UpdateTaskData {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: string | null;
    dueDate?: Date | null;
    assigneeId?: string | null;
}

/**
 * TaskService - Business Logic Layer for Tasks
 * 
 * Pattern: Follows Spring Boot's @Service pattern with:
 * - Transactional audit logging (like @Transactional)
 * - Diff calculation for UPDATE operations
 * - Business rule validation (VIEWER cannot be assigned)
 * 
 * Similar to: Spring Boot Service layer with JPA repositories
 */
export class TaskService {
    /**
     * Get paginated tasks for a project with optional filtering
     */
    async getByProjectId(
        projectId: string,
        page: number = 1,
        pageSize: number = 20,
        filter?: { status?: TaskStatus; assigneeId?: string; search?: string }
    ) {
        const result = await taskRepository.findByProjectId(projectId, page, pageSize, filter);
        return {
            data: result.data,
            meta: {
                total: result.total,
                page,
                pageSize,
                totalPages: Math.ceil(result.total / pageSize),
            },
        };
    }

    /**
     * Get a single task by ID
     */
    async getById(id: string) {
        const task = await taskRepository.findById(id);
        if (!task) {
            throw AppError.notFound('Task not found', ErrorCodes.TASK.NOT_FOUND);
        }
        return task;
    }

    /**
     * Validate that the assignee can be assigned to tasks
     * 
     * Business Rule: View-only users can NEVER be assigned a task
     * This is a critical RBAC requirement from the specification
     * 
     * @throws AppError if assignee is a VIEWER in the project
     */
    private async validateAssignee(projectId: string, assigneeId: string | null | undefined): Promise<void> {
        if (!assigneeId) return; // null/undefined assignee is valid (unassigned task)

        // Check the user's project role
        const projectRole = await projectRepository.getUserProjectRole(projectId, assigneeId);

        // If user is not a project member, check if they're an ADMIN (global role)
        if (!projectRole) {
            const user = await prisma.user.findUnique({
                where: { id: assigneeId },
                select: { id: true, role: true },
            });

            if (!user) {
                throw AppError.badRequest(
                    'Assignee not found',
                    ErrorCodes.TASK.ASSIGNEE_NOT_FOUND,
                    { assigneeId }
                );
            }

            // Global ADMINs can be assigned (they have implicit access)
            if (user.role === 'ADMIN') {
                return;
            }

            // User is not in project and not an ADMIN
            throw AppError.badRequest(
                'Assignee is not a member of this project',
                ErrorCodes.TASK.ASSIGNEE_NOT_IN_PROJECT,
                { assigneeId, projectId }
            );
        }

        // If user is a VIEWER in the project, they cannot be assigned
        if (projectRole === ProjectRole.VIEWER) {
            throw AppError.badRequest(
                'Cannot assign tasks to view-only users. Viewers have read-only access.',
                ErrorCodes.TASK.VIEWER_CANNOT_BE_ASSIGNED,
                { assigneeId, projectRole }
            );
        }

        // MEMBER role is valid for assignment
    }

    /**
     * Create a new task with transactional audit logging
     */
    async create(data: CreateTaskData, actorId: string) {
        // Validate assignee before transaction
        await this.validateAssignee(data.projectId, data.assigneeId);

        return prisma.$transaction(async (tx) => {
            const task = await tx.task.create({
                data: {
                    title: data.title,
                    description: data.description,
                    priority: data.priority,
                    dueDate: data.dueDate,
                    projectId: data.projectId,
                    assigneeId: data.assigneeId,
                    reporterId: actorId,
                },
                include: {
                    assignee: { select: { id: true, email: true, name: true } },
                    reporter: { select: { id: true, email: true, name: true } },
                },
            });

            // Audit log - atomically created with the task
            await auditRepository.create(tx, {
                entityType: 'Task',
                entityId: task.id,
                action: 'CREATE',
                actorId,
                details: {
                    title: data.title,
                    description: data.description,
                    priority: data.priority,
                    dueDate: data.dueDate,
                    projectId: data.projectId,
                    assigneeId: data.assigneeId,
                },
            });

            return task;
        });
    }

    /**
     * Update a task with diff-based audit logging
     * 
     * Pattern: Similar to Hibernate's @PreUpdate with change tracking
     */
    async update(id: string, data: UpdateTaskData, actorId: string) {
        const current = await taskRepository.findById(id);
        if (!current) {
            throw AppError.notFound('Task not found', ErrorCodes.TASK.NOT_FOUND);
        }

        // Validate assignee if being changed
        if (data.assigneeId !== undefined) {
            await this.validateAssignee(current.projectId, data.assigneeId);
        }

        // Handle status transition to DONE
        const updateData: UpdateTaskData & { completedAt?: Date | null } = { ...data };
        if (data.status === TaskStatus.DONE && current.status !== TaskStatus.DONE) {
            updateData.completedAt = new Date();
        } else if (data.status && data.status !== TaskStatus.DONE && current.status === TaskStatus.DONE) {
            updateData.completedAt = null;
        }

        return prisma.$transaction(async (tx) => {
            const task = await tx.task.update({
                where: { id },
                data: updateData,
                include: {
                    assignee: { select: { id: true, email: true, name: true } },
                    reporter: { select: { id: true, email: true, name: true } },
                },
            });

            // Calculate diff for audit log
            const diff: Record<string, { old: unknown; new: unknown }> = {};
            const fieldsToCheck: (keyof UpdateTaskData)[] = [
                'title',
                'description',
                'status',
                'priority',
                'assigneeId',
                'dueDate',
            ];

            for (const field of fieldsToCheck) {
                if (data[field] !== undefined) {
                    const oldVal = current[field];
                    const newVal = data[field];
                    // String comparison handles Date objects and null values
                    if (String(oldVal) !== String(newVal)) {
                        diff[field] = { old: oldVal, new: newVal };
                    }
                }
            }

            // Only log if there are actual changes
            if (Object.keys(diff).length > 0) {
                await auditRepository.create(tx, {
                    entityType: 'Task',
                    entityId: id,
                    action: 'UPDATE',
                    actorId,
                    details: diff,
                });
            }

            return task;
        });
    }

    /**
     * Delete a task with audit logging
     */
    async delete(id: string, actorId: string) {
        const task = await taskRepository.findById(id);
        if (!task) {
            throw AppError.notFound('Task not found', ErrorCodes.TASK.NOT_FOUND);
        }

        return prisma.$transaction(async (tx) => {
            await tx.task.delete({ where: { id } });

            // Log deletion with task snapshot for recovery purposes
            await auditRepository.create(tx, {
                entityType: 'Task',
                entityId: id,
                action: 'DELETE',
                actorId,
                details: {
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.dueDate,
                    projectId: task.projectId,
                    assigneeId: task.assigneeId,
                },
            });
        });
    }

    /**
     * Get paginated history for a task
     */
    async getHistory(taskId: string, page: number = 1, pageSize: number = 20) {
        return auditRepository.findByEntity('Task', taskId, page, pageSize);
    }
}

export const taskService = new TaskService();
