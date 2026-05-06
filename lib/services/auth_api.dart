import 'package:dio/dio.dart';
import '../models/api_response.dart';
import 'api_client.dart';

class AuthApi {
  final ApiClient _client = ApiClient();

  Future<ApiResponse<Map<String, dynamic>>> login(String email, String password) async {
    try {
      final response = await _client.post('/api/auth/login', data: {
        'email': email,
        'password': password,
      });
      return ApiResponse.fromJson(response.data, (json) => json);
    } on DioException catch (e) {
      if (e.response != null && e.response!.data != null) {
        return ApiResponse.fromJson(e.response!.data, (json) => json);
      }
      return ApiResponse(ok: false, error: ApiError(code: 'CONNECTION_ERROR', message: e.message ?? 'Connection failed'));
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? role,
  }) async {
    try {
      final response = await _client.post('/api/auth/register', data: {
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'password': password,
        'role': role,
      });
      return ApiResponse.fromJson(response.data, (json) => json);
    } on DioException catch (e) {
      if (e.response != null && e.response!.data != null) {
        return ApiResponse.fromJson(e.response!.data, (json) => json);
      }
      return ApiResponse(ok: false, error: ApiError(code: 'CONNECTION_ERROR', message: e.message ?? 'Connection failed'));
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> getMe() async {
    try {
      final response = await _client.get('/api/auth/me');
      return ApiResponse.fromJson(response.data, (json) => json);
    } on DioException catch (e) {
      if (e.response != null && e.response!.data != null) {
        return ApiResponse.fromJson(e.response!.data, (json) => json);
      }
      return ApiResponse(ok: false, error: ApiError(code: 'CONNECTION_ERROR', message: e.message ?? 'Connection failed'));
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> logout() async {
    try {
      final response = await _client.post('/api/auth/logout');
      return ApiResponse.fromJson(response.data, (json) => json);
    } on DioException catch (e) {
      if (e.response != null && e.response!.data != null) {
        return ApiResponse.fromJson(e.response!.data, (json) => json);
      }
      return ApiResponse(ok: false, error: ApiError(code: 'CONNECTION_ERROR', message: e.message ?? 'Connection failed'));
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> selectRole(String role) async {
    try {
      final response = await _client.patch('/api/auth/role', data: {'role': role});
      return ApiResponse.fromJson(response.data, (json) => json);
    } on DioException catch (e) {
      if (e.response != null && e.response!.data != null) {
        return ApiResponse.fromJson(e.response!.data, (json) => json);
      }
      return ApiResponse(ok: false, error: ApiError(code: 'CONNECTION_ERROR', message: e.message ?? 'Connection failed'));
    }
  }
}
