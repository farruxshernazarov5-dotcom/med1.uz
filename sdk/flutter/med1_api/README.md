# MED1.UZ Flutter SDK

Official Dart / Flutter client for the [MED1.UZ](https://med1.uz) REST API v1.

## Installation

```yaml
dependencies:
  med1_api: ^0.1.0
```

Or install directly from git:

```yaml
dependencies:
  med1_api:
    git:
      url: https://github.com/med1uz/flutter-sdk
      path: sdk/flutter/med1_api
```

## Quick start

### 1. Partner / HAMBI (API Key)

```dart
import 'package:med1_api/med1_api.dart';

final client = Med1ApiClient(apiKey: 'md1_live_...');

final clinics = await client.clinics.list(city: 'Tashkent');
print(clinics['items']);
```

### 2. Mobile app (end user JWT)

```dart
final client = Med1ApiClient();

// Login
final session = await client.auth.login(
  phone: '+998901234567',
  password: 'secret',
);
client.setSession(
  accessToken: session['access_token'],
  refreshToken: session['refresh_token'],
);

// Now call authenticated endpoints
final profile = await client.user.profile();
final history = await client.appointments.history();
```

### 3. AI (14 services)

```dart
final reply = await client.ai.doctor(messages: [
  {'role': 'user', 'content': 'Boshim og\'riyapti, nima qilay?'},
]);
print(reply);

final symptoms = await client.ai.symptoms({
  'symptoms': ['headache', 'fever'],
  'age': 30,
});
```

### 4. Appointments

```dart
final apt = await client.appointments.create({
  'clinic_id': 'uuid',
  'doctor_id': 'uuid',
  'date': '2026-08-01',
  'time': '10:00',
  'patient_name': 'Ali Valiyev',
  'patient_phone': '+998901234567',
});
```

### 5. Nearby clinics

```dart
final nearby = await client.maps.nearby(lat: 41.31, lng: 69.28, radiusKm: 5);
```

## Environments

```dart
// Production (default)
Med1ApiClient(apiKey: '...');

// Sandbox — test with fake data
Med1ApiClient(baseUrl: kMed1SandboxBaseUrl, apiKey: 'sandbox_...');
```

## Auto refresh

The SDK automatically refreshes expired JWTs when a `refresh_token` is set via `setSession()`.

## Full API reference

- Interactive docs: <https://med1.uz/api-docs>
- OpenAPI spec: <https://med1.uz/openapi.json>
- Developer Portal: <https://med1.uz/developers>

## License

MIT — © 2018–2026 MED-ALL AI SYSTEM MCHJ
