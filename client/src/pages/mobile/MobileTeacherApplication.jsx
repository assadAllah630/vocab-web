import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Video, Globe, BookOpen, User, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../api';

const MobileTeacherApplication = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        resume_link: '',
        intro_video_link: '',
        experience_years: 0,
        teaching_languages: '', // Comma separated for MVP
        bio: ''
    });

    useEffect(() => {
        checkExistingApplication();
    }, []);

    const checkExistingApplication = async () => {
        try {
            // First check if user is already an approved teacher
            const statusRes = await api.get('/teachers/status/');
            const status = statusRes.data;

            if (status.is_teacher && status.has_approved_application) {
                // Already an approved teacher - go to dashboard
                navigate('/m/teacher/dashboard', { replace: true });
                return;
            }

            if (status.application_status === 'pending') {
                // Has pending application - go to status page
                navigate('/m/teach/status', { replace: true });
                return;
            }

            // No approved application - check for any existing application
            const { data } = await api.get('/teachers/application/');
            if (data && data.status && data.status !== 'none') {
                navigate('/m/teach/status', { replace: true });
            }
        } catch (err) {
            // 403 might mean session not yet established, ignore and show form
            console.log("No existing application found or auth pending");
        } finally {
            setCheckingStatus(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                teaching_languages: formData.teaching_languages.split(',').map(l => l.trim()).filter(l => l),
                experience_years: parseInt(formData.experience_years) || 0
            };

            await api.post('/teachers/apply/', payload);
            navigate('/m/teach/status');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "Failed to submit application. Please check your inputs.");
        } finally {
            setLoading(false);
        }
    };

    if (checkingStatus) return <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#09090B] pb-24 text-white">
            {/* Header */}
            <div className="flex items-center gap-4 p-5 sticky top-0 bg-[#09090B]/95 backdrop-blur z-10 border-b border-[#27272A]">
                <button onClick={() => navigate('/m/teach')} className="p-2 -ml-2 rounded-full hover:bg-[#27272A]">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="font-bold text-lg">Teacher Application</h1>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-6">

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <div className="bg-[#1C1C1F] border border-[#27272A] rounded-xl p-5 space-y-5">
                    <h2 className="font-bold text-gray-300 mb-2">Basic Info</h2>

                    <InputGroup
                        icon={Globe}
                        label="Languages you can teach"
                        placeholder="English, German, Spanish..."
                        value={formData.teaching_languages}
                        onChange={e => setFormData({ ...formData, teaching_languages: e.target.value })}
                        hint="Separate with commas"
                    />

                    <InputGroup
                        icon={BookOpen}
                        label="Years of Experience"
                        placeholder="e.g. 5"
                        type="number"
                        value={formData.experience_years}
                        onChange={e => setFormData({ ...formData, experience_years: e.target.value })}
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <User size={16} /> Bio & Motivation
                        </label>
                        <textarea
                            className="w-full bg-[#27272A] border border-[#3F3F46] rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 h-32 resize-none"
                            placeholder="Tell us about yourself and why you want to teach..."
                            value={formData.bio}
                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="bg-[#1C1C1F] border border-[#27272A] rounded-xl p-5 space-y-5">
                    <h2 className="font-bold text-gray-300 mb-2">Qualifications</h2>

                    <InputGroup
                        icon={Upload}
                        label="Resume / CV Link"
                        placeholder="https://drive.google.com/..."
                        value={formData.resume_link}
                        onChange={e => setFormData({ ...formData, resume_link: e.target.value })}
                        hint="Link to a public Google Drive or LinkedIn profile"
                        type="url"
                    />

                    <InputGroup
                        icon={Video}
                        label="Intro Video Link"
                        placeholder="https://youtube.com/..."
                        value={formData.intro_video_link}
                        onChange={e => setFormData({ ...formData, intro_video_link: e.target.value })}
                        hint="A short 1-2 minute video introducing yourself"
                        type="url"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                >
                    {loading ? 'Submitting...' : 'Submit Application'}
                </button>

            </form>
        </div>
    );
};

const InputGroup = ({ icon: Icon, label, hint, ...props }) => (
    <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Icon size={16} /> {label}
        </label>
        <input
            className="w-full bg-[#27272A] border border-[#3F3F46] rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            required
            {...props}
        />
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
);

export default MobileTeacherApplication;
