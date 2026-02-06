import { Request, Response } from 'express';
import { authService } from '../services';
import { catchAsync } from '../utils/catchAsync';

/**
 * AuthController - HTTP Layer for Authentication
 * Similar to @RestController in Spring Boot
 */
export class AuthController {
    login = catchAsync(async (req: Request, res: Response) => {
        const { email, password } = req.body;
        const result = await authService.login(email, password);

        res.status(200).json({
            status: 'success',
            data: result,
        });
    });

    register = catchAsync(async (req: Request, res: Response) => {
        const { email, name, password, role } = req.body;
        const user = await authService.register(email, name, password, role);

        res.status(201).json({
            status: 'success',
            data: { user },
        });
    });

    me = catchAsync(async (req: Request, res: Response) => {
        res.status(200).json({
            status: 'success',
            data: { user: req.user },
        });
    });
}

export const authController = new AuthController();
