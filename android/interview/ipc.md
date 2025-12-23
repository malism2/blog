## Android 跨进程通信（IPC）

请说明 Android 跨进程通信（IPC）的常见方式（至少 3 种），并对比 AIDL 和 Messenger 的核心区别及适用场景？

### 一、IPC 核心定义

跨进程通信（Inter-Process Communication，IPC）是指 两个独立进程（如 App 主进程/后台服务进程、不同 App 进程）之间交换数据或调用功能 的机制。Android 中进程拥有独立内存空间，默认无法直接共享数据，需通过系统提供的 IPC 机制突破内存隔离。

### 二、Android 常见 IPC 方式（核心 5 种）

#### 1. Intent + Bundle（简单数据传递）

- 核心原理：通过 Intent 携带 Bundle 传递数据，Bundle 仅支持 Serializable/Parcelable 序列化类型。

- 适用场景：简单单向数据传递（如启动其他 App 的 Activity 并传递订单号、用户 ID）。

- 限制：数据大小受限（Binder 缓冲区约 1MB），仅支持“一次性传递”，无双向通信能力。

#### 2. Messenger（轻量级双向通信）

- 核心原理：基于 AIDL 封装，通过 Message + Handler 实现跨进程消息收发，底层依赖 Binder。

- 适用场景：低并发的双向通信（如 App 主进程向后台服务进程发送“播放/暂停”指令）。

- 特点：单线程处理消息，无需手动处理线程同步，开发成本低。

#### 3. AIDL（复杂场景双向通信）

- 核心原理：通过定义 AIDL 接口文件，系统自动生成跨进程通信代码，底层是 Binder 驱动。

- 适用场景：高并发、复杂交互的 IPC（如音乐播放器服务被多个进程并发调用、需要回调通知）。

- 特点：支持多线程、复杂数据类型（自定义 Parcelable、List/Map），需手动处理线程同步。

#### 4. ContentProvider（数据共享型 IPC）

- 核心原理：封装数据访问接口，供其他进程（如其他 App）查询/修改数据，底层依赖 Binder。

- 适用场景：数据共享（如系统通讯录/媒体库、App 对外提供数据查询能力）。

- 特点：自带权限控制，支持批量数据操作，是 Android 系统最常用的“跨 App 数据共享”方案。

#### 5. Socket（网络型 IPC）

- 核心原理：基于 TCP/UDP 协议的通信，不依赖 Binder，可跨设备/跨进程。

- 适用场景：跨设备通信（如 App 与智能硬件）、长连接场景（如即时通讯、实时数据同步）。

- 特点：不受 Binder 数据大小限制，但需处理网络异常、线程阻塞问题。

### 三、AIDL 与 Messenger 的核心区别及适用场景

| 对比维度 | AIDL | Messenger |
| ------ | ----- | ------|
| 底层实现 |  基于 Binder，手动定义接口 | 基于 AIDL 封装，Message + Handler | 
| 线程模型 | 多线程（客户端并发调用，需手动同步） | 单线程（所有消息排队处理，无需同步） |
| 通信能力 | 双向通信（支持回调接口） | 双向通信（但回调仍为单线程） |
| 数据类型 | 支持复杂类型（自定义 Parcelable、List/Map） | 仅支持 Message 可携带的类型（Bundle、基础类型） |
| 开发复杂度 | 高（需写 AIDL 文件、处理线程同步） | 低（仅需 Handler 处理消息） |
| 性能 | 高（直接 IPC，无封装开销） | 中（封装层有轻微性能损耗） |
| 适用场景 | 高并发、复杂交互（如音乐服务被多进程调用） | 低并发、简单指令传递（如主进程控制后台服务） |


实战示例（核心代码）

1. Messenger 实现（服务端 + 客户端）

- 服务端：

```
class MessengerService : Service() {
    // 处理客户端消息的 Handler
    private val msgHandler = object : Handler(Looper.getMainLooper()) {
        override fun handleMessage(msg: Message) {
            when (msg.what) {
                1 -> {
                    // 接收客户端数据
                    val content = msg.data.getString("content")
                    Log.d("Messenger", "收到客户端消息：$content")
                    // 可选：向客户端回传消息
                    val replyMsg = Message.obtain().apply {
                        what = 2
                        data = Bundle().apply { putString("reply", "已收到：$content") }
                    }
                    msg.replyTo?.send(replyMsg) // 通过 replyTo 回调客户端
                }
            }
        }
    }

    // 暴露 Messenger 的 Binder
    private val messenger = Messenger(msgHandler)
    override fun onBind(intent: Intent): IBinder = messenger.binder
}
```

- 客户端：

```
// 绑定服务后获取 Messenger
val serviceMessenger = Messenger(serviceBinder)
// 发送消息给服务端
val msg = Message.obtain().apply {
    what = 1
    data = Bundle().apply { putString("content", "Hello Messenger") }
    replyTo = Messenger(clientHandler) // 客户端的 Messenger，用于接收回复
}
serviceMessenger.send(msg)
```

2. AIDL 实现（核心步骤）

- 步骤 1：定义 AIDL 文件（IMyAidlInterface.aidl）：

```
interface IMyAidlInterface {
    // 定义跨进程方法
    String getServerResponse(String content);
    // 注册回调（支持双向通信）
    void registerCallback(ICallback callback);
}

// 回调接口 AIDL
interface ICallback {
    void onResult(String result);
}
```

- 步骤 2：服务端实现接口：

```
class AidlService : Service() {
    private val binder = object : IMyAidlInterface.Stub() {
        override fun getServerResponse(content: String): String {
            return "服务端响应：$content"
        }

        override fun registerCallback(callback: ICallback) {
            // 保存回调，异步通知客户端
            callback.onResult("回调通知：处理完成")
        }
    }

    override fun onBind(intent: Intent): IBinder = binder
}
```

- 步骤 3：客户端调用：

```
val aidlInterface = IMyAidlInterface.Stub.asInterface(serviceBinder)
// 同步调用跨进程方法
val response = aidlInterface.getServerResponse("Hello AIDL")
// 注册回调
aidlInterface.registerCallback(object : ICallback.Stub() {
    override fun onResult(result: String) {
        Log.d("AIDL", "收到回调：$result")
    }
})
```

### 四、关键补充

1. Binder 是核心：除 Socket 外，Intent、Messenger、AIDL、ContentProvider 均基于 Binder 实现；

2. 序列化选型：跨进程传递自定义对象优先用 Parcelable（效率远高于 Serializable）；

3. 权限控制：IPC 需在 AndroidManifest.xml 声明权限（如 android:permission），避免恶意进程调用。

总结

1. 常见 IPC 方式：Intent+Bundle（简单传参）、Messenger（轻量级双向）、AIDL（复杂高并发）、ContentProvider（数据共享）、Socket（跨设备）；

2. AIDL vs Messenger：AIDL 适合高并发/复杂交互，需手动处理线程同步；Messenger 适合低并发/简单指令，开发成本低；

3. 核心选型原则：简单场景用 Messenger/Intent，复杂场景用 AIDL，数据共享用 ContentProvider，跨设备用 Socket。

接下来是第十道面试题，[说明 MVVM 架构的核心组成部分及各部分职责，以及 MVVM 相比 MVC/MVP 的核心优势？并举例说明 ViewModel 与 View 的数据绑定实现方式？](./mvvm)
