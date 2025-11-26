import React, { useEffect, useState } from 'react';
import api from '../api';
import { UserCircleIcon, MapPinIcon, PencilIcon, CheckIcon, XMarkIcon, KeyIcon, LockClosedIcon } from '@heroicons/react/24/outline';

function Profile({ user, setUser }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        bio: '',
        location: '',
        avatar: null,
        native_language: 'en',
        target_language: 'de'
    });
    const [previewAvatar, setPreviewAvatar] = useState(null);
    const [stats, setStats] = useState({
        followers: 0,
        following: 0,
        total_words: 0
    });

    // Password management state
    const [hasPassword, setHasPassword] = useState(false);
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        fetchProfileData();
        fetchHistory();
        checkPasswordStatus();
    }, []);

    const checkPasswordStatus = async () => {
        try {
            const res = await api.get('auth/password-status/');
            setHasPassword(res.data.has_password);
        } catch (err) {
            console.error("Failed to check password status:", err);
        }
    };

    const fetchProfileData = async () => {
        try {
            const res = await api.get('users/me/');
            setProfileData({
                bio: res.data.bio || '',
                location: res.data.location || '',
                native_language: res.data.native_language || 'en',
                target_language: res.data.target_language || 'de',
                avatar: res.data.avatar
            });
            setStats({
                followers: res.data.followers_count || 0,
                following: res.data.following_count || 0,
                total_words: 0 // Fetch real count if needed
            });
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get('quiz/');
            const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setHistory(data);
        } catch (err) {
            console.error(err);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        const formData = new FormData();
        formData.append('bio', profileData.bio);
        formData.append('location', profileData.location);
        formData.append('native_language', profileData.native_language);
        formData.append('target_language', profileData.target_language);

        if (profileData.avatar instanceof File) {
            formData.append('avatar', profileData.avatar);
        }

        try {
            // Use specific endpoint for multipart update if needed, or generic user update
            // Assuming we updated the UserProfileViewSet to handle this
            const res = await api.patch(`users/${user.profile_id || 'me'}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setIsEditing(false);
            // Refresh user context if needed
            // setUser({...user, ...res.data}); 
            fetchProfileData();
        } catch (err) {
            console.error("Failed to save profile:", err);
            alert("Failed to save profile changes.");
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileData({ ...profileData, avatar: file });
            setPreviewAvatar(URL.createObjectURL(file));
        }
    };

    const handlePasswordSubmit = async () => {
        setPasswordError('');
        setPasswordSuccess('');

        try {
            const endpoint = hasPassword ? 'auth/change-password/' : 'auth/set-password/';
            const res = await api.post(endpoint, passwordData);

            setPasswordSuccess(res.data.message);
            setPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
            setShowPasswordSection(false);

            // Update password status
            if (!hasPassword) {
                setHasPassword(true);
            }
        } catch (err) {
            if (err.response?.data?.error) {
                setPasswordError(err.response.data.error);
                if (err.response.data.details) {
                    setPasswordError(err.response.data.error + ': ' + err.response.data.details.join(', '));
                }
            } else {
                setPasswordError('Failed to update password. Please try again.');
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
            {/* Profile Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
                <div className="flex flex-col md:flex-row items-start gap-8">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="h-32 w-32 rounded-full bg-slate-100 overflow-hidden border-4 border-white shadow-lg">
                            {previewAvatar || profileData.avatar ? (
                                <img
                                    src={previewAvatar || profileData.avatar}
                                    alt={user.username}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary-100 text-4xl text-primary-600 font-bold">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        {isEditing && (
                            <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md cursor-pointer hover:bg-slate-50 border border-slate-200 transition-colors">
                                <PencilIcon className="w-4 h-4 text-slate-600" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                            </label>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-1">{user.username}</h2>
                                <p className="text-slate-500 mb-4">{user.email}</p>
                            </div>
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <PencilIcon className="w-4 h-4" />
                                    Edit Profile
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                                    >
                                        <CheckIcon className="w-4 h-4" />
                                        Save
                                    </button>
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-4 mt-2 max-w-lg">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                                    <textarea
                                        value={profileData.bio}
                                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                        className="w-full rounded-lg border-slate-300 focus:border-primary-500 focus:ring-primary-500"
                                        rows="3"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={profileData.location}
                                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                                        className="w-full rounded-lg border-slate-300 focus:border-primary-500 focus:ring-primary-500"
                                        placeholder="e.g. Berlin, Germany"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {profileData.bio && (
                                    <p className="text-slate-700 leading-relaxed max-w-2xl">
                                        {profileData.bio}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-6 text-sm text-slate-600">
                                    {profileData.location && (
                                        <div className="flex items-center gap-1.5">
                                            <MapPinIcon className="w-4 h-4 text-slate-400" />
                                            {profileData.location}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <div><span className="font-bold text-slate-900">{stats.followers}</span> Followers</div>
                                        <div><span className="font-bold text-slate-900">{stats.following}</span> Following</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Password Management Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <LockClosedIcon className="w-6 h-6 text-slate-600" />
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Password & Security</h3>
                            <p className="text-sm text-slate-500">
                                {hasPassword ? 'Change your password' : 'Set a password to enable username/password login'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowPasswordSection(!showPasswordSection)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <KeyIcon className="w-4 h-4" />
                        {hasPassword ? 'Change Password' : 'Set Password'}
                    </button>
                </div>

                {showPasswordSection && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <div className="max-w-md space-y-4">
                            {hasPassword && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.current_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                        className="w-full rounded-lg border-slate-300 focus:border-primary-500 focus:ring-primary-500"
                                        placeholder="Enter current password"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.new_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 focus:border-primary-500 focus:ring-primary-500"
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.confirm_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 focus:border-primary-500 focus:ring-primary-500"
                                    placeholder="Confirm new password"
                                />
                            </div>

                            {passwordError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    {passwordError}
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                                    {passwordSuccess}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={handlePasswordSubmit}
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    {hasPassword ? 'Change Password' : 'Set Password'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPasswordSection(false);
                                        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                                        setPasswordError('');
                                        setPasswordSuccess('');
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-sm text-slate-500 font-medium uppercase tracking-wide mb-1">Quizzes Taken</div>
                    <div className="text-3xl font-bold text-slate-900">{history.length}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-sm text-slate-500 font-medium uppercase tracking-wide mb-1">Avg. Score</div>
                    <div className="text-3xl font-bold text-slate-900">
                        {history.length > 0
                            ? Math.round(history.reduce((acc, curr) => acc + curr.score, 0) / history.length * 10) + '%'
                            : '-'}
                    </div>
                </div>
                {/* Add more stats here */}
            </div>

            {/* Activity History */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Word</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Result</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {history.slice(0, 10).map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                {item.vocab_word}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.score > 0
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {item.score > 0 ? 'Correct' : 'Incorrect'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {new Date(item.timestamp).toLocaleDateString()}
                                                <span className="text-slate-400 ml-2 text-xs">
                                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-12 text-center text-slate-500">
                                                <p className="text-base">No quiz history yet.</p>
                                                <p className="text-sm mt-1">Start a quiz to see your progress here!</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;
