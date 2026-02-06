import { Project, Prisma, ProjectRole } from '@prisma/client';
import { prisma } from '../config/database';

/**
 * ProjectRepository - Data Access Layer for Projects
 * Implements the Repository pattern similar to Spring Data JPA
 */
export class ProjectRepository {
    async findById(id: string) {
        return prisma.project.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, email: true, name: true, role: true },
                        },
                    },
                },
                _count: { select: { tasks: true } },
            },
        });
    }

    async findAll(page: number = 1, pageSize: number = 20) {
        const skip = (page - 1) * pageSize;
        const [data, total] = await Promise.all([
            prisma.project.findMany({
                skip,
                take: pageSize,
                include: {
                    members: {
                        include: {
                            user: {
                                select: { id: true, email: true, name: true, role: true },
                            },
                        },
                    },
                    _count: { select: { tasks: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.project.count(),
        ]);

        return { data, total };
    }

    /**
     * Find projects accessible to a specific user
     * - Admins can see all projects
     * - Members/Viewers can only see projects they are assigned to
     */
    async findByUserId(userId: string, userIsAdmin: boolean, page: number = 1, pageSize: number = 20) {
        if (userIsAdmin) {
            return this.findAll(page, pageSize);
        }

        const skip = (page - 1) * pageSize;
        const [data, total] = await Promise.all([
            prisma.project.findMany({
                where: {
                    members: {
                        some: { userId },
                    },
                },
                skip,
                take: pageSize,
                include: {
                    members: {
                        include: {
                            user: {
                                select: { id: true, email: true, name: true, role: true },
                            },
                        },
                    },
                    _count: { select: { tasks: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.project.count({
                where: {
                    members: {
                        some: { userId },
                    },
                },
            }),
        ]);

        return { data, total };
    }

    async create(data: Prisma.ProjectCreateInput): Promise<Project> {
        return prisma.project.create({ data });
    }

    async update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
        return prisma.project.update({ where: { id }, data });
    }

    async delete(id: string): Promise<void> {
        await prisma.project.delete({ where: { id } });
    }

    // Project Members
    async addMember(projectId: string, userId: string, projectRole: ProjectRole) {
        return prisma.projectMember.create({
            data: { projectId, userId, projectRole },
        });
    }

    async updateMemberRole(memberId: string, projectRole: ProjectRole) {
        return prisma.projectMember.update({
            where: { id: memberId },
            data: { projectRole },
        });
    }

    async removeMember(memberId: string) {
        await prisma.projectMember.delete({ where: { id: memberId } });
    }

    async getUserProjectRole(projectId: string, userId: string) {
        const member = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId } },
        });
        return member?.projectRole || null;
    }
}

export const projectRepository = new ProjectRepository();
