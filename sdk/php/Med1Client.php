<?php
/**
 * MED1.UZ PHP SDK — official client for the MED1.UZ REST API v1.
 * PHP 7.4+ · Requires ext-curl, ext-json, ext-hash.
 *
 * composer require med1uz/api-php
 * Docs: https://med1.uz/developers
 */

namespace Med1Uz;

class Med1ApiException extends \RuntimeException {
    public int $status;
    public string $code;
    public function __construct(int $status, string $code, string $message) {
        parent::__construct("[$status $code] $message");
        $this->status = $status; $this->code = $code;
    }
}

class Med1Client {
    public const BASE_URL = 'https://api.med1.uz';

    private string $apiKey;
    private string $baseUrl;
    private ?string $hmacSecret;
    private ?string $accessToken = null;
    private ?string $refreshToken = null;

    public function __construct(string $apiKey, string $baseUrl = self::BASE_URL, ?string $hmacSecret = null) {
        $this->apiKey = $apiKey;
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->hmacSecret = $hmacSecret;
    }

    public function setSession(string $access, ?string $refresh = null): void {
        $this->accessToken = $access;
        if ($refresh !== null) $this->refreshToken = $refresh;
    }

    public function request(string $method, string $path, ?array $body = null, ?string $userId = null) {
        $url = $this->baseUrl . $path;
        $bodyText = $body === null ? '' : json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $headers = ['Content-Type: application/json', 'x-api-key: ' . $this->apiKey];
        if ($this->accessToken) $headers[] = 'Authorization: Bearer ' . $this->accessToken;
        if ($userId) $headers[] = 'x-user-id: ' . $userId;

        if ($this->hmacSecret) {
            $ts = (string) time();
            $hash = hash('sha256', $bodyText);
            $sig = hash_hmac('sha256', "$ts.$method.$path.$hash", $this->hmacSecret);
            $headers[] = 'x-timestamp: ' . $ts;
            $headers[] = 'x-signature: ' . $sig;
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_POSTFIELDS => $body === null ? null : $bodyText,
        ]);
        $raw = curl_exec($ch);
        if ($raw === false) {
            $err = curl_error($ch); curl_close($ch);
            throw new Med1ApiException(0, 'network_error', $err);
        }
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode($raw, true);
        if ($status < 200 || $status >= 300) {
            $e = $data['error'] ?? [];
            throw new Med1ApiException($status, $e['code'] ?? 'http_error', $e['message'] ?? 'HTTP error');
        }
        return $data['data'] ?? $data;
    }

    public function ping() { return $this->request('GET', '/v1/ping'); }
    public function listClinics(array $query = []) {
        $qs = http_build_query($query);
        return $this->request('GET', '/v1/clinics' . ($qs ? "?$qs" : ''));
    }
    public function aiDoctor(array $messages, string $lang = 'uz') {
        return $this->request('POST', '/v1/ai/doctor', ['messages' => $messages, 'lang' => $lang]);
    }
    public function login(?string $email, ?string $phone, string $password) {
        $body = array_filter(['email' => $email, 'phone' => $phone, 'password' => $password]);
        $res = $this->request('POST', '/v1/auth/login', $body);
        if (is_array($res) && !empty($res['access_token'])) {
            $this->setSession($res['access_token'], $res['refresh_token'] ?? null);
        }
        return $res;
    }
}
