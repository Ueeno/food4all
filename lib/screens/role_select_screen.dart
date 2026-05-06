import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/auth_state.dart';
import '../widgets/app_button.dart';

class RoleSelectScreen extends StatelessWidget {
  const RoleSelectScreen({super.key});

  Future<void> _selectRole(BuildContext context, String role) async {
    final authState = Provider.of<AuthState>(context, listen: false);
    final error = await authState.selectRole(role);
    
    if (error != null) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error)),
        );
      }
    } else {
      if (context.mounted) {
        if (role == 'buyer') {
          Navigator.pushReplacementNamed(context, '/buyer-home');
        } else {
          // Seller area not implemented in Phase 1
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Seller area coming soon!')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = Provider.of<AuthState>(context);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 60),
              const Text(
                'Choose Your Role',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1976D2),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'How do you want to use FOOD4ALL?',
                style: TextStyle(fontSize: 16, color: Color(0xFF666666)),
              ),
              const SizedBox(height: 48),
              _RoleCard(
                title: 'I want to Buy',
                description: 'Browse local foods and save money.',
                icon: Icons.shopping_bag_outlined,
                onTap: () => _selectRole(context, 'buyer'),
                isLoading: authState.isLoading && authState.selectedRole == 'buyer',
              ),
              const SizedBox(height: 24),
              _RoleCard(
                title: 'I want to Sell',
                description: 'List products and reduce food waste.',
                icon: Icons.storefront_outlined,
                onTap: () => _selectRole(context, 'seller'),
                isLoading: authState.isLoading && authState.selectedRole == 'seller',
              ),
              const Spacer(),
              AppButton(
                label: 'Logout',
                onPressed: () {
                  authState.logout();
                  Navigator.pushReplacementNamed(context, '/login');
                },
                color: Colors.grey,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;
  final VoidCallback onTap;
  final bool isLoading;

  const _RoleCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.onTap,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: isLoading ? null : onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE0E0E0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF5FAFF),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: const Color(0xFF4DA6FF), size: 32),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF666666),
                    ),
                  ),
                ],
              ),
            ),
            if (isLoading)
              const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            else
              const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}
