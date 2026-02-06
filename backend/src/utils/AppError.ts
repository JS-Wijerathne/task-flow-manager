import { ErrorCode } from './errorCodes';

/**
 * AppError - Custom application error class
 * 
 * Pattern: Follows Spring Boot's exception handling pattern with:
 * - Operational vs Programming errors distinction
 * - Error codes for client-side error handling
 * - Metadata for additional context
 * 
 * Similar to: @ResponseStatus + ErrorDetails in Spring Boot
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code?: ErrorCode;
    public readonly metadata?: Record<string, unknown>;

    constructor(
        message: string,
        statusCode: number,
        options?: {
            code?: ErrorCode;
            metadata?: Record<string, unknown>;
        }
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = options?.code;
        this.metadata = options?.metadata;

        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Factory method for common error types
     */
    static notFound(message: string, code?: ErrorCode): AppError {
        return new AppError(message, 404, { code });
    }

    static badRequest(message: string, code?: ErrorCode, metadata?: Record<string, unknown>): AppError {
        return new AppError(message, 400, { code, metadata });
    }

    static unauthorized(message: string, code?: ErrorCode): AppError {
        return new AppError(message, 401, { code });
    }

    static forbidden(message: string, code?: ErrorCode): AppError {
        return new AppError(message, 403, { code });
    }

    static internal(message: string, code?: ErrorCode): AppError {
        return new AppError(message, 500, { code });
    }

    /**
     * Converts error to JSON for API response
     */
    toJSON() {
        return {
            status: 'error',
            statusCode: this.statusCode,
            code: this.code,
            message: this.message,
            ...(this.metadata && { metadata: this.metadata }),
        };
    }
}
