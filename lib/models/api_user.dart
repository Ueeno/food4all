class ApiUser {
  final String id;
  final String email;
  final String name;
  final String? phone;
  final String? role;

  ApiUser({
    required this.id,
    required this.email,
    required this.name,
    this.phone,
    this.role,
  });

  factory ApiUser.fromJson(Map<String, dynamic> json) {
    return ApiUser(
      id: json['id'],
      email: json['email'],
      name: json['name'],
      phone: json['phone'],
      role: json['role'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'phone': phone,
      'role': role,
    };
  }
}
