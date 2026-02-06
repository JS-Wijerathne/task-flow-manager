import { ProjectRole } from '@prisma/client';
import { prisma } from '../config/database';
import { projectRepository, auditRepository, userRepository } from '../repositories';
import { AppError } from '../utils/AppError';
import { ErrorCodes } from '../utils/errorCodes';

interface CreateProjectData {
    name: string;
    description?: string;
}

interface UpdateProjectData {
    name?: string;
    description?: string | null;
}

/**
 * ProjectService - Business Logic Layer for Projects
 * 
 * Pattern: Follows Spring Boot's @Service pattern with:
 * - Repository pattern for data access (like JPA Repositories)
 * - Transactional operations (like @Transactional)
 * - Audit logging with diff calculation
 * 
 * Similar to: Spring Boot Service layer with JPA repositories
 */
export class ProjectService {
    /**
     * Get all projects accessible by a user
     * - Admins see all projects
     * - Members/Viewers see only their assigned projects
     */
    async getAll(userId: string, isAdmin: boolean, page: number = 1, pageSize: number = 20) {
        const result = await projectRepository.findByUserId(userId, isAdmin, page, pageSize);
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
     * Get a single project by ID with members and task count
     */
    async getById(id: string) {
        const project = await projectRepository.findById(id);
        if (!project) {
            throw AppError.notFound('Project not found', ErrorCodes.PROJECT.NOT_FOUND);
        }
        return project;
    }

    /**
     * Create a new project with transactional audit logging
     * 
     * Pattern: All write operations are wrapped in a transaction
     * to ensure atomicity of both the operation and the audit log.
     */
    async create(data: CreateProjectData, actorId: string) {
        return prisma.$transaction(async (tx) => {
            const project = await tx.project.create({
                data: {
                    name: data.name,
                    description: data.description,
                },
            });

            // Create audit log atomically - similar to @PostPersist listener
            await auditRepository.create(tx, {
                entityType: 'Project',
                entityId: project.id,
                action: 'CREATE',
                actorId,
                details: {
                    name: data.name,
                    description: data.description,
                },
            });

            return project;
        });
    }

    /**
     * Update a project with diff-based audit logging
     * 
     * Pattern: Calculate diff before update, then log only changed fields.
     * Similar to Hibernate's change tracking with @PreUpdate.
     */
    async update(id: string, data: UpdateProjectData, actorId: string) {
        const current = await projectRepository.findById(id);
        if (!current) {
            throw AppError.notFound('Project not found', ErrorCodes.PROJECT.NOT_FOUND);
        }

        return prisma.$transaction(async (tx) => {
            const updated = await tx.project.update({
                where: { id },
                data,
            });

            // Calculate diff - only log actual changes
            const diff: Record<string, { old: unknown; new: unknown }> = {};
            if (data.name !== undefined && data.name !== current.name) {
                diff.name = { old: current.name, new: data.name };
            }
            if (data.description !== undefined && data.description !== current.description) {
                diff.description = { old: current.description, new: data.description };
            }

            // Only log if there are actual changes
            if (Object.keys(diff).length > 0) {
                await auditRepository.create(tx, {
                    entityType: 'Project',
                    entityId: id,
                    action: 'UPDATE',
                    actorId,
                    details: diff,
                });
            }

            return updated;
        });
    }

    /**
     * Delete a project with audit logging
     * 
     * Note: Due to cascade delete, all tasks and members are also deleted.
     * The audit log preserves the project snapshot for recovery purposes.
     */
    async delete(id: string, actorId: string) {
        const project = await projectRepository.findById(id);
        if (!project) {
            throw AppError.notFound('Project not found', ErrorCodes.PROJECT.NOT_FOUND);
        }

        return prisma.$transaction(async (tx) => {
            await tx.project.delete({ where: { id } });

            // Log deletion with snapshot for recovery
            await auditRepository.create(tx, {
                entityType: 'Project',
                entityId: id,
                action: 'DELETE',
                actorId,
                details: {
                    name: project.name,
                    description: project.description,
                },
            });
        });
    }

    // ========================================
    // Member Management
    // ========================================

    /**
     * Add a member to a project
     * 
     * Business Rules:
     * - User must exist
     * - User must not already be a member
     * - Only Admins can add members (enforced at route level)
     */
    async addMember(projectId: string, userId: string, projectRole: ProjectRole, actorId: string) {
        const project = await projectRepository.findById(projectId);
        if (!project) {
            throw AppError.notFound('Project not found', ErrorCodes.PROJECT.NOT_FOUND);
        }

        // Verify user exists
        const user = await userRepository.findById(userId);
        if (!user) {
            throw AppError.badRequest('User not found', ErrorCodes.USER.NOT_FOUND, { userId });
        }

        // Check if already a member
        const existingRole = await projectRepository.getUserProjectRole(projectId, userId);
        if (existingRole) {
            throw AppError.badRequest(
                'User is already a member of this project',
                ErrorCodes.PROJECT.MEMBER_ALREADY_EXISTS,
                { userId, projectId, existingRole }
            );
        }

        return prisma.$transaction(async (tx) => {
            const member = await tx.projectMember.create({
                data: { projectId, userId, projectRole },
                include: {
                    user: { select: { id: true, email: true, name: true, role: true } },
                },
            });

            await auditRepository.create(tx, {
                entityType: 'Project',
                entityId: projectId,
                action: 'UPDATE',
                actorId,
                details: {
                    memberAdded: {
                        userId,
                        userName: member.user.name,
                        userEmail: member.user.email,
                        projectRole,
                    },
                },
            });

            return member;
        });
    }

    /**
     * Update a member's role in a project
     */
    async updateMemberRole(projectId: string, memberId: string, newRole: ProjectRole, actorId: string) {
        const member = await prisma.projectMember.findUnique({
            where: { id: memberId },
            include: { user: { select: { email: true, name: true } } },
        });

        if (!member || member.projectId !== projectId) {
            throw AppError.notFound('Member not found in this project', ErrorCodes.PROJECT.MEMBER_NOT_FOUND);
        }

        const oldRole = member.projectRole;
        if (oldRole === newRole) {
            return member; // No change needed
        }

        return prisma.$transaction(async (tx) => {
            const updated = await tx.projectMember.update({
                where: { id: memberId },
                data: { projectRole: newRole },
                include: {
                    user: { select: { id: true, email: true, name: true, role: true } },
                },
            });

            await auditRepository.create(tx, {
                entityType: 'Project',
                entityId: projectId,
                action: 'UPDATE',
                actorId,
                details: {
                    memberRoleChanged: {
                        userId: member.userId,
                        userName: member.user.name,
                        projectRole: { old: oldRole, new: newRole },
                    },
                },
            });

            return updated;
        });
    }

    /**
     * Remove a member from a project
     */
    async removeMember(projectId: string, memberId: string, actorId: string) {
        return prisma.$transaction(async (tx) => {
            const member = await tx.projectMember.findUnique({
                where: { id: memberId },
                include: { user: { select: { id: true, email: true, name: true } } },
            });

            if (!member || member.projectId !== projectId) {
                throw AppError.notFound(
                    'Member not found in this project',
                    ErrorCodes.PROJECT.MEMBER_NOT_FOUND
                );
            }

            await tx.projectMember.delete({ where: { id: memberId } });

            await auditRepository.create(tx, {
                entityType: 'Project',
                entityId: projectId,
                action: 'UPDATE',
                actorId,
                details: {
                    memberRemoved: {
                        userId: member.userId,
                        userName: member.user.name,
                        userEmail: member.user.email,
                        projectRole: member.projectRole,
                    },
                },
            });
        });
    }

    /**
     * Get paginated history for a project
     */
    async getHistory(projectId: string, page: number = 1, pageSize: number = 20) {
        return auditRepository.findByEntity('Project', projectId, page, pageSize);
    }
}

export const projectService = new ProjectService();
