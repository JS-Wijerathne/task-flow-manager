import axios from './client';
import { AuditLogDTO } from '@temp-ops/shared';

interface AuditResponse {
    status: string;
    data: {
        logs: AuditLogDTO[];
    };
}

export const auditApi = {
    getProjectHistory: async (projectId: string) => {
        const response = await axios.get<AuditResponse>(`/projects/${projectId}/history`);
        return response.data.data.logs;
    },

    // If we had task history endpoint
    // getTaskHistory: async (taskId: string) => ...
};
