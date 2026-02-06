import { User, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

/**
 * UserRepository - Data Access Layer for Users
 * Similar to JPA Repository pattern in Spring Data
 */
export class UserRepository {
    async findById(id: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { id } });
    }

    async findByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { email } });
    }

    async findAll(): Promise<User[]> {
        return prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findAllPaginated(
        page: number,
        pageSize: number,
        search?: string,
        sortBy: 'name' | 'role' | 'createdAt' = 'createdAt',
        sortOrder: 'asc' | 'desc' = 'desc'
    ) {
        const skip = (page - 1) * pageSize;

        // Build where clause
        const where: Prisma.UserWhereInput = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ],
        } : {};

        const [data, total] = await Promise.all([
            prisma.user.findMany({
                skip,
                take: pageSize,
                where,
                orderBy: { [sortBy]: sortOrder },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            prisma.user.count({ where }),
        ]);
        return { data, total };
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        return prisma.user.create({ data });
    }

    async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        return prisma.user.update({ where: { id }, data });
    }

    async delete(id: string): Promise<void> {
        await prisma.user.delete({ where: { id } });
    }
}

export const userRepository = new UserRepository();
