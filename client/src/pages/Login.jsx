import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import Logo from '../components/Logo';
import {
    UserIcon,
    LockClosedIcon,
    EnvelopeIcon,
    LanguageIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';
import GoogleAuthButton from '../components/GoogleAuthButton';

function Login({ setUser }) {
    const [isLogin, setIsLogin] = useState(true);
    const [verificationMode, setVerificationMode] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [nativeLang, setNativeLang] = useState('en');
    const [targetLang, setTargetLang] = useState('de');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (verificationMode) {
                // Verify OTP
                const response = await api.post('auth/verify-email/', { email, otp });
                const user = response.data;
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                navigate('/dashboard');
            } else {
                // Login or Signup
                const endpoint = isLogin ? 'auth/signin/' : 'auth/signup/';
                const data = isLogin
                    ? { username, password }
                    : { username, password, email, native_language: nativeLang, target_language: targetLang };

                const response = await api.post(endpoint, data);

                if (isLogin) {
                    const user = response.data;
                    localStorage.setItem('user', JSON.stringify(user));
                    setUser(user);
                    navigate('/dashboard');
                } else {
                    // Signup successful, switch to verification
                    setVerificationMode(true);
                    setError(''); // Clear any previous errors
                }
            }
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.requires_verification) {
                // Login blocked because email not verified
                setEmail(err.response.data.email);
                setVerificationMode(true);
                setError('Please verify your email to continue.');
            } else {
                setError(err.response?.data?.error || 'An error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;

        try {
            await api.post('auth/resend-otp/', { email });
            setResendCooldown(60);
            const timer = setInterval(() => {
                setResendCooldown((prev) => {
                    if (prev <= 1) clearInterval(timer);
                    return prev - 1;
                });
            }, 1000);
        } catch (err) {
            setError('Failed to resend OTP.');
        }
    };

    const inputClasses = "w-full pl-10 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm font-medium text-surface-900 placeholder-surface-400";
    const labelClasses = "block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5";

    return (
        <div className="min-h-screen flex bg-surface-50">
            {/* Left Side - Brand Showcase */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary-900">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-900 opacity-90" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center mix-blend-overlay" />

                <div className="relative z-10 flex flex-col justify-between h-full p-16 text-white">
                    <Logo className="h-10 w-10 text-white" textClassName="text-white text-2xl" />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <h1 className="text-5xl font-extrabold leading-tight mb-6">
                            Master any language <br />
                            <span className="text-primary-200">with AI precision.</span>
                        </h1>
                        <p className="text-lg text-primary-100 max-w-md leading-relaxed">
                            Join thousands of learners using our advanced agentic AI to create personalized exams, track vocabulary, and achieve fluency faster.
                        </p>
                    </motion.div>

                    <div className="flex gap-4 text-sm font-medium text-primary-200">
                        <span>© 2024 VocabMaster</span>
                        <span>•</span>
                        <span>Privacy Policy</span>
                    </div>
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative">
                <div className="max-w-md w-full">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="text-center lg:text-left mb-10">
                            <h2 className="text-3xl font-bold text-surface-900 mb-2">
                                {verificationMode
                                    ? 'Verify Email'
                                    : isLogin ? 'Welcome back' : 'Create an account'}
                            </h2>
                            <p className="text-surface-500">
                                {verificationMode
                                    ? `We sent a code to ${email}`
                                    : isLogin ? 'Please enter your details to sign in.' : 'Start your language journey today.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <AnimatePresence mode='wait'>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {verificationMode ? (
                                // OTP Input
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <label htmlFor="otp" className={labelClasses}>Verification Code</label>
                                    <div className="relative">
                                        <LockClosedIcon className="w-5 h-5 text-surface-400 absolute left-3 top-3.5" />
                                        <input
                                            id="otp"
                                            type="text"
                                            required
                                            maxLength="6"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            className={`${inputClasses} tracking-[0.5em] text-center font-mono text-lg`}
                                            placeholder="000000"
                                        />
                                    </div>
                                    <div className="mt-4 text-center">
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={resendCooldown > 0}
                                            className="text-sm text-primary-600 font-medium hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {resendCooldown > 0
                                                ? `Resend code in ${resendCooldown}s`
                                                : "Didn't receive code? Resend"}
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                // Login/Signup Inputs
                                <>
                                    <div>
                                        <label htmlFor="username" className={labelClasses}>Username</label>
                                        <div className="relative">
                                            <UserIcon className="w-5 h-5 text-surface-400 absolute left-3 top-3.5" />
                                            <input
                                                id="username"
                                                type="text"
                                                required
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className={inputClasses}
                                                placeholder="Enter your username"
                                            />
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {!isLogin && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="space-y-5 overflow-hidden"
                                            >
                                                <div>
                                                    <label htmlFor="email" className={labelClasses}>Email Address</label>
                                                    <div className="relative">
                                                        <EnvelopeIcon className="w-5 h-5 text-surface-400 absolute left-3 top-3.5" />
                                                        <input
                                                            id="email"
                                                            type="email"
                                                            required
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            className={inputClasses}
                                                            placeholder="name@company.com"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label htmlFor="nativeLang" className={labelClasses}>I Speak</label>
                                                        <div className="relative">
                                                            <LanguageIcon className="w-5 h-5 text-surface-400 absolute left-3 top-3.5" />
                                                            <select
                                                                id="nativeLang"
                                                                value={nativeLang}
                                                                onChange={(e) => setNativeLang(e.target.value)}
                                                                className={inputClasses}
                                                            >
                                                                <option value="en">English</option>
                                                                <option value="de">German</option>
                                                                <option value="ar">Arabic</option>
                                                                <option value="ru">Russian</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label htmlFor="targetLang" className={labelClasses}>I Want to Learn</label>
                                                        <div className="relative">
                                                            <LanguageIcon className="w-5 h-5 text-surface-400 absolute left-3 top-3.5" />
                                                            <select
                                                                id="targetLang"
                                                                value={targetLang}
                                                                onChange={(e) => setTargetLang(e.target.value)}
                                                                className={inputClasses}
                                                            >
                                                                <option value="en">English</option>
                                                                <option value="de">German</option>
                                                                <option value="ar">Arabic</option>
                                                                <option value="ru">Russian</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div>
                                        <label htmlFor="password" className={labelClasses}>Password</label>
                                        <div className="relative">
                                            <LockClosedIcon className="w-5 h-5 text-surface-400 absolute left-3 top-3.5" />
                                            <input
                                                id="password"
                                                type="password"
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className={inputClasses}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-500/30 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:scale-95"
                            >
                                {loading ? (
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>
                                        {verificationMode
                                            ? 'Verify Email'
                                            : isLogin ? 'Sign in' : 'Create account'}
                                        <ArrowRightIcon className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </button>
                        </form>

                        {!verificationMode && (
                            <div className="mt-6">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-surface-200"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-white text-surface-500 font-medium">Or continue with</span>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-center">
                                    <GoogleAuthButton
                                        onSuccess={(data) => {
                                            setUser(data.user);
                                            navigate('/dashboard');
                                        }}
                                        onError={(error) => {
                                            setError('Google login failed. Please try again.');
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {!verificationMode && (
                            <div className="mt-8 text-center">
                                <p className="text-sm text-surface-500">
                                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                                    <button
                                        onClick={() => {
                                            setIsLogin(!isLogin);
                                            setError('');
                                        }}
                                        className="font-bold text-primary-600 hover:text-primary-700 transition-colors"
                                    >
                                        {isLogin ? 'Sign up for free' : 'Sign in'}
                                    </button>
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default Login;
