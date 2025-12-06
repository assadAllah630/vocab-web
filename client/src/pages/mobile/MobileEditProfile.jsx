import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Save, User, Mail, MapPin, FileText, Check } from 'lucide-react';
import api from '../../api';

const MobileEditProfile = ({ user, setUser }) => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);

    const [formData, setFormData] = useState({
        username: '',
        bio: '',
        location: ''
    });
    const [avatarFile, setAvatarFile] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                bio: user.profile?.bio || '',
                location: user.profile?.location || ''
            });
            if (user.profile?.avatar) {
                setAvatarPreview(user.profile.avatar);
            }
        }
    }, [user]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setAvatarPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const data = new FormData();
            data.append('bio', formData.bio);
            data.append('location', formData.location);
            if (avatarFile) {
                data.append('avatar', avatarFile);
            }

            await api.put('users/me/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Update local user state
            setUser(prev => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    bio: formData.bio,
                    location: formData.location,
                    avatar: avatarPreview
                }
            }));

            setSaved(true);
            setTimeout(() => {
                navigate(-1);
            }, 1000);
        } catch (err) {
            console.error('Failed to save profile:', err);
            alert('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen pb-24" style={{ backgroundColor: 'transparent' }}>
            {/* Header */}
            <div
                className="sticky top-0 z-20 px-4 py-4 flex items-center justify-between"
                style={{
                    backgroundColor: 'rgba(10, 10, 11, 0.9)',
                    backdropFilter: 'blur(10px)',
                    paddingTop: 'env(safe-area-inset-top, 16px)'
                }}
            >
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 rounded-xl"
                    style={{ backgroundColor: '#18181B' }}
                >
                    <ArrowLeft size={20} style={{ color: '#A1A1AA' }} />
                </button>
                <h1 className="text-lg font-semibold" style={{ color: '#FAFAFA' }}>
                    Edit Profile
                </h1>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={saving || saved}
                    className="px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2"
                    style={{
                        background: saved ? '#22C55E' : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        color: '#FFFFFF',
                        opacity: saving ? 0.7 : 1
                    }}
                >
                    {saved ? <Check size={16} /> : <Save size={16} />}
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
                </motion.button>
            </div>

            <div className="px-5 pt-6">
                {/* Avatar */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center mb-8"
                >
                    <div className="relative">
                        <div
                            className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden"
                            style={{
                                background: avatarPreview ? 'transparent' : 'linear-gradient(135deg, #18181B 0%, #27272A 100%)',
                                border: '2px solid #3F3F46'
                            }}
                        >
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-bold" style={{ color: '#FAFAFA' }}>
                                    {formData.username?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            )}
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleAvatarClick}
                            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
                        >
                            <Camera size={18} style={{ color: '#FFFFFF' }} />
                        </motion.button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                    />
                    <p className="text-xs mt-3" style={{ color: '#71717A' }}>
                        Tap to change photo
                    </p>
                </motion.div>

                {/* Form Fields */}
                <div className="space-y-4">
                    {/* Username (read-only) */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#A1A1AA' }}>
                            <User size={14} />
                            Username
                        </label>
                        <input
                            type="text"
                            value={formData.username}
                            readOnly
                            className="w-full px-4 py-3.5 rounded-xl text-sm"
                            style={{
                                backgroundColor: '#141416',
                                border: '1px solid #27272A',
                                color: '#71717A'
                            }}
                        />
                        <p className="text-xs mt-1.5" style={{ color: '#52525B' }}>
                            Username cannot be changed
                        </p>
                    </div>

                    {/* Email (read-only) */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#A1A1AA' }}>
                            <Mail size={14} />
                            Email
                        </label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            readOnly
                            className="w-full px-4 py-3.5 rounded-xl text-sm"
                            style={{
                                backgroundColor: '#141416',
                                border: '1px solid #27272A',
                                color: '#71717A'
                            }}
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#A1A1AA' }}>
                            <MapPin size={14} />
                            Location
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => handleChange('location', e.target.value)}
                            placeholder="e.g., Berlin, Germany"
                            className="w-full px-4 py-3.5 rounded-xl text-sm"
                            style={{
                                backgroundColor: '#18181B',
                                border: '1px solid #27272A',
                                color: '#FAFAFA'
                            }}
                        />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#A1A1AA' }}>
                            <FileText size={14} />
                            Bio
                        </label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => handleChange('bio', e.target.value)}
                            placeholder="Write a short bio..."
                            rows={4}
                            maxLength={500}
                            className="w-full px-4 py-3.5 rounded-xl text-sm resize-none"
                            style={{
                                backgroundColor: '#18181B',
                                border: '1px solid #27272A',
                                color: '#FAFAFA'
                            }}
                        />
                        <p className="text-xs mt-1.5 text-right" style={{ color: '#52525B' }}>
                            {formData.bio.length}/500
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileEditProfile;
