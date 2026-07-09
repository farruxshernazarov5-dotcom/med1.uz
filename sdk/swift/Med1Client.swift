// MED1.UZ Swift SDK (async/await, URLSession, single file)
// Copy into your Xcode project; requires iOS 15 / macOS 12+ / Swift 5.5+.

import Foundation
import CryptoKit

public struct Med1ApiError: Error, CustomStringConvertible {
    public let status: Int
    public let code: String
    public let message: String
    public var description: String { "Med1ApiError(\(status) \(code): \(message))" }
}

public final class Med1Client {
    public let baseUrl: URL
    public let apiKey: String
    public var accessToken: String?
    public var refreshToken: String?
    public let hmacSecret: String?
    private let session: URLSession

    public init(
        apiKey: String,
        baseUrl: URL = URL(string: "https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/api-gateway")!,
        hmacSecret: String? = nil,
        session: URLSession = .shared
    ) {
        self.apiKey = apiKey
        self.baseUrl = baseUrl
        self.hmacSecret = hmacSecret
        self.session = session
    }

    public func setSession(access: String, refresh: String? = nil) {
        self.accessToken = access
        self.refreshToken = refresh
    }

    private func sha256Hex(_ s: String) -> String {
        SHA256.hash(data: Data(s.utf8)).map { String(format: "%02x", $0) }.joined()
    }
    private func hmacHex(_ secret: String, _ msg: String) -> String {
        let key = SymmetricKey(data: Data(secret.utf8))
        return HMAC<SHA256>.authenticationCode(for: Data(msg.utf8), using: key)
            .map { String(format: "%02x", $0) }.joined()
    }

    public func request<T: Decodable>(_ method: String, _ path: String, body: Encodable? = nil,
                                      userId: String? = nil, as type: T.Type = T.self) async throws -> T {
        let data = try await raw(method, path, body: body, userId: userId)
        // Unwrap { success, data, ... }
        struct Envelope<D: Decodable>: Decodable { let data: D? }
        if let env = try? JSONDecoder().decode(Envelope<T>.self, from: data), let d = env.data { return d }
        return try JSONDecoder().decode(T.self, from: data)
    }

    public func raw(_ method: String, _ path: String, body: Encodable? = nil, userId: String? = nil) async throws -> Data {
        var req = URLRequest(url: baseUrl.appendingPathComponent(path))
        req.httpMethod = method
        req.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let userId { req.setValue(userId, forHTTPHeaderField: "x-user-id") }
        if let t = accessToken { req.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization") }

        var bodyText = ""
        if let body {
            let d = try JSONEncoder().encode(AnyEncodable(body))
            req.httpBody = d
            bodyText = String(data: d, encoding: .utf8) ?? ""
        }

        if let secret = hmacSecret {
            let ts = String(Int(Date().timeIntervalSince1970))
            let hash = sha256Hex(bodyText)
            req.setValue(ts, forHTTPHeaderField: "x-timestamp")
            req.setValue(hmacHex(secret, "\(ts).\(method).\(path).\(hash)"), forHTTPHeaderField: "x-signature")
        }

        let (data, resp) = try await session.data(for: req)
        let http = resp as! HTTPURLResponse
        if !(200..<300).contains(http.statusCode) {
            struct ErrEnv: Decodable { struct E: Decodable { let code: String?; let message: String? } ; let error: E? }
            let e = (try? JSONDecoder().decode(ErrEnv.self, from: data))?.error
            throw Med1ApiError(status: http.statusCode, code: e?.code ?? "http_error", message: e?.message ?? http.description)
        }
        return data
    }

    // MARK: helpers
    public func ping() async throws -> Data { try await raw("GET", "/v1/ping") }
    public func listClinics(city: String? = nil, limit: Int = 50) async throws -> Data {
        var comps = URLComponents()
        comps.queryItems = [URLQueryItem(name: "limit", value: "\(limit)")]
        if let city { comps.queryItems?.append(URLQueryItem(name: "city", value: city)) }
        return try await raw("GET", "/v1/clinics?" + (comps.percentEncodedQuery ?? ""))
    }
    public func aiDoctor(messages: [[String: String]], lang: String = "uz") async throws -> Data {
        struct Body: Encodable { let messages: [[String: String]]; let lang: String }
        return try await raw("POST", "/v1/ai/doctor", body: Body(messages: messages, lang: lang))
    }
    public func login(email: String? = nil, phone: String? = nil, password: String) async throws -> Data {
        struct B: Encodable { let email: String?; let phone: String?; let password: String }
        let d = try await raw("POST", "/v1/auth/login", body: B(email: email, phone: phone, password: password))
        if let obj = try? JSONSerialization.jsonObject(with: d) as? [String: Any],
           let at = obj["access_token"] as? String {
            setSession(access: at, refresh: obj["refresh_token"] as? String)
        }
        return d
    }
}

// Erased Encodable wrapper (Swift < 5.9 compat).
struct AnyEncodable: Encodable {
    let value: Encodable
    init(_ v: Encodable) { value = v }
    func encode(to encoder: Encoder) throws { try value.encode(to: encoder) }
}
