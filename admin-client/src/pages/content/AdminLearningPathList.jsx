
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    EyeIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';
import api from '../../api';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { format } from 'date-fns';

export default function AdminLearningPathList() {
    const [paths, setPaths] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        fetchPaths();
    }, []);

    const fetchPaths = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/paths/'); // Utilizing existing API
            setPaths(res.data);
        } catch (err) {
            showToast('Failed to load learning paths', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this path? This cannot be undone.')) return;

        try {
            await api.delete(`/api/paths/${id}/`);
            setPaths(paths.filter(p => p.id !== id));
            showToast('Path deleted successfully', 'success');
        } catch (err) {
            showToast('Failed to delete path', 'error');
        }
    };

    const togglePublish = async (path) => {
        try {
            await api.patch(`/api/paths/${path.id}/`, { is_published: !path.is_published });
            setPaths(paths.map(p => p.id === path.id ? { ...p, is_published: !p.is_published } : p));
            showToast(`Path ${!path.is_published ? 'published' : 'unpublished'}`, 'success');
        } catch (err) {
            showToast('Failed to update status', 'error');
        }
    };

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Learning Paths
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Create and manage structured curriculums for students.
                    </p>
                </div>
                <Link to="/content/paths/new">
                    <Button className="bg-primary hover:bg-primary/90 text-white">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Create New Path
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
                </div>
            ) : paths.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="mx-auto h-12 w-12 text-slate-400">
                        <PlusIcon />
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No paths</h3>
                    <p className="mt-1 text-sm text-slate-500">Get started by creating a new learning path.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {paths.map((path) => (
                        <Card key={path.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    <Badge variant={path.is_published ? 'success' : 'secondary'}>
                                        {path.is_published ? 'Published' : 'Draft'}
                                    </Badge>
                                </CardTitle>
                                <span className="text-xs text-slate-500 font-mono uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                    {path.speaking_language} → {path.target_language}
                                </span>
                            </CardHeader>
                            <CardContent>
                                <div className="mt-2 mb-4">
                                    <div className="text-lg font-bold truncate">{path.title}</div>
                                    <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                                        {path.description || "No description provided."}
                                    </p>
                                </div>
                                <div className="text-xs text-slate-400 mb-4">
                                    Created {format(new Date(path.created_at), 'PPP')}
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => togglePublish(path)}
                                        title={path.is_published ? "Unpublish" : "Publish"}
                                    >
                                        {path.is_published ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                    </Button>
                                    <Link to={`/content/paths/${path.id}/build`}>
                                        <Button variant="outline" size="sm">
                                            <PencilSquareIcon className="h-4 w-4 mr-2" />
                                            Edit
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        onClick={() => handleDelete(path.id)}
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
