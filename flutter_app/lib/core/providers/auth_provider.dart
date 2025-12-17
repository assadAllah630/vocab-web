import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb_auth;
import 'package:google_sign_in/google_sign_in.dart';
import '../network/api_client.dart';

/// User model - matches backend User serializer
class User {
  final int id;
  final String email;
  final String? username;
  final String? nativeLanguage;
  final String? learningLanguage;
  final String? avatarUrl;

  User({
    required this.id,
    required this.email,
    this.username,
    this.nativeLanguage,
    this.learningLanguage,
    this.avatarUrl,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? 0,
      email: json['email'] ?? '',
      username: json['username'],
      nativeLanguage: json['native_language'],
      learningLanguage: json['learning_language'],
      avatarUrl: json['avatar_url'],
    );
  }
}

/// Auth State
class AuthState {
  final User? user;
  final bool isLoading;
  final bool isAuthenticated;
  final String? error;

  AuthState({
    this.user,
    this.isLoading = false,
    this.isAuthenticated = false,
    this.error,
  });

  AuthState copyWith({
    User? user,
    bool? isLoading,
    bool? isAuthenticated,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      error: error,
    );
  }
}

/// Auth Notifier - Uses Firebase Auth for authentication
class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _apiClient;
  final fb_auth.FirebaseAuth _firebaseAuth = fb_auth.FirebaseAuth.instance;

  AuthNotifier(this._apiClient) : super(AuthState()) {
    _checkAuthStatus();
    // Listen to Firebase auth state changes
    _firebaseAuth.authStateChanges().listen(_onFirebaseAuthChanged);
  }

  /// Handle Firebase auth state changes
  void _onFirebaseAuthChanged(fb_auth.User? firebaseUser) async {
    if (firebaseUser != null) {
      // User is signed in to Firebase, sync with backend
      await _syncWithBackend(firebaseUser);
    }
  }

  /// Sync Firebase user with Django backend
  Future<void> _syncWithBackend(fb_auth.User firebaseUser) async {
    try {
      // Get Firebase ID token
      final idToken = await firebaseUser.getIdToken();

      // Send to backend for verification and user creation/sync
      final response = await _apiClient.post(
        'auth/firebase/',
        data: {'id_token': idToken},
      );

      // Store Django token
      if (response.data['token'] != null) {
        await _apiClient.setToken(response.data['token']);
      }

      // Update state with user data
      if (response.data['user'] != null) {
        final user = User.fromJson(response.data['user']);
        state = state.copyWith(
          user: user,
          isLoading: false,
          isAuthenticated: true,
        );
      }
    } catch (e) {
      print('Backend sync error: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to sync with server',
      );
    }
  }

  /// Check if user is already logged in
  Future<void> _checkAuthStatus() async {
    state = state.copyWith(isLoading: true);

    // Check Firebase auth first
    final firebaseUser = _firebaseAuth.currentUser;
    if (firebaseUser != null) {
      await _syncWithBackend(firebaseUser);
      return;
    }

    // Fallback: Check Django token
    final hasToken = await _apiClient.hasToken();
    if (hasToken) {
      await fetchCurrentUser();
    } else {
      state = state.copyWith(isLoading: false, isAuthenticated: false);
    }
  }

  /// Fetch current user from backend
  Future<void> fetchCurrentUser() async {
    try {
      final response = await _apiClient.get('auth/me/');
      final user = User.fromJson(response.data);
      state = state.copyWith(
        user: user,
        isLoading: false,
        isAuthenticated: true,
      );
    } catch (e) {
      await logout();
    }
  }

  /// Sign up with email and password using Firebase
  Future<bool> signUp({
    required String email,
    required String password,
    required String username,
    String nativeLanguage = 'en',
    String targetLanguage = 'de',
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // Create user in Firebase
      final credential = await _firebaseAuth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      // Update display name
      await credential.user?.updateDisplayName(username);

      // Send email verification
      await credential.user?.sendEmailVerification();

      // Sync with backend
      if (credential.user != null) {
        await _syncWithBackend(credential.user!);
      }

      state = state.copyWith(isLoading: false);
      return true;
    } on fb_auth.FirebaseAuthException catch (e) {
      String errorMessage = _getFirebaseErrorMessage(e.code);
      state = state.copyWith(isLoading: false, error: errorMessage);
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  /// Login with email and password using Firebase
  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final credential = await _firebaseAuth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (credential.user != null) {
        await _syncWithBackend(credential.user!);
        return true;
      }
      return false;
    } on fb_auth.FirebaseAuthException catch (e) {
      String errorMessage = _getFirebaseErrorMessage(e.code);
      state = state.copyWith(isLoading: false, error: errorMessage);
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  /// Sign in with Google
  Future<bool> signInWithGoogle() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final GoogleSignIn googleSignIn = GoogleSignIn(
        scopes: ['email', 'profile'],
      );
      final GoogleSignInAccount? googleUser = await googleSignIn.signIn();

      if (googleUser == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'Google sign-in cancelled',
        );
        return false;
      }

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      // Create Firebase credential
      final credential = fb_auth.GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      // Sign in to Firebase
      final userCredential = await _firebaseAuth.signInWithCredential(
        credential,
      );

      if (userCredential.user != null) {
        await _syncWithBackend(userCredential.user!);
        return true;
      }
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Google sign-in failed: $e',
      );
      return false;
    }
  }

  /// Send password reset email
  Future<bool> sendPasswordResetEmail(String email) async {
    try {
      await _firebaseAuth.sendPasswordResetEmail(email: email);
      return true;
    } catch (e) {
      state = state.copyWith(error: 'Failed to send reset email');
      return false;
    }
  }

  /// Resend email verification
  Future<bool> resendEmailVerification() async {
    try {
      await _firebaseAuth.currentUser?.sendEmailVerification();
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Check if email is verified
  Future<bool> checkEmailVerified() async {
    await _firebaseAuth.currentUser?.reload();
    return _firebaseAuth.currentUser?.emailVerified ?? false;
  }

  /// Logout
  Future<void> logout() async {
    try {
      await _firebaseAuth.signOut();
      await GoogleSignIn().signOut();
      await _apiClient.post('logout/');
    } catch (_) {
      // Ignore errors during logout
    } finally {
      await _apiClient.clearToken();
      state = AuthState();
    }
  }

  /// Change Password (for users with password)
  Future<bool> changePassword(
    String currentPassword,
    String newPassword,
  ) async {
    try {
      final user = _firebaseAuth.currentUser;
      if (user == null || user.email == null) return false;

      // Re-authenticate
      final credential = fb_auth.EmailAuthProvider.credential(
        email: user.email!,
        password: currentPassword,
      );
      await user.reauthenticateWithCredential(credential);

      // Update password
      await user.updatePassword(newPassword);
      return true;
    } on fb_auth.FirebaseAuthException catch (e) {
      state = state.copyWith(error: _getFirebaseErrorMessage(e.code));
      return false;
    }
  }

  /// Update Profile
  Future<bool> updateProfile(Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.patch('users/me/', data: data);
      final updatedUser = User.fromJson(response.data);
      state = state.copyWith(user: updatedUser);
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  /// Get user-friendly error message from Firebase error code
  String _getFirebaseErrorMessage(String code) {
    switch (code) {
      case 'email-already-in-use':
        return 'This email is already registered. Please login instead.';
      case 'invalid-email':
        return 'Please enter a valid email address.';
      case 'weak-password':
        return 'Password should be at least 6 characters.';
      case 'user-not-found':
        return 'No account found with this email.';
      case 'wrong-password':
        return 'Incorrect password. Please try again.';
      case 'user-disabled':
        return 'This account has been disabled.';
      case 'too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return 'Authentication failed. Please try again.';
    }
  }
}

/// Riverpod provider for auth state
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuthNotifier(apiClient);
});
