import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, ChevronLeft, AlertCircle } from 'lucide-react';
import api from '../../api';

const MobileTeacherStatus = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    const [application, setApplication] = useState(null);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const { data } = await api.get('/teachers/application/');
            if (data.status && data.status !== 'none') {
                setStatus(data.status);
                setApplication(data);
            } else {
                // No valid application found, redirect to apply
                navigate('/m/teach/apply');
            }
        } catch (err) {
            console.error(err);
            // If 404, it means no application
            if (err.response && err.response.status === 404) {
                navigate('/m/teach');
            } else {
                setStatus('error');
            }
        }
    };

    if (status === 'loading') return <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-white">Loading status...</div>;
    // Removed 'none' check from here

    return (
        <div className="min-h-screen bg-[#09090B] p-6 flex flex-col items-center justify-center text-center text-white">

            <Content status={status} application={application} navigate={navigate} />

            <button
                onClick={() => navigate('/m')}
                className="mt-12 text-gray-500 text-sm flex items-center gap-2 hover:text-white transition-colors"
            >
                <ChevronLeft size={16} /> Back to Home
            </button>
        </div>
    );
};

const Content = ({ status, application, navigate }) => {
    switch (status) {
        case 'pending':
            return (
                <div className="space-y-6 max-w-sm">
                    <div className="mx-auto w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 relative">
                        <Clock size={48} className="text-amber-500" />
                        <span className="absolute top-0 right-0 w-6 h-6 bg-amber-500 rounded-full animate-ping opacity-75"></span>
                    </div>
                    <h1 className="text-3xl font-bold">Application Under Review</h1>
                    <p className="text-gray-400">
                        Thank you for your interest in joining VocabMaster!
                        Our team is currently reviewing your profile and credentials.
                    </p>
                    <div className="bg-[#1C1C1F] p-4 rounded-xl border border-[#27272A] text-left text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Submitted:</span>
                            <span className="text-white">{new Date(application.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Resume:</span>
                            <a href={application.resume_link} target="_blank" className="text-indigo-400 hover:underline truncate w-32 text-right">View Link</a>
                        </div>
                    </div>
                </div>
            );

        case 'approved':
            return (
                <div className="space-y-6 max-w-sm">
                    <div className="mx-auto w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle size={48} className="text-green-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-green-400">Welcome Aboard! 🎉</h1>
                    <p className="text-gray-400">
                        Your application has been approved. You now have full access to teacher tools.
                    </p>
                    <button
                        onClick={() => {
                            // Force refresh or update context might be needed in real app
                            window.location.href = '/m/teacher/dashboard';
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                        Go to Teacher Command Center
                    </button>
                </div>
            );

        case 'rejected':
            return (
                <div className="space-y-6 max-w-sm">
                    <div className="mx-auto w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                        <XCircle size={48} className="text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-red-400">Application Status</h1>
                    <p className="text-gray-400">
                        Unfortunately, your application was not approved at this time.
                    </p>
                    {application.admin_feedback && (
                        <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl text-left">
                            <h3 className="text-xs font-bold text-red-500 uppercase mb-2">Feedback</h3>
                            <p className="text-sm text-gray-300">{application.admin_feedback}</p>
                        </div>
                    )}
                    <button
                        onClick={() => navigate('/m/teach/apply')}
                        className="w-full bg-[#27272A] border border-[#3F3F46] text-white py-3 rounded-xl transition-colors"
                    >
                        Review & Re-apply
                    </button>
                </div>
            );

        case 'error':
            return (
                <div className="space-y-6 max-w-sm">
                    <div className="mx-auto w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle size={48} className="text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-red-400">Connection Error</h1>
                    <p className="text-gray-400">
                        We couldn't fetch your application status. Please check your connection and try again.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-[#27272A] border border-[#3F3F46] text-white py-3 rounded-xl transition-colors hover:bg-[#3F3F46]"
                    >
                        Retry
                    </button>
                    <button
                        onClick={() => navigate('/m/teach')}
                        className="w-full text-gray-500 py-3 transition-colors hover:text-white"
                    >
                        Back to Teacher Home
                    </button>
                </div>
            );

        default:
            return <div>Unknown Status: {status}</div>;
    }
};

export default MobileTeacherStatus;
