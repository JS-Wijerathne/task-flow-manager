import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../shared/hooks/usePermissions';
import { Plus, Folder, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useProjects } from './hooks/useProjects';
import { CreateProjectModal } from './components/CreateProjectModal';
import { Button } from '../../shared/components/Button';
import { ProjectDTO } from '@temp-ops/shared';

export const ProjectsList = () => {
    const { isAdmin } = usePermissions();
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const pageSize = 20; // Matches backend default
    const { data, isLoading, isError } = useProjects(page, pageSize);
    const projects = data?.projects || [];
    const meta = data?.meta;
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-red-600">
                <AlertCircle className="w-8 h-8 mb-2" />
                <p>Failed to load projects. Please try again.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage your teams and current active projects.
                    </p>
                </div>
                {isAdmin && (
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Project
                    </Button>
                )}
            </div>

            {projects?.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">
                        {isAdmin ? 'No projects yet' : 'No projects assigned'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                        {isAdmin
                            ? 'Get started by creating your first project.'
                            : 'You are not assigned to any projects yet. Please contact an administrator to get access.'}
                    </p>
                    {isAdmin && (
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
                            Create Project
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects?.map((project: ProjectDTO) => (
                        <div
                            key={project.id}
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer hover:border-primary-200 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                                    <Folder className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-medium text-gray-400">
                                    Last filtered
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                                {project.name}
                            </h3>
                            <p className="text-gray-500 text-sm mb-6 line-clamp-2 min-h-[40px]">
                                {project.description || 'No description provided.'}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(project.updatedAt), 'MMM d, yyyy')}
                                </div>
                                {/* <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
                                    <span>{project.members?.length || 0} members</span>
                                </div> */}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
            {/* Pagination Controls */}
            {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-6">
                    <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{((page - 1) * pageSize) + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, meta.total)}</span> of <span className="font-medium">{meta.total}</span> results
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={page >= meta.totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
