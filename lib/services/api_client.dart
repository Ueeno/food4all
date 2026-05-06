import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:path_provider/path_provider.dart';
import '../config/app_config.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  late Dio dio;
  late PersistCookieJar cookieJar;
  bool _initialized = false;

  factory ApiClient() {
    return _instance;
  }

  ApiClient._internal() {
    dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      contentType: 'application/json',
    ));
  }

  Future<void> init() async {
    if (_initialized) return;

    final appDocDir = await getApplicationDocumentsDirectory();
    final String cookiePath = '${appDocDir.path}/.cookies/';
    cookieJar = PersistCookieJar(storage: FileStorage(cookiePath));
    
    dio.interceptors.add(CookieManager(cookieJar));
    
    // Add logger for debug
    dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
    ));

    _initialized = true;
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    await init();
    return dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data}) async {
    await init();
    return dio.post(path, data: data);
  }

  Future<Response> patch(String path, {dynamic data}) async {
    await init();
    return dio.patch(path, data: data);
  }

  Future<Response> delete(String path, {dynamic data}) async {
    await init();
    return dio.delete(path, data: data);
  }
}
