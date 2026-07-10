# MED1.UZ PHP SDK

Official PHP client for the [MED1.UZ](https://med1.uz) REST API v1.

## Install

```bash
composer require med1uz/api-php
```

## Quick start

```php
use Med1Uz\Med1Client;

$med1 = new Med1Client('md1_live_...');

$clinics = $med1->listClinics(['city' => 'Tashkent', 'limit' => 20]);
$reply   = $med1->aiDoctor([['role' => 'user', 'content' => "Boshim og'riyapti"]], 'uz');

$med1->login(null, '+998901234567', '***');
$profile = $med1->request('GET', '/v1/user/profile');
```

HMAC signing:
```php
$med1 = new Med1Client('md1_live_...', Med1Client::BASE_URL, getenv('MED1_HMAC_SECRET'));
```

MIT — © 2018–2026 MED-ALL AI SYSTEM MCHJ
