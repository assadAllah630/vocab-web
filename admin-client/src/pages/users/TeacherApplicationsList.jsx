
import { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { format } from 'date-fns';
import { useToast } from '../../components/ui/Toast';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/Avatar';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from '../../components/ui/Card';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '../../components/ui/Dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import {
    CheckCircle, XCircle, ExternalLink, Video, FileText, User, Filter, AlertCircle
} from 'lucide-react';

export default function TeacherApplicationsList() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');

    // Action Dialog State
    const [selectedApp, setSelectedApp] = useState(null);
    const [actionType, setActionType] = useState(null); // 'approve' | 'reject'
    const [feedback, setFeedback] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const { showToast } = useToast();

    const fetchApplications = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/teachers/admin/applications/?status=${statusFilter}`);
            setApplications(response.data);
        } catch (err) {
            showToast('Failed to load applications', 'error');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, showToast]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const handleAction = (app, type) => {
        setSelectedApp(app);
        setActionType(type);
        setFeedback(type === 'reject' ? 'Requirements not met.' : 'Welcome to the team!');
    };

    const submitAction = async () => {
        if (!selectedApp || !actionType) return;

        try {
            setActionLoading(true);
            const endpoint = `/api/teachers/admin/applications/${selectedApp.id}/${actionType}/`;
            await api.post(endpoint, { feedback });

            showToast(`Application ${actionType}d successfully`, 'success');
            setSelectedApp(null);
            setActionType(null);
            fetchApplications(); // Refresh list
        } catch (err) {
            showToast(`Failed to ${actionType} application`, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Teacher Applications
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Review and manage requests to join the teaching staff.
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                    <Button
                        variant={statusFilter === 'pending' ? 'default' : 'ghost'}
                        onClick={() => setStatusFilter('pending')}
                        size="sm"
                    >
                        Pending
                    </Button>
                    <Button
                        variant={statusFilter === 'approved' ? 'default' : 'ghost'}
                        onClick={() => setStatusFilter('approved')}
                        size="sm"
                    >
                        Approved
                    </Button>
                    <Button
                        variant={statusFilter === 'rejected' ? 'default' : 'ghost'}
                        onClick={() => setStatusFilter('rejected')}
                        size="sm"
                    >
                        Rejected
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="grid gap-6">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
                    </div>
                ) : applications.length === 0 ? (
                    <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500">
                        No {statusFilter} applications found.
                    </div>
                ) : (
                    applications.map((app) => (
                        <Card key={app.id} className="overflow-hidden">
                            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarFallback>{app.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle>{app.username}</CardTitle>
                                            <CardDescription>Applied on {format(new Date(app.created_at), 'PPP')}</CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant={
                                        app.status === 'approved' ? 'success' :
                                            app.status === 'rejected' ? 'destructive' : 'secondary'
                                    }>
                                        {app.status.toUpperCase()}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                                            <User size={16} /> Bio & Experience
                                        </h4>
                                        <p className="text-slate-900 dark:text-white mb-2">{app.bio}</p>
                                        <div className="flex gap-2">
                                            <Badge variant="outline">{app.experience_years} Years Exp</Badge>
                                            {app.teaching_languages.map(lang => (
                                                <Badge key={lang} variant="secondary">{lang}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-slate-500 mb-2">Portfolio Links</h4>
                                    <div className="grid gap-2">
                                        {app.resume_link && (
                                            <a
                                                href={app.resume_link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                <FileText className="text-blue-500" size={20} />
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Resume / CV</div>
                                                    <div className="text-xs text-slate-400 truncate">{app.resume_link}</div>
                                                </div>
                                                <ExternalLink size={16} className="text-slate-400" />
                                            </a>
                                        )}
                                        {app.intro_video_link && (
                                            <a
                                                href={app.intro_video_link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                <Video className="text-purple-500" size={20} />
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Intro Video</div>
                                                    <div className="text-xs text-slate-400 truncate">{app.intro_video_link}</div>
                                                </div>
                                                <ExternalLink size={16} className="text-slate-400" />
                                            </a>
                                        )}
                                    </div>

                                    {app.status === 'pending' && (
                                        <div className="flex gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                            <Button
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleAction(app, 'approve')}
                                            >
                                                <CheckCircle size={16} className="mr-2" /> Approve
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                className="flex-1"
                                                onClick={() => handleAction(app, 'reject')}
                                            >
                                                <XCircle size={16} className="mr-2" /> Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Action Dialog */}
            <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="capitalize">{actionType} Application</DialogTitle>
                        <DialogDescription>
                            {actionType === 'approve'
                                ? "This will grant the user Teacher privileges and create their public profile."
                                : "This will reject the application. The user can re-apply later."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Feedback / Message</label>
                            <Textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Add a note for the applicant..."
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectedApp(null)}>Cancel</Button>
                        <Button
                            variant={actionType === 'approve' ? 'default' : 'destructive'}
                            onClick={submitAction}
                            disabled={actionLoading}
                            className={actionType === 'approve' ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                            {actionLoading ? 'Processing...' : `Confirm ${actionType}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
