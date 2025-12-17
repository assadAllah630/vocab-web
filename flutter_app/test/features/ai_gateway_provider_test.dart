import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dio/dio.dart';
import 'package:flutter_app/features/ai/providers/ai_gateway_provider.dart';
import 'package:flutter_app/core/network/api_client.dart';

class MockApiClient extends Mock implements ApiClient {}

void main() {
  late MockApiClient mockApiClient;
  late AIGatewayNotifier aiNotifier;

  setUp(() {
    mockApiClient = MockApiClient();
    aiNotifier = AIGatewayNotifier(mockApiClient);
  });

  group('AIGatewayNotifier Tests', () {
    test('initial state should be empty', () {
      expect(aiNotifier.debugState.isLoading, false);
      expect(aiNotifier.debugState.dashboard, null);
    });

    test(
      'loadData success should parse Dashboard, Providers, and Keys',
      () async {
        // Arrange
        when(() => mockApiClient.get('/ai-gateway/dashboard/')).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: ''),
            data: {
              'summary': {'total_requests': 100},
            },
            statusCode: 200,
          ),
        );
        when(() => mockApiClient.get('/ai-gateway/providers/')).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: ''),
            data: {
              'providers': [
                {'id': 'openai', 'name': 'OpenAI'},
              ],
            },
            statusCode: 200,
          ),
        );
        when(() => mockApiClient.get('/ai-gateway/keys/')).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: ''),
            data: {
              'keys': [
                {'id': 1, 'provider': 'openai', 'health_score': 95},
              ],
            },
            statusCode: 200,
          ),
        );

        // Act
        await aiNotifier.loadData();

        // Assert
        expect(aiNotifier.debugState.isLoading, false);
        expect(aiNotifier.debugState.dashboard, isNotNull);
        expect(aiNotifier.debugState.providers.length, 1);
        expect(aiNotifier.debugState.keys.length, 1);
        expect(aiNotifier.debugState.keys.first.healthScore, 95);
      },
    );

    test('addKey should post data and reload', () async {
      when(
        () => mockApiClient.post('/ai-gateway/keys/', data: any(named: 'data')),
      ).thenAnswer(
        (_) async =>
            Response(requestOptions: RequestOptions(path: ''), statusCode: 201),
      );

      // Mock re-load calls
      when(() => mockApiClient.get(any())).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: ''),
          data: {
            'summary': {},
            'providers': [],
            'keys': [],
          }, // Empty for simplicity
          statusCode: 200,
        ),
      );

      await aiNotifier.addKey({'key': 'sk-123', 'provider': 'openai'});

      verify(
        () => mockApiClient.post('/ai-gateway/keys/', data: any(named: 'data')),
      ).called(1);
    });

    test('deleteKey should send delete request', () async {
      when(() => mockApiClient.delete('/ai-gateway/keys/1/')).thenAnswer(
        (_) async =>
            Response(requestOptions: RequestOptions(path: ''), statusCode: 204),
      );

      // Mock re-load
      when(() => mockApiClient.get(any())).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: ''),
          data: {'summary': {}, 'providers': [], 'keys': []},
          statusCode: 200,
        ),
      );

      await aiNotifier.deleteKey(1);

      verify(() => mockApiClient.delete('/ai-gateway/keys/1/')).called(1);
    });
  });
}
