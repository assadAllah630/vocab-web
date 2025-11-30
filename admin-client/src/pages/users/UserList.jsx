import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import UserSheet from './UserSheet';
import { useToast } from '../../components/ui/Toast';

export default function UserList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const { addToast } = useToast();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('http://localhost:8000/api/admin/users/', {
                headers: { Authorization: `Token ${token}` }
            });
            setUsers(response.data.results);
        } catch (error) {
            console.error('Failed to fetch users', error);
            addToast({ title: 'Error', description: 'Failed to fetch users', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const columns = useMemo(
        () => [
            {
                header: 'User',
                accessorKey: 'username',
                cell: info => (
                    <div className="flex items-center gap-3">
                        <Avatar alt={info.getValue()} className="h-8 w-8" />
                        <div>
                            <div className="font-medium text-text-primary-light dark:text-text-primary-dark">
                                {info.getValue()}
                            </div>
                            <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                {info.row.original.email}
                            </div>
                        </div>
                    </div>
                ),
            },
            {
                header: 'Status',
                accessorKey: 'is_active',
                cell: info => (
                    <Badge variant={info.getValue() ? 'success' : 'error'}>
                        {info.getValue() ? 'Active' : 'Suspended'}
                    </Badge>
                ),
            },
            {
                header: 'Language',
                accessorKey: 'profile.learning_language',
                cell: info => info.getValue() || '-',
            },
            {
                header: 'Level',
                accessorKey: 'profile.level',
                cell: info => info.getValue() || '-',
            },
            {
                header: 'Joined',
                accessorKey: 'date_joined',
                cell: info => format(new Date(info.getValue()), 'MMM d, yyyy'),
            },
            {
                header: 'Last Login',
                accessorKey: 'last_login',
                cell: info => info.getValue() ? format(new Date(info.getValue()), 'MMM d, HH:mm') : 'Never',
            },
        ],
        []
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                        Users
                    </h1>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">
                        Manage and monitor user accounts
                    </p>
                </div>
                <Button onClick={fetchUsers} variant="outline" size="sm">
                    Refresh
                </Button>
            </div>

            <DataTable
                data={users}
                columns={columns}
                isLoading={loading}
                onRowClick={(row) => setSelectedUserId(row.id)}
            />

            <UserSheet
                userId={selectedUserId}
                isOpen={!!selectedUserId}
                onClose={() => setSelectedUserId(null)}
                onUserUpdated={fetchUsers}
            />
        </div>
    );
}
