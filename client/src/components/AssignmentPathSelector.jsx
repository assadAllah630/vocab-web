import React, { useState, useEffect } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import api from '../api';

const AssignmentPathSelector = ({ onSelect, selectedId }) => {
    const [paths, setPaths] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedPath, setExpandedPath] = useState(null);

    useEffect(() => {
        fetchPaths();
    }, []);

    const fetchPaths = async () => {
        try {
            const res = await api.get('paths/');
            setPaths(res.data);
            if (res.data.length > 0) {
                setExpandedPath(res.data[0].id); // Auto expand first one
            }
        } catch (err) {
            console.error("Failed to load paths:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="animate-pulse h-10 bg-[#27272A] rounded-xl" />;

    return (
        <div className="space-y-2">
            {paths.map(path => (
                <div key={path.id} className="border border-[#27272A] rounded-xl overflow-hidden">
                    <button
                        onClick={() => setExpandedPath(expandedPath === path.id ? null : path.id)}
                        className="w-full p-3 bg-[#1C1C1F] flex justify-between items-center text-sm font-bold text-white"
                    >
                        <span>{path.title}</span>
                        <ChevronRight
                            size={16}
                            className={`transition-transform ${expandedPath === path.id ? 'rotate-90' : ''}`}
                        />
                    </button>

                    {expandedPath === path.id && (
                        <div className="bg-[#141416] p-2 space-y-1">
                            {path.nodes?.map(node => (
                                <button
                                    key={node.id}
                                    onClick={() => onSelect(node)}
                                    className={`w-full p-2 rounded-lg flex items-center justify-between text-xs text-left ${selectedId === node.id
                                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                                            : 'hover:bg-[#27272A] text-gray-400'
                                        }`}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-bold">{node.title}</span>
                                        <span className="opacity-50">{node.node_type}</span>
                                    </div>
                                    {selectedId === node.id && <Check size={14} />}
                                </button>
                            ))}
                            {path.nodes?.length === 0 && (
                                <div className="p-2 text-center text-xs text-gray-600">No lessons in this unit.</div>
                            )}
                        </div>
                    )}
                </div>
            ))}

            {paths.length === 0 && (
                <div className="text-center p-4 text-sm text-gray-500">
                    No Learning Paths found. Create one in the curriculum editor first.
                </div>
            )}
        </div>
    );
};

export default AssignmentPathSelector;
