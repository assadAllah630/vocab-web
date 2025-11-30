import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useToast } from '../../components/ui/Toast';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '../../components/ui/DropdownMenu';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../../components/ui/Select';
import {
    Search, Filter, MoreHorizontal, Trash2, BookOpen, ArrowUpDown, Download
} from 'lucide-react';

export default function VocabularyList() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [languageFilter, setLanguageFilter] = useState('all');

    const { showToast } = useToast();

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('http://localhost:8000/api/admin/content/vocabulary/', {
                headers: { Authorization: `Token ${token}` }
            });
            // Handle both array and paginated results
            const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
            setItems(data);
        } catch (err) {
            console.error('Failed to fetch vocabulary:', err);
            showToast('Failed to load vocabulary', 'error');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this word?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            await axios.delete(`http://localhost:8000/api/admin/content/vocabulary/${id}/`, {
                headers: { Authorization: `Token ${token}` }
            });
            showToast('Word deleted successfully', 'success');
            fetchItems();
        } catch (err) {
            showToast('Failed to delete word', 'error');
        }
    };

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredAndSortedItems = useMemo(() => {
        let result = [...items];

        // Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.word.toLowerCase().includes(query) ||
                item.translation.toLowerCase().includes(query)
            );
        }

        if (languageFilter !== 'all') {
            result = result.filter(item => item.language === languageFilter);
        }

        // Sort
        result.sort((a, b) => {
            if (sortConfig.key === 'created_at') {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
            }

            const valA = String(a[sortConfig.key] || '').toLowerCase();
            const valB = String(b[sortConfig.key] || '').toLowerCase();
            return sortConfig.direction === 'asc'
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        });

        return result;
    }, [items, searchQuery, languageFilter, sortConfig]);

    // Extract unique languages for filter
    const languages = useMemo(() => {
        const langs = new Set(items.map(item => item.language).filter(Boolean));
        return Array.from(langs).sort();
    }, [items]);

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Vocabulary
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Manage vocabulary words added by users.
                    </p>
                </div>
                <Button variant="outline" className="bg-white dark:bg-slate-900">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search words..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select value={languageFilter} onValueChange={setLanguageFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Languages</SelectItem>
                            {languages.map(lang => (
                                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Data Table */}
            <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px] cursor-pointer" onClick={() => handleSort('word')}>
                                <div className="flex items-center gap-1">
                                    Word
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('translation')}>
                                <div className="flex items-center gap-1">
                                    Translation
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead>Language</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                                <div className="flex items-center gap-1">
                                    Created
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredAndSortedItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                    No vocabulary found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedItems.map((item) => (
                                <TableRow key={item.id} className="group">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <BookOpen className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-white">
                                                {item.word}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-slate-600 dark:text-slate-300">
                                            {item.translation}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900">
                                            {item.language}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-slate-500 dark:text-slate-400">
                                            {typeof item.user === 'object' ? item.user?.username : `User #${item.user}`}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-slate-500 dark:text-slate-400">
                                            {format(new Date(item.created_at), 'MMM d, yyyy')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.word)}>
                                                    Copy Word
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(item.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete Word
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
