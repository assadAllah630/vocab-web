/**
 * Error Logs Page - Upgraded with shadcn/ui
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../../components/ui/Dialog";
import { Alert, AlertTitle, AlertDescription } from "../../components/ui/Alert";
import { AlertTriangle, RefreshCw, AlertCircle, CheckCircle2, Eye, Server, Bot } from 'lucide-react';
import { fadeIn } from '../../utils/animations';
import { format } from 'date-fns';

export default function ErrorLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Details Dialog
    const [selectedError, setSelectedError] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { showToast } = useToast();

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('adminToken');

            if (!token) throw new Error('Not authenticated');

            const response = await api.get('/api/admin/error-logs/');

            const data = response.data.results || response.data || [];
            setLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch error logs:', err);
            setError('Failed to load error logs');
            showToast('Failed to load error logs', 'error');
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleViewDetails = (errorLog) => {
        setSelectedError(errorLog);
        setIsDialogOpen(true);
    };

    const columns = useMemo(() => [
        {
            header: 'Timestamp',
            accessorKey: 'timestamp',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground font-mono">
                    {format(new Date(row.original.timestamp), 'MMM d, HH:mm:ss')}
                </span>
            )
        },
        {
            header: 'Source',
            accessorKey: 'source',
            cell: ({ row }) => {
                const source = row.original.source;
                return (
                    <Badge variant={source === 'AI API' ? 'secondary' : 'outline'} className="flex w-fit items-center gap-1">
                        {source === 'AI API' ? <Bot className="w-3 h-3" /> : <Server className="w-3 h-3" />}
                        {source}
                    </Badge>
                );
            }
        },
        {
            header: 'Error Message',
            accessorKey: 'error',
            cell: ({ row }) => (
                <div className="flex items-start gap-2 max-w-md group cursor-pointer" onClick={() => handleViewDetails(row.original)}>
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <span className="text-sm text-destructive font-medium break-words line-clamp-2 group-hover:underline">
                        {row.original.error}
                    </span>
                </div>
            )
        },
        {
            header: 'User',
            accessorKey: 'user',
            cell: ({ row }) => (
                <span className="text-sm text-foreground">
                    {row.original.user || 'System'}
                </span>
            )
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <Button variant="ghost" size="sm" onClick={() => handleViewDetails(row.original)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Details
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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Error Logs</h1>
                    <p className="mt-1 text-muted-foreground">
                        Monitor system failures and exceptions.
                    </p>
                </div>
                <Button variant="outline" size="icon" onClick={fetchLogs}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <Card className="overflow-hidden border-border shadow-soft-md">
                <CardContent className="p-0">
                    {loading && logs.length === 0 ? (
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
                            <Alert variant="destructive" className="max-w-md mx-auto">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                            <Button onClick={fetchLogs} variant="outline" className="mt-4">Try Again</Button>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">No errors found</h3>
                            <p className="text-muted-foreground mt-1">
                                The system is running smoothly.
                            </p>
                        </div>
                    ) : (
                        <DataTable
                            data={logs}
                            columns={columns}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Error Details Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            Error Details
                        </DialogTitle>
                        <DialogDescription>
                            Occurred on {selectedError && format(new Date(selectedError.timestamp), 'PPP pp')}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedError && (
                        <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground">Source</h4>
                                    <Badge variant="outline">{selectedError.source}</Badge>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground">User</h4>
                                    <p className="text-sm font-medium">{selectedError.user}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground">Action</h4>
                                <p className="text-sm font-mono bg-muted p-2 rounded">{selectedError.action}</p>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground">Error Message</h4>
                                <Alert variant="destructive">
                                    <AlertDescription className="font-mono text-xs break-all">
                                        {selectedError.error}
                                    </AlertDescription>
                                </Alert>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground">Technical Details</h4>
                                <div className="bg-slate-950 text-slate-50 p-4 rounded-lg text-xs font-mono overflow-auto max-h-[200px] whitespace-pre-wrap">
                                    {selectedError.details || "No technical details available."}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
