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
    ArrowRightIcon,
    EyeIcon,
    EyeSlashIcon,
    CheckCircleIcon,
    XCircleIcon,
    AcademicCapIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';
import GoogleAuthButton from '../components/GoogleAuthButton';
import MagneticWords from '../components/MagneticWords';

function TeacherLogin({ setUser }) {
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

    // Default teacher redirect
    const from = location.state?.from?.pathname || '/m/teach/apply';

    // Password strength checker (Same as Login.jsx)
    const checkPasswordStrength = (pwd) => {
        const checks = {
            length: pwd.length >= 8,
            uppercase: /[A-Z]/.test(pwd),
            lowercase: /[a-z]/.test(pwd),
            number: /[0-9]/.test(pwd),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
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
                AuthService.setSession(userData);
                setUser(userData);

                // After verification, check if teacher profile exists
                // If newly created, they likely don't have it, so go to apply
                if (userData.is_teacher) {
                    navigate('/m/teacher/dashboard', { replace: true });
                } else {
                    navigate('/m/teach/apply', { replace: true });
                }

            } else {
                const endpoint = isLogin ? 'auth/signin/' : 'auth/signup/';
                const data = isLogin
                    ? { username, password }
                    : { username, password, email, native_language: nativeLang, target_language: targetLang };

                const response = await api.post(endpoint, data);

                if (isLogin) {
                    const userData = response.data;
                    AuthService.setSession(userData);
                    setUser(userData);

                    // Redirect to teacher application page which will handle status checking
                    // using the established session. The apply page will redirect to dashboard
                    // if user already has an approved application.
                    navigate('/m/teach/apply', { replace: true });
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

    const inputClasses = "w-full pl-10 pr-4 py-3 bg-white/50 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm font-medium text-slate-900 placeholder-slate-400 backdrop-blur-sm";
    const labelClasses = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

    return (
        <div className="relative min-h-screen w-full bg-[#FAFAFA] overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-purple-50"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-8 py-12">
                <div className="flex flex-col lg:flex-row w-full max-w-5xl gap-10 lg:gap-16 items-stretch">

                    {/* LEFT CARD - TEACHER INFO (PURPLE) */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="hidden lg:flex lg:flex-1 bg-slate-900 text-white rounded-3xl shadow-2xl p-10 flex-col justify-between relative overflow-hidden"
                    >
                        {/* Decorative background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900 opacity-90"></div>
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

                        <div className="relative z-10 text-white/50 hover:text-white transition-colors cursor-pointer" onClick={() => navigate('/')}>
                            <ArrowLeftIcon className="w-6 h-6" />
                        </div>

                        <div className="relative z-10 my-auto">
                            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md border border-purple-400/30">
                                <AcademicCapIcon className="w-8 h-8 text-purple-300" />
                            </div>
                            <h1 className="text-4xl font-black mb-6 leading-tight">
                                Inspire the Next <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300">
                                    Generation
                                </span>
                            </h1>
                            <p className="text-lg text-purple-200/80 mb-8 leading-relaxed max-w-sm">
                                Join our community of elite educators. Access advanced tools, track progress, and earn by teaching what you love.
                            </p>
                        </div>

                        <div className="relative z-10 grid grid-cols-2 gap-6">
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-2xl font-bold text-white mb-1">85%</div>
                                <div className="text-xs text-purple-200">Higher Engagement</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-2xl font-bold text-white mb-1">AI</div>
                                <div className="text-xs text-purple-200">Teaching Assistant</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT CARD - LOGIN FORM */}
                    <div className="w-full lg:flex-1 bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl shadow-purple-900/5 p-8 sm:p-10 flex flex-col justify-center border border-white">
                        <div className="mb-8">
                            <div className="flex justify-between items-start">
                                <div className="lg:hidden w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-200 mb-6">T</div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                                    {verificationMode ? 'Verify Email' : isLogin ? 'Teacher Portal' : 'Apply to Teach'}
                                </h2>
                            </div>
                            <p className="text-slate-500 text-sm">
                                {verificationMode
                                    ? `We sent a code to ${email}`
                                    : isLogin ? 'Sign in to access your classroom and tools.' : 'Create an account to start your application.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <AnimatePresence mode='wait'>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-2"
                                    >
                                        <XCircleIcon className="w-5 h-5 shrink-0" />
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {verificationMode ? (
                                <div>
                                    <label htmlFor="otp" className={labelClasses}>Verification Code</label>
                                    <div className="relative">
                                        <LockClosedIcon className="w-5 h-5 text-purple-400 absolute left-3 top-3.5" />
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
                                        className="mt-4 text-sm text-purple-600 font-medium hover:text-purple-700"
                                    >
                                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label htmlFor="username" className={labelClasses}>Username</label>
                                        <div className="relative">
                                            <UserIcon className="w-5 h-5 text-purple-400 absolute left-3 top-3.5" />
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
                                                        <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full"></div>
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
                                    </div>

                                    <AnimatePresence>
                                        {!isLogin && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="space-y-4"
                                            >
                                                <div>
                                                    <label htmlFor="email" className={labelClasses}>Email</label>
                                                    <div className="relative">
                                                        <EnvelopeIcon className="w-5 h-5 text-purple-400 absolute left-3 top-3.5" />
                                                        <input
                                                            id="email"
                                                            type="email"
                                                            required
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            className={inputClasses}
                                                            placeholder="teacher@school.com"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className={labelClasses}>I Teach</label>
                                                        <select
                                                            value={targetLang}
                                                            onChange={(e) => setTargetLang(e.target.value)}
                                                            className={inputClasses}
                                                        >
                                                            <option value="de">German</option>
                                                            <option value="en">English</option>
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
                                            <LockClosedIcon className="w-5 h-5 text-purple-400 absolute left-3 top-3.5" />
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
                                                className="absolute right-3 top-3.5 text-purple-400 hover:text-purple-600 transition-colors"
                                            >
                                                {showPassword ? (
                                                    <EyeSlashIcon className="w-5 h-5" />
                                                ) : (
                                                    <EyeIcon className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Password Strength Meter */}
                                        {!isLogin && password && (
                                            <div className="mt-2 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-300 ${passwordStrength.color === 'red' ? 'bg-red-500 w-1/3' :
                                                                passwordStrength.color === 'yellow' ? 'bg-yellow-500 w-2/3' :
                                                                    passwordStrength.color === 'green' ? 'bg-green-500 w-full' : 'w-0'
                                                                }`}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-70 transition-all shadow-lg shadow-purple-500/20 mt-6"
                            >
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>
                                        {verificationMode ? 'Verify Email' : isLogin ? 'Sign In as Teacher' : 'Create Teacher Account'}
                                        <ArrowRightIcon className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </button>
                        </form>

                        {!verificationMode && (
                            <div className="mt-8">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-100"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-white/80 backdrop-blur-sm text-slate-400 font-medium">or</span>
                                    </div>
                                </div>

                                <p className="text-center text-sm text-slate-500 space-y-2 flex flex-col">
                                    <span>
                                        {isLogin ? "Don't have a teacher account?" : "Already have an account?"}{' '}
                                        <button
                                            onClick={() => {
                                                setIsLogin(!isLogin);
                                                setError('');
                                            }}
                                            className="font-bold text-purple-600 hover:text-purple-700 underline decoration-2 decoration-transparent hover:decoration-purple-200 transition-all"
                                        >
                                            {isLogin ? 'Apply now' : 'Log in'}
                                        </button>
                                    </span>

                                    <Link to="/login" className="text-xs text-slate-400 hover:text-purple-600 transition-colors mt-4 block">
                                        Looking for Student Login?
                                    </Link>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherLogin;
