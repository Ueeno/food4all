import 'package:flutter_test/flutter_test.dart';
import 'package:food4all/models/api_response.dart';
import 'package:food4all/models/api_user.dart';
import 'package:food4all/models/api_product.dart';

void main() {
  group('API Model Parsing', () {
    test('Parse ApiUser from JSON', () {
      final json = {
        'id': 'user-1',
        'email': 'test@example.com',
        'name': 'Test User',
        'role': 'buyer'
      };
      final user = ApiUser.fromJson(json);
      expect(user.id, 'user-1');
      expect(user.email, 'test@example.com');
      expect(user.name, 'Test User');
      expect(user.role, 'buyer');
    });

    test('Parse ApiProduct from JSON', () {
      final json = {
        'id': 'prod-1',
        'name': 'Corned Beef',
        'brand': 'Purefoods',
        'categoryId': 'cat-1',
        'originalPrice': 100,
        'discountedPrice': 80,
        'quantity': 10,
        'unit': 'can',
        'expiryDate': '2026-12-31T00:00:00.000Z',
      };
      final product = ApiProduct.fromJson(json);
      expect(product.id, 'prod-1');
      expect(product.originalPrice, 100.0);
      expect(product.discountedPrice, 80.0);
    });

    test('Parse successful ApiResponse', () {
      final json = {
        'ok': true,
        'data': {'id': '1', 'name': 'Item'}
      };
      final response = ApiResponse<Map<String, dynamic>>.fromJson(
        json,
        (data) => Map<String, dynamic>.from(data),
      );
      expect(response.ok, true);
      expect(response.data?['name'], 'Item');
      expect(response.error, isNull);
    });

    test('Parse error ApiResponse', () {
      final json = {
        'ok': false,
        'error': {
          'code': 'VALIDATION_ERROR',
          'message': 'Invalid email',
          'fieldErrors': {'email': 'Already exists'}
        }
      };
      final response = ApiResponse<Map<String, dynamic>>.fromJson(
        json,
        (data) => {},
      );
      expect(response.ok, false);
      expect(response.error?.code, 'VALIDATION_ERROR');
      expect(response.error?.message, 'Invalid email');
      expect(response.error?.fieldErrors?['email'], 'Already exists');
    });
  });
}
