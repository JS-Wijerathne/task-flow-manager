import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

/**
 * AuditRepository - Data Access Layer for Audit Logs
 */
export class AuditRepository {
    async create(
        tx: Prisma.TransactionClient,
        data: {
            entityType: string;
            entityId: string;
            action: AuditAction;
            actorId: string;
            details?: Record<string, unknown>;
        }
    ) {
        return tx.auditLog.create({
            data: {
                entityType: data.entityType,
                entityId: data.entityId,
                action: data.action,
                actorId: data.actorId,
                details: data.details as Prisma.InputJsonValue,
            },
        });
    }

    async findByEntity(entityType: string, entityId: string, page: number = 1, pageSize: number = 20) {
        const skip = (page - 1) * pageSize;
        const [data, total] = await Promise.all([
            prisma.auditLog.findMany({
                where: { entityType, entityId },
                skip,
                take: pageSize,
                include: {
                    actor: { select: { id: true, email: true, name: true } },
                },
                orderBy: { timestamp: 'desc' },
            }),
            prisma.auditLog.count({ where: { entityType, entityId } }),
        ]);

        return { data, total };
    }
}

export const auditRepository = new AuditRepository();
