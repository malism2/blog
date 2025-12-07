## ViewModel VS onSaveInstanceState

请说明 ViewModel 的核心作用，以及它为什么能解决屏幕旋转时数据丢失的问题？同时对比 ViewModel 和 onSaveInstanceState() 的适用场景差异？

### 一、ViewModel 核心作用

ViewModel 是 Jetpack 核心组件，核心作用是 存储和管理 UI 相关的数据，隔离 UI 控制器（Activity/Fragment）与数据逻辑，具体包括：

1. 持有 UI 所需的数据（如列表数据、表单输入、网络请求结果），避免数据随 UI 控制器重建而丢失。

2. 封装数据获取逻辑（如调用 Repository 层、网络请求、数据库操作），让 Activity/Fragment 仅负责 UI 渲染，符合单一职责原则。

3. 支持跨组件数据共享（如同一 Activity 下的多个 Fragment 共享数据，通过 Activity 持有同一个 ViewModel 实例）。

### 二、为什么屏幕旋转时数据不丢失？

核心原因是 ViewModel 的生命周期独立于 Activity/Fragment 的配置变更（如旋转、语言切换）：

1. ViewModel 由 ViewModelProvider 创建，其生命周期由 ViewModelStore 管理，而非依附于 Activity/Fragment 实例。

2. 屏幕旋转时，系统会销毁旧的 Activity 实例并创建新实例，但 ViewModelStore 会被系统保留（直到 Activity 真正销毁，如用户按返回键）。

3. 新的 Activity 实例会通过 ViewModelProvider 获取到之前的 ViewModel 实例，因此数据不会丢失。

### 三、ViewModel 与 onSaveInstanceState() 的适用场景差异

| 对比维度 | ViewModel | onSaveInstanceState() |
| ------- | --------- | --------------------- |
| 存储数据类型 | 复杂数据（对象、列表、Bitmap）、非序列化数据 | 简单数据（基本类型、 Serializable/Parcelable 对象）|
| 存储大小限制 | 无明显限制（依赖内存）| 有限制（数据存在 Binder 缓冲区，建议不超过100KB）|
| 适用场景 | 屏幕旋转、配置变更时的大量 UI 数据保留 | 系统回收 Activity（如后台低内存）时的少量关键数据恢复 |
| 生命周期范围 | Activity/Fragment 配置变更后仍存活 | 仅在 Activity 销毁-重建周期中传递数据 |

### 四、关键补充

- ViewModel 不能持有 Activity/Fragment 的 Context 引用（否则会导致内存泄漏），若需上下文，可使用 AndroidViewModel 并持有 Application Context。

- ViewModel 不负责数据持久化（如应用进程被杀死，数据仍会丢失），需配合 Room（数据库）、DataStore 等完成持久化。

接下来是第三道面试题，聚焦 Kotlin 与协程[请说明 Kotlin 协程的核心优势，以及 launch 和 async 的区别？同时解释 Dispatchers 常见的调度器类型及适用场景？](./kotlin_coroutines)
