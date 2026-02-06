import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../../api/analyticsApi';

export const useProjectAnalytics = (projectId: string) => {
    return useQuery({
        queryKey: ['analytics', projectId],
        queryFn: () => analyticsApi.getProjectAnalytics(projectId),
        enabled: !!projectId,
        refetchInterval: 60000, // Refresh every minute
    });
};
