import { Request, Response, NextFunction } from 'express';
import { UserRole, ProjectRole } from '@prisma/client';
import { taskRepository, projectRepository } from '../repositories';
import { AppError } from '../utils/AppError';
import { ErrorCodes } from '../utils/errorCodes';

// Extend Request to include task context
declare global {
    namespace Express {
        interface Request {
            task?: {
                id: string;
                projectId: string;
            };
        }
    }
}

/**
 * Task Access Middleware
 * 
 * Verifies the authenticated user has access to the task's project.
 * This is critical for RBAC enforcement since task routes use task ID,
 * not project ID, so we must look up the task's project and verify access.
 * 
 * @param requireWrite - If true, requires MEMBER role (write access). 
 *                       If false, allows both MEMBER and VIEWER (read access).
 */
export const requireTaskAccess = (requireWrite: boolean = false) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(AppError.unauthorized(
                    'Authentication required.',
                    ErrorCodes.AUTH.AUTHENTICATION_REQUIRED
                ));
            }

            const taskId = req.params.id;
            if (!taskId) {
                return next(AppError.badRequest(
                    'Task ID is required.',
                    ErrorCodes.VALIDATION.MISSING_REQUIRED_FIELD
                ));
            }

            // Fetch the task to get its project
            const task = await taskRepository.findById(taskId);
            if (!task) {
                return next(AppError.notFound(
                    'Task not found.',
                    ErrorCodes.TASK.NOT_FOUND
                ));
            }

            // Global ADMINs have access to all tasks
            if (req.user.role === UserRole.ADMIN) {
                req.task = { id: task.id, projectId: task.projectId };
                return next();
            }

            // Check project membership for non-admin users
            const projectRole = await projectRepository.getUserProjectRole(task.projectId, req.user.id);

            if (!projectRole) {
                return next(AppError.forbidden(
                    'You do not have access to this task\'s project.',
                    ErrorCodes.AUTHZ.PROJECT_ACCESS_DENIED
                ));
            }

            // If write access is required, verify user is a MEMBER (not VIEWER)
            if (requireWrite && projectRole === ProjectRole.VIEWER) {
                return next(AppError.forbidden(
                    'You do not have write access to tasks in this project. Viewers have read-only access.',
                    ErrorCodes.AUTHZ.WRITE_ACCESS_REQUIRED
                ));
            }

            // Attach task context for controller use
            req.task = { id: task.id, projectId: task.projectId };
            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Shortcut for requiring write access (MEMBER role)
 */
export const requireTaskWriteAccess = requireTaskAccess(true);

/**
 * Shortcut for requiring read access (MEMBER or VIEWER)
 */
export const requireTaskReadAccess = requireTaskAccess(false);
