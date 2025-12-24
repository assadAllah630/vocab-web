import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    UsersIcon,
    AcademicCapIcon,
    ChartBarIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';
import api from '../../api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { format } from 'date-fns';

export default function AdminClassroomDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [classroom, setClassroom] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClassroom();
    }, [id]);

    const fetchClassroom = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/classrooms/${id}/`);
            setClassroom(response.data);
        } catch (err) {
            showToast('Failed to load classroom details', 'error');
            navigate('/school/classrooms');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="p-8 flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    if (!classroom) return null;

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/school/classrooms')}>
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {classroom.name}
                            </h1>
                            <Badge variant={classroom.is_active ? 'success' : 'secondary'}>
                                {classroom.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <p className="text-slate-500 mt-1 flex items-center gap-2">
                            <AcademicCapIcon className="h-4 w-4" />
                            {classroom.language} • {classroom.level}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => window.open(`/classrooms/${classroom.id}`, '_blank')}>
                        View as Student
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90">
                        Manage Resources
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats Cards */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <UsersIcon className="h-4 w-4" /> Enrolled Students
                        </CardDescription>
                        <CardTitle className="text-2xl">{classroom.student_count} / {classroom.max_students}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-2">
                            <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${Math.min(100, (classroom.student_count / classroom.max_students) * 100)}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" /> Created On
                        </CardDescription>
                        <CardTitle className="text-2xl">
                            {format(new Date(classroom.created_at), 'MMM d, yyyy')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-slate-500">By {classroom.teacher_name}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <ChartBarIcon className="h-4 w-4" /> Invite Code
                        </CardDescription>
                        <CardTitle className="text-2xl font-mono">{classroom.invite_code}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-slate-500">Shared across {classroom.student_count} users</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Details Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Classroom Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            {classroom.description || "No description provided for this classroom."}
                        </p>
                    </CardContent>
                </Card>

                {/* Teacher Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Instructor Information</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                            {classroom.teacher_name?.charAt(0) || 'T'}
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{classroom.teacher_name}</h3>
                            <p className="text-sm text-slate-500">Head Instructor</p>
                            <Button variant="link" className="p-0 h-auto text-primary" onClick={() => navigate(`/school/teachers/${classroom.teacher}`)}>
                                View Full Profile
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
