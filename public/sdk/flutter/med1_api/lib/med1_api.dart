/// MED1.UZ Flutter SDK
/// Official Dart/Flutter client for the MED1.UZ REST API v1.
///
/// Base URL: https://med1.uz/api-gateway/v1
///
/// Auth: JWT (end users) or X-Api-Key (partners / HAMBI)
///
/// Example:
/// ```dart
/// final client = Med1ApiClient(apiKey: 'md1_...');
/// final clinics = await client.clinics.list(city: 'Tashkent');
/// final aiReply = await client.ai.doctor(messages: [...]);
/// ```
library med1_api;

import 'package:dio/dio.dart';

const String kMed1BaseUrl = 'https://med1.uz/api-gateway/v1';
const String kMed1SandboxBaseUrl = 'https://med1.uz/api-gateway/sandbox/v1';

/// Root client. Instantiate once and reuse across the app.
class Med1ApiClient {
  final Dio _dio;
  final String? apiKey;
  String? _accessToken;
  String? _refreshToken;

  Med1ApiClient({
    String? baseUrl,
    this.apiKey,
    String? accessToken,
    Duration timeout = const Duration(seconds: 30),
  })  : _dio = Dio(BaseOptions(
          baseUrl: baseUrl ?? kMed1BaseUrl,
          connectTimeout: timeout,
          receiveTimeout: timeout,
          headers: {
            'Content-Type': 'application/json',
            if (apiKey != null) 'x-api-key': apiKey,
          },
        )),
        _accessToken = accessToken {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_accessToken != null) {
          options.headers['Authorization'] = 'Bearer $_accessToken';
        }
        handler.next(options);
      },
      onError: (e, handler) async {
        if (e.response?.statusCode == 401 && _refreshToken != null) {
          try {
            await refresh();
            final opts = e.requestOptions;
            opts.headers['Authorization'] = 'Bearer $_accessToken';
            final retry = await _dio.fetch(opts);
            return handler.resolve(retry);
          } catch (_) {}
        }
        handler.next(e);
      },
    ));
  }

  AuthApi get auth => AuthApi(this);
  UserApi get user => UserApi(this);
  AiApi get ai => AiApi(this);
  ClinicsApi get clinics => ClinicsApi(this);
  AppointmentsApi get appointments => AppointmentsApi(this);
  EmrApi get emr => EmrApi(this);
  PaymentsApi get payments => PaymentsApi(this);
  NotificationsApi get notifications => NotificationsApi(this);
  MapsApi get maps => MapsApi(this);

  void setSession({required String accessToken, String? refreshToken}) {
    _accessToken = accessToken;
    _refreshToken = refreshToken;
  }

  Future<void> refresh() async {
    if (_refreshToken == null) throw StateError('no refresh_token');
    final r = await _dio.post('/auth/refresh', data: {'refresh_token': _refreshToken});
    _accessToken = r.data['access_token'] ?? r.data['data']?['access_token'];
    _refreshToken = r.data['refresh_token'] ?? r.data['data']?['refresh_token'] ?? _refreshToken;
  }

  Dio get dio => _dio;
}

// -------- Auth --------
class AuthApi {
  final Med1ApiClient c;
  AuthApi(this.c);

  Future<Map<String, dynamic>> login({String? email, String? phone, required String password}) async {
    final r = await c.dio.post('/auth/login', data: {'email': email, 'phone': phone, 'password': password});
    return Map<String, dynamic>.from(r.data);
  }

  Future<Map<String, dynamic>> register({String? email, String? phone, required String password, Map<String, dynamic>? metadata}) async {
    final r = await c.dio.post('/auth/register', data: {'email': email, 'phone': phone, 'password': password, 'metadata': metadata});
    return Map<String, dynamic>.from(r.data);
  }

  Future<void> sendOtp({String? phone, String? email}) async {
    await c.dio.post('/auth/otp/send', data: {'phone': phone, 'email': email});
  }

  Future<Map<String, dynamic>> verifyOtp({required String token, String? phone, String? email, String type = 'sms'}) async {
    final r = await c.dio.post('/auth/otp/verify', data: {'token': token, 'phone': phone, 'email': email, 'type': type});
    return Map<String, dynamic>.from(r.data);
  }

  Future<void> forgotPassword(String email) async {
    await c.dio.post('/auth/forgot-password', data: {'email': email});
  }

  Future<void> logout() async {
    await c.dio.post('/auth/logout');
  }
}

// -------- User --------
class UserApi {
  final Med1ApiClient c;
  UserApi(this.c);
  Future<Map<String, dynamic>> profile() async {
    final r = await c.dio.get('/user/profile');
    return Map<String, dynamic>.from(r.data);
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> patch) async {
    final r = await c.dio.patch('/user/profile', data: patch);
    return Map<String, dynamic>.from(r.data);
  }
}

// -------- AI (14 services) --------
class AiApi {
  final Med1ApiClient c;
  AiApi(this.c);

  Future<Map<String, dynamic>> _call(String path, Map<String, dynamic> body) async {
    final r = await c.dio.post(path, data: body);
    return Map<String, dynamic>.from(r.data);
  }

  Future<Map<String, dynamic>> doctor({required List<Map<String, String>> messages}) => _call('/ai/doctor', {'messages': messages});
  Future<Map<String, dynamic>> symptoms(Map<String, dynamic> body) => _call('/ai/symptoms', body);
  Future<Map<String, dynamic>> laboratory(Map<String, dynamic> body) => _call('/ai/laboratory', body);
  Future<Map<String, dynamic>> radiology(Map<String, dynamic> body) => _call('/ai/radiology', body);
  Future<Map<String, dynamic>> pregnancy(Map<String, dynamic> body) => _call('/ai/pregnancy', body);
  Future<Map<String, dynamic>> babyCare(Map<String, dynamic> body) => _call('/ai/baby-care', body);
  Future<Map<String, dynamic>> psychologist(Map<String, dynamic> body) => _call('/ai/psychologist', body);
  Future<Map<String, dynamic>> diet(Map<String, dynamic> body) => _call('/ai/diet', body);
  Future<Map<String, dynamic>> pharmacy(Map<String, dynamic> body) => _call('/ai/pharmacy', body);
  Future<Map<String, dynamic>> cosmetology(Map<String, dynamic> body) => _call('/ai/cosmetology', body);
  Future<Map<String, dynamic>> fitness(Map<String, dynamic> body) => _call('/ai/fitness', body);
  Future<Map<String, dynamic>> assistant(Map<String, dynamic> body) => _call('/ai/assistant', body);
  Future<Map<String, dynamic>> monitoring(Map<String, dynamic> body) => _call('/ai/monitoring', body);
  Future<Map<String, dynamic>> prediction(Map<String, dynamic> body) => _call('/ai/prediction', body);
}

// -------- Clinics / Doctors / etc. --------
class ClinicsApi {
  final Med1ApiClient c;
  ClinicsApi(this.c);
  Future<Map<String, dynamic>> list({String? city, String? q, int limit = 50, int offset = 0}) async {
    final r = await c.dio.get('/clinics', queryParameters: {'city': city, 'q': q, 'limit': limit, 'offset': offset});
    return Map<String, dynamic>.from(r.data);
  }
  Future<Map<String, dynamic>> get(String id) async {
    final r = await c.dio.get('/clinics/$id');
    return Map<String, dynamic>.from(r.data);
  }
  Future<Map<String, dynamic>> doctors({String? city, String? specialty, int limit = 50}) async {
    final r = await c.dio.get('/doctors', queryParameters: {'city': city, 'specialty': specialty, 'limit': limit});
    return Map<String, dynamic>.from(r.data);
  }
  Future<Map<String, dynamic>> diagnostics({String? city, int limit = 50}) async {
    final r = await c.dio.get('/diagnostics', queryParameters: {'city': city, 'limit': limit});
    return Map<String, dynamic>.from(r.data);
  }
  Future<Map<String, dynamic>> pharmacies({String? city, bool? is24h, int limit = 50}) async {
    final r = await c.dio.get('/pharmacies', queryParameters: {'city': city, 'is_24h': is24h?.toString(), 'limit': limit});
    return Map<String, dynamic>.from(r.data);
  }
}

// -------- Appointments --------
class AppointmentsApi {
  final Med1ApiClient c;
  AppointmentsApi(this.c);
  Future<Map<String, dynamic>> create(Map<String, dynamic> body) async {
    final r = await c.dio.post('/appointments', data: body);
    return Map<String, dynamic>.from(r.data);
  }
  Future<Map<String, dynamic>> history({int limit = 50}) async {
    final r = await c.dio.get('/appointments/history', queryParameters: {'limit': limit});
    return Map<String, dynamic>.from(r.data);
  }
  Future<void> cancel(String id) async {
    await c.dio.delete('/appointments/$id');
  }
  Future<Map<String, dynamic>> checkin(String id) async {
    final r = await c.dio.post('/appointments/$id/checkin');
    return Map<String, dynamic>.from(r.data);
  }
}

// -------- EMR --------
class EmrApi {
  final Med1ApiClient c;
  EmrApi(this.c);
  Future<Map<String, dynamic>> records() async { final r = await c.dio.get('/emr/records'); return Map<String, dynamic>.from(r.data); }
  Future<Map<String, dynamic>> analyses() async { final r = await c.dio.get('/emr/analyses'); return Map<String, dynamic>.from(r.data); }
  Future<Map<String, dynamic>> prescriptions() async { final r = await c.dio.get('/emr/prescriptions'); return Map<String, dynamic>.from(r.data); }
  Future<Map<String, dynamic>> diagnoses() async { final r = await c.dio.get('/emr/diagnoses'); return Map<String, dynamic>.from(r.data); }
}

// -------- Payments --------
class PaymentsApi {
  final Med1ApiClient c;
  PaymentsApi(this.c);
  Future<Map<String, dynamic>> click(Map<String, dynamic> body) async { final r = await c.dio.post('/payments/click', data: body); return Map<String, dynamic>.from(r.data); }
  Future<Map<String, dynamic>> payme(Map<String, dynamic> body) async { final r = await c.dio.post('/payments/payme', data: body); return Map<String, dynamic>.from(r.data); }
  Future<Map<String, dynamic>> uzum(Map<String, dynamic> body) async { final r = await c.dio.post('/payments/uzum', data: body); return Map<String, dynamic>.from(r.data); }
  Future<Map<String, dynamic>> history() async { final r = await c.dio.get('/payments/history'); return Map<String, dynamic>.from(r.data); }
  Future<Map<String, dynamic>> subscriptions() async { final r = await c.dio.get('/subscriptions'); return Map<String, dynamic>.from(r.data); }
  Future<Map<String, dynamic>> buyMedCoin({required int amount}) async { final r = await c.dio.post('/med-coin/purchase', data: {'amount': amount}); return Map<String, dynamic>.from(r.data); }
}

// -------- Notifications --------
class NotificationsApi {
  final Med1ApiClient c;
  NotificationsApi(this.c);
  Future<Map<String, dynamic>> telegram({required String chatId, required String text}) async {
    final r = await c.dio.post('/notifications/telegram', data: {'chat_id': chatId, 'text': text});
    return Map<String, dynamic>.from(r.data);
  }
  Future<Map<String, dynamic>> email({required String to, required String subject, required String template, Map<String, dynamic>? data}) async {
    final r = await c.dio.post('/notifications/email', data: {'to': to, 'subject': subject, 'template': template, 'data': data});
    return Map<String, dynamic>.from(r.data);
  }
}

// -------- Maps --------
class MapsApi {
  final Med1ApiClient c;
  MapsApi(this.c);
  Future<Map<String, dynamic>> nearby({required double lat, required double lng, double radiusKm = 10}) async {
    final r = await c.dio.get('/maps/nearby', queryParameters: {'lat': lat, 'lng': lng, 'radius_km': radiusKm});
    return Map<String, dynamic>.from(r.data);
  }
  Future<Map<String, dynamic>> geofence() async {
    final r = await c.dio.get('/maps/geofence');
    return Map<String, dynamic>.from(r.data);
  }
}
