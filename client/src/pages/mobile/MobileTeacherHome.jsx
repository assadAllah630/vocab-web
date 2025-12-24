import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
    Plus, Users, BookOpen, ChevronRight, School,
    CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import {
    checkTeacherStatus,
    becomeTeacher,
    getMyClassrooms
} from '../../api';

const MobileTeacherHome = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isTeacher, setIsTeacher] = useState(false);
    const [teacherProfile, setTeacherProfile] = useState(null);
    const [classrooms, setClassrooms] = useState([]);
    const [checkingStatus, setCheckingStatus] = useState(false);

    // Form state for becoming a teacher
    const [organization, setOrganization] = useState('');
    const [subjects, setSubjects] = useState('');
    const [bio, setBio] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const statusRes = await checkTeacherStatus();
            setIsTeacher(statusRes.data.is_teacher);

            if (statusRes.data.is_teacher) {
                setTeacherProfile(statusRes.data.profile);
                const classroomsRes = await getMyClassrooms();
                setClassrooms(classroomsRes.data);
            }
        } catch (err) {
            console.error('Failed to load teacher data:', err);
            setError('Failed to load profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBecomeTeacher = async (e) => {
        e.preventDefault();
        if (!organization || !subjects) {
            setError('Please fill in organization and subjects.');
            return;
        }

        try {
            setSubmitting(true);
            setError('');
            await becomeTeacher({
                organization_name: organization,
                subjects,
                bio
            });

            // Reload to get teacher status
            await loadData();
        } catch (err) {
            console.error('Failed to become teacher:', err);
            setError('Failed to create teacher profile. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-900">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    // NON-TEACHER VIEW: SHOW SIGNUP FORM
    if (!isTeacher) {
        return (
            <div className="min-h-screen bg-slate-900 text-white p-4 pb-20">
                <div className="max-w-md mx-auto">
                    <div className="mb-8 text-center mt-8">
                        <div className="bg-indigo-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <School className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Become a Teacher</h1>
                        <p className="text-slate-400">
                            Create classrooms, invite students, and track their progress with AI insights.
                        </p>
                    </div>

                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                        <form onSubmit={handleBecomeTeacher} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Organization / School Name *
                                </label>
                                <input
                                    type="text"
                                    value={organization}
                                    onChange={(e) => setOrganization(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="e.g. Berlin Language Center"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Subjects *
                                </label>
                                <input
                                    type="text"
                                    value={subjects}
                                    onChange={(e) => setSubjects(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="e.g. German A1, Business English"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Bio / Introduction (Optional)
                                </label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors h-24 resize-none"
                                    placeholder="Tell students about yourself..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-6"
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Create Profile</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // TEACHER VIEW: DASHBOARD -> Redirect to new Dashboard
    if (isTeacher) {
        return <Navigate to="/m/dashboard" replace />;
    }

    return null;
};

export default MobileTeacherHome;
