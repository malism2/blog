## Android 内存泄漏

### 一、内存泄漏核心定义

内存泄漏（Memory Leak）是指 程序中已不再使用的对象，因被意外持有强引用，导致垃圾回收（GC）无法回收其占用的内存。随着泄漏积累，内存占用持续升高，最终触发 OOM（OutOfMemoryError），是 Android 性能优化的核心痛点。

### 二、内存泄漏的常见原因

所有内存泄漏的本质都是「长生命周期对象持有短生命周期对象的强引用」，常见场景可归纳为 5 类：

1. 长生命周期对象（单例、静态变量）持有 Activity/Fragment Context；

2. 未取消的监听器/回调（EventBus、广播、View 监听）；

3. 线程/协程未正确销毁（线程持有组件引用、协程未取消作用域）；

4. 资源未关闭/释放（Cursor、IO 流、Bitmap、WebView 未销毁）；

5. 集合类缓存泄漏（全局 List/Map 存储对象后未移除）。

### 三、内存泄漏的排查方法

#### 1. 开发阶段：LeakCanary（首选，自动检测）

- 接入方式（Gradle 依赖）：

    ```
    debugImplementation 'com.squareup.leakcanary:leakcanary-android:2.12'
    ```

- 核心作用：App 运行时自动检测泄漏，弹出通知并生成「泄漏报告」，包含：

  - 泄漏对象类型（如 MainActivity）；

  - 引用链（如「单例 → Activity Context → Activity」）；

  - 泄漏根因（如「单例持有 Activity Context」）。

#### 2. 线上/复杂场景：Android Studio Memory Profiler

核心步骤：

  - 打开 Profiler → 选择 Memory 面板；

  - 操作触发泄漏场景（如进入/退出 Activity）；

  - 点击「Dump Java Heap」捕获堆转储文件（.hprof）；

  - 分析堆文件：筛选泄漏对象（如 Activity），查看「Reference Chain」定位引用持有者。

#### 3. 辅助工具：MAT（Memory Analyzer Tool）

适用于复杂堆文件分析：将 Profiler 导出的 .hprof 转换为 MAT 支持格式，通过 Dominator Tree - Path to GC Roots 定位泄漏根因。

### 四、内存泄漏的通用解决方案

核心原则：切断「长生命周期对象 → 短生命周期对象」的强引用，具体手段：

1. 用「弱引用（WeakReference）」替代强引用（如缓存场景）；

2. 生命周期对齐：组件销毁时（onDestroy）取消监听、终止线程、释放资源；

3. 避免静态变量持有组件引用，单例优先使用 Application Context；

4. 及时清理集合：全局缓存使用「弱引用集合（WeakHashMap）」，或用完即移除元素；

5. 协程使用「生命周期绑定作用域」（lifecycleScope/viewModelScope），自动取消。

### 五、3 种典型内存泄漏场景（附错误写法 + 修复方案）

场景 1：单例持有 Activity Context（最常见）

错误写法（泄漏根因）：

单例生命周期与 App 一致，持有 Activity Context 后，Activity 销毁时无法被 GC 回收：

```
// 单例类（长生命周期）
class UserManager private constructor(context: Context) {
    private val mContext: Context = context // 持有Activity Context（短生命周期）
    
    companion object {
        @Volatile
        private var INSTANCE: UserManager? = null
        // Activity中调用：UserManager.getInstance(this)
        fun getInstance(context: Context): UserManager {
            if (INSTANCE == null) {
                synchronized(this) {
                    INSTANCE = UserManager(context) // 传入Activity Context
                }
            }
            return INSTANCE!!
        }
    }
}
```

修复方案（改用 Application Context）：

Application Context 生命周期与 App 一致，不会因组件销毁导致泄漏：

```
class UserManager private constructor(context: Context) {
    // 改用Application Context（生命周期与App一致）
    private val mContext: Context = context.applicationContext 
    
    companion object {
        @Volatile
        private var INSTANCE: UserManager? = null
        // 仍接收Context，但内部转换为Application Context
        fun getInstance(context: Context): UserManager {
            if (INSTANCE == null) {
                synchronized(this) {
                    INSTANCE = UserManager(context)
                }
            }
            return INSTANCE!!
        }
    }
}
```

场景 2：未取消的 EventBus 注册

错误写法（泄漏根因）：

Activity 销毁后，EventBus 仍持有其强引用，导致无法回收：

```
class HomeActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        EventBus.getDefault().register(this) // 注册EventBus
    }

    // 未重写onDestroy取消注册
    @Subscribe
    fun onUpdateEvent(event: UpdateEvent) { /* 处理事件 */ }
}
```
修复方案（生命周期对齐，销毁时取消注册）：
```
class HomeActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        EventBus.getDefault().register(this)
    }

    override fun onDestroy() {
        super.onDestroy()
        // 销毁时取消注册，切断EventBus对Activity的引用
        EventBus.getDefault().unregister(this) 
    }

    @Subscribe
    fun onUpdateEvent(event: UpdateEvent) { /* 处理事件 */ }
}
```

场景 3：线程持有 Activity 引用且未终止

错误写法（泄漏根因）：

线程无限循环且持有 Activity 引用，Activity 销毁后线程仍运行，导致泄漏：
```
class DetailActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // 线程持有Activity的隐式引用（this）
        Thread {
            while (true) { // 无限循环，线程永不结束
                Thread.sleep(1000)
                // runOnUiThread持有Activity引用
                runOnUiThread { tv_content.text = "更新数据" }
            }
        }.start()
    }
}
```
修复方案（协程 + 生命周期绑定，自动取消）：

推荐使用 lifecycleScope（绑定 Activity 生命周期），组件销毁时协程自动取消：
```
class DetailActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // lifecycleScope：Activity销毁时自动取消协程
        lifecycleScope.launch {
            // isActive：协程是否活跃（Activity销毁后为false）
            while (isActive) { 
                delay(1000) // 替代Thread.sleep，非阻塞
                tv_content.text = "更新数据"
            }
        }
    }
}
```

### 六、关键补充（其他高频泄漏场景）

1. WebView 泄漏：WebView 持有 Context 引用，需手动销毁：
```
override fun onDestroy() {
    super.onDestroy()
    webView.removeAllViews()
    webView.destroy() // 必须调用，否则泄漏
}
```
2. Bitmap 泄漏：用完后回收（API 30+ 已自动管理，低版本需手动）：
```
bitmap.recycle() // 释放Bitmap内存
bitmap = null // 切断引用
```
3. 集合泄漏：全局缓存改用 WeakHashMap（键为弱引用，GC 自动回收）：
```
val cache = WeakHashMap<String, Any>() // 弱引用集合，避免内存泄漏
```

###总结

1. 内存泄漏本质：长生命周期对象持有短生命周期对象的强引用；

2. 排查工具：开发阶段用 LeakCanary 自动检测，复杂场景用 Memory Profiler/MAT；

3. 核心修复手段：生命周期对齐（取消监听/终止线程）、弱引用替代强引用、使用 Application Context；

4. 高频场景：单例持 Context、未取消的监听器、线程/协程未销毁。

接下来是第九道面试题，聚焦跨进程通信——请说明 Android 跨进程通信（IPC）的常见方式（至少 3 种），并对比 AIDL 和 Messenger 的核心区别及适用场景？
