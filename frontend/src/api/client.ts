import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const apiClient = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Attach token
apiClient.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 and show error toasts
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Import dynamically to avoid circular dependency
        import('../stores/toastStore').then(({ showErrorToast }) => {
            if (error.response?.status === 401) {
                useAuthStore.getState().logout();
                showErrorToast('Session expired. Please login again.', 'Authentication Error');
            } else if (error.response?.status >= 500) {
                showErrorToast('An unexpected server error occurred. Please try again later.', 'Server Error');
            } else if (error.response?.data?.message) {
                // Only show non-403 API error messages
                if (error.response?.status !== 403) {
                    showErrorToast(error.response.data.message, 'Error');
                }
            }
        });
        return Promise.reject(error);
    }
);

export default apiClient;
