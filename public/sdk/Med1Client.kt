// MED1.UZ Kotlin SDK (single-file, coroutines + OkHttp)
// Add: implementation("com.squareup.okhttp3:okhttp:4.12.0")
//      implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
// Package: uz.med1.api

package uz.med1.api

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.security.MessageDigest
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

class Med1ApiException(val status: Int, val code: String, message: String) : RuntimeException(message)

class Med1Client(
    private val apiKey: String,
    private val baseUrl: String = "https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/api-gateway",
    private val hmacSecret: String? = null,
) {
    private val http = OkHttpClient()
    private var accessToken: String? = null
    private var refreshToken: String? = null
    private val JSON_MT = "application/json; charset=utf-8".toMediaType()

    fun setSession(access: String, refresh: String? = null) {
        accessToken = access; refreshToken = refresh
    }

    private fun sha256Hex(s: String): String =
        MessageDigest.getInstance("SHA-256").digest(s.toByteArray()).joinToString("") { "%02x".format(it) }

    private fun hmacHex(secret: String, msg: String): String {
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(secret.toByteArray(), "HmacSHA256"))
        return mac.doFinal(msg.toByteArray()).joinToString("") { "%02x".format(it) }
    }

    suspend fun request(method: String, path: String, body: JsonElement? = null, userId: String? = null): JsonElement =
        withContext(Dispatchers.IO) {
            val bodyText = body?.toString() ?: ""
            val builder = Request.Builder()
                .url(baseUrl + path)
                .header("x-api-key", apiKey)
                .apply { if (userId != null) header("x-user-id", userId) }
                .apply { accessToken?.let { header("Authorization", "Bearer $it") } }

            if (hmacSecret != null) {
                val ts = (System.currentTimeMillis() / 1000).toString()
                val hash = sha256Hex(bodyText)
                builder.header("x-timestamp", ts)
                builder.header("x-signature", hmacHex(hmacSecret, "$ts.$method.$path.$hash"))
            }

            when (method) {
                "GET", "DELETE" -> builder.method(method, null)
                else -> builder.method(method, bodyText.toRequestBody(JSON_MT))
            }

            http.newCall(builder.build()).execute().use { res ->
                val text = res.body?.string() ?: "{}"
                val json = Json.parseToJsonElement(text)
                if (!res.isSuccessful) {
                    val err = (json as? JsonObject)?.get("error") as? JsonObject
                    throw Med1ApiException(
                        res.code,
                        err?.get("code")?.jsonPrimitive?.content ?: "http_error",
                        err?.get("message")?.jsonPrimitive?.content ?: res.message
                    )
                }
                (json as? JsonObject)?.get("data") ?: json
            }
        }

    // Convenience helpers
    suspend fun ping() = request("GET", "/v1/ping")
    suspend fun listClinics(city: String? = null, limit: Int = 50) =
        request("GET", "/v1/clinics?limit=$limit" + (city?.let { "&city=$it" } ?: ""))

    suspend fun aiDoctor(messages: List<Pair<String, String>>, lang: String = "uz"): JsonElement {
        val msgs = buildJsonArray {
            messages.forEach { (r, c) -> add(buildJsonObject { put("role", r); put("content", c) }) }
        }
        return request("POST", "/v1/ai/doctor", buildJsonObject { put("messages", msgs); put("lang", lang) })
    }

    suspend fun login(email: String? = null, phone: String? = null, password: String): JsonElement {
        val body = buildJsonObject {
            email?.let { put("email", it) }; phone?.let { put("phone", it) }; put("password", password)
        }
        val res = request("POST", "/v1/auth/login", body)
        (res as? JsonObject)?.get("access_token")?.jsonPrimitive?.contentOrNull?.let {
            setSession(it, (res)["refresh_token"]?.jsonPrimitive?.contentOrNull)
        }
        return res
    }
}
