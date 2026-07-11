
UPDATE public.api_sdk_versions SET download_url = 'https://med1.uz/sdk/curl-examples.md', repository_url = NULL WHERE language = 'curl';
UPDATE public.api_sdk_versions SET download_url = 'https://med1.uz/sdk/flutter/med1_api/lib/med1_api.dart', repository_url = NULL WHERE language IN ('dart','flutter');
UPDATE public.api_sdk_versions SET download_url = 'https://med1.uz/sdk/med1-js.ts', repository_url = NULL WHERE language IN ('javascript','typescript');
UPDATE public.api_sdk_versions SET download_url = 'https://med1.uz/sdk/Med1Client.kt', repository_url = NULL WHERE language = 'kotlin';
UPDATE public.api_sdk_versions SET download_url = 'https://med1.uz/sdk/Med1Client.swift', repository_url = NULL WHERE language = 'swift';
UPDATE public.api_sdk_versions SET download_url = 'https://med1.uz/sdk/Med1Client.php', repository_url = NULL WHERE language = 'php';
UPDATE public.api_sdk_versions SET download_url = 'https://med1.uz/sdk/med1_client.py', repository_url = NULL WHERE language = 'python';
