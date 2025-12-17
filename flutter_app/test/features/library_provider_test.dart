import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:flutter_app/features/library/providers/library_provider.dart';
import 'package:flutter_app/core/network/api_client.dart';

class MockApiClient extends Mock implements ApiClient {}

void main() {
  late MockApiClient mockApiClient;
  late LibraryNotifier libraryNotifier;

  setUp(() {
    mockApiClient = MockApiClient();
    libraryNotifier = LibraryNotifier(mockApiClient);
  });

  group('LibraryNotifier Tests', () {
    test('initial state should have empty lists', () {
      expect(libraryNotifier.debugState.stories, isEmpty);
      expect(libraryNotifier.debugState.dialogues, isEmpty);
      expect(libraryNotifier.debugState.articles, isEmpty);
    });

    test('fetchLibrary should populate lists (Mocked/Simulated)', () async {
      // LibraryProvider currently uses mock data internally, but we test that it loads correctly.
      // If refactored to use API, we would mock the API call here.

      // Act
      await libraryNotifier.fetchLibrary();

      // Assert
      expect(libraryNotifier.debugState.isLoading, false);
      expect(libraryNotifier.debugState.stories.isNotEmpty, true);
      expect(libraryNotifier.debugState.dialogues.isNotEmpty, true);
      // The default mock data has 2 stories, 1 dialogue
      expect(libraryNotifier.debugState.stories.length, 2);
      expect(libraryNotifier.debugState.dialogues.length, 1);
    });

    test('getItem should return correct item by ID', () async {
      // Act
      await libraryNotifier.fetchLibrary();
      final item = libraryNotifier.getItem('1');

      // Assert
      expect(item, isNotNull);
      expect(item!.title, 'The Lost Key');
      expect(item.type, 'story');
    });

    test('getItem should return null for invalid ID', () async {
      await libraryNotifier.fetchLibrary();
      final item = libraryNotifier.getItem('999');
      expect(item, isNull);
    });
  });
}
