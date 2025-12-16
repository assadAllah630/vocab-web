import 'package:flutter_riverpod/flutter_riverpod.dart';
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

/// Auth Notifier - Replaces AuthContext from React
class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _apiClient;

  AuthNotifier(this._apiClient) : super(AuthState()) {
    _checkAuthStatus();
  }

  /// Check if user is already logged in
  Future<void> _checkAuthStatus() async {
    state = state.copyWith(isLoading: true);

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
      final response = await _apiClient.dio.get('auth/me/');
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

  /// Login with email and password
  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.dio.post(
        'auth/login/',
        data: {'email': email, 'password': password},
      );

      final token = response.data['token'];
      await _apiClient.setToken(token);
      await fetchCurrentUser();
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Login failed. Please check your credentials.',
      );
      return false;
    }
  }

  /// Logout user
  Future<void> logout() async {
    await _apiClient.clearToken();
    state = AuthState(isLoading: false, isAuthenticated: false);
  }
}

/// Riverpod provider for auth state
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuthNotifier(apiClient);
});
