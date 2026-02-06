import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

/**
 * Validation Middleware Factory
 * Similar to @Valid annotation in Spring Boot
 */
export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
                return next(new AppError(`Validation failed: ${messages.join(', ')}`, 400));
            }
            next(error);
        }
    };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            req.query = schema.parse(req.query);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
                return next(new AppError(`Invalid query parameters: ${messages.join(', ')}`, 400));
            }
            next(error);
        }
    };
};
