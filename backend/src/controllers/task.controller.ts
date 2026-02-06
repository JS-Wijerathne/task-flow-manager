import { Request, Response } from 'express';
import { taskService } from '../services';
import { catchAsync } from '../utils/catchAsync';

/**
 * TaskController - HTTP Layer for Tasks
 */
export class TaskController {
    getByProject = catchAsync(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;
        const status = req.query.status as string | undefined;
        const assigneeId = req.query.assigneeId as string | undefined;
        const search = req.query.search as string | undefined;

        const result = await taskService.getByProjectId(req.params.projectId, page, pageSize, {
            status: status as any,
            assigneeId,
            search,
        });

        res.status(200).json({
            status: 'success',
            data: {
                tasks: result.data,
                meta: result.meta
            },
        });
    });

    getById = catchAsync(async (req: Request, res: Response) => {
        const task = await taskService.getById(req.params.id);

        res.status(200).json({
            status: 'success',
            data: { task },
        });
    });

    create = catchAsync(async (req: Request, res: Response) => {
        const task = await taskService.create(
            { ...req.body, projectId: req.params.projectId },
            req.user!.id
        );

        res.status(201).json({
            status: 'success',
            data: { task },
        });
    });

    update = catchAsync(async (req: Request, res: Response) => {
        const task = await taskService.update(req.params.id, req.body, req.user!.id);

        res.status(200).json({
            status: 'success',
            data: { task },
        });
    });

    delete = catchAsync(async (req: Request, res: Response) => {
        await taskService.delete(req.params.id, req.user!.id);

        res.status(204).send();
    });

    getHistory = catchAsync(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;

        const history = await taskService.getHistory(req.params.id, page, pageSize);

        res.status(200).json({
            status: 'success',
            data: {
                logs: history.data,
                total: history.total
            },
        });
    });
}

export const taskController = new TaskController();
