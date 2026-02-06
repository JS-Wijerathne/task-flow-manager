import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserDTO } from '@temp-ops/shared';

interface AuthState {
    user: UserDTO | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (user: UserDTO, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            login: (user, token) => set({ user, token, isAuthenticated: true }),
            logout: () => set({ user: null, token: null, isAuthenticated: false }),
        }),
        {
            name: 'auth-storage', // unique name
            partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
