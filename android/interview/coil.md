## Coil 图片加载框架

请说明 Coil 相比 Glide 的核心优势，以及 Coil 加载图片并实现圆角、占位图、错误图的核心 API 用法？同时解释 Coil 如何避免 OOM？

### 一、Coil 相比 Glide 的核心优势

Coil 是 Kotlin 原生的图片加载框架（全称 Coroutine Image Loader），设计初衷是“轻量、高效、贴合 Kotlin 生态”，相比 Glide（Java 编写）的核心优势集中在 Kotlin 适配、协程原生支持、API 简洁性 上：

| 对比维度 | Coil | Glide |
| ----- | ---- | ----- |
| 语言生态 | Kotlin-first，原生支持协程、扩展函数、DSL，代码更简洁 | Java 编写，Kotlin 中需适配（如协程包装），API 偏冗余 |
| 异步机制 | 基于 Kotlin 协程（非回调），挂起函数支持，线程切换更自然 | 基于 Handler + 线程池，回调嵌套（需手动封装协程）|
| 依赖体积 | 轻量（核心包 ~150KB），复用 AndroidX 组件（如 Lifecycle），无额外冗余 | 体积较大（核心包 ~400KB），依赖自身封装的生命周期、缓存等模块 |
| 功能支持 | 默认支持 GIF、SVG、WebP、视频帧，无需额外依赖 | 基础格式支持，GIF/SVG 需添加独立依赖库（如 glide-gifdecoder）|
| 生命周期绑定 | 自动绑定 Lifecycle，页面销毁/不可见时自动暂停加载、释放资源，无需手动处理 | 需通过 RequestManager 绑定生命周期，API 配置更繁琐 |
| 易用性 | 扩展函数 imageView.load(url) 一行加载，配置项通过 DSL 链式调用 | 需构建 RequestOptions + Glide.with(context).load(url).apply(options).into(iv)，步骤更多 |

核心优势总结：对 Kotlin 项目更友好，协程异步无回调地狱，API 简洁高效，轻量无冗余，默认功能更全。

### 二、Coil 核心 API 用法（圆角 + 占位图 + 错误图）

Coil 提供了 扩展函数（便捷） 和 ImageRequest.Builder（灵活配置） 两种用法，以下是实战中最常用的配置示例（需先添加依赖：implementation "io.coil-kt:coil:2.4.0"、implementation "io.coil-kt:coil-transformations:2.4.0"）：

#### 1. 基础用法：一行加载图片

````
// 扩展函数：ImageView 直接加载网络图片（默认生命周期绑定）
iv_avatar.load("https://example.com/avatar.png")
````

#### 2. 完整配置：圆角 + 占位图 + 错误图 + 淡入动画

````
iv_avatar.load("https://example.com/avatar.png") {
    // 占位图（加载中显示）
    placeholder(R.drawable.ic_placeholder)
    // 错误图（加载失败显示）
    error(R.drawable.ic_error)
    // 淡入动画（duration：动画时长，单位 ms）
    crossfade(500)
    // 圆角处理（通过 transformations 扩展，支持单独设置四角圆角）
    transformations(
        RoundedCornersTransformation(
            topLeft = 16.dpToPx(),  // 左上角圆角
            topRight = 16.dpToPx(), // 右上角圆角
            bottomLeft = 0f,        // 左下角无圆角
            bottomRight = 16.dpToPx() // 右下角圆角
        )
    )
    // 额外配置：图片尺寸限制（避免加载过大图片）
    size(200.dpToPx().toInt(), 200.dpToPx().toInt())
    // 禁止硬件加速（解决部分机型图片显示异常问题）
    allowHardware(false)
    // 内存缓存策略（仅内存缓存，不缓存到磁盘）
    memoryCachePolicy(CachePolicy.ENABLED)
    diskCachePolicy(CachePolicy.DISABLED)
    // 加载优先级（低优先级：不抢占关键图片加载资源）
    priority(Priority.LOW)
}

// 工具函数：DP 转 PX（适配不同屏幕）
fun Int.dpToPx(): Float = this * Resources.getSystem().displayMetrics.density
````

#### 3. 复杂场景：自定义 ImageRequest（如加载 SVG、监听加载状态）

````
// 构建自定义请求，支持更多回调
val request = ImageRequest.Builder(context)
    .data("https://example.com/icon.svg") // 加载 SVG 格式
    .target(
        onStart = { placeholder ->
            // 加载开始：显示占位图（可选）
            iv_icon.setImageDrawable(placeholder)
        },
        onSuccess = { result ->
            // 加载成功：获取 Drawable 并设置
            iv_icon.setImageDrawable(result)
        },
        onError = { error ->
            // 加载失败：显示错误图 + 日志打印
            iv_icon.setImageResource(R.drawable.ic_error)
            Log.e("Coil", "加载失败", error.throwable)
        }
    )
    .transformations(CircleCropTransformation()) // 圆形裁剪（替代圆角，适用于头像）
    .build()

// 执行请求（需通过 ImageLoader 发起）
Coil.imageLoader(context).enqueue(request)
````

关键 API 说明：

- transformations：图片变换（圆角 RoundedCornersTransformation、圆形 CircleCropTransformation、模糊 BlurTransformation 等）；

- placeholder/error：占位图/错误图（支持资源 ID、Drawable）；

- crossfade：淡入过渡动画（默认关闭，需手动开启）；

- size：限制图片加载尺寸（避免加载过大图片导致 OOM）；

- allowHardware：是否启用硬件加速（RemoteViews/Widget 中需设为 false）。

### 三、Coil 如何避免 OOM？

OOM（内存溢出）的核心原因是“图片占用内存过大”（如加载 4K 图片到 100dp 控件），Coil 从 尺寸优化、内存管理、资源释放 三个维度构建防护机制：

#### 1. 自动尺寸适配（核心手段）

Coil 会 自动根据 ImageView 的实际尺寸，加载对应分辨率的图片，避免“大图小用”：

- 若 ImageView 宽高为 200dp×200dp（对应屏幕像素 400×400），Coil 会请求/解码图片为 400×400 像素，而非原图尺寸（如 2000×2000）；

- 手动通过 size(width, height) 限制尺寸时，Coil 会严格按指定尺寸解码，进一步减少内存占用。

#### 2. 高效的 Bitmap 复用与内存缓存

- Bitmap 池复用：Coil 维护一个 Bitmap 池（复用已回收的 Bitmap 内存），避免频繁创建/销毁 Bitmap 导致的内存碎片；

- Lru 内存缓存：采用 LRU（最近最少使用）策略缓存图片，当内存不足时，自动回收最久未使用的图片缓存，避免内存堆积；

- 磁盘缓存分级：支持内存缓存（快速访问）和磁盘缓存（持久化），可通过 memoryCachePolicy/diskCachePolicy 灵活控制，减少重复网络请求和图片解码。

#### 3. 生命周期感知的资源释放

- Coil 自动绑定 LifecycleOwner（Activity/Fragment），当页面 onDestroy 或 onStop 时：

  - 暂停正在进行的图片加载请求；

  - 释放 ImageView 关联的 Bitmap 资源；

  - 清空当前页面的临时图片缓存，避免内存泄漏。

#### 4. 其他防护机制

- 禁用硬件加速：通过 allowHardware(false) 避免硬件加速导致的 Bitmap 内存无法释放问题（适用于 Widget、RemoteViews 等场景）；

- 渐进式解码：支持 JPEG 渐进式解码，先加载低分辨率缩略图，再逐步清晰，减少单次内存占用峰值；

- 异常捕获：加载超大图片时，自动捕获解码异常，降级显示错误图，避免崩溃。

### 总结

1. Coil 优势：Kotlin 原生、协程支持、API 简洁、轻量、默认功能全，适合 Kotlin 项目替代 Glide；

2. 核心用法：通过 load 扩展函数+DSL 配置，一行实现“圆角+占位图+错误图”，变换功能通过 transformations 实现；

3. 防 OOM 核心：自动尺寸适配、Bitmap 池复用、Lru 缓存、生命周期感知释放资源。

接下来是第七道面试题，[请说明 Android 组件化开发的核心思想，以及如何解决组件间通信、资源冲突、路由跳转这三个核心问题？](./moude)
