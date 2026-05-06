import 'package:dio/dio.dart';
import '../models/api_response.dart';
import 'api_client.dart';

class ProductApi {
  final ApiClient _client = ApiClient();

  Future<ApiResponse<Map<String, dynamic>>> getProducts({
    String? search,
    String? categoryId,
    int? page,
    int? pageSize,
  }) async {
    try {
      final queryParameters = <String, dynamic>{};
      if (search != null) queryParameters['search'] = search;
      if (categoryId != null) queryParameters['categoryId'] = categoryId;
      if (page != null) queryParameters['page'] = page;
      if (pageSize != null) queryParameters['pageSize'] = pageSize;

      final response = await _client.get('/api/products', queryParameters: queryParameters);
      return ApiResponse.fromJson(response.data, (json) => json);
    } on DioException catch (e) {
      if (e.response != null && e.response!.data != null) {
        return ApiResponse.fromJson(e.response!.data, (json) => json);
      }
      return ApiResponse(ok: false, error: ApiError(code: 'CONNECTION_ERROR', message: e.message ?? 'Connection failed'));
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> getProductById(String id) async {
    try {
      final response = await _client.get('/api/products/$id');
      return ApiResponse.fromJson(response.data, (json) => json);
    } on DioException catch (e) {
      if (e.response != null && e.response!.data != null) {
        return ApiResponse.fromJson(e.response!.data, (json) => json);
      }
      return ApiResponse(ok: false, error: ApiError(code: 'CONNECTION_ERROR', message: e.message ?? 'Connection failed'));
    }
  }
}
