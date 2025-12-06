import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Shield, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import api from '../../api';

const MobileSecuritySettings = ({ user }) => {
    const navigate = useNavigate();
    const [hasPassword, setHasPassword] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        checkPasswordStatus();
    }, []);

    const checkPasswordStatus = async () => {
        try {
            const res = await api.get('auth/password-status/');
            setHasPassword(res.data.has_password);
        } catch (err) {
            console.error('Failed to check password status:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleSave = async () => {
        // Validation
        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (formData.newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setSaving(true);
        setError('');

        try {
            if (hasPassword) {
                // Change password
                await api.post('auth/change-password/', {
                    current_password: formData.currentPassword,
                    new_password: formData.newPassword,
                    confirm_password: formData.confirmPassword
                });
            } else {
                // Set password (for Google OAuth users)
                await api.post('auth/set-password/', {
                    new_password: formData.newPassword,
                    confirm_password: formData.confirmPassword
                });
            }

            setSaved(true);
            setTimeout(() => navigate(-1), 1500);
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.details?.[0] || 'Failed to update password';
            setError(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const PasswordInput = ({ value, onChange, placeholder, show, onToggle }) => (
        <div className="relative">
            <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3.5 pr-12 rounded-xl text-sm"
                style={{
                    backgroundColor: '#18181B',
                    border: '1px solid #27272A',
                    color: '#FAFAFA'
                }}
            />
            <button
                type="button"
                onClick={onToggle}
                className="absolute right-4 top-1/2 -translate-y-1/2"
            >
                {show ? (
                    <EyeOff size={18} style={{ color: '#71717A' }} />
                ) : (
                    <Eye size={18} style={{ color: '#71717A' }} />
                )}
            </button>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

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
                    Security
                </h1>
                <div className="w-10" />
            </div>

            <div className="px-5 pt-6">
                {/* Info Card */}
                <div
                    className="rounded-xl p-4 mb-6 flex items-start gap-3"
                    style={{ backgroundColor: '#6366F110', border: '1px solid #6366F130' }}
                >
                    <Shield size={20} style={{ color: '#6366F1' }} className="flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium" style={{ color: '#FAFAFA' }}>
                            {hasPassword ? 'Change Password' : 'Set Password'}
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#71717A' }}>
                            {hasPassword
                                ? 'Enter your current password and choose a new one'
                                : 'You signed up with Google. Set a password to also login with email.'
                            }
                        </p>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl p-4 mb-4 flex items-center gap-3"
                        style={{ backgroundColor: '#EF444420', border: '1px solid #EF444440' }}
                    >
                        <AlertCircle size={18} style={{ color: '#EF4444' }} />
                        <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
                    </motion.div>
                )}

                {/* Form */}
                <div className="space-y-4">
                    {hasPassword && (
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#A1A1AA' }}>
                                <Lock size={14} />
                                Current Password
                            </label>
                            <PasswordInput
                                value={formData.currentPassword}
                                onChange={(v) => handleChange('currentPassword', v)}
                                placeholder="Enter current password"
                                show={showCurrentPassword}
                                onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
                            />
                        </div>
                    )}

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#A1A1AA' }}>
                            <Lock size={14} />
                            New Password
                        </label>
                        <PasswordInput
                            value={formData.newPassword}
                            onChange={(v) => handleChange('newPassword', v)}
                            placeholder="Enter new password"
                            show={showNewPassword}
                            onToggle={() => setShowNewPassword(!showNewPassword)}
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#A1A1AA' }}>
                            <Lock size={14} />
                            Confirm Password
                        </label>
                        <PasswordInput
                            value={formData.confirmPassword}
                            onChange={(v) => handleChange('confirmPassword', v)}
                            placeholder="Confirm new password"
                            show={showConfirmPassword}
                            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                        />
                    </div>
                </div>

                {/* Save Button */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={saving || saved}
                    className="w-full mt-8 py-4 rounded-xl font-medium flex items-center justify-center gap-2"
                    style={{
                        background: saved ? '#22C55E' : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        color: '#FFFFFF',
                        opacity: saving ? 0.7 : 1
                    }}
                >
                    {saved ? <Check size={20} /> : <Lock size={20} />}
                    {saving ? 'Updating...' : saved ? 'Password Updated!' : hasPassword ? 'Change Password' : 'Set Password'}
                </motion.button>
            </div>
        </div>
    );
};

export default MobileSecuritySettings;
