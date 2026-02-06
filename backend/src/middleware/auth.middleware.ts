import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { ErrorCodes } from '../utils/errorCodes';
import { userRepository, projectRepository } from '../repositories';
import { UserRole, ProjectRole } from '@prisma/client';

// Extend Express Request type to include authenticated user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: UserRole;
            };
        }
    }
}

/**
 * Authentication Middleware - Verifies JWT token
 * 
 * Pattern: Similar to Spring Security's JwtAuthenticationFilter
 * - Extracts Bearer token from Authorization header
 * - Verifies token signature and expiration
 * - Attaches user context to request object
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw AppError.unauthorized(
                'Authentication required. Please provide a valid Bearer token.',
                ErrorCodes.AUTH.AUTHENTICATION_REQUIRED
            );
        }

        const token = authHeader.split(' ')[1];

        let decoded: { id: string; email: string; role: UserRole };
        try {
            decoded = jwt.verify(token, env.JWT_SECRET) as typeof decoded;
        } catch (jwtError) {
            if (jwtError instanceof jwt.TokenExpiredError) {
                throw AppError.unauthorized(
                    'Token has expired. Please login again.',
                    ErrorCodes.AUTH.TOKEN_EXPIRED
                );
            }
            throw AppError.unauthorized(
                'Invalid authentication token.',
                ErrorCodes.AUTH.INVALID_TOKEN
            );
        }

        // Verify user still exists and is active
        const user = await userRepository.findById(decoded.id);
        if (!user) {
            throw AppError.unauthorized(
                'User no longer exists.',
                ErrorCodes.AUTH.USER_NOT_FOUND
            );
        }

        // Attach user to request for downstream handlers
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Role-Based Access Control Middleware
 * 
 * Pattern: Similar to Spring Security's @PreAuthorize("hasRole(...)")
 * - Checks if authenticated user has one of the allowed global roles
 * - Use for endpoints that require specific user roles regardless of project context
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(AppError.unauthorized(
                'Authentication required.',
                ErrorCodes.AUTH.AUTHENTICATION_REQUIRED
            ));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(AppError.forbidden(
                `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
                ErrorCodes.AUTHZ.ROLE_REQUIRED
            ));
        }

        next();
    };
};

/**
 * Admin Role Middleware - Shortcut for admin-only endpoints
 * 
 * Pattern: Similar to @PreAuthorize("hasRole('ADMIN')")
 */
export const requireAdminRole = requireRole(UserRole.ADMIN);

/**
 * Project Access Middleware
 * 
 * Pattern: Similar to Spring Security's method security with SpEL expressions
 * - Verifies user has access to the project specified in the request
 * - Optionally requires specific project roles (MEMBER vs VIEWER)
 * 
 * Access Rules:
 * - Global ADMINs have access to ALL projects
 * - Members/Viewers only have access to projects they're assigned to
 * - If requiredRoles specified, user must have one of those project roles
 */
export const requireProjectAccess = (requiredRoles?: ProjectRole[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(AppError.unauthorized(
                    'Authentication required.',
                    ErrorCodes.AUTH.AUTHENTICATION_REQUIRED
                ));
            }

            // Extract project ID from various possible parameter names
            const projectId = req.params.projectId || req.params.id;
            if (!projectId) {
                return next(AppError.badRequest(
                    'Project ID is required.',
                    ErrorCodes.VALIDATION.MISSING_REQUIRED_FIELD
                ));
            }

            // Global ADMINs have access to all projects
            if (req.user.role === UserRole.ADMIN) {
                return next();
            }

            // Check project membership for non-admin users
            const userProjectRole = await projectRepository.getUserProjectRole(projectId, req.user.id);

            if (!userProjectRole) {
                return next(AppError.forbidden(
                    'You do not have access to this project.',
                    ErrorCodes.AUTHZ.PROJECT_ACCESS_DENIED
                ));
            }

            // If specific project roles are required, verify the user has one of them
            if (requiredRoles && requiredRoles.length > 0) {
                if (!requiredRoles.includes(userProjectRole)) {
                    return next(AppError.forbidden(
                        `This action requires one of the following project roles: ${requiredRoles.join(', ')}`,
                        ErrorCodes.AUTHZ.WRITE_ACCESS_REQUIRED
                    ));
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Project Write Access Middleware - Shortcut for requiring MEMBER role
 * 
 * Use for: Create Task, Update Task, Delete Task, Change Status, Assign Task
 * VIEWERs are explicitly denied write access.
 */
export const requireProjectWriteAccess = requireProjectAccess([ProjectRole.MEMBER]);

/**
 * Project Read Access Middleware - Allows both MEMBER and VIEWER
 * 
 * Use for: View Project, View Tasks, View Analytics, View History
 */
export const requireProjectReadAccess = requireProjectAccess([ProjectRole.MEMBER, ProjectRole.VIEWER]);
