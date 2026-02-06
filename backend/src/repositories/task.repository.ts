import { Task, Prisma, TaskStatus } from '@prisma/client';
import { prisma } from '../config/database';

export interface TaskFilter {
    projectId: string;
    status?: TaskStatus;
    assigneeId?: string;
    search?: string;
}

/**
 * TaskRepository - Data Access Layer for Tasks
 */
export class TaskRepository {
    async findById(id: string) {
        return prisma.task.findUnique({
            where: { id },
            include: {
                assignee: { select: { id: true, email: true, name: true } },
                reporter: { select: { id: true, email: true, name: true } },
            },
        });
    }

    async findByProjectId(
        projectId: string,
        page: number = 1,
        pageSize: number = 20,
        filter?: Omit<TaskFilter, 'projectId'>
    ) {
        const where: Prisma.TaskWhereInput = { projectId };

        if (filter?.status) {
            where.status = filter.status;
        }
        if (filter?.assigneeId) {
            where.assigneeId = filter.assigneeId;
        }
        if (filter?.search) {
            where.OR = [
                { title: { contains: filter.search, mode: 'insensitive' } },
                { description: { contains: filter.search, mode: 'insensitive' } },
            ];
        }

        const skip = (page - 1) * pageSize;
        const [data, total] = await Promise.all([
            prisma.task.findMany({
                where,
                skip,
                take: pageSize,
                include: {
                    assignee: { select: { id: true, email: true, name: true } },
                    reporter: { select: { id: true, email: true, name: true } },
                },
                orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
            }),
            prisma.task.count({ where }),
        ]);

        return { data, total };
    }

    async create(data: Prisma.TaskUncheckedCreateInput): Promise<Task> {
        return prisma.task.create({
            data,
            include: {
                assignee: { select: { id: true, email: true, name: true } },
                reporter: { select: { id: true, email: true, name: true } },
            },
        });
    }

    async update(id: string, data: Prisma.TaskUncheckedUpdateInput): Promise<Task> {
        return prisma.task.update({
            where: { id },
            data,
            include: {
                assignee: { select: { id: true, email: true, name: true } },
                reporter: { select: { id: true, email: true, name: true } },
            },
        });
    }

    async delete(id: string): Promise<void> {
        await prisma.task.delete({ where: { id } });
    }
}

export const taskRepository = new TaskRepository();
