
INSERT INTO public.api_sdk_versions (language, version, download_url, repository_url, changelog, is_latest, is_stable, min_api_version)
VALUES
  ('javascript', '0.1.0', 'https://www.npmjs.com/package/@med1uz/api', 'https://github.com/med1uz/js-sdk',
    'Initial release — Auth, User, AI (14 services), Directory, Appointments, EMR, Payments, Notifications, Maps. Node 18+, Deno, Bun, browser. Auto JWT refresh + optional HMAC signing.', true, true, 'v1'),
  ('typescript', '0.1.0', 'https://www.npmjs.com/package/@med1uz/api', 'https://github.com/med1uz/js-sdk',
    'Full TypeScript types shipped with @med1uz/api. Same feature set as the JS build.', true, true, 'v1'),
  ('flutter', '0.1.0', 'https://pub.dev/packages/med1_api', 'https://github.com/med1uz/flutter-sdk',
    'Dart 3 / Flutter 3.10+ client on Dio. Auto refresh, HMAC signing, sandbox mode, 14 AI services.', true, true, 'v1'),
  ('dart', '0.1.0', 'https://pub.dev/packages/med1_api', 'https://github.com/med1uz/flutter-sdk',
    'Pure Dart usage of med1_api (server / CLI). Same package as Flutter.', true, true, 'v1'),
  ('kotlin', '0.1.0', 'https://github.com/med1uz/kotlin-sdk/releases/tag/v0.1.0', 'https://github.com/med1uz/kotlin-sdk',
    'Single-file coroutines client on OkHttp + kotlinx.serialization. HMAC signing, JWT session, 14 AI services.', true, true, 'v1'),
  ('swift', '0.1.0', 'https://github.com/med1uz/swift-sdk/releases/tag/v0.1.0', 'https://github.com/med1uz/swift-sdk',
    'async/await client on URLSession + CryptoKit. iOS 15 / macOS 12+. HMAC signing, JWT session, 14 AI services.', true, true, 'v1'),
  ('python', '0.1.0', 'https://pypi.org/project/med1-api/', 'https://github.com/med1uz/python-sdk',
    'Python 3.8+ client on requests. HMAC signing, JWT session, 14 AI services.', true, true, 'v1'),
  ('php', '0.1.0', 'https://packagist.org/packages/med1uz/api-php', 'https://github.com/med1uz/php-sdk',
    'PHP 7.4+ single-file client (ext-curl). HMAC signing, JWT session, 14 AI services.', true, true, 'v1'),
  ('curl', '1.0.0', 'https://med1.uz/api-docs', 'https://github.com/med1uz/med1-sdks/tree/main/curl',
    'Copy-paste cURL snippets covering auth, directory, AI, appointments, payments and HMAC-signed requests.', true, true, 'v1')
ON CONFLICT (language, version) DO UPDATE SET
  download_url  = EXCLUDED.download_url,
  repository_url = EXCLUDED.repository_url,
  changelog      = EXCLUDED.changelog,
  is_latest      = EXCLUDED.is_latest,
  is_stable      = EXCLUDED.is_stable,
  updated_at     = now();
