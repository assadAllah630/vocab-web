import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, Calculator, User, CreditCard, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';

const CommandPalette = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = (command) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm transition-all">
            <Command className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <Command.Input
                        placeholder="Type a command or search..."
                        className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-50"
                    />
                </div>
                <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
                    <Command.Empty className="py-6 text-center text-sm text-slate-500">No results found.</Command.Empty>

                    <Command.Group heading="Pages" className="px-2 py-1.5 text-xs font-medium text-slate-500">
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/'))}
                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50"
                        >
                            <Calculator className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/users'))}
                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50"
                        >
                            <User className="mr-2 h-4 w-4" />
                            <span>Users</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/settings'))}
                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50"
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </Command.Item>
                    </Command.Group>

                    <Command.Group heading="Actions" className="px-2 py-1.5 text-xs font-medium text-slate-500">
                        <Command.Item
                            onSelect={() => runCommand(() => console.log('Logout'))}
                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Logout</span>
                        </Command.Item>
                    </Command.Group>
                </Command.List>
                <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2 text-xs text-slate-500">
                    Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900">ESC</kbd> to close
                </div>
            </Command>
        </div>
    );
};

export { CommandPalette };
