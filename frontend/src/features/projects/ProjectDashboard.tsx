
import { useParams, useNavigate } from 'react-router-dom';
import { TaskBoard } from '../tasks/TaskBoard';
import { BarChart3, ListTodo, Users, Plus, UserX, History as HistoryIcon, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { ProjectMemberDTO } from '@temp-ops/shared';
import { useProject, useDeleteProject } from './hooks/useProjects';
import { AddMemberModal } from './components/AddMemberModal';
import { EditProjectModal } from './components/EditProjectModal';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { HistoryPanel } from '../audit/components/HistoryPanel';
import { Button } from '../../shared/components/Button';
import { usePermissions } from '../../shared/hooks/usePermissions';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../api/projectsApi';
import { format } from 'date-fns';

export const ProjectDashboard = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { data: project, isLoading, isError } = useProject(projectId!);
    const [activeTab, setActiveTab] = useState<'tasks' | 'analytics' | 'members' | 'history'>('tasks');
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isAdmin } = usePermissions();
    const queryClient = useQueryClient();
    const { mutate: deleteProject } = useDeleteProject();

    const { mutate: removeMember } = useMutation({
        mutationFn: (memberId: string) => projectsApi.removeMember(projectId!, memberId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (isError || !project) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Project Not Found</h2>
                <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
            </div>
        );
    }

    const tabs = [
        { id: 'tasks', label: 'Tasks', icon: ListTodo },
        { id: 'members', label: 'Members', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'history', label: 'History', icon: HistoryIcon },
    ] as const;

    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div className="flex items-center gap-4">
                    <div>
                        <div className="text-sm text-gray-500 mb-1">Project / {project.id.split('-')[0]}...</div>
                        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                    </div>
                    {isAdmin && (
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                                    <button
                                        onClick={() => {
                                            setIsEditOpen(true);
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit Project
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm(`Delete "${project.name}"? This will also delete all tasks. This cannot be undone.`)) {
                                                deleteProject(project.id, {
                                                    onSuccess: () => navigate('/projects'),
                                                });
                                            }
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Project
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex p-1 bg-gray-100 rounded-lg">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
                                activeTab === tab.id
                                    ? "bg-white text-primary-700 shadow-sm"
                                    : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-0">
                {activeTab === 'tasks' && (
                    <TaskBoard projectMembers={project.members || []} />
                )}

                {activeTab === 'members' && (
                    <div className="space-y-6 overflow-y-auto max-h-full">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
                            {isAdmin && (
                                <Button onClick={() => setIsAddMemberOpen(true)} size="sm">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Member
                                </Button>
                            )}
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                            {/* We assume project.members exists. If TS complains, we verify DTO */}
                            {project.members?.map((member: ProjectMemberDTO) => (
                                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                            {member.user?.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">{member.user?.name}</h4>
                                            <p className="text-sm text-gray-500">{member.user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-end">
                                            {isAdmin ? (
                                                <select
                                                    value={member.projectRole}
                                                    onChange={(e) => {
                                                        const newRole = e.target.value as 'MEMBER' | 'VIEWER';
                                                        if (newRole !== member.projectRole) {
                                                            projectsApi.updateMemberRole(projectId!, member.id, newRole)
                                                                .then(() => {
                                                                    queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
                                                                });
                                                        }
                                                    }}
                                                    className={cn(
                                                        "px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer border-0",
                                                        member.projectRole === 'MEMBER'
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-gray-100 text-gray-700"
                                                    )}
                                                >
                                                    <option value="MEMBER">MEMBER</option>
                                                    <option value="VIEWER">VIEWER</option>
                                                </select>
                                            ) : (
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-xs font-medium",
                                                    member.projectRole === 'MEMBER'
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-gray-100 text-gray-700"
                                                )}>
                                                    {member.projectRole}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-gray-400 mt-1">
                                                Joined {format(new Date(member.joinedAt), 'MMM d, yyyy')}
                                            </span>
                                        </div>

                                        {isAdmin && (
                                            <button
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to remove this member?')) {
                                                        removeMember(member.id);
                                                    }
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <UserX className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {!project.members || project.members.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    No members in this project yet.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="overflow-y-auto max-h-full">
                        <AnalyticsPanel />
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="overflow-y-auto max-h-full">
                        <HistoryPanel />
                    </div>
                )}
            </div>

            {project && (
                <AddMemberModal
                    isOpen={isAddMemberOpen}
                    onClose={() => setIsAddMemberOpen(false)}
                    projectId={projectId!}
                    existingMemberIds={project.members?.map((m) => m.userId) || []}
                />
            )}

            {project && (
                <EditProjectModal
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    project={project}
                />
            )}
        </div>
    );
};
