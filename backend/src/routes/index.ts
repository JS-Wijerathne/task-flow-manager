import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/', taskRoutes); // Tasks are nested under /projects/:id/tasks
router.use('/users', userRoutes);

export default router;
