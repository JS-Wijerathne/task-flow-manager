import { useCallback, useMemo } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { UserRole, ProjectRole, ProjectMemberDTO } from '@temp-ops/shared';

/**
 * usePermissions Hook - Global permission checks
 * 
 * Pattern: Similar to Spring Security's SecurityContextHolder
 * - Provides current user context
 * - Checks global roles (ADMIN, MEMBER, VIEWER)
 * 
 * Use for: Global UI elements like sidebar navigation
 */
export const usePermissions = () => {
    const { user } = useAuthStore();

    const isAdmin = useMemo(() => user?.role === UserRole.ADMIN, [user]);
    const isMember = useMemo(() => user?.role === UserRole.MEMBER, [user]);
    const isViewer = useMemo(() => user?.role === UserRole.VIEWER, [user]);
    const isAuthenticated = useMemo(() => !!user, [user]);

    /**
     * Check if user has one of the specified roles
     */
    const hasRole = useCallback(
        (allowedRoles: UserRole[]) => {
            if (!user) return false;
            return allowedRoles.includes(user.role);
        },
        [user]
    );

    /**
     * Check if user can access admin-only features
     * - User management
     * - Create/Delete projects
     * - Add/Remove project members
     */
    const canAccessAdminFeatures = useMemo(() => isAdmin, [isAdmin]);

    /**
     * Check if user can view the global members list
     * (Admin only - Members/Viewers only see their project members)
     */
    const canViewMembersList = useMemo(() => isAdmin, [isAdmin]);

    return {
        user,
        isAuthenticated,
        isAdmin,
        isMember,
        isViewer,
        hasRole,
        canAccessAdminFeatures,
        canViewMembersList,
    };
};

/**
 * useProjectPermissions Hook - Project-context permission checks
 * 
 * Pattern: Similar to Spring Security's method security with project context
 * - Checks project-level roles (MEMBER vs VIEWER)
 * - Considers global ADMIN role as having full access
 * 
 * @param projectMembers - List of project members to check against
 * 
 * Use for: Project-specific UI elements like task buttons
 */
export const useProjectPermissions = (projectMembers?: ProjectMemberDTO[]) => {
    const { user } = useAuthStore();

    /**
     * Get the current user's role in this specific project
     * Returns undefined if user is not a member (though they shouldn't be here)
     */
    const currentUserProjectRole = useMemo(() => {
        if (!user || !projectMembers) return undefined;
        const membership = projectMembers.find((m) => m.userId === user.id);
        return membership?.projectRole;
    }, [user, projectMembers]);

    /**
     * Check if user is a global ADMIN
     */
    const isGlobalAdmin = useMemo(() => user?.role === UserRole.ADMIN, [user]);

    /**
     * Check if user has write access to the project
     * - Global ADMINs always have write access
     * - Project MEMBERs have write access
     * - Project VIEWERs do NOT have write access
     */
    const canWrite = useMemo(() => {
        if (!user) return false;
        // Global ADMINs have full access
        if (isGlobalAdmin) return true;
        // Check project-level role
        return currentUserProjectRole === ProjectRole.MEMBER;
    }, [user, isGlobalAdmin, currentUserProjectRole]);

    /**
     * Check if user can only read (VIEWER role)
     */
    const isReadOnly = useMemo(() => {
        if (!user) return true;
        if (isGlobalAdmin) return false;
        return currentUserProjectRole === ProjectRole.VIEWER;
    }, [user, isGlobalAdmin, currentUserProjectRole]);

    // ========================================
    // Task Permissions
    // ========================================

    /**
     * Can user create tasks in this project?
     * - Admins: Yes
     * - Members: Yes
     * - Viewers: No
     */
    const canCreateTask = useMemo(() => canWrite, [canWrite]);

    /**
     * Can user update/edit tasks?
     */
    const canUpdateTask = useMemo(() => canWrite, [canWrite]);

    /**
     * Can user delete tasks?
     */
    const canDeleteTask = useMemo(() => canWrite, [canWrite]);

    /**
     * Can user change task status?
     */
    const canChangeTaskStatus = useMemo(() => canWrite, [canWrite]);

    /**
     * Can user assign tasks to others?
     */
    const canAssignTask = useMemo(() => canWrite, [canWrite]);

    /**
     * Can user drag and drop tasks (status change)?
     */
    const canDragDropTasks = useMemo(() => canWrite, [canWrite]);

    // ========================================
    // Project Member Permissions
    // ========================================

    /**
     * Can user add members to this project?
     * (Admin only)
     */
    const canAddMembers = useMemo(() => isGlobalAdmin, [isGlobalAdmin]);

    /**
     * Can user remove members from this project?
     * (Admin only)
     */
    const canRemoveMembers = useMemo(() => isGlobalAdmin, [isGlobalAdmin]);

    /**
     * Can user change member roles?
     * (Admin only)
     */
    const canChangeMemberRole = useMemo(() => isGlobalAdmin, [isGlobalAdmin]);

    // ========================================
    // Project Permissions
    // ========================================

    /**
     * Can user edit project settings?
     * (Admin only)
     */
    const canEditProject = useMemo(() => isGlobalAdmin, [isGlobalAdmin]);

    /**
     * Can user delete the project?
     * (Admin only)
     */
    const canDeleteProject = useMemo(() => isGlobalAdmin, [isGlobalAdmin]);

    return {
        // User context
        user,
        currentUserProjectRole,
        isGlobalAdmin,
        canWrite,
        isReadOnly,

        // Task permissions
        canCreateTask,
        canUpdateTask,
        canDeleteTask,
        canChangeTaskStatus,
        canAssignTask,
        canDragDropTasks,

        // Member permissions
        canAddMembers,
        canRemoveMembers,
        canChangeMemberRole,

        // Project permissions
        canEditProject,
        canDeleteProject,
    };
};

/**
 * Helper function to check if a user can be assigned to a task
 * 
 * Rule: VIEWERs cannot be assigned tasks
 * 
 * @param userId - The user to check
 * @param projectMembers - The project's member list
 * @returns true if user can be assigned
 */
export const canBeAssignedTask = (
    userId: string,
    projectMembers: ProjectMemberDTO[],
    globalRole?: UserRole
): boolean => {
    // Global ADMINs can always be assigned
    if (globalRole === UserRole.ADMIN) return true;

    // Check project role
    const membership = projectMembers.find((m) => m.userId === userId);
    if (!membership) return false; // Not a project member

    // VIEWERs cannot be assigned
    return membership.projectRole !== ProjectRole.VIEWER;
};
