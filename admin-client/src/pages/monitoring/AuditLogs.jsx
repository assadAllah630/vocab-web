/**
 * Audit Logs Page - Upgraded with shadcn/ui
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../api';
import { motion } from 'framer-motion';
import { DataTable } from '../../components/common/DataTable';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/Select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "../../components/ui/Sheet";
import { ShieldAlert, Search, RefreshCw, AlertCircle, FileText, Calendar as CalendarIcon } from 'lucide-react';
import { fadeIn } from '../../utils/animations';
import { format, subDays } from 'date-fns';

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [filters, setFilters] = useState({ action: 'all', username: '' });
    const [dateRange, setDateRange] = useState({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    // Details Sheet
    const [selectedLog, setSelectedLog] = useState(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const { showToast } = useToast();

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('adminToken');

            if (!token) throw new Error('Not authenticated');

            const params = new URLSearchParams();
            if (filters.action && filters.action !== 'all') params.append('action', filters.action);
            if (filters.username) params.append('username', filters.username);

            // Add date range params if backend supports them (assuming it does or will)
            if (dateRange?.from) params.append('start_date', dateRange.from.toISOString());
            if (dateRange?.to) params.append('end_date', dateRange.to.toISOString());

            const response = await api.get(`/api/admin/audit-logs/?${params.toString()}`);

            const data = response.data.results || response.data || [];
            setLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
            setError('Failed to load audit logs');
            showToast('Failed to load audit logs', 'error');
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [filters, dateRange, showToast]);

    useEffect(() => {
        // Debounce filter changes
        const timer = setTimeout(() => {
            fetchLogs();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchLogs]);

    const handleRowClick = (log) => {
        setSelectedLog(log);
        setIsSheetOpen(true);
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
            header: 'Admin',
            accessorKey: 'admin',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {row.original.admin.substring(0, 1).toUpperCase()}
                    </div>
                    <span className="font-medium text-foreground">{row.original.admin}</span>
                </div>
            )
        },
        {
            header: 'Action',
            accessorKey: 'action',
            cell: ({ row }) => {
                const action = row.original.action.toLowerCase();
                let variant = 'secondary';
                if (action.includes('delete')) variant = 'destructive';
                if (action.includes('create') || action.includes('add')) variant = 'success';
                if (action.includes('update') || action.includes('edit')) variant = 'warning';

                return (
                    <Badge variant={variant} className="font-mono text-xs uppercase tracking-wider">
                        {row.original.action}
                    </Badge>
                );
            }
        },
        {
            header: 'Resource',
            accessorKey: 'resource_type',
            cell: ({ row }) => <span className="text-foreground">{row.original.resource_type}</span>
        },
        {
            header: 'IP Address',
            accessorKey: 'ip_address',
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                    {row.original.ip_address}
                </span>
            )
        },
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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Logs</h1>
                    <p className="mt-1 text-muted-foreground">
                        Track administrative actions and system modifications.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchLogs}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <Card className="bg-muted/30 border-dashed">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                placeholder="Filter by Admin..."
                                value={filters.username}
                                onChange={(e) => setFilters({ ...filters, username: e.target.value })}
                                className="pl-8 h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>

                        {/* Action Select */}
                        <div className="w-[200px]">
                            <Select
                                value={filters.action}
                                onValueChange={(val) => setFilters({ ...filters, action: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter Action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actions</SelectItem>
                                    <SelectItem value="create">Create</SelectItem>
                                    <SelectItem value="update">Update</SelectItem>
                                    <SelectItem value="delete">Delete</SelectItem>
                                    <SelectItem value="login">Login</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Range Picker */}
                        <DateRangePicker
                            date={dateRange}
                            setDate={setDateRange}
                            className="w-[300px]"
                        />
                    </div>
                </CardContent>
            </Card>

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
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive mb-4">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">Failed to load logs</h3>
                            <p className="text-muted-foreground mt-1 mb-4">{error}</p>
                            <Button onClick={fetchLogs} variant="outline">Try Again</Button>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                                <FileText className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">No logs found</h3>
                            <p className="text-muted-foreground mt-1">
                                No actions match your current filters.
                            </p>
                        </div>
                    ) : (
                        <DataTable
                            data={logs}
                            columns={columns}
                            onRowClick={handleRowClick}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Details Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                        <SheetTitle>Audit Log Details</SheetTitle>
                        <SheetDescription>
                            Detailed information about this action.
                        </SheetDescription>
                    </SheetHeader>
                    {selectedLog && (
                        <div className="mt-6 space-y-6">
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground">Timestamp</h4>
                                <p className="text-base font-mono">
                                    {format(new Date(selectedLog.timestamp), 'PPP pp')}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground">Admin</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                            {selectedLog.admin.substring(0, 1).toUpperCase()}
                                        </div>
                                        <span className="font-medium">{selectedLog.admin}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground">IP Address</h4>
                                    <p className="font-mono text-sm">{selectedLog.ip_address}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground">Action</h4>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{selectedLog.action}</Badge>
                                    <span className="text-sm text-muted-foreground">on</span>
                                    <Badge variant="secondary">{selectedLog.resource_type}</Badge>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground">Details</h4>
                                <div className="bg-muted/50 p-4 rounded-lg border text-sm font-mono whitespace-pre-wrap">
                                    {selectedLog.details || "No additional details provided."}
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </motion.div>
    );
}
