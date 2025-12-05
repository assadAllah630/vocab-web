import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import MobileArticleDisplay from '../../components/mobile/MobileArticleDisplay';
import api from '../../api';

const MobileArticleViewer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await api.get(`ai/generated-content/${id}/`);
                setContent(response.data);
            } catch (err) {
                console.error('Error fetching article:', err);
                setError('Failed to load article');
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[#71717A] text-sm">Loading article...</p>
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
                        className="px-4 py-2 bg-[#27272A] rounded-lg text-white"
                    >
                        Back to Library
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090B]">
            <div className="sticky top-0 z-50 px-4 py-3 bg-[#09090B]/95 backdrop-blur border-b border-[#27272A]">
                <button
                    onClick={() => navigate('/m/ai/library')}
                    className="flex items-center gap-2 text-[#A1A1AA] hover:text-white transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span className="text-sm">Back to Library</span>
                </button>
            </div>

            <MobileArticleDisplay
                content={content?.content_data}
                title={content?.content_data?.title}
                level={content?.parameters?.level}
            />
        </div>
    );
};

export default MobileArticleViewer;
