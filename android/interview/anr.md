## App Not Response

请说明ANR的产生原因及常见类型，以及从编码层面如何避免ANR？

### 一、ANR 核心定义

ANR（Application Not Responding，应用无响应）是 Android 系统对应用的一种“ watchdog 机制”——当 主线程（UI线程）被阻塞超过指定阈值 时，系统会判定应用无响应，弹出ANR提示框（强制关闭/等待）。

核心本质：主线程无法及时处理用户交互或系统回调。

### 二、ANR 的产生原因及常见类型

#### 1. 核心产生原因

所有 ANR 的根源都是 主线程执行了耗时操作，导致无法响应后续事件（用户点击、系统广播等），常见耗时场景：

- 主线程执行 IO 操作（网络请求、数据库读写、文件读写）；

- 主线程执行复杂计算、大数据量解析（如 JSON 解析几万条数据）；

- 主线程同步等待锁（死锁或锁竞争，导致线程阻塞）；

- 广播接收器（BroadcastReceiver）的 onReceive() 方法耗时过长；

- Service 生命周期方法（onCreate()、onStartCommand()）耗时过长；

- 主线程被其他线程持有锁，导致无法执行任务。

#### 2. 常见 ANR 类型及阈值

Android 系统对不同组件的主线程响应有明确时间限制，超过则触发 ANR：

| ANR 类型 | 触发阈值 | 典型场景 |
| -------- | ------- | ------- |
Input Dispatching ANR | 5秒 | 用户点击、滑动等交互事件，主线程5秒内未处理（最常见，如按钮点击后主线程卡5秒）|
| Service ANR | 20秒 | Service 的 onCreate()/onStartCommand()/onBind() 等方法20秒内未完成 |
| BroadcastReceiver ANR | 前台10秒/后台60秒 | 广播接收器的 onReceive() 方法超时（前台广播10秒，后台广播60秒）|
| ContentProvider ANR | 10秒 | ContentProvider 的 query()/insert() 等方法10秒内未完成（较少见）|

### 三、编码层面避免 ANR 的核心方法

核心原则：绝对不让主线程执行任何耗时操作，所有耗时任务都放到后台线程，主线程仅负责 UI 渲染和事件分发。

#### 1. 主线程“轻量化”：耗时操作移至后台

- IO/网络任务：用 Kotlin 协程（Dispatchers.IO）、WorkManager、Thread + Handler 等，避免在主线程直接调用 HttpURLConnection、Room 同步方法、FileInputStream 等。

示例：用协程处理网络请求

// 正确：耗时操作放到 Dispatchers.IO
lifecycleScope.launch(Dispatchers.IO) {
    val data = apiService.fetchData() // 网络请求（耗时）
    withContext(Dispatchers.Main) {
        updateUI(data) // 主线程更新UI
    }
}

- 复杂计算/数据解析：用 Dispatchers.Default（CPU 密集型），避免在主线程做循环解析、排序、加密等操作。

#### 2. 优化 BroadcastReceiver

- 避免在 onReceive() 中做耗时操作（如网络请求、数据库写入），仅做“事件转发”；

- 若需处理耗时逻辑，用 JobIntentService（替代旧的 IntentService）或 WorkManager 接收广播后异步处理；

- 优先使用动态广播（而非静态广播），减少系统唤醒频率。

#### 3. 优化 Service

- 避免在 onCreate()、onStartCommand() 中做耗时操作，若需后台任务，在 Service 中启动协程/线程，或直接用 WorkManager 替代后台 Service（8.0+ 后台 Service 受限制）；

- 若 Service 需持续运行，改为前台 Service（显示通知），避免被系统限制。

#### 4. 避免主线程阻塞/死锁

- 不使用 Thread.sleep()、Object.wait() 等方法阻塞主线程；

- 避免主线程和后台线程相互持有锁（如主线程等待后台线程释放锁，后台线程又等待主线程资源）；

- 减少同步锁的使用，若必须用，缩小锁的作用域（避免大段代码加锁）。

#### 5. 优化 UI 响应性

- 减少布局层级（用 ConstraintLayout 替代嵌套 LinearLayout），避免过度绘制（Overdraw）；

- 列表渲染用 RecyclerView 并开启复用，避免在 onBindViewHolder() 中做耗时操作；

- 避免在主线程频繁创建大量对象（导致 GC 频繁，间接阻塞主线程）。

#### 6. 监控与兜底

- 用 StrictMode（严格模式）检测主线程耗时操作，开发阶段发现潜在问题：

// Application 中初始化
StrictMode.setThreadPolicy(
    StrictMode.ThreadPolicy.Builder()
        .detectDiskReads()
        .detectDiskWrites()
        .detectNetwork()
        .penaltyLog() // 违规操作打印日志
        .build()
)

- 捕获 ANR 日志（/data/anr/traces.txt），线上通过 Crash 监控工具（如 Bugly）收集 ANR 信息，定位阻塞点。

### 四、关键补充

- ANR 不是崩溃，但比崩溃更影响用户体验（用户无法操作应用）；

- 主线程阻塞时间未到阈值（如 3 秒），虽不触发 ANR，但会导致 UI 卡顿，需同样避免；

- 8.0+ 系统对后台应用的限制更严格，后台线程过多也可能间接导致 ANR，需合理管理线程池/协程作用域。

接下来是第五道面试题，[请说明 Room 数据库的核心组成部分（Entity、DAO、Database）的作用，以及 Room 如何保证数据一致性？同时解释 @Insert、@Update、@Delete 注解的常用参数及区别？](./room)

