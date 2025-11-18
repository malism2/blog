# Compose 与 ViewModel

欢迎来到 Compose 与 ViewModel 的世界！ViewModel 是 Android 架构组件中的重要一员，它可以帮助我们管理 UI 状态并处理业务逻辑。Compose 与 ViewModel 结合使用，可以创建出更加健壮、可测试的应用。让我们一起探索吧！

## 🎯 什么是 ViewModel？

ViewModel 是一个架构组件，它的主要作用是：

- 管理 UI 相关的状态
- 处理业务逻辑
- 存活于配置变化（如屏幕旋转）
- 提供数据给 UI 层
- 与数据层交互（如网络请求、数据库操作等）

## 🧩 ViewModel 的优势

### 1. 配置变化时状态保留

ViewModel 在配置变化时不会被销毁，因此可以保留状态：

```kotlin
@Composable
fun MyScreen() {
    val viewModel = viewModel<MyViewModel>()
    val count = viewModel.count
    
    Button(onClick = { viewModel.increment() }) {
        Text(text = "Count: $count")
    }
}

class MyViewModel : ViewModel() {
    var count by mutableStateOf(0) // 配置变化时会保留
    
    fun increment() {
        count++
    }
}
```

### 2. 关注点分离

ViewModel 可以帮助我们将 UI 逻辑和业务逻辑分离：

```kotlin
// UI 层
@Composable
fun MyScreen() {
    val viewModel = viewModel<MyViewModel>()
    val state by viewModel.state
    
    if (state.loading) {
        CircularProgressIndicator()
    } else if (state.error != null) {
        Text(text = state.error!!, color = Color.Red)
    } else {
        // 渲染数据
    }
}

// ViewModel 层
class MyViewModel : ViewModel() {
    val state = mutableStateOf(MyState())
    
    init {
        fetchData()
    }
    
    private fun fetchData() {
        viewModelScope.launch {
            try {
                state.value = state.value.copy(loading = true)
                val data = dataRepository.fetchData()
                state.value = state.value.copy(data = data, loading = false)
            } catch (e: Exception) {
                state.value = state.value.copy(error = e.message, loading = false)
            }
        }
    }
}

// 数据层
class DataRepository {
    suspend fun fetchData(): List<Item> {
        // 网络请求或数据库操作
    }
}
```

### 3. 可测试性

ViewModel 可以独立于 UI 进行测试：

```kotlin
@Test
fun testIncrement() {
    val viewModel = MyViewModel()
    viewModel.increment()
    assertEquals(1, viewModel.count)
}
```

## 🧩 在 Compose 中使用 ViewModel

### 1. 导入依赖

首先，确保你的项目中包含 ViewModel 依赖：

```gradle
dependencies {
    // ViewModel
    implementation "androidx.lifecycle:lifecycle-viewmodel-compose:2.5.1"
    
    // 协程支持
    implementation "androidx.lifecycle:lifecycle-viewmodel-ktx:2.5.1"
}
```

### 2. 创建 ViewModel

```kotlin
class MyViewModel : ViewModel() {
    // 使用 MutableStateFlow 存储状态
    private val _state = MutableStateFlow(MyState())
    val state: StateFlow<MyState> = _state.asStateFlow()
    
    // 或者使用 mutableStateOf
    var count by mutableStateOf(0)
    
    fun increment() {
        count++
    }
    
    fun fetchData() {
        viewModelScope.launch {
            try {
                _state.value = _state.value.copy(loading = true)
                val data = fetchDataFromNetwork()
                _state.value = _state.value.copy(data = data, loading = false)
            } catch (e: Exception) {
                _state.value = _state.value.copy(error = e.message, loading = false)
            }
        }
    }
}

// 定义状态类
data class MyState(
    val loading: Boolean = false,
    val data: List<Item> = emptyList(),
    val error: String? = null
)
```

### 3. 在 Compose 中获取 ViewModel

使用 `viewModel()` 函数获取 ViewModel 实例：

```kotlin
@Composable
fun MyScreen() {
    val viewModel = viewModel<MyViewModel>()
    // ...
}
```

### 4. 观察 ViewModel 中的状态

#### 使用 mutableStateOf

```kotlin
@Composable
fun MyScreen() {
    val viewModel = viewModel<MyViewModel>()
    val count = viewModel.count // 自动重组
    
    Button(onClick = { viewModel.increment() }) {
        Text(text = "Count: $count")
    }
}
```

#### 使用 StateFlow

```kotlin
@Composable
fun MyScreen() {
    val viewModel = viewModel<MyViewModel>()
    val state by viewModel.state.collectAsState() // 需要导入 androidx.lifecycle.compose.collectAsState
    
    if (state.loading) {
        CircularProgressIndicator()
    } else if (state.error != null) {
        Text(text = state.error!!, color = Color.Red)
    } else {
        LazyColumn {
            items(state.data) {
                Text(text = it.name)
            }
        }
    }
}
```

## 🧩 ViewModel 与状态管理

### 1. UI 状态的建模

使用数据类建模 UI 状态是一种很好的做法：

```kotlin
data class LoginState(
    val email: String = "",
    val password: String = "",
    val loading: Boolean = false,
    val error: String? = null,
    val isLoggedIn: Boolean = false
)

class LoginViewModel : ViewModel() {
    var state by mutableStateOf(LoginState())
    
    fun onEmailChange(email: String) {
        state = state.copy(email = email)
    }
    
    fun onPasswordChange(password: String) {
        state = state.copy(password = password)
    }
    
    fun login() {
        viewModelScope.launch {
            try {
                state = state.copy(loading = true)
                authRepository.login(state.email, state.password)
                state = state.copy(isLoggedIn = true, loading = false)
            } catch (e: Exception) {
                state = state.copy(error = e.message, loading = false)
            }
        }
    }
}
```

### 2. 单向数据流

ViewModel 可以帮助我们实现单向数据流：

```kotlin
// UI 事件 -> ViewModel
Button(onClick = { viewModel.login() }) {
    Text(text = "Login")
}

// ViewModel -> UI 状态
val state by viewModel.state
if (state.loading) {
    CircularProgressIndicator()
}
```

## 🧩 在 ViewModel 中使用协程

### 1. viewModelScope

ViewModel 提供了 `viewModelScope`，它会在 ViewModel 销毁时自动取消所有协程：

```kotlin
class MyViewModel : ViewModel() {
    fun fetchData() {
        // 在 viewModelScope 中启动协程
        viewModelScope.launch {
            val data = dataRepository.fetchData()
            // 更新状态
        }
    }
}
```

### 2. 异常处理

在 ViewModel 中处理异常：

```kotlin
class MyViewModel : ViewModel() {
    var state by mutableStateOf(MyState())
    
    fun fetchData() {
        viewModelScope.launch {
            try {
                state = state.copy(loading = true)
                val data = dataRepository.fetchData()
                state = state.copy(data = data, loading = false)
            } catch (e: Exception) {
                state = state.copy(error = e.message, loading = false)
            }
        }
    }
}
```

## 🧩 ViewModel 与导航

### 1. 导航事件

在 ViewModel 中处理导航事件：

```kotlin
sealed class NavigationEvent {
    object Home : NavigationEvent()
    object Detail : NavigationEvent()
    class Profile(val userId: Int) : NavigationEvent()
}

class MyViewModel : ViewModel() {
    private val _navigationEvent = MutableSharedFlow<NavigationEvent>()
    val navigationEvent = _navigationEvent.asSharedFlow()
    
    fun navigateToDetail() {
        viewModelScope.launch {
            _navigationEvent.emit(NavigationEvent.Detail)
        }
    }
    
    fun navigateToProfile(userId: Int) {
        viewModelScope.launch {
            _navigationEvent.emit(NavigationEvent.Profile(userId))
        }
    }
}
```

在 Compose 中观察导航事件：

```kotlin
@Composable
fun MyScreen() {
    val viewModel = viewModel<MyViewModel>()
    val navController = rememberNavController()
    
    // 观察导航事件
    LaunchedEffect(Unit) {
        viewModel.navigationEvent.collect {
            when (it) {
                NavigationEvent.Home -> navController.navigate("home")
                NavigationEvent.Detail -> navController.navigate("detail")
                is NavigationEvent.Profile -> navController.navigate("profile/${it.userId}")
            }
        }
    }
    
    Button(onClick = { viewModel.navigateToDetail() }) {
        Text(text = "Go to Detail")
    }
}
```

## 🧩 ViewModel 的测试

### 1. 单元测试

使用 JUnit 和 Mockito 测试 ViewModel：

```kotlin
@Test
fun testLoginSuccess() {
    // 创建模拟的依赖
    val mockAuthRepository = mock(AuthRepository::class.java)
    
    // 设置模拟行为
    runBlocking {
        `when`(mockAuthRepository.login(anyString(), anyString())).thenReturn(true)
    }
    
    // 创建 ViewModel 实例
    val viewModel = LoginViewModel(mockAuthRepository)
    
    // 设置状态
    viewModel.onEmailChange("test@example.com")
    viewModel.onPasswordChange("password")
    
    // 执行测试
    runBlockingTest {
        viewModel.login()
    }
    
    // 验证结果
    assertEquals(true, viewModel.state.isLoggedIn)
    assertNull(viewModel.state.error)
}
```

### 2. Compose 测试

使用 Compose Testing 测试 UI 与 ViewModel 的交互：

```kotlin
@Test
fun testLoginButton() {
    // 创建模拟的 ViewModel
    val mockViewModel = mock(LoginViewModel::class.java)
    `when`(mockViewModel.state).thenReturn(MutableStateFlow(LoginState()).asStateFlow())
    
    composeTestRule.setContent {
        MyComposeTheme {
            LoginScreen(viewModel = mockViewModel)
        }
    }
    
    // 点击登录按钮
    composeTestRule.onNodeWithText("Login").performClick()
    
    // 验证 ViewModel 的方法是否被调用
    verify(mockViewModel).login()
}
```

## 🧩 ViewModel 的最佳实践

### 1. 单一职责原则

每个 ViewModel 应该只负责一个功能模块：

```kotlin
// 好的做法：每个功能模块一个 ViewModel
class LoginViewModel : ViewModel() { /* ... */ }
class HomeViewModel : ViewModel() { /* ... */ }
class DetailViewModel : ViewModel() { /* ... */ }

// 不好的做法：一个 ViewModel 负责所有功能
class AppViewModel : ViewModel() {
    // 登录相关
    // 首页相关
    // 详情页相关
    // ...
}
```

### 2. 使用依赖注入

使用依赖注入框架（如 Hilt）注入 ViewModel 的依赖：

```kotlin
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    // ...
}
```

### 3. 避免引用 View 或 Context

ViewModel 中不应该引用 View 或 Context，否则可能导致内存泄漏：

```kotlin
// 不好的做法：引用 Context
class MyViewModel(private val context: Context) : ViewModel() {
    // ...
}

// 好的做法：不引用 Context
class MyViewModel(private val dataRepository: DataRepository) : ViewModel() {
    // ...
}
```

## 🎨 练习

现在，让我们来练习一下：创建一个带有 ViewModel 的计数器应用，并实现配置变化时状态保留。

```kotlin
// ViewModel
class CounterViewModel : ViewModel() {
    var count by mutableStateOf(0)
    var showToast by mutableStateOf(false)
    
    fun increment() {
        count++
        if (count % 5 == 0) {
            showToast = true
        }
    }
    
    fun decrement() {
        if (count > 0) {
            count--
        }
    }
    
    fun reset() {
        count = 0
    }
    
    fun dismissToast() {
        showToast = false
    }
}

// UI 层
@Composable
fun CounterScreen() {
    val viewModel = viewModel<CounterViewModel>()
    val count = viewModel.count
    val showToast = viewModel.showToast
    
    // 显示 Toast
    if (showToast) {
        Toast.makeText(LocalContext.current, "Count is $count!", Toast.LENGTH_SHORT).show()
        LaunchedEffect(Unit) {
            delay(2000)
            viewModel.dismissToast()
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(title = { Text(text = "Counter") })
        }
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // 计数器显示
            Text(
                text = "$count",
                style = MaterialTheme.typography.h1,
                modifier = Modifier.padding(16.dp)
            )
            
            // 控制按钮
            Row(modifier = Modifier.padding(16.dp)) {
                Button(onClick = { viewModel.decrement() }) {
                    Text(text = "-")
                }
                Button(onClick = { viewModel.increment() }, modifier = Modifier.padding(8.dp)) {
                    Text(text = "+" )
                }
                Button(onClick = { viewModel.reset() }) {
                    Text(text = "Reset" )
                }
            }
        }
    }
}
```

## 🎉 恭喜

你已经学习了如何在 Compose 中使用 ViewModel！ViewModel 是 Compose 开发中的重要工具，它可以帮助我们管理状态、处理业务逻辑，并在配置变化时保留状态。

下一节，我们将学习 Compose 中的测试，了解如何测试 Compose 应用。

🚀 继续前进吧！