import axios from './client';
import { ProjectAnalyticsDTO } from '@temp-ops/shared';

export const analyticsApi = {
    getProjectAnalytics: async (projectId: string) => {
        const response = await axios.get<{ status: string; data: { analytics: ProjectAnalyticsDTO } }>(
            `/projects/${projectId}/analytics`
        );
        return response.data.data.analytics;
    },
};
