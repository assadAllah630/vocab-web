import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    UserIcon,
    AcademicCapIcon,
    UsersIcon,
    CheckBadgeIcon,
    CalendarIcon,
    BriefcaseIcon,
    EnvelopeIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import api from '../../api';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { format } from 'date-fns';

export default function AdminTeacherDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [teacher, setTeacher] = useState(null);
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [teacherRes, perfRes] = await Promise.all([
                api.get(`/api/teachers/${id}/`),
                api.get(`/api/teachers/${id}/performance/`)
            ]);
            setTeacher(teacherRes.data);
            setPerformance(perfRes.data);
        } catch (err) {
            showToast('Failed to load teacher details', 'error');
            navigate('/school/teachers');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="p-8 flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    if (!teacher) return null;

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/school/teachers')}>
                    <ArrowLeftIcon className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        {teacher.user_details.username}
                        {teacher.is_verified && <CheckBadgeIcon className="h-7 w-7 text-blue-500" />}
                    </h1>
                    <p className="text-slate-500">Teacher ID: {teacher.id} • Joined {format(new Date(teacher.created_at || new Date()), 'MMMM yyyy')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Profile & Stats */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <EnvelopeIcon className="h-4 w-4" />
                                <span>{teacher.user_details.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <BuildingOfficeIcon className="h-4 w-4" />
                                <span>{teacher.organization_name || 'Individual'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <BriefcaseIcon className="h-4 w-4" />
                                <span>{teacher.subjects?.join(', ') || 'No subjects'}</span>
                            </div>
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Teacher Bio</p>
                                <p className="text-sm italic text-slate-600 dark:text-slate-400">
                                    "{teacher.bio || 'No bio provided'}"
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 dark:bg-primary/10 border-primary/20">
                        <CardContent className="p-6 space-y-6">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Total Classrooms</p>
                                <div className="flex items-center gap-2">
                                    <AcademicCapIcon className="h-5 w-5 text-indigo-500" />
                                    <span className="text-2xl font-bold">{performance?.total_classrooms || 0}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Active Students</p>
                                <div className="flex items-center gap-2">
                                    <UsersIcon className="h-5 w-5 text-emerald-500" />
                                    <span className="text-2xl font-bold">{performance?.total_students || 0}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Status</p>
                                <Badge variant={teacher.is_verified ? "success" : "secondary"}>
                                    {teacher.is_verified ? 'Globally Verified' : 'Standard Teacher'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Col: Classrooms and detailed performance */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Managed Classrooms</CardTitle>
                            <Badge variant="outline">{performance?.total_classrooms || 0} Active</Badge>
                        </CardHeader>
                        <CardContent>
                            {/* Assuming we can fetch classrooms for this teacher. 
                                For now we list the count and we could add a list if the endpoint supports filtering.
                            */}
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-8 text-center">
                                <InformationCircleIcon className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                                <h3 className="font-medium">Classroom List</h3>
                                <p className="text-sm text-slate-500 mb-4">View and monitor all groups led by this teacher</p>
                                <Button variant="outline" size="sm" onClick={() => navigate('/school/classrooms')}>
                                    Go to Global Classroom List
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Placeholder for activity feed */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Teacher Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex gap-4 items-start">
                                    <div className="w-2 h-2 rounded-full bg-slate-300 mt-2 shrink-0" />
                                    <div>
                                        <p className="text-sm">Created a new assignment: <span className="font-medium">Vocabulary Quiz #4</span></p>
                                        <p className="text-xs text-slate-400">2 days ago</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="w-2 h-2 rounded-full bg-slate-300 mt-2 shrink-0" />
                                    <div>
                                        <p className="text-sm">Verified <span className="font-medium">5 student submissions</span></p>
                                        <p className="text-xs text-slate-400">3 days ago</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Missing import used in the component
function BuildingOfficeIcon(props) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A4.833 4.833 0 0012.75 4.5 4.833 4.833 0 006 10.332V21m12.75 0h-15" />
        </svg>
    );
}
