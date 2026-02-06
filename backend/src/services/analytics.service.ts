import { prisma } from '../config/database';

/**
 * AnalyticsService - Optimized database-level analytics
 * All calculations happen in PostgreSQL, not in JavaScript memory
 */
export class AnalyticsService {
    /**
     * Get task counts grouped by status
     * Uses Prisma groupBy which translates to SQL GROUP BY
     */
    async getTasksByStatus(projectId: string) {
        const results = await prisma.task.groupBy({
            by: ['status'],
            where: { projectId },
            _count: { status: true },
        });

        // Initialize with zeros
        const stats: Record<string, number> = {
            TODO: 0,
            IN_PROGRESS: 0,
            DONE: 0,
        };

        for (const group of results) {
            stats[group.status] = group._count.status;
        }

        return stats;
    }

    /**
     * Get count of overdue tasks (incomplete tasks past due date)
     */
    async getOverdueCount(projectId: string) {
        return prisma.task.count({
            where: {
                projectId,
                status: { not: 'DONE' },
                dueDate: { lt: new Date() },
            },
        });
    }

    /**
     * Get list of overdue tasks (Top 5 most overdue)
     */
    async getOverdueTasks(projectId: string, limit = 5) {
        return prisma.task.findMany({
            where: {
                projectId,
                status: { not: 'DONE' },
                dueDate: { lt: new Date() },
            },
            take: limit,
            orderBy: { dueDate: 'asc' }, // Oldest due dates first
            include: {
                // Include minimal user details for UI
                assignee: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
                reporter: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
            },
        });
    }

    /**
     * Calculate average time to completion using raw SQL
     * For tasks that have been completed (completedAt is set)
     */
    async getAvgCompletionTime(projectId: string): Promise<number | null> {
        const result = await prisma.$queryRaw<[{ avg_hours: number | null }]>`
      SELECT AVG(EXTRACT(EPOCH FROM ("completedAt" - "createdAt")) / 3600) as avg_hours
      FROM "tasks"
      WHERE "projectId" = ${projectId}
      AND "status" = 'DONE'
      AND "completedAt" IS NOT NULL
    `;

        return result[0]?.avg_hours ? parseFloat(result[0].avg_hours.toFixed(2)) : null;
    }

    /**
     * Get completion time distribution (histograms)
     * Buckets: < 1 Day, 1-3 Days, 3-7 Days, > 7 Days
     */
    async getCompletionTimeDistribution(projectId: string) {
        // Using raw SQL for efficient bucketing
        const results = await prisma.$queryRaw<{ range: string; count: number }[]>`
            SELECT
                CASE
                    WHEN duration_hours < 24 THEN '< 1 Day'
                    WHEN duration_hours BETWEEN 24 AND 72 THEN '1-3 Days'
                    WHEN duration_hours BETWEEN 72 AND 168 THEN '3-7 Days'
                    ELSE '> 7 Days'
                END as range,
                COUNT(*)::int as count
            FROM (
                SELECT EXTRACT(EPOCH FROM ("completedAt" - "createdAt")) / 3600 as duration_hours
                FROM "tasks"
                WHERE "projectId" = ${projectId} AND "status" = 'DONE' AND "completedAt" IS NOT NULL
            ) as durations
            GROUP BY range
        `;

        // Initialize defaults
        const distribution: Record<string, number> = {
            '< 1 Day': 0,
            '1-3 Days': 0,
            '3-7 Days': 0,
            '> 7 Days': 0,
        };

        results.forEach(row => {
            distribution[row.range] = Number(row.count);
        });

        return distribution;
    }

    /**
     * Get all analytics for a project dashboard
     */
    async getProjectAnalytics(projectId: string) {
        const [
            tasksByStatus,
            overdueCount,
            overdueTasks,
            avgCompletionTimeHours,
            completionTimeDistribution
        ] = await Promise.all([
            this.getTasksByStatus(projectId),
            this.getOverdueCount(projectId),
            this.getOverdueTasks(projectId),
            this.getAvgCompletionTime(projectId),
            this.getCompletionTimeDistribution(projectId),
        ]);

        return {
            projectId,
            tasksByStatus,
            overdueCount,
            overdueTasks,
            avgCompletionTimeHours,
            completionTimeDistribution,
        };
    }
}

export const analyticsService = new AnalyticsService();
