import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    UserIcon,
    AcademicCapIcon,
    UsersIcon,
    CheckBadgeIcon,
    MagnifyingGlassIcon,
    ChevronRightIcon,
    BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import api from '../../api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';

export default function AdminTeacherList() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadTeachers();
    }, []);

    const loadTeachers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/teachers/');
            setTeachers(res.data);
        } catch (err) {
            showToast('Failed to load teachers', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredTeachers = teachers.filter(t =>
        t.user_details?.username?.toLowerCase().includes(search.toLowerCase()) ||
        t.organization_name?.toLowerCase().includes(search.toLowerCase()) ||
        t.user_details?.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="p-8 flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Teacher Directory</h1>
                    <p className="text-slate-500 mt-1">Manage all approved educators and track their performance</p>
                </div>
            </div>

            {/* Search */}
            <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <CardContent className="p-4">
                    <div className="relative max-w-md">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name, email or organization..."
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeachers.map(teacher => (
                    <Card
                        key={teacher.id}
                        className="group hover:shadow-md transition-all cursor-pointer border-slate-200 dark:border-slate-800"
                        onClick={() => navigate(`/school/teachers/${teacher.id}`)}
                    >
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <UserIcon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors flex items-center gap-1">
                                            {teacher.user_details?.username}
                                            {teacher.is_verified && (
                                                <CheckBadgeIcon className="h-5 w-5 text-blue-500" />
                                            )}
                                        </h3>
                                        <p className="text-sm text-slate-500">{teacher.user_details?.email}</p>
                                    </div>
                                </div>
                                <Badge variant={teacher.is_verified ? "success" : "secondary"}>
                                    {teacher.is_verified ? 'Verified' : 'Active'}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-50 dark:border-slate-800">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Classrooms</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <AcademicCapIcon className="h-4 w-4 text-indigo-500" />
                                        <span className="font-bold">{teacher.classroom_count}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Students</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <UsersIcon className="h-4 w-4 text-emerald-500" />
                                        <span className="font-bold">{teacher.student_count || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <BuildingOfficeIcon className="h-4 w-4" />
                                    <span>{teacher.organization_name || 'Individual Tutor'}</span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {Array.isArray(teacher.subjects) && teacher.subjects.length > 0 ? (
                                        teacher.subjects.map(s => (
                                            <Badge key={s} variant="outline" className="text-[10px] px-1 py-0">{s}</Badge>
                                        ))
                                    ) : (
                                        <span className="text-xs text-slate-400">No subjects listed</span>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                                <span>Click for teacher dashboard</span>
                                <ChevronRightIcon className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filteredTeachers.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <UserIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No teachers found</h3>
                        <p className="text-slate-500">Could not find any educators matching your search</p>
                    </div>
                )}
            </div>
        </div>
    );
}
