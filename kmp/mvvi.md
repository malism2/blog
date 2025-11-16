---
title: MVI 架构
date: 2025-11-16
---

# kmp mvvi

KMP + MVI 架构深度实践指南：从分层设计到多端落地
Kotlin Multiplatform (KMP) 核心价值是“**一份业务逻辑覆盖多端**”，而 MVVI（Model-View-ViewModel-Intent）通过“Intent 驱动状态流转”的单向数据流模式，能完美解决 KMP 多端状态同步、业务逻辑复用与平台特性适配的核心矛盾。本文从架构设计、核心组件实现、平台适配、实战案例四个维度，提供可直接复用的 KMP + MVVI 落地方案。


## 一、MVI 架构在 KMP 中的核心定位
MVI 本质是“**用户操作→业务处理→状态更新→UI 渲染**”的闭环，在 KMP 中需严格区分“**共享层**”（核心逻辑）与“**平台层**”（原生适配），确保业务一致性的同时不牺牲原生体验。

### 1.1 KMP + MVVI 分层模型
| 层级          | 职责边界                                                                 | 跨平台特性       | 技术依赖                          |
|---------------|--------------------------------------------------------------------------|------------------|-----------------------------------|
| **Intent 层** | 定义用户操作（如“登录”“加载列表”），用密封类实现类型安全，避免操作歧义     | 100% 共享        | Kotlin 密封类                      |
| **State 层**  | 定义 UI 唯一数据源，封装“加载/成功/失败”通用状态与业务数据，确保 UI 无冗余判断 | 100% 共享        | Kotlin 数据类/密封类、StateFlow    |
| **ViewModel 层** | 接收 Intent、调用 Repository 处理业务、转换为 State，暴露不可变状态流       | 100% 共享        | Kotlin 协程、StateFlow             |
| **Repository 层** | 数据统一出入口（聚合网络/本地存储），屏蔽数据来源细节，提供干净的业务接口   | 接口共享+实现适配 | 平台原生存储（如 SQLDelight）、Ktor |
| **Model 层**  | 定义数据结构（DTO：服务端模型；Entity：业务模型），实现跨层数据映射         | 100% 共享        | Kotlin 数据类、Kotlin Serialization |
| **View 层**   | 渲染 State、转发用户操作为 Intent，支持 Compose 跨平台 UI 或平台原生 UI     | 平台适配         | Compose Multiplatform、SwiftUI/XML |
| **Platform 层** | 实现共享层 `expect` 接口（如日志、权限、音视频），封装原生能力             | 平台专属         | `expect/actual` 机制、原生 SDK     |

### 1.2 核心设计原则
1. **单向数据流**：Intent → ViewModel → State → View，禁止 View 直接修改 State 或调用 Repository，避免状态混乱；
2. **共享层纯业务**：共享层（Intent/State/ViewModel/Model）无任何平台依赖，仅通过 `expect` 定义平台能力接口；
3. **状态不可变**：UI State 必须是不可变数据类，更新时通过“复制新对象”实现（如 `currentState.copy(isLoading = true)`），确保状态可追溯；
4. **平台最小适配**：仅将“无法跨平台”的能力（如 Android 权限、iOS 推送）放在平台层，核心业务逻辑全部共享。


## 二、共享层核心组件实现（100% 复用）
共享层是 KMP + MVVI 的核心，需先实现 Intent、State、ViewModel、Repository 基础组件，再通过 `expect/actual` 对接平台能力。

### 2.1 Intent 层：用户操作的“类型安全契约”
用密封类定义所有用户操作，确保多端操作统一，避免平台端随意扩展。**每个页面/功能模块对应独立 Intent 类**，降低耦合。

```kotlin
// shared/src/commonMain/kotlin/com/your/app/mvvi/login/LoginIntent.kt
sealed class LoginIntent {
    // 登录操作（携带账号密码参数）
    data class DoLogin(val username: String, val password: String) : LoginIntent()
    // 清除输入内容（无参数）
    object ClearInput : LoginIntent()
    // 跳转注册页面（需平台层处理，通过回调传递）
    object NavigateToRegister : LoginIntent()
}
```

**设计技巧**：
- 带参数的操作（如 `DoLogin`）用 `data class`，无参数用 `object`，减少内存开销；
- 跨页面跳转等“平台专属操作”，通过 Intent 定义，ViewModel 中用回调通知平台层（避免共享层依赖平台导航 API）。


### 2.2 State 层：UI 渲染的“唯一数据源”
State 需同时包含“**通用状态**”（加载/成功/失败）和“**业务数据**”（如账号输入、登录结果），UI 仅需根据 State 分支渲染，无需额外判断。

#### 2.2.1 通用基础状态（可复用）
```kotlin
// shared/src/commonMain/kotlin/com/your/app/mvvi/base/BaseUiState.kt
sealed class BaseUiState<out T> {
    // 加载中（无数据）
    object Loading : BaseUiState<Nothing>()
    // 成功（携带业务数据 T）
    data class Success<out T>(val data: T) : BaseUiState<T>()
    // 失败（携带错误信息+重试逻辑）
    data class Error(
        val errorMsg: String,
        val retryAction: (() -> Unit)? = null // 失败后重试的 Intent 触发逻辑
    ) : BaseUiState<Nothing>()
}
```

#### 2.2.2 业务页面状态（登录页面示例）
```kotlin
// shared/src/commonMain/kotlin/com/your/app/mvvi/login/LoginUiState.kt
// 登录页面的业务数据（不可变数据类）
data class LoginBusinessState(
    val username: String = "",        // 账号输入框内容
    val password: String = "",        // 密码输入框内容
    val isLoginButtonEnabled: Boolean = false, // 登录按钮是否可用（如账号密码非空）
    val loginLoading: Boolean = false // 登录按钮加载状态
)

// 登录页面的完整 UI State（通用状态 + 业务数据）
typealias LoginUiState = BaseUiState<LoginBusinessState>
```

**设计技巧**：
- 用 `typealias` 简化类型定义（如 `LoginUiState = BaseUiState<LoginBusinessState>`）；
- 业务状态中的“派生字段”（如 `isLoginButtonEnabled`）由 ViewModel 计算，避免 UI 层做逻辑判断。


### 2.3 ViewModel 层：业务处理的“中枢”
ViewModel 是 MVVI 的核心，负责：
1. 接收 View 传递的 Intent；
2. 调用 Repository 获取数据/处理业务；
3. 将业务结果转换为 State，通过 StateFlow 暴露给 View；
4. 管理状态快照，避免重复读取 StateFlow。

```kotlin
// shared/src/commonMain/kotlin/com/your/app/viewmodel/LoginViewModel.kt
class LoginViewModel(
    private val loginRepository: LoginRepository, // 依赖 Repository（构造注入，便于测试）
    private val mainDispatcher: CoroutineDispatcher // 平台适配的主线程调度器（expect/actual）
) {
    // 私有可变 State（仅 ViewModel 可修改）
    private val _uiState = MutableStateFlow<LoginUiState>(
        BaseUiState.Success(LoginBusinessState()) // 初始状态：空输入+按钮禁用
    )
    // 公开不可变 State（View 仅观察，不可修改）
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    // 状态快照（缓存当前业务状态，避免频繁从 StateFlow 读取）
    private var currentBusinessState: LoginBusinessState
        get() = (_uiState.value as? BaseUiState.Success)?.data ?: LoginBusinessState()
        set(value) {
            _uiState.value = BaseUiState.Success(value)
        }

    // 处理 Intent 的入口方法（View 调用此方法传递用户操作）
    fun handleIntent(intent: LoginIntent) {
        when (intent) {
            is LoginIntent.DoLogin -> doLogin(intent.username, intent.password)
            LoginIntent.ClearInput -> clearInput()
            LoginIntent.NavigateToRegister -> navigateToRegister()
        }
    }

    // 1. 处理登录业务
    private fun doLogin(username: String, password: String) {
        // 先更新“登录中”状态（避免网络请求延迟导致 UI 无响应）
        currentBusinessState = currentBusinessState.copy(loginLoading = true)
        
        CoroutineScope(mainDispatcher).launch {
            try {
                // 调用 Repository 执行登录（Repository 已处理网络/本地存储）
                val loginResult = loginRepository.login(username, password)
                // 登录成功：可通过回调通知平台层跳转主页（共享层不依赖平台导航）
                onLoginSuccess?.invoke(loginResult.userId)
            } catch (e: Exception) {
                // 登录失败：更新错误状态（带重试逻辑）
                _uiState.value = BaseUiState.Error(
                    errorMsg = e.message ?: "登录失败，请重试",
                    retryAction = { handleIntent(LoginIntent.DoLogin(username, password)) }
                )
            } finally {
                // 无论成功/失败，恢复登录按钮加载状态
                currentBusinessState = currentBusinessState.copy(loginLoading = false)
            }
        }
    }

    // 2. 清除输入内容
    private fun clearInput() {
        currentBusinessState = LoginBusinessState() // 重置为初始状态
    }

    // 3. 跳转注册页面（平台层实现的回调）
    private fun navigateToRegister() {
        onNavigateToRegister?.invoke()
    }

    // ------------------- 平台层注入的回调（避免共享层依赖平台 API） -------------------
    var onLoginSuccess: ((userId: String) -> Unit)? = null // 登录成功跳转主页
    var onNavigateToRegister: (() -> Unit)? = null // 跳转注册页面
}
```

**关键细节**：
- **构造注入**：Repository 和调度器通过构造函数传入，便于单元测试（替换为 Mock 实现）；
- **主线程调度器**：通过 `expect/actual` 适配平台主线程（Android 用 `Dispatchers.Main`，iOS 用 `Dispatchers.Main` 适配的原生主线程）；
- **状态快照**：用 `currentBusinessState` 缓存当前业务状态，避免每次更新都从 `StateFlow` 读取，提升性能；
- **平台回调**：跨页面跳转等平台操作通过回调传递，共享层仅定义接口，不关心实现。


### 2.4 Repository 层：数据的“统一出入口”
Repository 是 MVVI 中“数据层”的核心，负责聚合网络请求、本地存储，对外提供“干净的业务接口”，屏蔽数据来源细节（View/ViewModel 无需关心数据来自网络还是本地）。

#### 2.4.1 Repository 接口（共享层定义能力）
```kotlin
// shared/src/commonMain/kotlin/com/your/app/repository/LoginRepository.kt
interface LoginRepository {
    // 登录（网络请求+本地存储 Token）
    suspend fun login(username: String, password: String): LoginResultEntity
    // 检查本地是否有已登录的 Token
    suspend fun checkLocalToken(): String?
}

// 登录结果业务模型（Entity）
data class LoginResultEntity(
    val userId: String,
    val token: String,
    val expireTime: Long // Token 过期时间（毫秒）
)
```

#### 2.4.2 Repository 实现（共享层+平台适配）
Repository 接口在共享层定义，实现中可调用跨平台库（如 Ktor 网络、SQLDelight 存储），平台特有逻辑通过 `expect/actual` 适配。

```kotlin
// shared/src/commonMain/kotlin/com/your/app/repository/LoginRepositoryImpl.kt
class LoginRepositoryImpl(
    private val ktorClient: HttpClient, // Ktor 网络客户端（共享层单例）
    private val tokenStorage: TokenStorage, // Token 本地存储（expect/actual 实现）
    private val networkChecker: NetworkChecker // 网络状态检查（expect/actual 实现）
) : LoginRepository {

    private val baseUrl = "https://api.your-app.com/v1"

    override suspend fun login(username: String, password: String): LoginResultEntity {
        // 1. 检查网络状态（平台适配能力）
        if (!networkChecker.isNetworkAvailable()) {
            throw NetworkUnavailableException("无网络连接，请检查网络")
        }

        // 2. 发起网络请求（Ktor 跨平台）
        val loginDto = ktorClient.post("$baseUrl/auth/login") {
            contentType(ContentType.Application.Json)
            setBody(LoginRequestDto(username, password)) // 服务端请求模型（DTO）
        }.body<LoginResponseDto>() // 服务端响应模型（DTO）

        // 3. DTO 转换为 Entity（屏蔽服务端模型变化对业务层的影响）
        val loginResult = LoginResultEntity(
            userId = loginDto.userId,
            token = loginDto.token,
            expireTime = System.currentTimeMillis() + (loginDto.expireSeconds * 1000)
        )

        // 4. 本地存储 Token（平台适配存储）
        tokenStorage.saveToken(loginResult.token, loginResult.expireTime)

        return loginResult
    }

    override suspend fun checkLocalToken(): String? {
        val (token, expireTime) = tokenStorage.getTokenWithExpireTime()
        // 检查 Token 是否过期
        return if (token.isNullOrEmpty() || expireTime < System.currentTimeMillis()) {
            tokenStorage.clearToken() // 过期则清除
            null
        } else {
            token
        }
    }
}

// ------------------- 辅助类定义 -------------------
// 服务端请求 DTO（与服务端字段严格对应）
@kotlinx.serialization.Serializable
private data class LoginRequestDto(
    val username: String,
    val password: String
)

// 服务端响应 DTO
@kotlinx.serialization.Serializable
private data class LoginResponseDto(
    val userId: String,
    val token: String,
    val expireSeconds: Int // 服务端返回过期秒数
)

// 自定义异常（共享层可复用）
class NetworkUnavailableException(message: String) : Exception(message)
```

**设计技巧**：
- **DTO 与 Entity 分离**：DTO 对应服务端模型（字段严格匹配），Entity 对应业务模型（按业务需求定义），避免服务端字段变化影响业务层；
- **聚合能力**：Repository 聚合网络、存储、网络检查等能力，ViewModel 仅需调用 `login()` 即可，无需关心内部逻辑；
- **异常封装**：自定义业务异常（如 `NetworkUnavailableException`），便于 ViewModel 统一处理错误。


## 三、平台适配层实现（`expect/actual` 机制）
KMP 中“无法跨平台”的能力（如本地存储、网络检查、主线程调度器），通过 `expect/actual` 机制实现：共享层用 `expect` 声明接口，平台层用 `actual` 实现。

### 3.1 主线程调度器适配（ViewModel 依赖）
ViewModel 需要在主线程更新 State，避免 UI 线程安全问题，需适配各平台主线程调度器。

```kotlin
// 1. 共享层声明（expect）
// shared/src/commonMain/kotlin/com/your/app/platform/CoroutineDispatcherProvider.kt
expect object CoroutineDispatcherProvider {
    val main: CoroutineDispatcher // 平台主线程调度器
    val io: CoroutineDispatcher   // 平台 IO 线程调度器
}

// 2. Android 平台实现（actual）
// shared/src/androidMain/kotlin/com/your/app/platform/CoroutineDispatcherProvider.kt
import kotlinx.coroutines.Dispatchers

actual object CoroutineDispatcherProvider {
    actual val main: CoroutineDispatcher = Dispatchers.Main
    actual val io: CoroutineDispatcher = Dispatchers.IO
}

// 3. iOS 平台实现（actual）
// shared/src/iosMain/kotlin/com/your/app/platform/CoroutineDispatcherProvider.kt
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.MainCoroutineDispatcher

actual object CoroutineDispatcherProvider {
    actual val main: CoroutineDispatcher = Dispatchers.Main // Ktor 已适配 iOS 主线程
    actual val io: CoroutineDispatcher = Dispatchers.IO
}
```

### 3.2 Token 本地存储适配（Repository 依赖）
用 Multiplatform Settings 实现跨平台键值对存储，适配 Android SharedPreferences 和 iOS UserDefaults。

```kotlin
// 1. 共享层声明（expect）
// shared/src/commonMain/kotlin/com/your/app/platform/TokenStorage.kt
expect interface TokenStorage {
    suspend fun saveToken(token: String, expireTime: Long)
    suspend fun getTokenWithExpireTime(): Pair<String?, Long> // (Token, 过期时间)
    suspend fun clearToken()
}

// 2. 共享层实现（基于 Multiplatform Settings，无需平台单独写 actual）
// shared/src/commonMain/kotlin/com/your/app/platform/TokenStorageImpl.kt
import com.russhwolf.settings.ExperimentalSettingsApi
import com.russhwolf.settings.ObservableSettings
import com.russhwolf.settings.coroutines.getLongOrNullFlow
import com.russhwolf.settings.coroutines.getStringOrNullFlow
import com.russhwolf.settings.set
import kotlinx.coroutines.Dispatchers