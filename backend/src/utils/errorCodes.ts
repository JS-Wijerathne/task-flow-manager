/**
 * Error Codes - Centralized error code management
 * 
 * Pattern: Follows Spring Boot's ErrorCode enum pattern for consistent
 * error identification across the application.
 * 
 * Format: ERR_{DOMAIN}_{CODE}
 */
export const ErrorCodes = {
    // Authentication Errors (1xx)
    AUTH: {
        INVALID_TOKEN: 'ERR_AUTH_001',
        TOKEN_EXPIRED: 'ERR_AUTH_002',
        USER_NOT_FOUND: 'ERR_AUTH_003',
        INVALID_CREDENTIALS: 'ERR_AUTH_004',
        AUTHENTICATION_REQUIRED: 'ERR_AUTH_005',
    },

    // Authorization Errors (2xx)
    AUTHZ: {
        INSUFFICIENT_PERMISSIONS: 'ERR_AUTHZ_001',
        ROLE_REQUIRED: 'ERR_AUTHZ_002',
        PROJECT_ACCESS_DENIED: 'ERR_AUTHZ_003',
        ADMIN_REQUIRED: 'ERR_AUTHZ_004',
        WRITE_ACCESS_REQUIRED: 'ERR_AUTHZ_005',
    },

    // Project Errors (3xx)
    PROJECT: {
        NOT_FOUND: 'ERR_PROJECT_001',
        ALREADY_EXISTS: 'ERR_PROJECT_002',
        MEMBER_ALREADY_EXISTS: 'ERR_PROJECT_003',
        MEMBER_NOT_FOUND: 'ERR_PROJECT_004',
    },

    // Task Errors (4xx)
    TASK: {
        NOT_FOUND: 'ERR_TASK_001',
        INVALID_STATUS_TRANSITION: 'ERR_TASK_002',
        VIEWER_CANNOT_BE_ASSIGNED: 'ERR_TASK_003',
        ASSIGNEE_NOT_FOUND: 'ERR_TASK_004',
        ASSIGNEE_NOT_IN_PROJECT: 'ERR_TASK_005',
    },

    // User Errors (5xx)
    USER: {
        NOT_FOUND: 'ERR_USER_001',
        EMAIL_ALREADY_EXISTS: 'ERR_USER_002',
        INVALID_ROLE: 'ERR_USER_003',
    },

    // Validation Errors (6xx)
    VALIDATION: {
        INVALID_INPUT: 'ERR_VALIDATION_001',
        MISSING_REQUIRED_FIELD: 'ERR_VALIDATION_002',
        INVALID_UUID: 'ERR_VALIDATION_003',
    },

    // System Errors (9xx)
    SYSTEM: {
        INTERNAL_ERROR: 'ERR_SYSTEM_001',
        DATABASE_ERROR: 'ERR_SYSTEM_002',
        EXTERNAL_SERVICE_ERROR: 'ERR_SYSTEM_003',
    },
} as const;

// Type for error codes
export type ErrorCode =
    | typeof ErrorCodes.AUTH[keyof typeof ErrorCodes.AUTH]
    | typeof ErrorCodes.AUTHZ[keyof typeof ErrorCodes.AUTHZ]
    | typeof ErrorCodes.PROJECT[keyof typeof ErrorCodes.PROJECT]
    | typeof ErrorCodes.TASK[keyof typeof ErrorCodes.TASK]
    | typeof ErrorCodes.USER[keyof typeof ErrorCodes.USER]
    | typeof ErrorCodes.VALIDATION[keyof typeof ErrorCodes.VALIDATION]
    | typeof ErrorCodes.SYSTEM[keyof typeof ErrorCodes.SYSTEM];
