import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// API Client - Replaces client/src/api.js
/// Uses Dio for HTTP requests with interceptors for auth
class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  late Dio dio;
  final _storage = const FlutterSecureStorage();

  factory ApiClient() => _instance;

  ApiClient._internal() {
    final baseUrl = dotenv.env['API_URL'] ?? 'http://localhost:8000';

    dio = Dio(
      BaseOptions(
        baseUrl: '$baseUrl/api/',
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Add auth interceptor (replaces axios interceptor in api.js)
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Get token from secure storage (replaces localStorage)
          final token = await _storage.read(key: 'auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Token $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          // Handle 401 Unauthorized
          if (e.response?.statusCode == 401) {
            await _storage.delete(key: 'auth_token');
            // TODO: Trigger logout / redirect to login
          }
          return handler.next(e);
        },
      ),
    );
  }

  /// Save auth token after login
  Future<void> setToken(String token) async {
    await _storage.write(key: 'auth_token', value: token);
  }

  /// Clear auth token on logout
  Future<void> clearToken() async {
    await _storage.delete(key: 'auth_token');
  }

  Future<bool> hasToken() async {
    final token = await _storage.read(key: 'auth_token');
    return token != null;
  }

  // Wrappers for Dio methods
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    return dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    return dio.post(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    return dio.put(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    return dio.delete(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> patch(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    return dio.patch(path, data: data, queryParameters: queryParameters);
  }
}

/// Riverpod provider for Dio instance
final dioProvider = Provider<Dio>((ref) {
  return ApiClient().dio;
});

/// Riverpod provider for ApiClient
final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});
