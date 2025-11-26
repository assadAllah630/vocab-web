import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { UserCircleIcon, MapPinIcon, UserPlusIcon, UserMinusIcon, ArrowPathIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useExam } from '../context/ExamContext';

function PublicProfile() {
    const { username } = useParams();
    const navigate = useNavigate();
    const { startExam } = useExam();

    const [profile, setProfile] = useState(null);
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        fetchProfile();
        fetchExams();
    }, [username]);

    const fetchProfile = async () => {
        try {
            const res = await api.get(`users/public/?username=${username}`);
            setProfile(res.data);
            setFollowing(res.data.is_following);
        } catch (err) {
            console.error("Failed to fetch profile:", err);
            if (err.response && err.response.status === 404) {
                alert("User not found");
                navigate('/');
            }
        }
    };

    const fetchExams = async () => {
        try {
            const res = await api.get(`exams/public_user_exams/?username=${username}`);
            const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setExams(data);
        } catch (err) {
            console.error("Failed to fetch exams:", err);
            setExams([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        setFollowLoading(true);
        try {
            const action = following ? 'unfollow' : 'follow';
            await api.post('users/follow/', { username, action });
            setFollowing(!following);
            // Update follower count locally
            setProfile(prev => ({
                ...prev,
                followers_count: prev.followers_count + (following ? -1 : 1)
            }));
        } catch (err) {
            console.error("Failed to follow/unfollow:", err);
        } finally {
            setFollowLoading(false);
        }
    };

    const handleRetake = (exam) => {
        if (window.confirm(`Do you want to take this exam: "${exam.topic}"?`)) {
            startExam({
                ...exam,
                title: exam.topic,
                description: `Created by ${profile.username} (${exam.difficulty})`,
                sections: exam.questions
            }, exam.questions.length * 20); // 20s per question
            navigate('/exams');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
            {/* Profile Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
                <div className="flex flex-col md:flex-row items-start gap-8">
                    {/* Avatar */}
                    <div className="h-32 w-32 rounded-full bg-slate-100 overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                        {profile.avatar ? (
                            <img
                                src={profile.avatar}
                                alt={profile.username}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-primary-100 text-4xl text-primary-600 font-bold">
                                {profile.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-1">{profile.username}</h2>
                                <p className="text-slate-500 mb-4">
                                    Learning {profile.target_language === 'de' ? 'German' : profile.target_language}
                                </p>
                            </div>
                            <button
                                onClick={handleFollow}
                                disabled={followLoading}
                                className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full transition-all transform active:scale-95 ${following
                                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                    : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/30'
                                    }`}
                            >
                                {followLoading ? (
                                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                ) : following ? (
                                    <>
                                        <UserMinusIcon className="w-5 h-5" />
                                        Unfollow
                                    </>
                                ) : (
                                    <>
                                        <UserPlusIcon className="w-5 h-5" />
                                        Follow
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="space-y-4">
                            {profile.bio && (
                                <p className="text-slate-700 leading-relaxed max-w-2xl">
                                    {profile.bio}
                                </p>
                            )}

                            <div className="flex flex-wrap gap-6 text-sm text-slate-600">
                                {profile.location && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPinIcon className="w-4 h-4 text-slate-400" />
                                        {profile.location}
                                    </div>
                                )}
                                <div className="flex items-center gap-4">
                                    <div><span className="font-bold text-slate-900">{profile.followers_count}</span> Followers</div>
                                    <div><span className="font-bold text-slate-900">{profile.following_count}</span> Following</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Public Exams */}
            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6">Public Exams</h3>

                {exams.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        <p className="text-slate-500">No public exams shared yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {exams.map(exam => (
                            <div key={exam.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${exam.difficulty === 'A1' || exam.difficulty === 'A2' ? 'bg-green-100 text-green-700' :
                                                exam.difficulty === 'B1' || exam.difficulty === 'B2' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {exam.difficulty}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {new Date(exam.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                                            {exam.topic}
                                        </h3>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                                    <div className="text-sm text-slate-500">
                                        {exam.questions.length} Questions
                                    </div>
                                    <button
                                        onClick={() => handleRetake(exam)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                                    >
                                        <PlayIcon className="w-4 h-4" />
                                        Take Exam
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PublicProfile;
