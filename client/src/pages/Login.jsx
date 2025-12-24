import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import AuthService from '../services/AuthService';
import Logo from '../components/Logo';
import {
    UserIcon,
    LockClosedIcon,
    EnvelopeIcon,
    LanguageIcon,
    ArrowRightIcon,
    EyeIcon,
    EyeSlashIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import GoogleAuthButton from '../components/GoogleAuthButton';
import MagneticWords from '../components/MagneticWords';

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

    // New UX states
    const [showPassword, setShowPassword] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState('idle'); // idle | checking | available | taken
    const [passwordStrength, setPasswordStrength] = useState({ strength: '', color: '', score: 0, checks: {} });


    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/dashboard';

    // Password strength checker
    const checkPasswordStrength = (pwd) => {
        const checks = {
            length: pwd.length >= 8,
            uppercase: /[A-Z]/.test(pwd),
            lowercase: /[a-z]/.test(pwd),
            number: /[0-9]/.test(pwd),
            special: /[!@#$%^&*(),.?\":{}|<>]/.test(pwd)
        };

        const score = Object.values(checks).filter(Boolean).length;

        let strength, color;
        if (score <= 2) {
            strength = 'weak';
            color = 'red';
        } else if (score <= 4) {
            strength = 'medium';
            color = 'yellow';
        } else {
            strength = 'strong';
            color = 'green';
        }

        return { strength, color, score, checks };
    };

    // Check username availability (debounced)
    useEffect(() => {
        if (!username || username.length < 3 || isLogin) {
            setUsernameStatus('idle');
            return;
        }

        setUsernameStatus('checking');
        const timer = setTimeout(async () => {
            try {
                const response = await api.post('auth/check-username/', { username });
                setUsernameStatus(response.data.available ? 'available' : 'taken');
            } catch (error) {
                setUsernameStatus('idle');
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [username, isLogin]);

    // Update password strength
    useEffect(() => {
        if (password && !isLogin) {
            setPasswordStrength(checkPasswordStrength(password));
        } else {
            setPasswordStrength({ strength: '', color: '', score: 0, checks: {} });
        }
    }, [password, isLogin]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (verificationMode) {
                const response = await api.post('auth/verify-email/', { email, otp });
                const userData = response.data;
                // Use AuthService for proper session management
                AuthService.setSession(userData);
                setUser(userData);
                navigate(from, { replace: true });
            } else {
                const endpoint = isLogin ? 'auth/signin/' : 'auth/signup/';
                const data = isLogin
                    ? { username, password }
                    : { username, password, email, native_language: nativeLang, target_language: targetLang };

                const response = await api.post(endpoint, data);

                if (isLogin) {
                    const userData = response.data;
                    // Use AuthService for proper session management
                    AuthService.setSession(userData);
                    setUser(userData);
                    navigate(from, { replace: true });
                } else {
                    setVerificationMode(true);
                    setError('');
                }
            }
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.requires_verification) {
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
        <div className="relative min-h-screen w-full">
            {/* FULL SCREEN MAGNETIC WORDS BACKGROUND */}
            <div className="absolute inset-0">
                <MagneticWords />
            </div>

            {/* CONTENT LAYER WITH TWO EQUAL CARDS */}
            <div className="relative z-10 min-h-screen flex items-center justify-center px-8">
                <div className="flex flex-col lg:flex-row w-full max-w-5xl gap-10 lg:gap-16 items-stretch">
                    {/* LEFT CARD - WHITE LOGIN */}
                    <div className="w-full lg:flex-1 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 flex flex-col justify-center">
                        <div className="mb-8">
                            <Logo className="h-10 w-10 text-indigo-600 mb-6" />
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">
                                {verificationMode ? 'Verify Email' : isLogin ? 'Welcome back' : 'Create an account'}
                            </h2>
                            <p className="text-slate-500 text-sm">
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
                                        className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {verificationMode ? (
                                <div>
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
                                            className={inputClasses}
                                            placeholder="000000"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={resendCooldown > 0}
                                        className="mt-4 text-sm text-primary-600 font-medium hover:text-primary-700"
                                    >
                                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                                    </button>
                                </div>
                            ) : (
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
                                                className={`${inputClasses} ${!isLogin && usernameStatus === 'taken' ? 'border-red-500 focus:ring-red-500' :
                                                    !isLogin && usernameStatus === 'available' ? 'border-green-500 focus:ring-green-500' : ''
                                                    }`}
                                                placeholder="Enter your username"
                                            />
                                            {!isLogin && username.length >= 3 && (
                                                <div className="absolute right-3 top-3.5">
                                                    {usernameStatus === 'checking' && (
                                                        <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                                                    )}
                                                    {usernameStatus === 'available' && (
                                                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                                    )}
                                                    {usernameStatus === 'taken' && (
                                                        <XCircleIcon className="w-5 h-5 text-red-500" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {!isLogin && usernameStatus === 'taken' && (
                                            <p className="mt-1 text-xs text-red-500">This username is already taken</p>
                                        )}
                                        {!isLogin && usernameStatus === 'available' && (
                                            <p className="mt-1 text-xs text-green-500">Username is available</p>
                                        )}
                                    </div>

                                    <AnimatePresence>
                                        {!isLogin && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="space-y-5"
                                            >
                                                <div>
                                                    <label htmlFor="email" className={labelClasses}>Email</label>
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
                                                        <label className={labelClasses}>I Speak</label>
                                                        <select
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
                                                    <div>
                                                        <label className={labelClasses}>I Learn</label>
                                                        <select
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
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div>
                                        <label htmlFor="password" className={labelClasses}>Password</label>
                                        <div className="relative">
                                            <LockClosedIcon className="w-5 h-5 text-surface-400 absolute left-3 top-3.5" />
                                            <input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className={`${inputClasses} pr-12`}
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-3.5 text-surface-400 hover:text-surface-600 transition-colors"
                                            >
                                                {showPassword ? (
                                                    <EyeSlashIcon className="w-5 h-5" />
                                                ) : (
                                                    <EyeIcon className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Password Strength Meter - Only show during signup */}
                                        {!isLogin && password && (
                                            <div className="mt-2 space-y-2">
                                                {/* Strength Bar */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 bg-surface-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-300 ${passwordStrength.color === 'red' ? 'bg-red-500 w-1/3' :
                                                                passwordStrength.color === 'yellow' ? 'bg-yellow-500 w-2/3' :
                                                                    passwordStrength.color === 'green' ? 'bg-green-500 w-full' : 'w-0'
                                                                }`}
                                                        ></div>
                                                    </div>
                                                    <span className={`text-xs font-bold uppercase ${passwordStrength.color === 'red' ? 'text-red-500' :
                                                        passwordStrength.color === 'yellow' ? 'text-yellow-500' :
                                                            passwordStrength.color === 'green' ? 'text-green-500' : ''
                                                        }`}>
                                                        {passwordStrength.strength}
                                                    </span>
                                                </div>

                                                {/* Requirements Checklist */}
                                                <div className="grid grid-cols-2 gap-1 text-xs">
                                                    {Object.entries(passwordStrength.checks).map(([key, value]) => (
                                                        <div key={key} className={`flex items-center gap-1 ${value ? 'text-green-600' : 'text-surface-400'}`}>
                                                            {value ? '✓' : '○'}
                                                            <span className="capitalize">
                                                                {key === 'length' ? '8+ characters' :
                                                                    key === 'uppercase' ? 'Uppercase' :
                                                                        key === 'lowercase' ? 'Lowercase' :
                                                                            key === 'number' ? 'Number' :
                                                                                'Special char'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-70 transition-all"
                            >
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>
                                        {verificationMode ? 'Verify Email' : isLogin ? 'Sign in' : 'Create account'}
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

                                <div className="mt-6">
                                    <GoogleAuthButton
                                        onSuccess={(data) => {
                                            setUser(data.user);
                                            navigate(from, { replace: true });
                                        }}
                                        onError={() => setError('Google login failed.')}
                                        className="w-full flex justify-center items-center py-3.5 px-4 border-2 border-surface-300 rounded-xl text-sm font-semibold text-surface-700 bg-white hover:bg-surface-50 transition-all"
                                    />
                                </div>

                                <p className="mt-6 text-center text-sm text-surface-500">
                                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                                    <button
                                        onClick={() => {
                                            setIsLogin(!isLogin);
                                            setError('');
                                        }}
                                        className="font-semibold text-primary-600 hover:text-primary-700"
                                    >
                                        {isLogin ? 'Sign up' : 'Log in'}
                                    </button>
                                </p>

                                <div className="mt-8 pt-6 border-t border-surface-200">
                                    <Link to="/teacher-login" className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-purple-600 transition-colors group">
                                        Are you a teacher?
                                        <span className="underline decoration-2 decoration-transparent group-hover:decoration-purple-200">Sign in here</span>
                                        <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT CARD - HERO CONTENT (GRAY/WHITE) */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1.4, delay: 0.3, ease: "easeOut" }}
                        className="hidden lg:flex lg:flex-1 bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/10 flex-col justify-center"
                    >
                        <h1 className="text-5xl font-black mb-6 leading-tight text-white">
                            Master Any Language,{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-white">
                                Naturally
                            </span>
                        </h1>

                        <div className="text-lg text-white/80 mb-10 space-y-1">
                            <p>Your personal AI-powered vocabulary companion.</p>
                            <p>Learn faster,</p>
                            <p>remember longer,</p>
                            <p>speak confidently.</p>
                        </div>

                        <div className="space-y-6 w-full max-w-sm">
                            {[
                                { icon: '/icon-brain.png', text: 'Smart spaced repetition' },
                                { icon: '/icon-target.png', text: 'Personalized learning paths' },
                                { icon: '/icon-globe.png', text: '20+ languages supported' },
                                { icon: '/icon-lightning.png', text: 'AI-powered insights' }
                            ].map((feature, index) => (
                                <div key={index} className="flex items-center gap-4 text-white/90">
                                    <div className="h-12 w-12 flex items-center justify-center shrink-0 overflow-hidden">
                                        <img
                                            src={feature.icon}
                                            alt=""
                                            className="w-full h-full object-cover mix-blend-screen scale-125"
                                        />
                                    </div>
                                    <span className="font-medium text-lg text-left">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default Login;
