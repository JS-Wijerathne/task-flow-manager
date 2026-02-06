import { Router } from 'express';
import { projectController } from '../controllers';
import { authenticate, requireRole, requireProjectAccess, requireProjectWriteAccess } from '../middleware/auth.middleware';
import { validate } from '../middleware';
import { z } from 'zod';

const router = Router();

// Schemas
const createProjectSchema = z.object({
    name: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
});

const updateProjectSchema = z.object({
    name: z.string().min(3).max(100).optional(),
    description: z.string().max(500).nullable().optional(),
});

const addMemberSchema = z.object({
    userId: z.string().uuid(),
    projectRole: z.enum(['MEMBER', 'VIEWER']),
});

const updateMemberRoleSchema = z.object({
    projectRole: z.enum(['MEMBER', 'VIEWER']),
});

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ProjectMember:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         projectId:
 *           type: string
 *         projectRole:
 *           type: string
 *           enum: [MEMBER, VIEWER]
 */

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Get all projects for the current user
 *     description: Admins see all projects, Members/Viewers see only assigned projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of accessible projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     projects:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Project'
 */
router.get('/', projectController.getAll);

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a new project (Admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Project created successfully
 *       403:
 *         description: Admin only
 */
router.post('/', requireRole('ADMIN'), validate(createProjectSchema), projectController.create);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get project details
 *     description: Requires project membership or Admin role
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Project details with members
 *       403:
 *         description: Not a project member
 *       404:
 *         description: Project not found
 */
router.get('/:id', requireProjectAccess(), projectController.getById);

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Update project (Admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated
 *       403:
 *         description: Admin only
 *       404:
 *         description: Project not found
 */
router.put('/:id', requireRole('ADMIN'), validate(updateProjectSchema), projectController.update);

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Delete project (Admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Project deleted
 *       403:
 *         description: Admin only
 *       404:
 *         description: Project not found
 */
router.delete('/:id', requireRole('ADMIN'), projectController.delete);

/**
 * @swagger
 * /projects/{id}/members:
 *   post:
 *     summary: Add member to project (Admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
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
 *             required:
 *               - userId
 *               - projectRole
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               projectRole:
 *                 type: string
 *                 enum: [MEMBER, VIEWER]
 *     responses:
 *       201:
 *         description: Member added
 *       403:
 *         description: Admin only
 *       404:
 *         description: Project or user not found
 */
router.post('/:id/members', requireRole('ADMIN'), validate(addMemberSchema), projectController.addMember);

/**
 * @swagger
 * /projects/{id}/members/{memberId}:
 *   delete:
 *     summary: Remove member from project (Admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Member removed
 *       403:
 *         description: Admin only
 *       404:
 *         description: Member not found
 */
router.delete('/:id/members/:memberId', requireRole('ADMIN'), projectController.removeMember);

/**
 * @swagger
 * /projects/{id}/members/{memberId}:
 *   patch:
 *     summary: Update member role in project (Admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: memberId
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
 *               - projectRole
 *             properties:
 *               projectRole:
 *                 type: string
 *                 enum: [MEMBER, VIEWER]
 *     responses:
 *       200:
 *         description: Member role updated
 *       403:
 *         description: Admin only
 *       404:
 *         description: Member not found
 */
router.patch('/:id/members/:memberId', requireRole('ADMIN'), validate(updateMemberRoleSchema), projectController.updateMemberRole);

/**
 * @swagger
 * /projects/{id}/history:
 *   get:
 *     summary: Get project audit history
 *     description: Returns audit log entries for project changes
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
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
 *       403:
 *         description: Not a project member
 */
router.get('/:id/history', requireProjectAccess(), projectController.getHistory);

/**
 * @swagger
 * /projects/{id}/analytics:
 *   get:
 *     summary: Get project analytics
 *     description: Returns task statistics, overdue tasks, and completion metrics
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Project analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasksByStatus:
 *                   type: object
 *                 overdueTasks:
 *                   type: array
 *                 averageCompletionTime:
 *                   type: number
 *       403:
 *         description: Not a project member
 */
router.get('/:id/analytics', requireProjectAccess(), projectController.getAnalytics);

export default router;
