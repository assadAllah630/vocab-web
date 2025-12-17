import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dio/dio.dart';
import 'package:flutter_app/core/providers/auth_provider.dart';
import 'package:flutter_app/core/network/api_client.dart';

class MockApiClient extends Mock implements ApiClient {}

void main() {
  late MockApiClient mockApiClient;
  late AuthNotifier authNotifier;

  setUp(() {
    mockApiClient = MockApiClient();
    // Constructor triggers _checkAuthStatus, so we need to mock hasToken immediately or just ignore the initial check
    when(() => mockApiClient.hasToken()).thenAnswer((_) async => false);

    authNotifier = AuthNotifier(mockApiClient);
  });

  group('AuthNotifier Tests', () {
    test('initial state should be unauthenticated', () {
      expect(authNotifier.debugState.isAuthenticated, false);
      expect(authNotifier.debugState.isLoading, false);
      expect(authNotifier.debugState.user, null);
    });

    test('login success should update state and set token', () async {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const token = 'fake_jwt_token';
      final userJson = {
        'id': 1,
        'email': email,
        'username': 'TestUser',
        'native_language': 'English',
        'learning_language': 'German',
      };

      when(
        () => mockApiClient.post(
          'auth/login/',
          data: {'email': email, 'password': password},
        ),
      ).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: 'auth/login/'),
          data: {'token': token},
          statusCode: 200,
        ),
      );

      when(() => mockApiClient.setToken(token)).thenAnswer((_) async {});

      when(() => mockApiClient.get('auth/me/')).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: 'auth/me/'),
          data: userJson,
          statusCode: 200,
        ),
      );

      // Act
      final result = await authNotifier.login(email, password);

      // Assert
      expect(result, true);
      expect(authNotifier.debugState.isAuthenticated, true);
      expect(authNotifier.debugState.user?.email, email);
      verify(() => mockApiClient.setToken(token)).called(1);
    });

    test('login failure should set error state', () async {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';

      when(
        () => mockApiClient.post(
          'auth/login/',
          data: {'email': email, 'password': password},
        ),
      ).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: 'auth/login/'),
          response: Response(
            requestOptions: RequestOptions(path: 'auth/login/'),
            statusCode: 400,
          ),
        ),
      );

      // Act
      final result = await authNotifier.login(email, password);

      // Assert
      expect(result, false);
      expect(authNotifier.debugState.isAuthenticated, false);
      expect(authNotifier.debugState.error, contains('Login failed'));
      // Verify setToken was NOT called
      verifyNever(() => mockApiClient.setToken(any()));
    });

    test('logout should clear token and reset state', () async {
      // Arrange
      when(() => mockApiClient.post('logout/')).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: 'logout/'),
          statusCode: 200,
        ),
      );
      when(() => mockApiClient.clearToken()).thenAnswer((_) async {});

      // Act
      await authNotifier.logout();

      // Assert
      expect(authNotifier.debugState.isAuthenticated, false);
      expect(authNotifier.debugState.user, null);
      verify(() => mockApiClient.clearToken()).called(1);
    });
  });
}
