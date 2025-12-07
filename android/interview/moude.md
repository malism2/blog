# Android 组件化开发

请说明 Android 组件化开发的核心思想，以及如何解决组件间通信、资源冲突、路由跳转这三个核心问题？

### 一、组件化开发的核心思想

组件化是 Android 大型项目的主流架构模式，核心思想是 **“拆分、解耦、复用、集成”**：  

将一个庞大的 App 按 **业务功能/职责** 拆分为多个独立的“组件”（如首页组件、用户组件、订单组件、公共组件），每个组件可独立编译、调试、测试（作为单独 App 运行），最终通过“集成模式”组合为完整 App。

核心目标：

1. 解耦：组件间低依赖/无依赖，避免“牵一发而动全身”；

2. 并行开发：不同团队负责不同组件，提升开发效率；

3. 复用：公共功能（如登录、支付、工具类）封装为组件，多 App 复用；

4. 维护性：单个组件体积小，便于定位问题和迭代。

关键原则：**组件边界清晰、依赖关系单向（上层组件依赖下层组件，禁止循环依赖）**。

### 二、组件化核心问题的解决方案（实战落地）

#### 1. 组件间通信：解决“无依赖组件如何交换数据/调用功能”

组件间禁止直接依赖（如订单组件不能直接引用用户组件的类），需通过“中间层”实现通信，主流方案有 2 种：

##### （1）路由框架 + 接口暴露（主流：ARouter）

核心思路：通过路由框架（如 ARouter）作为通信桥梁，组件通过“暴露接口”提供服务，其他组件通过接口调用，无需关心实现。  

**步骤实现**：

1. 新建基础组件（base-component）：存放公共接口（IProvider），所有业务组件依赖该基础组件；

2. 提供服务的组件（如用户组件）：实现基础组件中的接口，用 `@Route` 注解暴露服务；

3. 调用服务的组件（如订单组件）：通过 ARouter 获取接口实例，调用方法（无直接依赖）。

**代码示例**：

- 基础组件定义接口：

    ```Kotlin
    // 基础组件中的公共接口
    interface UserService : IProvider {
        fun getCurrentUserId(): String // 获取当前用户ID
        fun getUserInfo(userId: String): UserInfo // 获取用户信息
    }
    ```

- 用户组件实现接口：

    ```Kotlin
    // 用户组件中实现接口（隐藏实现细节）
    @Route(path = "/user/service") // 暴露服务的路由地址
    class UserServiceImpl : UserService {
        override fun getCurrentUserId(): String {
            return "user_123" // 实际场景从本地缓存/数据库获取
        }

        override fun getUserInfo(userId: String): UserInfo {
            return UserInfo(userId, "张三", "13800138000")
        }

        override fun init(context: Context?) {}
    }
    ```

- 订单组件调用服务：

    ```Kotlin
    // 订单组件中通过ARouter获取服务，无依赖用户组件
    val userService = ARouter.getInstance().build("/user/service").navigation() as UserService
    val userId = userService.getCurrentUserId()
    val userInfo = userService.getUserInfo(userId)
    Log.d("OrderComponent", "当前用户：${userInfo.userName}")
    
    ```

##### （2）EventBus/Flow 事件通信（适用于“通知类场景”）

对于“无需返回结果”的通信（如用户登录成功后通知其他组件刷新），用 EventBus 或 Kotlin Flow 发送事件，组件订阅事件即可。  

**示例（Flow）**：

- 基础组件定义事件：

    ```Kotlin
    // 基础组件中的事件模型
    data class UserLoginEvent(val userId: String)
    ```

- 用户组件发送事件（登录成功后）：

    ```Kotlin
    // 用户组件：登录成功后发送事件
    fun loginSuccess(userId: String) {
        EventBus.post(UserLoginEvent(userId)) // 或用Flow的SharedFlow发送
    }    
    ```

- 订单组件订阅事件：

    ```Kotlin
    // 订单组件：订阅登录事件，刷新订单列表
    @Subscribe(threadMode = ThreadMode.MAIN) // EventBus注解
    fun onUserLogin(event: UserLoginEvent) {
        refreshOrderList(event.userId) // 刷新当前用户的订单
    }

    // 注册/取消订阅（避免内存泄漏）
    override fun onStart() {
        super.onStart()
        EventBus.getDefault().register(this)
    }

    override fun onStop() {
        super.onStop()
        EventBus.getDefault().unregister(this)
    }
    ```

**通信场景总结**：

- 需返回结果、同步调用：用 ARouter + 接口暴露；

- 无返回结果、异步通知：用 EventBus/Flow。

#### 2. 资源冲突：解决“多组件资源名重复”

多组件中若存在同名资源（如 `ic_back.png`、`string_app_name`），编译时会冲突，解决方案：

##### （1）资源命名规范 + 前缀约束

- 强制约定：所有组件的资源名必须加“组件前缀”（如首页组件前缀 `home_`、订单组件前缀 `order_`）；

- 示例：首页组件的返回图标 `ic_home_back.png`，订单组件的返回图标 `ic_order_back.png`，避免重名。

##### （2）Gradle 配置 resourcePrefix（强制前缀）

在组件的 `build.gradle` 中配置资源前缀，编译时自动校验，未加前缀的资源会报错：

```Plain Text
android {
    defaultConfig {
        // 强制当前组件所有资源名以“order_”为前缀
        resourcePrefix "order_" 
    }
}
```

##### （3）公共资源统一存放

将全局复用的资源（如主题、颜色、尺寸、基础图标）统一放在「基础组件（base-component）」的 `res` 目录下，业务组件直接引用，避免重复定义。

#### 3. 路由跳转：解决“无依赖组件间页面跳转”

组件间不能直接用 `Intent(context, OtherComponentActivity::class.java)` 跳转（会产生直接依赖），需通过路由框架（如 ARouter）实现“隐式跳转”。

##### （1）ARouter 路由跳转核心用法

1. 组件内页面添加路由注解：

    ```Kotlin
    // 订单组件的订单详情页（添加路由注解）
    @Route(path = "/order/detail") // 路由地址：/组件名/页面名
    class OrderDetailActivity : AppCompatActivity() {
        // 接收参数（ARouter自动注入）
        @Autowired
        lateinit var orderId: String // 订单ID（必填参数）
        
        @Autowired(name = "isFromHome")
        var isFromHome: Boolean = false // 可选参数（默认值false）

        override fun onCreate(savedInstanceState: Bundle?) {
            super.onCreate(savedInstanceState)
            ARouter.getInstance().inject(this) // 注入参数
            Log.d("OrderDetail", "订单ID：$orderId")
        }
    }
    ```

2. 其他组件跳转该页面：

    ```Kotlin
    // 首页组件跳转订单详情页（无直接依赖）
    ARouter.getInstance()
        .build("/order/detail") // 目标路由地址
        .withString("orderId", "order_456") // 传递字符串参数
        .withBoolean("isFromHome", true) // 传递布尔参数
        .withTransition(R.anim.slide_in_right, R.anim.slide_out_left) // 跳转动画
        .navigation() // 执行跳转
    ```

##### （2）路由跳转进阶能力

- 拦截器：实现登录拦截（如未登录时跳转到登录页，登录后再跳转目标页面）；

- 降级策略：跳转不存在的路由时，显示错误页面或执行默认操作；

- 结果返回：支持 `startActivityForResult` 类似的回调，获取跳转页面的返回数据。

**示例：登录拦截器**

```Kotlin
// 全局登录拦截器（实现ARouter的IInterceptor）
@Interceptor(priority = 1) // 优先级：数值越小优先级越高
class LoginInterceptor : IInterceptor {
    override fun process(postcard: Postcard, callback: InterceptorCallback) {
        val path = postcard.path
        // 需登录才能访问的页面（如订单详情、个人中心）
        val needLoginPaths = listOf("/order/detail", "/user/profile")
        
        if (needLoginPaths.contains(path) && !UserManager.isLogin()) {
            // 未登录：跳转到登录页，携带目标页面路由地址（登录成功后跳转）
            postcard.withString("targetPath", path)
                .withSerializable("targetParams", postcard.extras)
                .setDestination("/user/login") // 登录页路由地址
        }
        callback.onContinue(postcard) // 继续跳转
    }

    override fun init(context: Context?) {}
}

```

### 三、组件化开发关键补充

1. 组件模式切换：通过 Gradle 构建变量控制组件是“独立运行模式”还是“集成模式”（如 `isModule = true` 时作为独立 App 运行）；

2. 基础库设计：基础组件需包含：路由接口、公共资源、工具类、网络框架封装、数据库封装等，避免业务组件重复造轮子；

3. 集成测试：通过“壳工程（app-module）”依赖所有业务组件，实现整体集成测试，壳工程仅负责组装组件，不包含业务逻辑。

### 总结

1. 组件化核心：拆分解耦、单向依赖、独立开发、集成部署；

2. 三大核心问题解决方案：

    - 通信：ARouter + 接口暴露（需返回结果）、EventBus/Flow（通知类）；

    - 资源冲突：前缀命名规范 + Gradle resourcePrefix 强制约束；

    - 路由跳转：ARouter 实现无依赖跳转，支持参数传递、拦截器、动画；

3. 关键工具：ARouter（路由/通信）、EventBus/Flow（事件通知）、Gradle 构建配置（模式切换/资源约束）。

接下来是第八道面试题，[请说明 Android 内存泄漏的常见原因及对应的排查方法、解决方案？并举例说明 3 种典型的内存泄漏场景（如单例持有 Context）？](./oom)
