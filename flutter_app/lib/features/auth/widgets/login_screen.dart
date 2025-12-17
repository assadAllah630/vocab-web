import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _isLogin = true;
  bool _obscurePassword = true;
  String? _error;
  bool _verificationMode = false;

  // Language Selection
  String _nativeLang = 'en';
  String _targetLang = 'de';

  @override
  void dispose() {
    _emailController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      if (_verificationMode) {
        // Firebase handles email verification automatically
        // Check if email is verified and retry sync
        final isVerified = await ref
            .read(authProvider.notifier)
            .checkEmailVerified();
        if (isVerified) {
          // Re-authenticate to sync with backend
          await ref
              .read(authProvider.notifier)
              .login(_emailController.text, _passwordController.text);
        } else {
          setState(
            () => _error = 'Email not yet verified. Please check your inbox.',
          );
        }
      } else {
        if (_isLogin) {
          // Handle Login with Firebase (using email)
          final success = await ref
              .read(authProvider.notifier)
              .login(_emailController.text, _passwordController.text);

          if (!success) {
            if (mounted) {
              setState(() {
                _error = ref.read(authProvider).error;
              });
            }
          }
        } else {
          // Handle Signup with Firebase
          final success = await ref
              .read(authProvider.notifier)
              .signUp(
                email: _emailController.text,
                password: _passwordController.text,
                username: _usernameController.text,
                nativeLanguage: _nativeLang,
                targetLanguage: _targetLang,
              );

          if (success) {
            setState(() {
              _verificationMode = true;
              _error = null;
            });
          } else if (mounted) {
            setState(() {
              _error = ref.read(authProvider).error;
            });
          }
        }
      }
    } catch (e) {
      String msg = e.toString().replaceAll('Exception: ', '');
      setState(() => _error = msg);
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleGoogleSignIn() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final success = await ref.read(authProvider.notifier).signInWithGoogle();

    if (!success && mounted) {
      setState(() {
        _isLoading = false;
        _error = ref.read(authProvider).error;
      });
    }
    // Success will be handled by the listener
  }

  void _listenToAuthChanges() {
    ref.listen(authProvider, (previous, next) {
      if (next.isAuthenticated) {
        context.go('/home');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    _listenToAuthChanges();

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF0F172A), // Slate 900
              Color(0xFF1E1B4B), // Indigo 950
              Color(0xFF020617), // Slate 950
            ],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              // Background Glows
              Positioned(
                top: -100,
                right: -100,
                child: Container(
                  width: 400,
                  height: 400,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF6366F1).withOpacity(0.15),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF6366F1).withOpacity(0.15),
                        blurRadius: 100,
                        spreadRadius: 50,
                      ),
                    ],
                  ),
                ).animate().scale(duration: 2000.ms, curve: Curves.easeInOut),
              ),
              Positioned(
                bottom: -100,
                left: -100,
                child:
                    Container(
                      width: 300,
                      height: 300,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFF10B981).withOpacity(0.1),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF10B981).withOpacity(0.1),
                            blurRadius: 100,
                            spreadRadius: 50,
                          ),
                        ],
                      ),
                    ).animate().scale(
                      delay: 500.ms,
                      duration: 2000.ms,
                      curve: Curves.easeInOut,
                    ),
              ),

              Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Header
                      Text(
                        _isLogin ? 'Welcome Back!' : 'Start Your Journey',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.outfit(
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          height: 1.2,
                        ),
                      ).animate().fadeIn().slideY(begin: 0.3),
                      const SizedBox(height: 12),
                      Text(
                        _verificationMode
                            ? 'We sent a verification link to your email.'
                            : (_isLogin
                                  ? 'Continue your path to language mastery.'
                                  : 'Join thousands of language learners today.'),
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          color: Colors.white70,
                        ),
                      ).animate().fadeIn(delay: 200.ms),
                      const SizedBox(height: 40),

                      // Glassmorphic Form Container
                      ClipRRect(
                        borderRadius: BorderRadius.circular(24),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                          child: Container(
                            padding: const EdgeInsets.all(32),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(
                                color: Colors.white.withOpacity(0.1),
                              ),
                            ),
                            child: Form(
                              key: _formKey,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  if (_error != null)
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      margin: const EdgeInsets.only(bottom: 20),
                                      decoration: BoxDecoration(
                                        color: Colors.red.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                          color: Colors.red.withOpacity(0.3),
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          const Icon(
                                            LucideIcons.alertCircle,
                                            color: Colors.redAccent,
                                            size: 20,
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Text(
                                              _error!,
                                              style: const TextStyle(
                                                color: Colors.redAccent,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ).animate().fadeIn(),

                                  if (!_verificationMode) ...[
                                    if (!_isLogin) ...[
                                      _buildTextField(
                                        controller: _usernameController,
                                        label: 'Username',
                                        icon: LucideIcons.user,
                                        validator: (v) =>
                                            v!.isEmpty ? 'Required' : null,
                                      ),
                                      const SizedBox(height: 20),
                                    ],

                                    _buildTextField(
                                      controller: _emailController,
                                      label: 'Email Address',
                                      icon: LucideIcons.mail,
                                      keyboardType: TextInputType.emailAddress,
                                      validator: (v) => !v!.contains('@')
                                          ? 'Invalid email'
                                          : null,
                                    ),
                                    const SizedBox(height: 20),

                                    _buildTextField(
                                      controller: _passwordController,
                                      label: 'Password',
                                      icon: LucideIcons.lock,
                                      obscureText: _obscurePassword,
                                      validator: (v) =>
                                          v!.length < 6 ? 'Min 6 chars' : null,
                                      suffixIcon: IconButton(
                                        icon: Icon(
                                          _obscurePassword
                                              ? LucideIcons.eye
                                              : LucideIcons.eyeOff,
                                          color: Colors.white60,
                                        ),
                                        onPressed: () => setState(
                                          () => _obscurePassword =
                                              !_obscurePassword,
                                        ),
                                      ),
                                    ),

                                    if (!_isLogin) ...[
                                      const SizedBox(height: 20),
                                      Row(
                                        children: [
                                          Expanded(
                                            child: _buildDropdown(
                                              label: 'I Speak',
                                              value: _nativeLang,
                                              onChanged: (v) => setState(
                                                () => _nativeLang = v!,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 16),
                                          Expanded(
                                            child: _buildDropdown(
                                              label: 'I Learn',
                                              value: _targetLang,
                                              onChanged: (v) => setState(
                                                () => _targetLang = v!,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],

                                    if (_isLogin) ...[
                                      const SizedBox(height: 12),
                                      Align(
                                        alignment: Alignment.centerRight,
                                        child: TextButton(
                                          onPressed: () {
                                            if (_emailController
                                                .text
                                                .isNotEmpty) {
                                              ref
                                                  .read(authProvider.notifier)
                                                  .sendPasswordResetEmail(
                                                    _emailController.text,
                                                  );
                                              ScaffoldMessenger.of(
                                                context,
                                              ).showSnackBar(
                                                const SnackBar(
                                                  content: Text(
                                                    'Password reset email sent',
                                                  ),
                                                ),
                                              );
                                            } else {
                                              setState(
                                                () => _error =
                                                    'Enter email to reset password',
                                              );
                                            }
                                          },
                                          child: Text(
                                            'Forgot Password?',
                                            style: GoogleFonts.inter(
                                              color: const Color(0xFF818CF8),
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],

                                  const SizedBox(height: 32),

                                  // Primary Button
                                  SizedBox(
                                    height: 56,
                                    child: ElevatedButton(
                                      onPressed: _isLoading
                                          ? null
                                          : _handleSubmit,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.white,
                                        foregroundColor: Colors.black,
                                        elevation: 0,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(
                                            16,
                                          ),
                                        ),
                                      ),
                                      child: _isLoading
                                          ? const SizedBox(
                                              height: 24,
                                              width: 24,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                              ),
                                            )
                                          : Text(
                                              _verificationMode
                                                  ? 'I Verified My Email'
                                                  : (_isLogin
                                                        ? 'Login'
                                                        : 'Create Account'),
                                              style: GoogleFonts.outfit(
                                                fontSize: 16,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                    ),
                                  ),

                                  if (!_verificationMode) ...[
                                    const SizedBox(height: 24),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Divider(
                                            color: Colors.white.withOpacity(
                                              0.2,
                                            ),
                                          ),
                                        ),
                                        Padding(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 16,
                                          ),
                                          child: Text(
                                            'Or continue with',
                                            style: GoogleFonts.inter(
                                              color: Colors.white54,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ),
                                        Expanded(
                                          child: Divider(
                                            color: Colors.white.withOpacity(
                                              0.2,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 24),

                                    // Social Buttons
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        _buildSocialButton(
                                          icon: LucideIcons.chrome,
                                          label: 'Google',
                                          onTap: _handleGoogleSignIn,
                                        ),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        ),
                      ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.2),

                      const SizedBox(height: 24),

                      // Toggle
                      if (!_verificationMode)
                        TextButton(
                          onPressed: () => setState(() => _isLogin = !_isLogin),
                          child: RichText(
                            text: TextSpan(
                              style: GoogleFonts.inter(color: Colors.white70),
                              children: [
                                TextSpan(
                                  text: _isLogin
                                      ? "Don't have an account? "
                                      : "Already have an account? ",
                                ),
                                TextSpan(
                                  text: _isLogin ? 'Sign Up' : 'Login',
                                  style: const TextStyle(
                                    color: Color(0xFF818CF8),
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool obscureText = false,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
    Widget? suffixIcon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            color: Colors.white70,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          validator: validator,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: Colors.white60, size: 20),
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: Colors.white.withOpacity(0.08),
            contentPadding: const EdgeInsets.all(16),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF6366F1)),
            ),
            errorStyle: const TextStyle(color: Colors.redAccent),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdown({
    required String label,
    required String value,
    required Function(String?) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            color: Colors.white70,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.08),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
            borderRadius: BorderRadius.circular(12),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              dropdownColor: const Color(0xFF1E1B4B), // Indigo 950
              icon: const Icon(
                LucideIcons.chevronDown,
                color: Colors.white60,
                size: 16,
              ),
              style: const TextStyle(color: Colors.white, fontSize: 14),
              onChanged: onChanged,
              items: const [
                DropdownMenuItem(value: 'en', child: Text('English')),
                DropdownMenuItem(value: 'de', child: Text('German')),
                DropdownMenuItem(value: 'ar', child: Text('Arabic')),
                DropdownMenuItem(value: 'ru', child: Text('Russian')),
                DropdownMenuItem(value: 'fr', child: Text('French')),
                DropdownMenuItem(value: 'es', child: Text('Spanish')),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSocialButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: 60,
        height: 60,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.08),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
        ),
        child: Center(child: Icon(icon, color: Colors.white)),
      ),
    );
  }
}
