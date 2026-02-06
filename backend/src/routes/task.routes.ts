import { Router } from 'express';
import { taskController } from '../controllers';
import { authenticate, requireProjectAccess, requireProjectWriteAccess } from '../middleware/auth.middleware';
import { requireTaskReadAccess, requireTaskWriteAccess } from '../middleware/task.middleware';
import { validate } from '../middleware';
import { z } from 'zod';

const router = Router();

// Schemas
const createTaskSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().max(2000).optional(),
    priority: z.enum(['Low', 'Medium', 'High']).optional(),
    dueDate: z.string().optional(),
    assigneeId: z.string().uuid().nullable().optional(),
});

const updateTaskSchema = z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    priority: z.enum(['Low', 'Medium', 'High']).nullable().optional(),
    dueDate: z.string().nullable().optional(),
    assigneeId: z.string().uuid().nullable().optional(),
});

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management API
 */

/**
 * @swagger
 * /projects/{projectId}/tasks:
 *   get:
 *     summary: Get all tasks for a project
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of tasks
 *       403:
 *         description: Not a project member
 */
router.get('/projects/:projectId/tasks', requireProjectAccess(), taskController.getByProject);

/**
 * @swagger
 * /projects/{projectId}/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *               dueDate:
 *                 type: string
 *                 format: date
 *               assigneeId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Task created
 *       403:
 *         description: No write access
 */
router.post(
    '/projects/:projectId/tasks',
    requireProjectWriteAccess,
    validate(createTaskSchema),
    taskController.create
);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get task details
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Task details
 *       404:
 *         description: Task not found
 */
router.get('/tasks/:id', requireTaskReadAccess, taskController.getById);

/**
 * @swagger
 * /tasks/{id}:
 *   patch:
 *     summary: Update a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, DONE]
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *               dueDate:
 *                 type: string
 *                 format: date
 *               assigneeId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Task updated
 *       403:
 *         description: No write access
 */
router.patch('/tasks/:id', requireTaskWriteAccess, validate(updateTaskSchema), taskController.update);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Task deleted
 *       403:
 *         description: No write access
 */
router.delete('/tasks/:id', requireTaskWriteAccess, taskController.delete);

/**
 * @swagger
 * /tasks/{id}/history:
 *   get:
 *     summary: Get task audit history
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of audit log entries
 *       404:
 *         description: Task not found
 */
router.get('/tasks/:id/history', requireTaskReadAccess, taskController.getHistory);

export default router;

