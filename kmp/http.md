---
outline: deep
---

# ktor for http request

在 KMP (Kotlin Multiplatform) 开发中，处理 **HTTP 请求**（常用 Ktor 库，非 "kor"）、**JSON 数据解析** 和 **RESTful API 交互** 是跨平台网络层的核心能力。以下从工具选型、核心实现、平台适配到最佳实践，系统梳理完整方案。


# 一、核心工具选型（跨平台友好）
KMP 网络层需兼顾 **多平台一致性**（Android/iOS/Desktop/Web）和 **性能**，推荐组合如下：

| 功能场景                | 推荐库                          | 核心优势                                                                 |
|-------------------------|---------------------------------|--------------------------------------------------------------------------|
| HTTP 请求 | Ktor Client                     | KMP 官方推荐，原生支持多平台，轻量且可灵活配置（引擎、拦截器等）         |
| JSON 数据解析           | Kotlinx Serialization           | Kotlin 官方序列化库，无反射（避免 iOS 反射限制），支持多平台和数据类适配 |
| RESTful API 辅助        | Ktor Client + 自定义封装        | 结合 Ktor 的请求构建能力，封装 REST 标准方法（GET/POST/PUT/DELETE）      |


# 二、Step 1：环境配置（build.gradle.kts）
首先在 KMP 项目的 **共享模块（shared）** 中添加依赖，确保多平台兼容性。


## 1. 基础配置（共享模块 build.gradle.kts）
```kotlin
plugins {
    kotlin("multiplatform") version "1.9.20"
    kotlin("plugin.serialization") version "1.9.20" // JSON 序列化插件
    id("io.ktor.plugin") version "2.3.7" // Ktor 插件（可选，简化配置）
}

kotlin {
    // 声明目标平台（根据需求调整）
    androidTarget()
    iosX64()
    iosArm64()
    iosSimulatorArm64()
    jvm("desktop")
    
    sourceSets {
        // 所有平台共享的代码
        val commonMain by getting {
            dependencies {
                // 1. Ktor Client 核心（多平台）
                implementation("io.ktor:ktor-client-core:2.3.7")
                // 2. Ktor Client 序列化（JSON 解析集成）
                implementation("io.ktor:ktor-client-serialization:2.3.7")
                implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.7")
                // 3. Kotlinx Serialization（JSON 核心）
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
                // 4. 可选：日志拦截器（调试用）
                implementation("io.ktor:ktor-client-logging:2.3.7")
            }
        }

        // 平台特定引擎（HTTP 底层实现，需单独配置）
        val androidMain by getting {
            dependencies {
                // Android 平台：使用 OkHttp 引擎（稳定、支持 HTTP/2）
                implementation("io.ktor:ktor-client-okhttp:2.3.7")
            }
        }

        val iosMain by getting {
            dependencies {
                // iOS 平台：使用 Darwin 引擎（基于 iOS 原生网络库）
                implementation("io.ktor:ktor-client-darwin:2.3.7")
            }
        }

        val desktopMain by getting {
            dependencies {
                // Desktop 平台：使用 Java 引擎（基于 JDK HttpURLConnection）
                implementation("io.ktor:ktor-client-java:2.3.7")
            }
        }
    }
}
```


# 三、Step 2：JSON 数据结构定义（Kotlinx Serialization）
使用 `@Serializable` 注解标记数据类，Kotlinx Serialization 会自动生成序列化/反序列化代码（**无反射**）。

## 示例：用户数据模型
```kotlin
// shared/src/commonMain/kotlin/com/your/package/model/User.kt
import kotlinx.serialization.Serializable

// 1. 基础数据类（与 REST API 响应字段一一对应）
@Serializable
data class User(
    val id: String,          // 对应 API 中的 "id" 字段
    val name: String,        // 对应 API 中的 "name" 字段
    @SerialName("avatar_url") // 若字段名不一致，用 @SerialName 映射
    val avatarUrl: String,
    val email: String? = null // 可选字段（API 可能返回 null）
)

// 2. 列表响应模型（API 常返回 "data: []" 结构）
@Serializable
data class UserListResponse(
    val code: Int,           // 状态码（如 200=成功）
    val message: String,     // 提示信息（如 "success"）
    val data: List<User>     // 核心数据列表
)

// 3. 错误响应模型（统一错误格式）
@Serializable
data class ApiError(
    val code: Int,           // 错误码（如 400=参数错误）
    val message: String      // 错误信息（如 "用户名已存在"）
)
```


# 四、Step 3：RESTful API 网络层封装（Ktor Client）
基于 Ktor Client 封装通用网络工具类，统一处理 **请求配置、拦截器、异常捕获、JSON 解析**，避免重复代码。


## 1. 网络客户端单例（多平台通用）
```kotlin
// shared/src/commonMain/kotlin/com/your/package/network/ApiClient.kt
import io.ktor.client.HttpClient
import io.ktor.client.engine.HttpClientEngine
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logging
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

// 网络客户端单例（需传入平台特定引擎，如 Android 的 OkHttp、iOS 的 Darwin）
class ApiClient(engine: HttpClientEngine) {
    val client = HttpClient(engine) {
        // 1. 日志配置（调试用，生产环境可关闭）
        install(Logging) {
            level = LogLevel.ALL // 打印请求/响应详情
        }

        // 2. JSON 序列化配置（集成 Kotlinx Serialization）
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true // 忽略 API 响应中未定义的字段（避免解析崩溃）
                isLenient = true         // 宽松解析（如允许 JSON 中的注释、换行）
                encodeDefaults = true    // 序列化时包含默认值（如 null 或空列表）
            })
        }

        // 3. 通用请求配置（可选）
        defaultRequest {
            url("https://api.your-domain.com/v1/") // 基础 URL（REST API 前缀）
            headers {
                // 添加通用请求头（如 Token、Content-Type）
                append("Content-Type", "application/json")
                append("Authorization", "Bearer {your_token}") // 后续可动态替换 Token
            }
        }
    }
}
```


## 2. RESTful API 方法封装（GET/POST/PUT/DELETE）
基于 `ApiClient` 封装具体的 REST 接口，返回 `Result<T>` 类型（Kotlin 标准库，统一处理成功/失败）。

```kotlin
// shared/src/commonMain/kotlin/com/your/package/network/ApiService.kt
import com.your.package.model.ApiError
import com.your.package.model.User
import com.your.package.model.UserListResponse
import io.ktor.client.call.body
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType

class ApiService(private val apiClient: ApiClient) {
    // 1. GET 请求：获取用户列表（带查询参数）
    suspend fun getUserList(page: Int, pageSize: Int = 20): Result<UserListResponse> {
        return try {
            val response = apiClient.client.get("users") {
                // 添加查询参数（URL 后拼接 ?page=1&pageSize=20）
                url.parameters.append("page", page.toString())
                url.parameters.append("pageSize", pageSize.toString())
            }
            Result.success(response.body())
        } catch (e: Exception) {
            Result.failure(handleApiError(e))
        }
    }

    // 2. GET 请求：获取单个用户（路径参数）
    suspend fun getUserById(userId: String): Result<User> {
        return try {
            val response = apiClient.client.get("users/$userId") // 路径参数：users/123
            Result.success(response.body())
        } catch (e: Exception) {
            Result.failure(handleApiError(e))
        }
    }

    // 3. POST 请求：创建用户（请求体为 JSON）
    suspend fun createUser(user: User): Result<User> {
        return try {
            val response = apiClient.client.post("users") {
                contentType(ContentType.Application.Json) // 明确 Content-Type
                setBody(user) // 自动序列化为 JSON（基于 Kotlinx Serialization）
            }
            Result.success(response.body())
        } catch (e: Exception) {
            Result.failure(handleApiError(e))
        }
    }

    // 4. PUT 请求：更新用户
    suspend fun updateUser(userId: String, user: User): Result<User> {
        return try {
            val response = apiClient.client.put("users/$userId") {
                contentType(ContentType.Application.Json)
                setBody(user)
            }
            Result.success(response.body())
        } catch (e: Exception) {
            Result.failure(handleApiError(e))
        }
    }

    // 5. DELETE 请求：删除用户
    suspend fun deleteUser(userId: String): Result<Unit> {
        return try {
            apiClient.client.delete("users/$userId")
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(handleApiError(e))
        }
    }

    // 辅助：统一处理 API 错误（解析错误响应或网络异常）
    private fun handleApiError(e: Exception): Exception {
        // 1. 若为 Ktor 响应错误（如 400/500），尝试解析 API 错误信息
        if (e is io.ktor.client.plugins.ResponseException) {
            return try {
                val errorBody = e.response.body<ApiError>()
                Exception("Error ${errorBody.code}: ${errorBody.message}")
            } catch (innerE: Exception) {
                // 解析失败，返回原始错误
                Exception("API Error: ${e.response.status}")
            }
        }
        // 2. 网络异常（如无网、超时）
        return Exception("Network Error: ${e.message ?: "Unknown error"}")
    }
}
```

# 五、最佳实践与注意事项
1. **Token 动态刷新**：  
   在 Ktor Client 中添加 `Auth` 拦截器，监听 401 错误（Token 过期），自动刷新 Token 后重试请求。

2. **网络状态监听**：  
   各平台需单独实现网络状态检测（如 Android 使用 `ConnectivityManager`，iOS 使用 `NWPathMonitor`），避免无网时发起无效请求。

3. **iOS 反射限制**：  
   严禁使用 Java 反射（如 `Gson` 库），必须使用 **Kotlinx Serialization**（编译期生成代码，无反射），否则 iOS 端会崩溃。

4. **线程安全**：  
   KMP 协程在各平台自动适配线程（Android 用 `Dispatchers.Main`，iOS 用 `KotlinxCoroutinesDispatcher`），避免手动切换线程。

5. **测试**：  
   使用 Ktor Client 的 `MockEngine` 模拟 API 响应，在共享模块中编写跨平台网络测试（无需依赖真实后端）。


通过以上方案，可实现 KMP 跨平台项目中 **RESTful API 交互、JSON 解析、HTTP 请求** 的统一封装，兼顾一致性和平台适配性。