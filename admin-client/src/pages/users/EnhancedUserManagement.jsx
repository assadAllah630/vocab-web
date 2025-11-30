/**
 * User Management - Professional Admin Panel Design (Using ONLY Real Backend Data)
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { format } from 'date-fns';
import UserSheet from './UserSheet';
import { useToast } from '../../components/ui/Toast';
import { usePermissions } from '../../contexts/PermissionContext';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/Avatar';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '../../components/ui/DropdownMenu';
import {
    Users, Search, Filter, Download, MoreHorizontal, UserCheck,
    UserX, Trash2, Mail, Calendar, Shield, ArrowUpDown
} from 'lucide-react';

export default function EnhancedUserManagement() {
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [sortConfig, setSortConfig] = useState({ key: 'date_joined', direction: 'desc' });
    const [filters, setFilters] = useState({
        status: 'all',
        role: 'all'
    });

    const { showToast } = useToast();
    const { hasPermission } = usePermissions();

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(
                'http://localhost:8000/api/admin/users/filter/',
                { headers: { Authorization: `Token ${token}` } }
            );
            setUsers(Array.isArray(response.data.results) ? response.data.results : []);
        } catch (err) {
            showToast('Failed to load users', 'error');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredAndSortedUsers = useMemo(() => {
        let result = [...users];

        // Filter
        result = result.filter(user => {
            const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filters.status === 'all' ||
                (filters.status === 'online' ? user.is_online :
                    filters.status === 'active' ? user.is_active :
                        filters.status === 'inactive' ? !user.is_active : true);
            const matchesRole = filters.role === 'all' ||
                (filters.role === 'admin' ? user.role : !user.role);

            return matchesSearch && matchesStatus && matchesRole;
        });

        // Sort
        result.sort((a, b) => {
            if (sortConfig.key === 'date_joined' || sortConfig.key === 'last_login') {
                const dateA = new Date(a[sortConfig.key] || 0);
                const dateB = new Date(b[sortConfig.key] || 0);
                return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
            }
            // Default string sort
            const valA = String(a[sortConfig.key] || '').toLowerCase();
            const valB = String(b[sortConfig.key] || '').toLowerCase();
            return sortConfig.direction === 'asc'
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        });

        return result;
    }, [users, searchQuery, filters, sortConfig]);

    const toggleUserSelection = (userId) => {
        const newSelection = new Set(selectedUsers);
        if (newSelection.has(userId)) {
            newSelection.delete(userId);
        } else {
            newSelection.add(userId);
        }
        setSelectedUsers(newSelection);
    };

    const handleBulkAction = async (action) => {
        if (selectedUsers.size === 0) return;

        try {
            const token = localStorage.getItem('adminToken');
            await axios.post(
                'http://localhost:8000/api/admin/users/bulk/',
                { action, user_ids: Array.from(selectedUsers) },
                { headers: { Authorization: `Token ${token}` } }
            );
            showToast(`Successfully ${action}ed ${selectedUsers.size} users`, 'success');
            setSelectedUsers(new Set());
            fetchUsers();
        } catch (err) {
            showToast(`Failed to ${action} users`, 'error');
        }
    };

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        User Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Manage user access, roles, and view detailed activity statistics.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="bg-white dark:bg-slate-900">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900">
                        <Users className="mr-2 h-4 w-4" />
                        Add User
                    </Button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-300"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                        <option value="all">All Status</option>
                        <option value="online">Online Now</option>
                        <option value="active">Account Active</option>
                        <option value="inactive">Account Suspended</option>
                    </select>
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Data Table */}
            <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300"
                                    checked={selectedUsers.size === filteredAndSortedUsers.length && filteredAndSortedUsers.length > 0}
                                    onChange={() => {
                                        if (selectedUsers.size === filteredAndSortedUsers.length) {
                                            setSelectedUsers(new Set());
                                        } else {
                                            setSelectedUsers(new Set(filteredAndSortedUsers.map(u => u.id)));
                                        }
                                    }}
                                />
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('username')}>
                                <div className="flex items-center gap-1">
                                    User
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('vocab_count')}>
                                <div className="flex items-center gap-1">
                                    Stats
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('date_joined')}>
                                <div className="flex items-center gap-1">
                                    Joined
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('last_login')}>
                                <div className="flex items-center gap-1">
                                    Last Login
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredAndSortedUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedUsers.map((user) => (
                                <TableRow key={user.id} className="group">
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300"
                                            checked={selectedUsers.has(user.id)}
                                            onChange={() => toggleUserSelection(user.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={user.profile?.avatar} />
                                                    <AvatarFallback className="bg-slate-100 dark:bg-slate-800">
                                                        {user.username.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {user.is_online && (
                                                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-slate-900" />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900 dark:text-white">
                                                    {user.username}
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {user.email}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={user.is_active ? "outline" : "destructive"}
                                            className={user.is_active ? "text-green-600 border-green-600 bg-green-50 dark:bg-green-900/20" : ""}
                                        >
                                            {user.is_active ? 'Active' : 'Suspended'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-3 w-3 text-slate-400" />
                                            <span className="capitalize text-sm text-slate-600 dark:text-slate-300">
                                                {user.role || 'User'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                {user.vocab_count || 0} words
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-500">
                                                {user.content_count || 0} AI gens
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-slate-500 dark:text-slate-400">
                                            {format(new Date(user.date_joined), 'MMM d, yyyy')}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-slate-500 dark:text-slate-400">
                                            {user.last_login
                                                ? format(new Date(user.last_login), 'MMM d, h:mm a')
                                                : 'Never'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                                                    Copy User ID
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => setSelectedUserId(user.id)}>
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>View Activity Log</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {user.is_active ? (
                                                    <DropdownMenuItem className="text-red-600" onClick={() => handleBulkAction('suspend')}>
                                                        Suspend User
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem className="text-green-600" onClick={() => handleBulkAction('activate')}>
                                                        Activate User
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Bulk Actions Floating Bar */}
            <AnimatePresence>
                {selectedUsers.size > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
                    >
                        <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-full shadow-2xl border border-slate-700 px-6 py-3 flex items-center gap-6">
                            <span className="font-medium text-sm">
                                {selectedUsers.size} selected
                            </span>
                            <div className="h-4 w-[1px] bg-slate-700" />
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                    onClick={() => handleBulkAction('activate')}
                                >
                                    Activate
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                    onClick={() => handleBulkAction('suspend')}
                                >
                                    Suspend
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-slate-400 hover:text-white"
                                    onClick={() => handleBulkAction('delete')}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* User Details Sheet */}
            <UserSheet
                userId={selectedUserId}
                isOpen={!!selectedUserId}
                onClose={() => setSelectedUserId(null)}
                onUserUpdated={fetchUsers}
            />
        </div>
    );
}
