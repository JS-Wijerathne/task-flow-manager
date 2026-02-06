import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { userRepository } from '../repositories';
import { AppError } from '../utils/AppError';

/**
 * AuthService - Handles authentication logic
 */
export class AuthService {
    async login(email: string, password: string) {
        // Find user
        const user = await userRepository.findByEmail(email);
        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError('Invalid email or password', 401);
        }

        // Generate JWT
        const signOptions: SignOptions = {
            expiresIn: env.JWT_EXPIRES_IN as any,
        };
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            env.JWT_SECRET,
            signOptions
        );

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }

    async register(email: string, name: string, password: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER' = 'VIEWER') {
        // Check if user exists
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            throw new AppError('User with this email already exists', 400);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await userRepository.create({
            email,
            name,
            password: hashedPassword,
            role,
        });

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };
    }
}

export const authService = new AuthService();
