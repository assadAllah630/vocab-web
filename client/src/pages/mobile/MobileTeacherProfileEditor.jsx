import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Save, School, BookOpen, User,
    CheckCircle2, Camera, Settings, LogOut
} from 'lucide-react';
import { Button, Avatar } from '@heroui/react';
import { getTeacherProfile, updateTeacherProfile } from '../../api';
import AuthService from '../../services/AuthService';

const CustomInput = ({ label, value, onChange, icon: Icon, placeholder, multiline = false }) => (
    <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-400 ml-1">{label}</label>
        <div className="relative group">
            <div className="absolute left-4 top-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                <Icon size={20} />
            </div>
            {multiline ? (
                <textarea
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="w-full bg-[#18181b] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-[#202023] transition-all min-h-[120px] resize-none"
                />
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="w-full bg-[#18181b] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-[#202023] transition-all"
                />
            )}
        </div>
    </div>
);

const MobileTeacherProfileEditor = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [formData, setFormData] = useState({
        organization_name: '',
        subjects: '',
        bio: ''
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const res = await getTeacherProfile();
            const data = res.data;
            setFormData({
                organization_name: data.organization_name || '',
                subjects: Array.isArray(data.subjects) ? data.subjects.join(', ') : (data.subjects || ''),
                bio: data.bio || ''
            });
        } catch (err) {
            console.error('Failed to load teacher profile:', err);
            setError('Could not load profile data.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError('');
            setSuccess(false);

            const subjectsArray = formData.subjects.split(',').map(s => s.trim()).filter(s => s !== '');

            await updateTeacherProfile({
                ...formData,
                subjects: subjectsArray
            });

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Failed to update teacher profile:', err);
            setError('Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await AuthService.logout();
            navigate('/login');
        } catch (err) {
            console.error('Logout error:', err);
            navigate('/login');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-indigo-500/30 overflow-hidden relative pb-24">

            {/* Cinematic Background */}
            <div className="absolute top-0 left-0 right-0 h-[40vh] overflow-hidden z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/40 to-[#09090b]" />
                <img
                    src={user.avatar || `https://i.pravatar.cc/150?u=${user.id}`}
                    className="w-full h-full object-cover blur-3xl opacity-30 scale-110"
                    alt="Background"
                />
            </div>

            {/* Navbar */}
            <div className="sticky top-0 z-50 px-4 py-4 flex items-center justify-between backdrop-blur-sm bg-black/10">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-md transition-colors">
                    <ChevronLeft size={20} className="text-white" />
                </button>
                <div className="font-bold text-lg tracking-tight">Edit Profile</div>
                <Button
                    size="sm"
                    color="primary"
                    className="font-bold shadow-lg shadow-indigo-500/20"
                    isLoading={saving}
                    onPress={handleSave}
                    startContent={!saving && <Save size={16} />}
                >
                    Save
                </Button>
            </div>

            <div className="relative z-10 px-6 pt-4 space-y-8">

                {/* Avatar Section */}
                <div className="flex flex-col items-center justify-center -mt-2">
                    <div className="relative group cursor-pointer">
                        <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full opacity-75 blur transition duration-1000 group-hover:duration-200 group-hover:opacity-100" />
                        <div className="relative w-28 h-28 rounded-full p-[2px] bg-[#09090b]">
                            <Avatar
                                src={user.avatar || `https://i.pravatar.cc/150?u=${user.id}`}
                                className="w-full h-full"
                                isBordered
                            />
                            <div className="absolute bottom-0 right-0 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-lg border-2 border-[#09090b]">
                                <Camera size={14} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <AnimatePresence>
                    {success && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex items-center gap-3">
                            <CheckCircle2 size={20} className="text-green-500" />
                            <span className="text-green-500 font-bold text-sm">Profile updated successfully</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Form Fields */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-6"
                >
                    <CustomInput
                        label="Organization"
                        value={formData.organization_name}
                        onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                        icon={School}
                        placeholder="Where do you teach?"
                    />

                    <CustomInput
                        label="Subjects"
                        value={formData.subjects}
                        onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                        icon={BookOpen}
                        placeholder="e.g. English, Math, Science"
                    />

                    <CustomInput
                        label="Bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        icon={User}
                        placeholder="Tell students about your teaching style..."
                        multiline
                    />
                </motion.div>

                {/* Footer Actions */}
                <div className="pt-8 border-t border-white/5 space-y-4">
                    <Button
                        fullWidth
                        variant="flat"
                        className="bg-[#18181b] text-gray-300 justify-between h-14"
                        onPress={() => navigate('/m/me')}
                        endContent={<ChevronLeft className="rotate-180" size={18} />}
                    >
                        <span className="flex items-center gap-3">
                            <Settings size={18} />
                            Student Profile Settings
                        </span>
                    </Button>

                    <Button
                        fullWidth
                        color="danger"
                        variant="flat"
                        className="bg-red-500/10 text-red-500 h-14 font-bold"
                        onPress={handleLogout}
                        isLoading={loggingOut}
                    >
                        {loggingOut ? 'Signing out...' : 'Sign Out'}
                    </Button>

                    <div className="text-center text-xs text-gray-600 pt-4">
                        Version 2.4.0 • Build 8892
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MobileTeacherProfileEditor;
