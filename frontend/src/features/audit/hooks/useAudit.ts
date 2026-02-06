import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../../../api/auditApi';

export const useProjectHistory = (projectId: string) => {
    return useQuery({
        queryKey: ['audit', 'project', projectId],
        queryFn: () => auditApi.getProjectHistory(projectId),
        enabled: !!projectId,
    });
};
