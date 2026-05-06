class ApiResponse<T> {
  final bool ok;
  final T? data;
  final ApiError? error;

  ApiResponse({required this.ok, this.data, this.error});

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic json) fromDataJson,
  ) {
    return ApiResponse(
      ok: json['ok'] ?? false,
      data: json['ok'] == true && json['data'] != null
          ? fromDataJson(json['data'])
          : null,
      error: json['ok'] == false && json['error'] != null
          ? ApiError.fromJson(json['error'])
          : null,
    );
  }
}

class ApiError {
  final String code;
  final String message;
  final Map<String, String>? fieldErrors;

  ApiError({
    required this.code,
    required this.message,
    this.fieldErrors,
  });

  factory ApiError.fromJson(Map<String, dynamic> json) {
    return ApiError(
      code: json['code'] ?? 'SERVER_ERROR',
      message: json['message'] ?? 'An unexpected error occurred',
      fieldErrors: json['fieldErrors'] != null
          ? Map<String, String>.from(json['fieldErrors'])
          : null,
    );
  }
}
