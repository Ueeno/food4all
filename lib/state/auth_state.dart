import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/api_user.dart';
import '../services/auth_api.dart';

class AuthState extends ChangeNotifier {
  final AuthApi _authApi = AuthApi();
  ApiUser? _currentUser;
  bool _isLoading = false;
  String? _selectedRole;

  ApiUser? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _currentUser != null;
  String? get selectedRole => _selectedRole;

  AuthState() {
    _loadFromPrefs();
  }

  Future<void> _loadFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString('current_user');
    if (userJson != null) {
      _currentUser = ApiUser.fromJson(jsonDecode(userJson));
    }
    _selectedRole = prefs.getString('selected_role');
    notifyListeners();
    
    // Refresh user from API
    checkAuth();
  }

  Future<void> checkAuth() async {
    final response = await _authApi.getMe();
    if (response.ok && response.data != null) {
      final userJson = response.data!['user'];
      if (userJson != null) {
        _currentUser = ApiUser.fromJson(userJson);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('current_user', jsonEncode(_currentUser!.toJson()));
      } else {
        _currentUser = null;
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('current_user');
      }
    } else {
      // If unauthorized, clear local user
      if (response.error?.code == 'UNAUTHENTICATED') {
        _currentUser = null;
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('current_user');
      }
    }
    notifyListeners();
  }

  Future<String?> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    final response = await _authApi.login(email, password);
    _isLoading = false;

    if (response.ok && response.data != null) {
      _currentUser = ApiUser.fromJson(response.data!['user']);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('current_user', jsonEncode(_currentUser!.toJson()));
      _selectedRole = _currentUser!.role;
      if (_selectedRole != null) {
        await prefs.setString('selected_role', _selectedRole!);
      }
      notifyListeners();
      return null; // Success
    } else {
      notifyListeners();
      return response.error?.message ?? 'Login failed';
    }
  }

  Future<String?> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? role,
  }) async {
    _isLoading = true;
    notifyListeners();

    final response = await _authApi.register(
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      role: role,
    );
    _isLoading = false;

    if (response.ok && response.data != null) {
      _currentUser = ApiUser.fromJson(response.data!['user']);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('current_user', jsonEncode(_currentUser!.toJson()));
      _selectedRole = _currentUser!.role;
      if (_selectedRole != null) {
        await prefs.setString('selected_role', _selectedRole!);
      }
      notifyListeners();
      return null; // Success
    } else {
      notifyListeners();
      return response.error?.message ?? 'Registration failed';
    }
  }

  Future<void> logout() async {
    await _authApi.logout();
    _currentUser = null;
    _selectedRole = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('current_user');
    await prefs.remove('selected_role');
    notifyListeners();
  }

  Future<String?> selectRole(String role) async {
    _isLoading = true;
    notifyListeners();

    final response = await _authApi.selectRole(role);
    _isLoading = false;

    if (response.ok && response.data != null) {
      _currentUser = ApiUser.fromJson(response.data!['user']);
      _selectedRole = _currentUser!.role;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('current_user', jsonEncode(_currentUser!.toJson()));
      if (_selectedRole != null) {
        await prefs.setString('selected_role', _selectedRole!);
      }
      notifyListeners();
      return null;
    } else {
      notifyListeners();
      return response.error?.message ?? 'Role selection failed';
    }
  }
}
