class ApiCategory {
  final String id;
  final String label;
  final String icon;

  ApiCategory({
    required this.id,
    required this.label,
    required this.icon,
  });

  factory ApiCategory.fromJson(Map<String, dynamic> json) {
    return ApiCategory(
      id: json['id'],
      label: json['label'],
      icon: json['icon'],
    );
  }
}
