import 'package:flutter_test/flutter_test.dart';
import 'package:food4all/main.dart';
import 'package:food4all/screens/splash_screen.dart';

void main() {
  testWidgets('App boots and shows splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(const Food4AllApp());
    expect(find.byType(SplashScreen), findsOneWidget);
    expect(find.text('FOOD4ALL'), findsOneWidget);
    
    // Advance time to allow splash screen timer to finish
    await tester.pump(const Duration(seconds: 2));
  });
}
