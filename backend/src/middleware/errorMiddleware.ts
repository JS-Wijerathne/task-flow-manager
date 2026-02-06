import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ZodError } from 'zod';
import { ErrorCodes } from '../utils/errorCodes';

/**
 * Global Error Handler Middleware
 * 
 * Pattern: Similar to Spring Boot's @ControllerAdvice + @ExceptionHandler
 * - Handles operational errors with proper status codes
 * - Masks internal errors in production
 * - Includes error codes for client-side handling
 */
export const globalErrorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
) => {
    // Handle Zod validation errors
    if (err instanceof ZodError) {
        return res.status(400).json({
            status: 'fail',
            code: ErrorCodes.VALIDATION.INVALID_INPUT,
            message: 'Validation failed',
            errors: err.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
    }

    // Handle AppError (operational errors)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: err.statusCode >= 500 ? 'error' : 'fail',
            code: err.code,
            message: err.message,
            ...(err.metadata && { metadata: err.metadata }),
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        });
    }

    // Handle unknown errors
    const error = err as Error;
    console.error('💥 Unexpected Error:', error);

    if (process.env.NODE_ENV === 'development') {
        return res.status(500).json({
            status: 'error',
            code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
            message: error.message || 'An unexpected error occurred',
            stack: error.stack,
        });
    }

    // Production: Don't leak error details
    return res.status(500).json({
        status: 'error',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
        message: 'Something went wrong. Please try again later.',
    });
};
