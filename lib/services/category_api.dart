import 'package:dio/dio.dart';
import '../models/api_response.dart';
import 'api_client.dart';

class CategoryApi {
  final ApiClient _client = ApiClient();

  Future<ApiResponse<Map<String, dynamic>>> getCategories() async {
    try {
      final response = await _client.get('/api/categories');
      return ApiResponse.fromJson(response.data, (json) => json);
    } on DioException catch (e) {
      if (e.response != null && e.response!.data != null) {
        return ApiResponse.fromJson(e.response!.data, (json) => json);
      }
      return ApiResponse(ok: false, error: ApiError(code: 'CONNECTION_ERROR', message: e.message ?? 'Connection failed'));
    }
  }
}
