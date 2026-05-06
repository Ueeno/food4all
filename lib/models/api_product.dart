class ApiProduct {
  final String id;
  final String name;
  final String brand;
  final String categoryId;
  final double originalPrice;
  final double discountedPrice;
  final int quantity;
  final String unit;
  final String expiryDate;
  final String? description;
  final String? imageUrl;
  final String? sellerId;
  final String? sellerName;

  ApiProduct({
    required this.id,
    required this.name,
    required this.brand,
    required this.categoryId,
    required this.originalPrice,
    required this.discountedPrice,
    required this.quantity,
    required this.unit,
    required this.expiryDate,
    this.description,
    this.imageUrl,
    this.sellerId,
    this.sellerName,
  });

  factory ApiProduct.fromJson(Map<String, dynamic> json) {
    return ApiProduct(
      id: json['id'],
      name: json['name'],
      brand: json['brand'],
      categoryId: json['categoryId'],
      originalPrice: (json['originalPrice'] as num).toDouble(),
      discountedPrice: (json['discountedPrice'] as num).toDouble(),
      quantity: json['quantity'] as int,
      unit: json['unit'],
      expiryDate: json['expiryDate'],
      description: json['description'],
      imageUrl: json['imageUrl'],
      sellerId: json['sellerId'],
      sellerName: json['sellerName'],
    );
  }
}
