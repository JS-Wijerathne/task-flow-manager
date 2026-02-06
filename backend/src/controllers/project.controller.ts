import { Request, Response } from 'express';
import { projectService, analyticsService } from '../services';
import { catchAsync } from '../utils/catchAsync';

/**
 * ProjectController - HTTP Layer for Projects
 */
export class ProjectController {
    getAll = catchAsync(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;

        const result = await projectService.getAll(
            req.user!.id,
            req.user!.role === 'ADMIN',
            page,
            pageSize
        );

        res.status(200).json({
            status: 'success',
            data: {
                projects: result.data,
                meta: result.meta
            },
        });
    });

    getById = catchAsync(async (req: Request, res: Response) => {
        const project = await projectService.getById(req.params.id);

        res.status(200).json({
            status: 'success',
            data: { project },
        });
    });

    create = catchAsync(async (req: Request, res: Response) => {
        const project = await projectService.create(req.body, req.user!.id);

        res.status(201).json({
            status: 'success',
            data: { project },
        });
    });

    update = catchAsync(async (req: Request, res: Response) => {
        const project = await projectService.update(req.params.id, req.body, req.user!.id);

        res.status(200).json({
            status: 'success',
            data: { project },
        });
    });

    delete = catchAsync(async (req: Request, res: Response) => {
        await projectService.delete(req.params.id, req.user!.id);

        res.status(204).send();
    });

    // Members
    addMember = catchAsync(async (req: Request, res: Response) => {
        const member = await projectService.addMember(
            req.params.id,
            req.body.userId,
            req.body.projectRole,
            req.user!.id
        );

        res.status(201).json({
            status: 'success',
            data: { member },
        });
    });

    removeMember = catchAsync(async (req: Request, res: Response) => {
        await projectService.removeMember(req.params.id, req.params.memberId, req.user!.id);

        res.status(204).send();
    });

    updateMemberRole = catchAsync(async (req: Request, res: Response) => {
        const member = await projectService.updateMemberRole(
            req.params.id,
            req.params.memberId,
            req.body.projectRole,
            req.user!.id
        );

        res.status(200).json({
            status: 'success',
            data: { member },
        });
    });

    // History
    getHistory = catchAsync(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;

        const history = await projectService.getHistory(req.params.id, page, pageSize);

        res.status(200).json({
            status: 'success',
            data: {
                logs: history.data,
                total: history.total
            },
        });
    });

    // Analytics
    getAnalytics = catchAsync(async (req: Request, res: Response) => {
        const analytics = await analyticsService.getProjectAnalytics(req.params.id);

        res.status(200).json({
            status: 'success',
            data: { analytics },
        });
    });
}

export const projectController = new ProjectController();
