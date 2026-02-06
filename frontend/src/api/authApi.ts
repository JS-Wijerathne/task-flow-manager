import axios from '../api/client';
import { LoginInput, LoginResponseDTO, UserDTO, RegisterInput } from '@temp-ops/shared';

export const login = async (data: LoginInput): Promise<LoginResponseDTO> => {
    const response = await axios.post<any>('/auth/login', data);
    // Backend returns { status: 'success', data: { token, user } }
    // We need to map it to LoginResponseDTO matching shared types
    return response.data.data;
};

export const register = async (data: RegisterInput): Promise<UserDTO> => {
    const response = await axios.post<any>('/auth/register', data);
    return response.data.data.user;
};

export const logout = () => {
    // Client-side logout only for JWT
    // If we had a backend logout endpoint (e.g. for cookies), calls it here
};

