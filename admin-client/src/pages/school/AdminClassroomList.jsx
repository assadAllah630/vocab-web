import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AcademicCapIcon,
    UserIcon,
    UsersIcon,
    CalendarIcon,
    ChevronRightIcon,
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import api from '../../api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { format } from 'date-fns';

export default function AdminClassroomList() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [search, setSearch] = useState('');
    const [filterLevel, setFilterLevel] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [classesRes, statsRes] = await Promise.all([
                api.get('/api/classrooms/'),
                api.get('/api/classrooms/admin_overview/')
            ]);
            setClassrooms(classesRes.data);
            setStats(statsRes.data);
        } catch (err) {
            showToast('Failed to load classrooms', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredClassrooms = classrooms.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.teacher_name?.toLowerCase().includes(search.toLowerCase());
        const matchesLevel = filterLevel === 'all' || c.level === filterLevel;
        return matchesSearch && matchesLevel;
    });

    if (loading) return (
        <div className="p-8 flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Global Classrooms</h1>
                    <p className="text-slate-500 mt-1">Monitor and manage all learning spaces across the platform</p>
                </div>

                {stats && (
                    <div className="flex gap-4">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                <AcademicCapIcon className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Classes</p>
                                <p className="text-xl font-bold">{stats.total_classrooms}</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                                <UsersIcon className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Enrollments</p>
                                <p className="text-xl font-bold">{stats.total_enrollments}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Filters */}
            <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <CardContent className="p-4 flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[300px]">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by class name or teacher..."
                            className="pl-10"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <AdjustmentsHorizontalIcon className="h-5 w-5 text-slate-400" />
                        <select
                            value={filterLevel}
                            onChange={e => setFilterLevel(e.target.value)}
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="all">All Levels</option>
                            <option value="A1">A1 - Beginner</option>
                            <option value="A2">A2 - Elementary</option>
                            <option value="B1">B1 - Intermediate</option>
                            <option value="B2">B2 - Upper Intermediate</option>
                            <option value="C1">C1 - Advanced</option>
                            <option value="C2">C2 - Mastery</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClassrooms.map(classroom => (
                    <Card
                        key={classroom.id}
                        className="group overflow-hidden hover:shadow-md transition-all cursor-pointer border-slate-200 dark:border-slate-800"
                        onClick={() => navigate(`/school/classrooms/${classroom.id}`)}
                    >
                        <CardContent className="p-0">
                            <div className="p-5 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                                            {classroom.name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Badge variant="outline" className="text-[10px] uppercase px-1.5 py-0">
                                                {classroom.language}
                                            </Badge>
                                            <Badge variant="secondary" className="text-[10px] uppercase px-1.5 py-0">
                                                {classroom.level}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className={`h-2 w-2 rounded-full ${classroom.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <UserIcon className="h-4 w-4 text-slate-400" />
                                        <span className="text-slate-600 dark:text-slate-300">
                                            Teacher: <span className="font-semibold">{classroom.teacher_name || 'Unassigned'}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <UsersIcon className="h-4 w-4 text-slate-400" />
                                        <span className="text-slate-600 dark:text-slate-300">
                                            {classroom.student_count || 0} / {classroom.max_students} Students Enrolled
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CalendarIcon className="h-4 w-4 text-slate-400" />
                                        <span className="text-slate-600 dark:text-slate-300">
                                            Created {format(new Date(classroom.created_at), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">View Details</span>
                                <ChevronRightIcon className="h-4 w-4 text-slate-400 group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filteredClassrooms.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <MagnifyingGlassIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No classrooms found</h3>
                        <p className="text-slate-500">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>
        </div>
    );
}
