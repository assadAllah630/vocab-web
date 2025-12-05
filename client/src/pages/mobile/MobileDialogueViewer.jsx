import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import MobileDialogueDisplay from '../../components/mobile/MobileDialogueDisplay';
import api from '../../api';

/**
 * Mobile viewer for saved dialogues
 * Uses the shared MobileDialogueDisplay component
 */
const MobileDialogueViewer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchContent();
    }, [id]);

    const fetchContent = async () => {
        try {
            const res = await api.get(`ai/generated-content/${id}/`);
            setContent(res.data);
        } catch (err) {
            console.error('Failed to fetch content', err);
            setError('Failed to load dialogue');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
                <div className="text-center">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 text-[#6366F1] mx-auto animate-pulse" />
                    <p className="text-[#A1A1AA] mt-4">Loading dialogue...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/m/ai/library')}
                        className="px-4 py-2 bg-[#6366F1] text-white rounded-lg"
                    >
                        Back to Library
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090B] pb-24">
            {/* Back Header */}
            <div className="sticky top-0 z-10 bg-[#09090B]/95 backdrop-blur px-4 py-3 flex items-center gap-3 border-b border-[#27272A]">
                <button
                    onClick={() => navigate('/m/ai/library')}
                    className="p-2 -ml-2 rounded-full hover:bg-white/5"
                >
                    <ChevronLeftIcon className="w-6 h-6 text-[#A1A1AA]" />
                </button>
                <span className="text-[#71717A] text-sm">Back to Library</span>
            </div>

            {/* Shared Dialogue Display Component */}
            <MobileDialogueDisplay
                content={content?.content_data}
                title={content?.title}
                level={content?.level}
                tone={content?.content_data?.tone || 'Neutral'}
                showSequential={false} // Show all messages at once
            />
        </div>
    );
};

export default MobileDialogueViewer;
