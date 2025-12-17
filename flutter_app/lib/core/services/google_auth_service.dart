import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../network/api_client.dart';

/// Google Sign-In Service for VocabMaster
/// Handles authentication with Google and backend integration
class GoogleAuthService {
  final GoogleSignIn _googleSignIn = GoogleSignIn(scopes: ['email', 'profile']);

  final ApiClient _apiClient;

  GoogleAuthService(this._apiClient);

  /// Sign in with Google and authenticate with backend
  /// Returns user data on success, throws on failure
  Future<Map<String, dynamic>> signInWithGoogle() async {
    try {
      // Trigger Google Sign-In flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        throw Exception('Google sign-in cancelled');
      }

      // Get authentication details
      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      // Send token to backend
      final response = await _apiClient.post(
        'auth/google/',
        data: {
          'id_token': googleAuth.idToken,
          'access_token': googleAuth.accessToken,
        },
      );

      // Store the auth token from backend
      if (response.data['token'] != null) {
        await _apiClient.setToken(response.data['token']);
      }

      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  /// Sign out from Google
  Future<void> signOut() async {
    await _googleSignIn.signOut();
  }

  /// Check if user is currently signed in with Google
  Future<bool> isSignedIn() async {
    return await _googleSignIn.isSignedIn();
  }

  /// Get current Google user (if signed in)
  GoogleSignInAccount? get currentUser => _googleSignIn.currentUser;
}

/// Provider for GoogleAuthService
final googleAuthServiceProvider = Provider<GoogleAuthService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return GoogleAuthService(apiClient);
});
