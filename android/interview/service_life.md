## startService vs bindService

说明 Android 中 Service 的两种启动方式（startService 和 bindService）的核心区别，包括生命周期、通信方式以及各自的典型使用场景

### 一、核心区别总览

startService 是“单向启动”，适合无需通信的后台任务；bindService 是“绑定通信”，适合需要组件间交互的场景，两者在生命周期、通信、使用场景上差异显著。

### 二、分维度详细区别

#### 1. 生命周期差异

- startService：

启动后生命周期为 onCreate() → onStartCommand() → onDestroy()。

多次调用 startService() 不会重复创建实例，只会重复执行 onStartCommand()。

必须通过 stopService() 或 stopSelf() 主动停止，否则会一直运行（后台进程）。

- bindService：

绑定后生命周期为 onCreate() → onBind() → onUnbind() → onDestroy()。

多次绑定同一 Service 不会重复创建实例，onBind() 仅执行一次（返回同一个 Binder 对象）。

所有绑定的客户端都解绑（unbindService()）后，Service 自动销毁。

#### 2. 通信方式差异

- startService：

无直接通信能力，只能通过 Intent 在启动时传递数据，无法获取 Service 反馈。

若需通信，需额外配合 BroadcastReceiver、EventBus 等工具。

- bindService：

支持双向通信，通过 onBind() 返回的 Binder 对象（或 Messenger、AIDL），客户端可直接调用 Service 中的方法，Service 也能回调客户端接口。

通信效率高，适合实时交互（如音乐播放器控制、定位数据获取）。

#### 3. 典型使用场景

- startService：

无需交互的后台长任务，例如：下载文件、后台播放音乐（无UI控制）、定时上传数据。

- bindService：

需要组件间交互的场景，例如：音乐播放器的播放/暂停/切歌控制（Activity 调用 Service 方法）、地图 SDK 的定位数据回调（Service 向 Activity 传递位置信息）。

### 三、关键补充

- 一个 Service 可同时被 start 和 bind：需同时调用 stopService() 且所有客户端解绑，Service 才会销毁。

- 8.0+ 后台限制：startService 启动的后台 Service 会被系统限制，需配合前台 Service（显示通知）或 WorkManager 替代。

接下来是第二道面试题，聚焦 Jetpack 核心组件，[请说明 ViewModel 的核心作用，以及它为什么能解决屏幕旋转时数据丢失的问题？同时对比 ViewModel 和 onSaveInstanceState() 的适用场景差异？](./viewmodel)
