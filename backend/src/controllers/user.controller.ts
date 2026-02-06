import { Request, Response } from 'express';
import { userRepository } from '../repositories';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

/**
 * UserController - HTTP Layer for User management
 */
export class UserController {
    getAll = catchAsync(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;
        const search = req.query.search as string | undefined;
        const sortBy = (req.query.sortBy as 'name' | 'role' | 'createdAt') || 'createdAt';
        const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

        const { data, total } = await userRepository.findAllPaginated(page, pageSize, search, sortBy, sortOrder);

        res.status(200).json({
            status: 'success',
            data: {
                users: data,
                meta: {
                    total,
                    page,
                    pageSize,
                    totalPages: Math.ceil(total / pageSize),
                },
            },
        });
    });

    getById = catchAsync(async (req: Request, res: Response) => {
        const user = await userRepository.findById(req.params.id);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Don't expose password
        const { password: _password, ...userWithoutPassword } = user;

        res.status(200).json({
            status: 'success',
            data: { user: userWithoutPassword },
        });
    });

    update = catchAsync(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { name, role } = req.body;

        const existingUser = await userRepository.findById(id);
        if (!existingUser) {
            throw new AppError('User not found', 404);
        }

        // Prevent self-demotion for admins
        if (req.user!.id === id && role && role !== existingUser.role) {
            throw new AppError('Cannot change your own role', 400);
        }

        const updatedUser = await userRepository.update(id, { name, role });
        const { password: _password, ...userWithoutPassword } = updatedUser;

        res.status(200).json({
            status: 'success',
            data: { user: userWithoutPassword },
        });
    });

    delete = catchAsync(async (req: Request, res: Response) => {
        const { id } = req.params;

        const existingUser = await userRepository.findById(id);
        if (!existingUser) {
            throw new AppError('User not found', 404);
        }

        // Prevent self-deletion
        if (req.user!.id === id) {
            throw new AppError('Cannot delete your own account', 400);
        }

        await userRepository.delete(id);

        res.status(204).send();
    });
}

export const userController = new UserController();

