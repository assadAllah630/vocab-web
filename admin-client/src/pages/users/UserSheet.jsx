import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter
} from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Separator } from '../../components/ui/Separator';
import { useToast } from '../../components/ui/Toast';
import {
    Mail, Calendar, BookOpen, Clock, UserCheck, UserX,
    Shield, Activity, FileText, Lock, MoreHorizontal
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/Avatar';

export default function UserSheet({ userId, isOpen, onClose, onUserUpdated }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (userId && isOpen) {
            fetchUser();
        } else {
            setUser(null);
        }
    }, [userId, isOpen]);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(
                `http://localhost:8000/api/admin/users/${userId}/`,
                { headers: { Authorization: `Token ${token}` } }
            );
            setUser(response.data);
        } catch (error) {
            showToast('Failed to load user details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action) => {
        const actionText = action === 'suspend' ? 'suspend' : 'activate';
        if (!window.confirm(`Are you sure you want to ${actionText} this user?`)) return;

        try {
            setActionLoading(true);
            const token = localStorage.getItem('adminToken');
            await axios.post(
                `http://localhost:8000/api/admin/users/${userId}/${action}/`,
                {},
                { headers: { Authorization: `Token ${token}` } }
            );
            showToast(`User ${actionText}d successfully`, 'success');
            fetchUser();
            onUserUpdated?.();
        } catch (error) {
            showToast(`Failed to ${actionText} user`, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>User Details</SheetTitle>
                    <SheetDescription>
                        View and manage user information and permissions.
                    </SheetDescription>
                </SheetHeader>

                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white" />
                    </div>
                ) : user ? (
                    <div className="space-y-6">
                        {/* User Profile Header */}
                        <div className="flex items-start space-x-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={user.profile?.avatar} />
                                <AvatarFallback className="text-lg bg-slate-100 dark:bg-slate-800">
                                    {user.username.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                                    {user.username}
                                </h3>
                                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                                    <Mail className="mr-2 h-3.5 w-3.5" />
                                    {user.email}
                                </div>
                                <div className="flex items-center space-x-2 pt-1">
                                    <Badge variant={user.is_active ? "default" : "destructive"}>
                                        {user.is_active ? 'Active' : 'Suspended'}
                                    </Badge>
                                    {user.is_online && (
                                        <Badge variant="outline" className="text-green-600 border-green-600">
                                            Online Now
                                        </Badge>
                                    )}
                                    <Badge variant="secondary">
                                        {user.role || 'User'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="activity">Activity</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-6 mt-4">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                                            <BookOpen className="h-4 w-4" />
                                            Vocabulary
                                        </div>
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {user.vocab_count || 0}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                                            <FileText className="h-4 w-4" />
                                            Generated Content
                                        </div>
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {user.content_count || 0}
                                        </div>
                                    </div>
                                </div>

                                {/* Details List */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">Account Information</h4>
                                    <div className="grid gap-4 text-sm">
                                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-slate-500 flex items-center gap-2">
                                                <Calendar className="h-4 w-4" /> Joined
                                            </span>
                                            <span className="font-medium">
                                                {format(new Date(user.date_joined), 'PPP')}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-slate-500 flex items-center gap-2">
                                                <Clock className="h-4 w-4" /> Last Login
                                            </span>
                                            <span className="font-medium">
                                                {user.last_login
                                                    ? format(new Date(user.last_login), 'PPP p')
                                                    : 'Never'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-slate-500 flex items-center gap-2">
                                                <Shield className="h-4 w-4" /> Role
                                            </span>
                                            <span className="font-medium capitalize">
                                                {user.role || 'Standard User'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="activity" className="mt-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
                                        <Activity className="h-4 w-4 mr-2" />
                                        Activity log coming soon...
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Actions */}
                        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Actions</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {user.is_active ? (
                                    <Button
                                        variant="destructive"
                                        className="w-full"
                                        onClick={() => handleAction('suspend')}
                                        disabled={actionLoading}
                                    >
                                        <UserX className="mr-2 h-4 w-4" />
                                        Suspend User
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleAction('unsuspend')}
                                        disabled={actionLoading}
                                    >
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Activate User
                                    </Button>
                                )}
                                <Button variant="outline" className="w-full">
                                    <Lock className="mr-2 h-4 w-4" />
                                    Reset Password
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-40 text-slate-500">
                        User not found
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
