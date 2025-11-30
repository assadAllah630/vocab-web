/**
 * Admin Users Management Page - Upgraded with shadcn/ui
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { DataTable } from '../../components/common/DataTable';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "../../components/ui/Dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/Select";
import { ShieldCheck, Plus, UserCog, AlertCircle, RefreshCw } from 'lucide-react';
import { fadeIn } from '../../utils/animations';
import { format } from 'date-fns';

export default function AdminUsers() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', role: 'CONTENT_MODERATOR' });
    const [creating, setCreating] = useState(false);

    const { showToast } = useToast();

    const fetchAdmins = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('adminToken');

            if (!token) throw new Error('Not authenticated');

            const response = await axios.get('http://localhost:8000/api/admin/admins/', {
                headers: { Authorization: `Token ${token}` }
            });

            const data = response.data.results || response.data || [];
            setAdmins(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch admins:', err);
            setError('Failed to load admin users');
            showToast('Failed to load admin users', 'error');
            setAdmins([]);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const token = localStorage.getItem('adminToken');
            await axios.post('http://localhost:8000/api/admin/admins/', newUser, {
                headers: { Authorization: `Token ${token}` }
            });

            showToast('Admin user added successfully', 'success');
            setShowModal(false);
            setNewUser({ username: '', role: 'CONTENT_MODERATOR' });
            fetchAdmins();
        } catch (err) {
            console.error('Failed to add admin:', err);
            showToast('Failed to add admin. Ensure user exists.', 'error');
        } finally {
            setCreating(false);
        }
    };

    const columns = useMemo(() => [
        {
            header: 'Username',
            accessorKey: 'username',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {row.original.username.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium text-foreground">{row.original.username}</span>
                </div>
            )
        },
        {
            header: 'Role',
            accessorKey: 'role',
            cell: ({ row }) => {
                const role = row.original.role;
                let variant = 'secondary';
                if (role === 'SUPER_ADMIN') variant = 'destructive';
                if (role === 'SYSTEM_ADMIN') variant = 'default';
                if (role === 'ANALYST') variant = 'warning';
                if (role === 'USER_SUPPORT') variant = 'success';

                return (
                    <Badge variant={variant} className="font-mono text-xs">
                        {role.replace('_', ' ')}
                    </Badge>
                );
            }
        },
        {
            header: 'Email',
            accessorKey: 'email',
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>
        },
        {
            header: 'Assigned At',
            accessorKey: 'assigned_at',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {format(new Date(row.original.assigned_at), 'MMM d, yyyy')}
                </span>
            )
        },
    ], []);

    return (
        <motion.div
            className="p-8 space-y-6"
            variants={fadeIn}
            initial="initial"
            animate="animate"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Users</h1>
                    <p className="mt-1 text-muted-foreground">
                        Manage administrative access and role assignments.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchAdmins}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={() => setShowModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Admin
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden border-border shadow-soft-md">
                <CardContent className="p-0">
                    {loading && admins.length === 0 ? (
                        <div className="p-6 space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-[200px]" />
                                        <Skeleton className="h-4 w-[150px]" />
                                    </div>
                                    <Skeleton className="h-8 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive mb-4">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">Failed to load admins</h3>
                            <p className="text-muted-foreground mt-1 mb-4">{error}</p>
                            <Button onClick={fetchAdmins} variant="outline">Try Again</Button>
                        </div>
                    ) : admins.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                                <UserCog className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">No admin users found</h3>
                            <p className="text-muted-foreground mt-1">
                                Start by adding a new administrator.
                            </p>
                        </div>
                    ) : (
                        <DataTable
                            data={admins}
                            columns={columns}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Add Admin Dialog */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New Admin</DialogTitle>
                        <DialogDescription>
                            Grant administrative privileges to an existing user.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    placeholder="Enter existing username"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={newUser.role}
                                    onValueChange={(val) => setNewUser({ ...newUser, role: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CONTENT_MODERATOR">Content Moderator</SelectItem>
                                        <SelectItem value="USER_SUPPORT">User Support</SelectItem>
                                        <SelectItem value="ANALYST">Analyst</SelectItem>
                                        <SelectItem value="SYSTEM_ADMIN">System Admin</SelectItem>
                                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={creating}>
                                {creating ? 'Adding...' : 'Add Admin'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
