import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import MobileStoryDisplay from '../../components/mobile/MobileStoryDisplay';
import api from '../../api';

/**
 * Mobile story viewer - displays saved story content
 */
const MobileStoryViewer = () => {
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
                console.error('Error fetching story:', err);
                setError('Failed to load story');
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [id]);

    // Polling for pending images
    useEffect(() => {
        let pollInterval;

        // If content is loaded and has pending images (or we suspect checks needed)
        if (content && content.has_images) {

            // Function to check status
            const checkStatus = async () => {
                try {
                    const res = await api.get(`ai/generated-content/${id}/images/status/`);
                    if (res.data.status !== 'none' && res.data.content) {
                        setContent(prev => ({
                            ...prev,
                            content_data: res.data.content
                        }));
                    } else if (res.data.status === 'none') {
                        // All done, stop polling
                        clearInterval(pollInterval);
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            };

            // Start polling if we see any pending items in current state
            const hasPending = content.content_data.events?.some(e => e.image_status === 'pending' || e.image_status === 'generating');

            if (hasPending) {
                console.log("Found pending images, starting polling...");
                pollInterval = setInterval(checkStatus, 3000);
            }
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [content, id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[#71717A] text-sm">Loading story...</p>
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
            {/* Header */}
            <div className="sticky top-0 z-50 px-4 py-3 bg-[#09090B]/95 backdrop-blur border-b border-[#27272A]">
                <button
                    onClick={() => navigate('/m/ai/library')}
                    className="flex items-center gap-2 text-[#A1A1AA] hover:text-white transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span className="text-sm">Back to Library</span>
                </button>
            </div>

            {/* Story Display */}
            <MobileStoryDisplay
                content={content?.content_data}
                title={content?.content_data?.title}
                level={content?.parameters?.level}
            />
        </div>
    );
};

export default MobileStoryViewer;
