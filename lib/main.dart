import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'state/auth_state.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/role_select_screen.dart';
import 'screens/buyer_product_list_screen.dart';
import 'state/product_state.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const Food4AllApp());
}

class Food4AllApp extends StatelessWidget {
  const Food4AllApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthState()),
        ChangeNotifierProvider(create: (_) => ProductState()),
      ],
      child: MaterialApp(
        title: 'FOOD4ALL',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF4DA6FF),
            primary: const Color(0xFF4DA6FF),
            secondary: const Color(0xFF1976D2),
          ),
          useMaterial3: true,
          scaffoldBackgroundColor: const Color(0xFFF5FAFF),
          cardTheme: CardThemeData(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(18),
            ),
          ),
        ),
        home: const SplashScreen(),
        routes: {
          '/login': (context) => const LoginScreen(),
          '/register': (context) => const RegisterScreen(),
          '/role-select': (context) => const RoleSelectScreen(),
          '/buyer-home': (context) => const BuyerProductListScreen(),
        },
      ),
    );
  }
}
