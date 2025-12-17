import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dio/dio.dart';
import 'package:flutter_app/features/vocab/providers/vocab_provider.dart';
import 'package:flutter_app/core/network/api_client.dart';

class MockApiClient extends Mock implements ApiClient {}

void main() {
  late MockApiClient mockApiClient;
  late VocabNotifier vocabNotifier;

  setUp(() {
    mockApiClient = MockApiClient();
    vocabNotifier = VocabNotifier(mockApiClient);
  });

  group('VocabNotifier Tests', () {
    test('initial state should be empty', () {
      expect(vocabNotifier.debugState.words, isEmpty);
      expect(vocabNotifier.debugState.isLoading, true); // It loads on init
    });

    test('loadWords success should populate list', () async {
      // Arrange
      final mockResponse = {
        'id': 1,
        'word': 'Haus',
        'translation': 'House',
        'definition': 'Building for living',
        'example': 'Das ist ein Haus.',
        'mastery_score': 50,
      };

      when(() => mockApiClient.get('vocab/')).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: 'vocab/'),
          data: [mockResponse],
          statusCode: 200,
        ),
      );

      // Act
      await vocabNotifier.loadWords();

      // Assert
      expect(vocabNotifier.debugState.words.length, 1);
      expect(vocabNotifier.debugState.words.first.word, 'Haus');
      expect(vocabNotifier.debugState.isLoading, false);
    });

    test('loadWords failure should handle error gracefully', () async {
      when(
        () => mockApiClient.get('vocab/'),
      ).thenThrow(DioException(requestOptions: RequestOptions(path: 'vocab/')));

      await vocabNotifier.loadWords();

      expect(vocabNotifier.debugState.isLoading, false);
      // Should result in empty if it failed initially
    });

    test('updateMastery should optimistically update', () async {
      // Pre-load
      final mockResponse = {
        'id': 1,
        'word': 'Haus',
        'translation': 'House',
        'definition': '',
        'example': '',
        'mastery_score': 10,
      };
      when(() => mockApiClient.get('vocab/')).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: 'vocab/'),
          data: [mockResponse],
          statusCode: 200,
        ),
      );
      await vocabNotifier.loadWords();

      // Act (Update +10)
      when(
        () => mockApiClient.post('vocab/1/progress/', data: {'change': 10}),
      ).thenAnswer(
        (_) async =>
            Response(requestOptions: RequestOptions(path: ''), statusCode: 200),
      );

      await vocabNotifier.updateMastery('1', 10);

      // Assert
      expect(vocabNotifier.debugState.words.first.mastery, 20);
    });

    test('semanticSearch should call API', () async {
      when(
        () => mockApiClient.post(
          'vocab/semantic-search/',
          data: {'query': 'building'},
        ),
      ).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: ''),
          data: [],
          statusCode: 200,
        ),
      );

      await vocabNotifier.semanticSearch('building');

      verify(
        () => mockApiClient.post(
          'vocab/semantic-search/',
          data: {'query': 'building'},
        ),
      ).called(1);
    });
  });
}
