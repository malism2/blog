---
outline: deep
---

# kmp 最近实践

在Kotlin Multiplatform (KMP) 开发中，**跨平台一致性、平台特性适配、性能与可维护性**是核心原则。以下从11个关键维度，提供经过行业验证的最佳实践、工具推荐及选型理由，覆盖从架构到具体功能实现的全链路需求。


## 一、架构推荐：分层架构 + 领域驱动设计（DDD）
KMP的核心价值是“一份业务逻辑，多端复用”，架构设计需优先保障**业务逻辑跨平台复用率**，同时允许平台层灵活适配原生特性。

### 推荐架构：三层架构（共享层）+ 平台适配层
| 层级          | 职责                                                                 | 跨平台性       | 核心组件/模式                  |
|---------------|----------------------------------------------------------------------|----------------|--------------------------------|
| 数据层（Data）| 数据获取（网络/本地存储）、数据映射（DTO → 领域模型）、数据缓存管理   | 90% 共享       | 仓库模式（Repository）、数据源（DataSource） |
| 领域层（Domain）| 核心业务逻辑、领域模型（Entity）、用例（UseCase）、业务规则校验       | 100% 共享      | 用例模式（UseCase）、领域模型（不可变数据类） |
| 表现层接口（Presentation API） | 定义UI交互接口（如状态流、事件流），不包含具体UI实现                 | 100% 共享      | MVVM（ViewModel接口）、状态管理（StateFlow） |
| 平台适配层    | 实现共享层定义的接口（如原生网络、本地存储、UI渲染）                 | 平台专属       | 期望（Expect/Actual）、平台单例              |

### 选型理由：
1. **高复用率**：领域层和数据层核心逻辑完全共享，避免多端重复开发；
2. **低耦合**：通过“接口定义在共享层，实现在平台层”（Expect/Actual），隔离业务逻辑与平台细节，便于维护；
3. **可测试性**：领域层无平台依赖，可通过单元测试直接验证业务逻辑；
4. **兼容性**：适配Android（Compose）、iOS（SwiftUI/UIKit）、桌面（Compose Desktop）等多端UI框架，无需修改共享层。


## 二、日志：Kermit + 平台原生日志
KMP日志需满足“**跨平台统一API + 平台原生日志集成**”（如Android的Logcat、iOS的Xcode控制台），同时支持日志分级、标签、上下文附加。

### 推荐方案：Kermit（Square开源）
#### 核心特性：
- 跨平台统一API：`Log.d()`/`Log.i()`/`Log.e()` 等方法在Android、iOS、桌面端行为一致；
- 平台原生集成：Android端自动映射到`android.util.Log`，iOS端映射到`OSLog`，桌面端输出到控制台；
- 灵活配置：支持日志级别动态切换（如Debug环境输出Verbose，Release环境仅输出Error）、日志拦截（如上报到远程日志系统）；
- 轻量级：无冗余依赖，仅核心日志功能（约100KB）。

### 替代方案：
- **Napier**：支持日志格式化、多输出源（文件/控制台），但配置略复杂；
- **原生日志**：Android用`Log`、iOS用`print`，但跨平台需手动封装，维护成本高。


## 三、网络请求：Ktor Client + 平台引擎
KMP网络需解决“**跨平台请求逻辑复用 + 平台原生网络性能**”（如Android的OkHttp、iOS的NSURLSession），同时支持拦截器、超时、SSL配置等核心能力。

### 推荐方案：Ktor Client（JetBrains官方）
#### 核心配置：
1. **依赖引入**（共享层）：
   ```kotlin
   // 核心库
   implementation("io.ktor:ktor-client-core:2.3.7")
   // 平台引擎（通过Expect/Actual自动适配）
   // Android端
   implementation("io.ktor:ktor-client-okhttp:2.3.7")
   // iOS端
   implementation("io.ktor:ktor-client-darwin:2.3.7")
   // 辅助功能：JSON解析（与Kotlinx Serialization集成）
   implementation("io.ktor:ktor-client-content-negotiation:2.3.7")
   implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.7")
   ```
2. **核心特性**：
   - 平台原生引擎：Android用OkHttp（成熟稳定，支持HTTP/2）、iOS用Darwin引擎（基于NSURLSession，适配iOS生态）；
   - 声明式API：支持协程（`suspend`函数），避免回调地狱；
   - 插件化扩展：通过插件实现JSON解析、拦截器、缓存、Cookie管理等；
   - 统一错误处理：跨平台捕获网络错误（如超时、404、500），无需平台单独处理。

### 选型理由：
- 官方维护：与Kotlin生态深度集成（如协程、Kotlinx Serialization），兼容性有保障；
- 性能最优：复用平台原生网络引擎，比纯Kotlin实现（如OkHttp跨iOS）性能高30%+；
- 低学习成本：API设计与Retrofit相似，Android开发者可快速上手。


## 四、配置文件：共享配置 + 平台专属配置
KMP配置需区分“**跨平台通用配置**”（如API基础地址、超时时间）和“**平台专属配置**”（如Android的Manifest配置、iOS的Info.plist），避免硬编码。

### 推荐方案：
#### 1. 共享层通用配置：buildSrc + 常量类
- 通过`buildSrc`定义跨平台通用配置（如版本号、API地址），统一管理：
  ```kotlin
  // buildSrc/src/main/kotlin/Config.kt
  object AppConfig {
      const val API_BASE_URL = "https://api.example.com"
      const val NETWORK_TIMEOUT = 30_000 // 30秒
      const val APP_VERSION = "1.0.0"
  }
  ```
- 在共享层直接引用：`val client = HttpClient { baseUrl(AppConfig.API_BASE_URL) }`。

#### 2. 平台专属配置：Expect/Actual + 原生配置文件
- **Android**：通过`BuildConfig`或`res/values/config.xml`存储，在Actual实现中读取；
- **iOS**：通过`Info.plist`存储，在Actual实现中通过`Bundle.main.object(forInfoDictionaryKey:)`读取；
- 共享层定义接口，平台层实现：
  ```kotlin
  // 共享层（Expect）
  expect object PlatformConfig {
      val isDebug: Boolean
      val deviceId: String
  }

  // Android层（Actual）
  actual object PlatformConfig {
      actual val isDebug: Boolean = BuildConfig.DEBUG
      actual val deviceId: String = Settings.Secure.getString(
          context.contentResolver, Settings.Secure.ANDROID_ID
      )
  }

  // iOS层（Actual）
  actual object PlatformConfig {
      actual val isDebug: Boolean = NSProcessInfo.processInfo.environment["DEBUG"] == "1"
      actual val deviceId: String = UIDevice.current.identifierForVendor?.uuidString ?: ""
  }
  ```

### 选型理由：
- 集中管理：避免配置散落在代码中，便于修改（如API地址切换）；
- 平台适配：兼顾通用配置复用和平台专属配置的灵活性。


## 五、本地存储：按数据类型选型
KMP本地存储需根据数据特性（**结构化数据、键值对、大文件**）选择工具，优先保障跨平台复用率和性能。

| 数据类型       | 推荐工具                          | 跨平台性       | 核心优势                                  |
|----------------|-----------------------------------|----------------|-------------------------------------------|
| 结构化数据（如用户信息、列表缓存） | SQLDelight（Square开源）          | 90% 共享       | 1. 用SQL定义 schema，生成跨平台Kotlin接口；<br>2. 底层适配SQLite（Android/iOS）、SQLCipher（加密）；<br>3. 支持协程，无回调地狱。 |
| 键值对（如配置、Token）           | Multiplatform Settings（JetBrains）| 100% 共享      | 1. 极简API（`putString()`/`getString()`）；<br>2. 底层适配SharedPreferences（Android）、UserDefaults（iOS）；<br>3. 支持加密扩展（如EncryptedSettings）。 |
| 大文件（如图片缓存、下载文件）    | 平台原生 + 共享路径管理           | 平台专属       | 1. Android用`Context.filesDir`，iOS用`NSDocumentDirectory`；<br>2. 共享层定义路径接口（如`getCacheDir()`），平台层实现；<br>3. 避免跨平台库的性能损耗（如文件IO）。 |

### 选型理由：
- 各司其职：不同工具适配不同数据场景，避免“一刀切”导致的性能问题；
- 成熟稳定：SQLDelight和Multiplatform Settings均为行业主流，社区活跃，bug修复及时。


## 六、UI界面：Compose Multiplatform（优先）+ 平台原生
KMP UI需平衡“**跨平台复用率**”和“**平台原生体验**”，Compose Multiplatform（JetBrains官方）是当前最优解（尤其Android/iOS/桌面端）。

### 推荐方案：Compose Multiplatform（CMP）
#### 核心优势：
1. **跨平台复用率高**：一份Compose代码可运行在Android、iOS（预览版，2024年已稳定）、桌面（Windows/macOS/Linux）、Web（实验性），UI逻辑100%共享；
2. **声明式UI**：与Android Compose语法完全一致，Android开发者可无缝迁移；
3. **平台原生适配**：支持调用平台原生组件（如Android的`RecyclerView`、iOS的`UIButton`），通过`@Composable expect/actual`实现差异化UI；
4. **性能接近原生**：iOS端基于Skia渲染，性能比Flutter略低，但优于React Native，且与Kotlin生态深度集成。

#### 替代方案（特殊场景）：
- **平台原生UI**：若需极致原生体验（如iOS的SwiftUI、Android的XML布局），可通过“共享层提供状态流，平台层渲染UI”实现（如Android用ViewModel + Compose，iOS用ObservableObject + SwiftUI）；
- **Flutter**：跨平台复用率更高，但与Kotlin生态割裂，需单独维护Flutter代码，适合纯UI跨平台场景。

### 选型理由：
- 生态统一：与KMP共享层（如StateFlow、UseCase）无缝衔接，无需跨语言通信（如Kotlin与Swift的桥接）；
- 学习成本低：Android开发者无需学习新语言，直接复用Compose经验；
- 未来趋势：JetBrains持续投入，2024年已支持iOS正式版，生态逐步完善。


## 七、图片加载：Coil Multiplatform（优先）+ 平台原生
KMP图片加载需解决“**跨平台缓存、内存管理、平台适配**”（如Android的Coil、iOS的Kingfisher），避免重复开发。

### 推荐方案：Coil Multiplatform（Coil团队开源）
#### 核心特性：
1. **跨平台API**：一份代码实现图片加载（网络/本地资源），支持`ImageRequest`、`rememberImagePainter`等Compose风格API；
2. **平台原生适配**：
   - Android端：基于Coil（成熟稳定，支持GIF、WebP，内存优化好）；
   - iOS端：底层适配Kingfisher（iOS主流图片加载库，支持缓存、动图）；
3. **Compose集成**：提供`AsyncImage`组件，直接在Compose UI中使用，支持占位图、错误图、加载状态；
4. **缓存统一**：跨平台共享缓存策略（内存缓存+磁盘缓存），减少重复下载。

### 替代方案：
- **平台原生库**：Android用Coil、iOS用Kingfisher，通过共享层定义图片加载接口（如`ImageLoader`），平台层实现；但需维护两套代码，复用率低。

### 选型理由：
- 无缝集成：与Compose Multiplatform完美配合，API风格一致；
- 性能可靠：底层复用平台成熟库，避免自研图片加载的内存泄漏、OOM问题。


## 八、国际化（i18n）：Compose Multiplatform + 共享资源
KMP国际化需实现“**共享字符串资源 + 平台原生资源适配**”（如Android的`strings.xml`、iOS的`Localizable.strings`），支持多语言切换。

### 推荐方案：Compose Multiplatform 资源系统 + 平台原生资源
#### 1. 共享层字符串（优先，适合CMP UI）：
- 通过Compose Multiplatform的`resources`库，在共享层定义多语言字符串：
  ```kotlin
  // 共享层：src/commonMain/resources/values/strings.xml
  <resources>
      <string name="app_name">My KMP App</string>
      <string name="welcome">Welcome, %s!</string>
  </resources>

  // 共享层：src/commonMain/resources/values-es/strings.xml（西班牙语）
  <resources>
      <string name="app_name">Mi App KMP</string>
      <string name="welcome">¡Bienvenido, %s!</string>
  </resources>
  ```
- 在Compose UI中直接引用：
  ```kotlin
  Text(text = stringResource(R.string.welcome, userName))
  ```

#### 2. 平台原生资源（适合平台原生UI）：
- 若使用平台原生UI（如iOS的SwiftUI），则通过`Expect/Actual`读取平台原生资源：
  ```kotlin
  // 共享层（Expect）
  expect fun getString(resId: String): String

  // Android层（Actual）
  actual fun getString(resId: String): String {
      val id = context.resources.getIdentifier(resId, "string", context.packageName)
      return context.getString(id)
  }

  // iOS层（Actual）
  actual fun getString(resId: String): String {
      return NSLocalizedString(resId, comment = "")
  }
  ```

### 选型理由：
- 复用率高：共享层字符串可直接在CMP UI中使用，无需平台单独维护；
- 平台兼容：兼顾CMP UI和平台原生UI，灵活性高；
- 工具支持：Android Studio支持多语言资源自动生成，便于管理。


## 九、音视频：平台原生SDK + 共享控制逻辑
KMP音视频需优先保障“**平台原生体验**”（如Android的ExoPlayer、iOS的AVPlayer），共享层仅管理控制逻辑（如播放状态、进度），避免跨平台库的性能损耗。

### 推荐方案：共享控制逻辑 + 平台原生播放器
#### 1. 共享层：定义播放器接口与状态
```kotlin
// 共享层：播放器状态（跨平台复用）
data class PlayerState(
    val isPlaying: Boolean = false,
    val progress: Long = 0, // 毫秒
    val duration: Long = 0
)

// 共享层：播放器接口（Expect）
expect class MediaPlayer {
    val state: StateFlow<PlayerState>
    suspend fun play(url: String)
    fun pause()
    fun seekTo(progress: Long)
    fun release()
}
```

#### 2. 平台层：实现原生播放器
- **Android**：基于ExoPlayer实现（支持HLS、DASH，兼容性好）；
- **iOS**：基于AVPlayer实现（原生支持iOS/macOS，性能优）；
- 共享层通过`MediaPlayer`接口控制播放，无需关心底层实现。

### 替代方案：
- **跨平台库**：如ExoPlayer跨iOS（需通过JNI，性能差）、FFmpeg（复杂度高，需自行编译），仅适合特殊场景（如自定义编解码）。

### 选型理由：
- 性能最优：平台原生播放器适配系统硬件加速，播放流畅度远超跨平台库；
- 功能完整：支持系统级特性（如画中画、后台播放、DRM加密），无需自研。


## 十、补充：关键通用最佳实践
1. **依赖管理**：使用`versionCatalog`（`libs.versions.toml`）统一管理跨平台依赖，避免版本冲突；
2. **协程与线程**：共享层使用`CoroutineDispatcher.Main`（通过Expect/Actual适配平台主线程），避免手动切换线程；
3. **测试策略**：
   - 共享层（领域层/数据层）：用JUnit测试（无平台依赖）；
   - 平台层：用AndroidX Test（Android）、XCTest（iOS）测试原生功能；
4. **构建优化**：
   - 启用KMP增量编译（`kotlin.incremental.multiplatform=true`）；
   - 拆分共享层模块（如`:shared:data`、`:shared:domain`），减少编译范围。


## 总结
KMP开发的核心是“**共享核心逻辑，适配平台特性**”，工具选型需兼顾“跨平台复用率”和“平台原生体验”。优先选择JetBrains官方或行业主流库（如Ktor、SQLDelight、Compose Multiplatform），避免自研跨平台组件（尤其音视频、文件IO等高性能场景），可大幅降低开发成本和维护风险。