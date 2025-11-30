/**
 * Grammar Topics Management Page
 * @module GrammarList
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../api';
import { motion } from 'framer-motion';
import { DataTable } from '../../components/common/DataTable';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { Book, RefreshCw, AlertCircle, Edit2 } from 'lucide-react';
import { fadeIn } from '../../utils/animations';

/**
 * @typedef {Object} GrammarTopic
 * @property {number} id
 * @property {string} title
 * @property {string} level
 * @property {Array} points
 */

export default function GrammarList() {
    const [items, setItems] = useState(/** @type {GrammarTopic[]} */([]));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { showToast } = useToast();

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('adminToken');

            if (!token) throw new Error('Not authenticated');

            const response = await api.get('/api/admin/content/grammar/');

            const data = response.data.results || response.data || [];
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch grammar topics:', err);
            setError('Failed to load grammar topics');
            showToast('Failed to load grammar topics', 'error');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const columns = useMemo(() => [
        {
            header: 'Title',
            accessorKey: 'title',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        <Book className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-foreground">{row.original.title}</span>
                </div>
            )
        },
        {
            header: 'Level',
            accessorKey: 'level',
            cell: ({ row }) => {
                const level = row.original.level;
                let variant = 'secondary';
                if (['A1', 'A2'].includes(level)) variant = 'success';
                if (['B1', 'B2'].includes(level)) variant = 'warning';
                if (['C1', 'C2'].includes(level)) variant = 'destructive';

                return (
                    <Badge variant={variant} className="font-mono">
                        {level}
                    </Badge>
                );
            }
        },
        {
            header: 'Points',
            accessorKey: 'points',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.points?.length || 0} key points
                </span>
            )
        },
        {
            header: 'Actions',
            id: 'actions',
            cell: ({ row }) => (
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                </Button>
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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Grammar Topics</h1>
                    <p className="mt-1 text-muted-foreground">
                        Manage grammar lessons and explanations.
                    </p>
                </div>
                <Button variant="outline" size="icon" onClick={fetchItems}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
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
                            <h3 className="text-lg font-medium text-foreground">Failed to load topics</h3>
                            <p className="text-muted-foreground mt-1 mb-4">{error}</p>
                            <Button onClick={fetchItems} variant="outline">Try Again</Button>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                                <Book className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">No grammar topics found</h3>
                            <p className="text-muted-foreground mt-1">
                                Add topics to start building the curriculum.
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
        </motion.div>
    );
}
