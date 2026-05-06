import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/auth_state.dart';
import '../state/product_state.dart';
import '../widgets/product_card.dart';

class BuyerProductListScreen extends StatefulWidget {
  const BuyerProductListScreen({super.key});

  @override
  State<BuyerProductListScreen> createState() => _BuyerProductListScreenState();
}

class _BuyerProductListScreenState extends State<BuyerProductListScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (!mounted) return;
      final productState = Provider.of<ProductState>(context, listen: false);
      productState.fetchCategories();
      productState.fetchProducts();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = Provider.of<AuthState>(context);
    final productState = Provider.of<ProductState>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('FOOD4ALL', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              authState.logout();
              Navigator.pushReplacementNamed(context, '/login');
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Greeting
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                const CircleAvatar(
                  backgroundColor: Color(0xFF4DA6FF),
                  child: Icon(Icons.person, color: Colors.white),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hello, ${authState.currentUser?.name ?? 'Buyer'}',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const Text('What would you like to save today?',
                        style: TextStyle(fontSize: 14, color: Color(0xFF666666))),
                  ],
                ),
              ],
            ),
          ),

          // Categories
          SizedBox(
            height: 50,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: productState.categories.length + 1,
              itemBuilder: (context, index) {
                if (index == 0) {
                  return _CategoryChip(
                    label: 'All',
                    isSelected: productState.selectedCategoryId == null,
                    onTap: () => productState.fetchProducts(),
                  );
                }
                final category = productState.categories[index - 1];
                return _CategoryChip(
                  label: category.label,
                  isSelected: productState.selectedCategoryId == category.id,
                  onTap: () => productState.fetchProducts(categoryId: category.id),
                );
              },
            ),
          ),

          // Product Grid
          Expanded(
            child: productState.isLoadingProducts
                ? const Center(child: CircularProgressIndicator())
                : productState.products.isEmpty
                    ? const Center(child: Text('No products found'))
                    : GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.7,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                        ),
                        itemCount: productState.products.length,
                        itemBuilder: (context, index) {
                          final product = productState.products[index];
                          return ProductCard(
                            product: product,
                            onTap: () {
                              // Details screen in Phase 2
                            },
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) => onTap(),
        selectedColor: const Color(0xFF4DA6FF),
        labelStyle: TextStyle(
          color: isSelected ? Colors.white : Colors.black,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
    );
  }
}
