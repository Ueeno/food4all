import 'package:flutter/material.dart';
import '../models/api_product.dart';
import '../models/api_category.dart';
import '../services/product_api.dart';
import '../services/category_api.dart';

class ProductState extends ChangeNotifier {
  final ProductApi _productApi = ProductApi();
  final CategoryApi _categoryApi = CategoryApi();

  List<ApiProduct> _products = [];
  List<ApiCategory> _categories = [];
  bool _isLoadingProducts = false;
  bool _isLoadingCategories = false;
  String? _selectedCategoryId;

  List<ApiProduct> get products => _products;
  List<ApiCategory> get categories => _categories;
  bool get isLoadingProducts => _isLoadingProducts;
  bool get isLoadingCategories => _isLoadingCategories;
  String? get selectedCategoryId => _selectedCategoryId;

  Future<void> fetchCategories() async {
    _isLoadingCategories = true;
    notifyListeners();

    final response = await _categoryApi.getCategories();
    _isLoadingCategories = false;

    if (response.ok && response.data != null) {
      final List<dynamic> categoriesJson = response.data!['categories'];
      _categories = categoriesJson.map((j) => ApiCategory.fromJson(j)).toList();
    }
    notifyListeners();
  }

  Future<void> fetchProducts({String? search, String? categoryId}) async {
    _isLoadingProducts = true;
    _selectedCategoryId = categoryId;
    notifyListeners();

    final response = await _productApi.getProducts(
      search: search,
      categoryId: categoryId,
    );
    _isLoadingProducts = false;

    if (response.ok && response.data != null) {
      final List<dynamic> productsJson = response.data!['products'];
      _products = productsJson.map((j) => ApiProduct.fromJson(j)).toList();
    }
    notifyListeners();
  }
}
