import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/auth_state.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    // Wait for auth initialization
    await Future.delayed(const Duration(seconds: 1));
    if (!mounted) return;

    final authState = Provider.of<AuthState>(context, listen: false);
    
    if (authState.isAuthenticated) {
      if (authState.selectedRole == null) {
        Navigator.pushReplacementNamed(context, '/role-select');
      } else if (authState.selectedRole == 'buyer') {
        Navigator.pushReplacementNamed(context, '/buyer-home');
      } else {
        // Seller home not implemented yet in Phase 1
        Navigator.pushReplacementNamed(context, '/role-select');
      }
    } else {
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'FOOD4ALL',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1976D2),
              ),
            ),
            SizedBox(height: 20),
            CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
