import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

export default function UserDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchUser();
    }, [id]);

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`http://localhost:8000/api/admin/users/${id}/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action) => {
        if (!window.confirm(`Are you sure you want to ${action.replace('_', ' ')} this user?`)) return;

        try {
            setActionLoading(true);
            const token = localStorage.getItem('adminToken');
            await axios.post(`http://localhost:8000/api/admin/users/${id}/${action}/`, {}, {
                headers: { Authorization: `Token ${token}` }
            });
            fetchUser(); // Refresh data
            alert('Action successful');
        } catch (error) {
            alert('Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!user) return <div>User not found</div>;

    return (
        <div>
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        {user.username}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">{user.email}</p>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    {user.is_active ? (
                        <button
                            onClick={() => handleAction('suspend')}
                            disabled={actionLoading}
                            className="ml-3 inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                        >
                            Suspend User
                        </button>
                    ) : (
                        <button
                            onClick={() => handleAction('unsuspend')}
                            disabled={actionLoading}
                            className="ml-3 inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                        >
                            Unsuspend User
                        </button>
                    )}
                    <button
                        onClick={() => handleAction('reset_password')}
                        disabled={actionLoading}
                        className="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                        Reset Password
                    </button>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Profile Card */}
                <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">Profile Information</h3>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                        <dl className="sm:divide-y sm:divide-gray-200">
                            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                                    {user.first_name} {user.last_name}
                                </dd>
                            </div>
                            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Joined</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                                    {format(new Date(user.date_joined), 'PPP')}
                                </dd>
                            </div>
                            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Learning Language</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                                    {user.profile?.learning_language || '-'}
                                </dd>
                            </div>
                            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Level</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                                    {user.profile?.level || '-'}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Activity Stats (Placeholder) */}
                <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">Activity Stats</h3>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                        <dl className="sm:divide-y sm:divide-gray-200">
                            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                                    {user.last_login ? format(new Date(user.last_login), 'PPP p') : 'Never'}
                                </dd>
                            </div>
                            {/* Add more stats here */}
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
