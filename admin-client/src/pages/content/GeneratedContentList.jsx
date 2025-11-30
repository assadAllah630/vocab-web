/**
 * Generated Content Management Page
 * @module GeneratedContentList
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { DataTable } from '../../components/common/DataTable';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { FileText, RefreshCw, AlertCircle, Eye, Trash2, X, Search } from 'lucide-react';
import { fadeIn } from '../../utils/animations';
import { format } from 'date-fns';

/**
 * @typedef {Object} GeneratedContent
 * @property {number} id
 * @property {string} title
 * @property {string} content_type
 * @property {Object} content
 * @property {string} created_at
 * @property {string} user
 */

export default function GeneratedContentList() {
    const [items, setItems] = useState(/** @type {GeneratedContent[]} */([]));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);

    const { showToast } = useToast();

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('adminToken');

            if (!token) throw new Error('Not authenticated');

            const response = await axios.get('http://localhost:8000/api/admin/content/generated/', {
                params: { search },
                headers: { Authorization: `Token ${token}` }
            });

            const data = response.data.results || response.data || [];
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch content:', err);
            setError('Failed to load generated content');
            showToast('Failed to load generated content', 'error');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [search, showToast]);

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchItems();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchItems]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this content?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            await axios.delete(`http://localhost:8000/api/admin/content/generated/${id}/`, {
                headers: { Authorization: `Token ${token}` }
            });

            showToast('Content deleted successfully', 'success');
            fetchItems();
            if (selectedItem?.id === id) setSelectedItem(null);
        } catch (err) {
            showToast('Failed to delete content', 'error');
        }
    };

    const columns = useMemo(() => [
        {
            header: 'Title',
            accessorKey: 'title',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        <FileText className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-foreground">{row.original.title}</span>
                </div>
            )
        },
        {
            header: 'Type',
            accessorKey: 'content_type',
            cell: ({ row }) => (
                <Badge variant="secondary" className="font-mono text-xs uppercase">
                    {row.original.content_type}
                </Badge>
            )
        },
        {
            header: 'User',
            accessorKey: 'user',
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.user || 'System'}</span>
        },
        {
            header: 'Created',
            accessorKey: 'created_at',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {format(new Date(row.original.created_at), 'MMM d, yyyy')}
                </span>
            )
        },
        {
            header: 'Actions',
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedItem(row.original)}
                        className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(row.original.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )
        }
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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Generated Content</h1>
                    <p className="mt-1 text-muted-foreground">
                        Review and manage AI-generated stories and articles.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            placeholder="Search content..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchItems}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden border-border shadow-soft-md">
                <CardContent className="p-0">
                    {loading && items.length === 0 ? (
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
                            <h3 className="text-lg font-medium text-foreground">Failed to load content</h3>
                            <p className="text-muted-foreground mt-1 mb-4">{error}</p>
                            <Button onClick={fetchItems} variant="outline">Try Again</Button>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                                <FileText className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">No content found</h3>
                            <p className="text-muted-foreground mt-1">
                                Generated content will appear here.
                            </p>
                        </div>
                    ) : (
                        <DataTable
                            data={items}
                            columns={columns}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Preview Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-border">
                                <h3 className="text-lg font-semibold text-foreground">{selectedItem.title}</h3>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedItem(null)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1">
                                <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-mono bg-muted/30 p-4 rounded-lg border border-border">
                                    {JSON.stringify(selectedItem.content, null, 2)}
                                </pre>
                            </div>
                            <div className="p-6 border-t border-border bg-muted/10 flex justify-end">
                                <Button onClick={() => setSelectedItem(null)}>
                                    Close Preview
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
