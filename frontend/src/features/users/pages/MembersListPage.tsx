import { useUsers, useDeleteUser } from '../hooks/useUsers';
import { DataTable } from '../../../shared/components/DataTable';
import { UserDTO, UserRole } from '@temp-ops/shared';
import { format } from 'date-fns';
import { Shield, User as UserIcon, Plus, MoreHorizontal, Edit, Trash2, Search, ArrowUpDown } from 'lucide-react';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '../../../shared/components/Button';
import { CreateUserModal } from '../components/CreateUserModal';
import { EditUserModal } from '../components/EditUserModal';
import { useAuthStore } from '../../../stores/authStore';

export const MembersListPage = () => {
    const { isAdmin } = usePermissions();
    const { user: currentUser } = useAuthStore();

    // State
    const [page, setPage] = useState(1);
    const pageSize = 20;
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'role' | 'createdAt'>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to page 1 on search
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading } = useUsers({
        page,
        pageSize,
        search: debouncedSearch,
        sortBy,
        sortOrder
    });

    const users = data?.users || [];
    const meta = data?.meta;

    const { mutate: deleteUser } = useDeleteUser();

    // ... rest of state definitions ...
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserDTO | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Toggle Sort Helper
    const handleSort = (field: 'name' | 'role' | 'createdAt') => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc'); // Default to asc for new field
        }
    };

    const SortIcon = ({ field }: { field: 'name' | 'role' | 'createdAt' }) => {
        if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400 opacity-0 group-hover:opacity-100" />;
        return <ArrowUpDown className={`w-3 h-3 ml-1 ${sortOrder === 'asc' ? 'text-primary-600 rotate-180' : 'text-primary-600'}`} />;
    };

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    const handleDelete = (user: UserDTO) => {
        if (confirm(`Are you sure you want to delete "${user.name}"? This action cannot be undone.`)) {
            deleteUser(user.id);
        }
        setOpenMenuId(null);
    };

    const columns = [
        {
            header: (
                <div
                    className="flex items-center cursor-pointer group select-none"
                    onClick={() => handleSort('name')}
                >
                    Name <SortIcon field="name" />
                </div>
            ),
            accessorKey: 'name' as keyof UserDTO,
            cell: (user: UserDTO) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                </div>
            ),
        },
        {
            header: (
                <div
                    className="flex items-center cursor-pointer group select-none"
                    onClick={() => handleSort('role')}
                >
                    Role <SortIcon field="role" />
                </div>
            ),
            accessorKey: 'role' as keyof UserDTO,
            cell: (user: UserDTO) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === UserRole.ADMIN
                    ? 'bg-purple-100 text-purple-700'
                    : user.role === UserRole.VIEWER
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                    {user.role === UserRole.ADMIN ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                    {user.role}
                </span>
            ),
        },
        {
            header: (
                <div
                    className="flex items-center cursor-pointer group select-none"
                    onClick={() => handleSort('createdAt')}
                >
                    Joined <SortIcon field="createdAt" />
                </div>
            ),
            accessorKey: 'createdAt' as keyof UserDTO,
            cell: (user: UserDTO) => format(new Date(user.createdAt), 'MMM d, yyyy'),
        },
        {
            header: 'Actions',
            accessorKey: 'id' as keyof UserDTO,
            cell: (user: UserDTO) => {
                const isSelf = currentUser?.id === user.id;
                return (
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === user.id ? null : user.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {openMenuId === user.id && (
                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                                <button
                                    onClick={() => {
                                        setEditingUser(user);
                                        setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit User
                                </button>
                                {!isSelf && (
                                    <button
                                        onClick={() => handleDelete(user)}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete User
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-6" onClick={() => setOpenMenuId(null)}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Members</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage all users in the organization (Admin only).
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search members..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
                        />
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create User
                    </Button>
                </div>
            </div>

            <DataTable
                data={users || []}
                columns={columns}
                isLoading={isLoading}
            />

            {/* Pagination Controls */}
            {meta && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{meta.total === 0 ? 0 : ((page - 1) * pageSize) + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, meta.total)}</span> of <span className="font-medium">{meta.total}</span> results
                    </p>
                    {meta.totalPages > 1 && (
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
                    )}
                </div>
            )}

            <CreateUserModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
            />

            {editingUser && (
                <EditUserModal
                    isOpen={!!editingUser}
                    onClose={() => setEditingUser(null)}
                    user={editingUser}
                />
            )}
        </div>
    );
};
