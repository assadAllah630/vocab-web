import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_app/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const ProviderScope(child: VocabMasterApp()));

    // Verify that the app renders (placeholder screens have text)
    expect(find.text('Home Screen\n(To be implemented)'), findsOneWidget);
  });
}
