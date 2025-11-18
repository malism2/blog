# Compose 测试

欢迎来到 Compose 测试的世界！测试是确保应用质量的重要环节，Compose 提供了强大的测试工具和 API，让我们一起探索吧！

## 🎯 为什么需要测试？

测试可以帮助我们：

- 确保应用功能正常工作
- 提高代码质量
- 减少回归错误
- 增加代码的可维护性
- 提升开发效率

## 🧩 Compose 测试的类型

Compose 测试主要包括以下几种类型：

1. **单元测试**：测试单一功能模块
2. **UI 测试**：测试 UI 组件的渲染和交互
3. **集成测试**：测试多个组件或模块的交互

## 🧩 测试环境配置

### 1. 导入依赖

首先，确保你的项目中包含 Compose 测试依赖：

```gradle
dependencies {
    // Compose 测试核心库
    debugImplementation "androidx.compose.ui:ui-test-manifest:1.4.0"
    androidTestImplementation "androidx.compose.ui:ui-test-junit4:1.4.0"
    
    // 协程测试支持
    testImplementation "org.jetbrains.kotlinx:kotlinx-coroutines-test:1.6.4"
    
    // Mockito 支持
    testImplementation "org.mockito:mockito-core:5.3.1"
    testImplementation "org.mockito.kotlin:mockito-kotlin:5.3.1"
    
    // Hilt 测试支持（如果使用 Hilt）
    androidTestImplementation "com.google.dagger:hilt-android-testing:2.45"
    kaptAndroidTest "com.google.dagger:hilt-compiler:2.45"
}
```

### 2. 配置测试运行器

在 `build.gradle` 中配置测试运行器：

```gradle
defaultConfig {
    testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
}
```

## 🧩 编写 Compose UI 测试

### 1. 基本测试结构

```kotlin
@RunWith(AndroidJUnit4::class)
class ComposeTest {
    private val composeTestRule = createComposeRule()
    
    @Test
    fun testTextDisplay() {
        // 设置 Compose 内容
        composeTestRule.setContent {
            Text(text = "Hello, World!")
        }
        
        // 验证文本是否显示
        composeTestRule.onNodeWithText("Hello, World!").assertIsDisplayed()
    }
}
```

### 2. 测试 UI 组件

```kotlin
@RunWith(AndroidJUnit4::class)
class MyComposableTest {
    private val composeTestRule = createComposeRule()
    
    @Test
    fun testButtonClick() {
        var clicked = false
        
        composeTestRule.setContent {
            Button(onClick = { clicked = true }) {
                Text(text = "Click Me")
            }
        }
        
        // 点击按钮
        composeTestRule.onNodeWithText("Click Me").performClick()
        
        // 验证点击事件是否触发
        assertTrue(clicked)
    }
    
    @Test
    fun testTextField() {
        var text = ""
        
        composeTestRule.setContent {
            TextField(
                value = text,
                onValueChange = { text = it },
                label = { Text(text = "Enter text") }
            )
        }
        
        // 输入文本
        composeTestRule.onNodeWithLabel("Enter text").performTextInput("Hello")
        
        // 验证文本是否正确
        assertEquals("Hello", text)
    }
}
```

## 🧩 使用 Mockito 测试 ViewModel

```kotlin
@RunWith(MockitoJUnitRunner::class)
class MyViewModelTest {
    @Mock
    private lateinit var dataRepository: DataRepository
    
    private lateinit var viewModel: MyViewModel
    
    @Before
    fun setUp() {
        viewModel = MyViewModel(dataRepository)
    }
    
    @Test
    fun testFetchDataSuccess() = runTest {
        // 设置模拟数据
        val mockData = listOf(Item(1, "Item 1"), Item(2, "Item 2"))
        `when`(dataRepository.fetchData()).thenReturn(mockData)
        
        // 执行测试
        viewModel.fetchData()
        
        // 验证结果
        assertEquals(mockData, viewModel.items.value)
        assertFalse(viewModel.loading.value)
        assertNull(viewModel.error.value)
    }
    
    @Test
    fun testFetchDataError() = runTest {
        // 设置模拟异常
        val mockException = Exception("Network error")
        `when`(dataRepository.fetchData()).thenThrow(mockException)
        
        // 执行测试
        viewModel.fetchData()
        
        // 验证结果
        assertEquals(emptyList(), viewModel.items.value)
        assertFalse(viewModel.loading.value)
        assertEquals("Network error", viewModel.error.value)
    }
}
```

## 🧩 测试 Navigation

```kotlin
@RunWith(AndroidJUnit4::class)
class NavigationTest {
    private val composeTestRule = createComposeRule()
    
    @Test
    fun testNavigation() {
        val navController = rememberNavController()
        
        composeTestRule.setContent {
            NavHost(navController = navController, startDestination = "screen1") {
                composable("screen1") {
                    Column {
                        Text(text = "Screen 1")
                        Button(onClick = { navController.navigate("screen2") }) {
                            Text(text = "Go to Screen 2")
                        }
                    }
                }
                composable("screen2") {
                    Column {
                        Text(text = "Screen 2")
                        Button(onClick = { navController.navigateUp() }) {
                            Text(text = "Go back")
                        }
                    }
                }
            }
        }
        
        // 验证初始屏幕
        composeTestRule.onNodeWithText("Screen 1").assertIsDisplayed()
        
        // 导航到屏幕 2
        composeTestRule.onNodeWithText("Go to Screen 2").performClick()
        composeTestRule.onNodeWithText("Screen 2").assertIsDisplayed()
        
        // 返回屏幕 1
        composeTestRule.onNodeWithText("Go back").performClick()
        composeTestRule.onNodeWithText("Screen 1").assertIsDisplayed()
    }
}
```

## 🧩 测试最佳实践

### 1. 单一测试原则

每个测试方法应该只测试一个功能点：

```kotlin
// 好的做法：单一测试原则
@Test
fun testButtonClick() {
    // 测试按钮点击
}

@Test
fun testTextDisplay() {
    // 测试文本显示
}

// 不好的做法：一个测试方法测试多个功能
@Test
fun testMultipleThings() {
    // 测试按钮点击
    // 测试文本显示
    // 测试其他功能
}
```

### 2. 测试命名规范

测试方法名称应该清晰地描述测试的功能：

```kotlin
// 好的命名
@Test
fun testButtonClickChangesText() {
    // ...
}

// 不好的命名
@Test
fun test1() {
    // ...
}
```

### 3. 避免测试实现细节

测试应该关注功能而不是实现细节：

```kotlin
// 好的做法：测试功能
@Test
fun testLoginSuccess() {
    // 测试登录成功后的行为
}

// 不好的做法：测试实现细节
@Test
fun testLoginButtonCallsAuthRepository() {
    // 测试登录按钮是否调用了 AuthRepository
}
```

### 4. 测试隔离

测试应该相互隔离，不依赖于其他测试的状态：

```kotlin
@Test
fun testIncrement() {
    val viewModel = MyViewModel()
    viewModel.increment()
    assertEquals(1, viewModel.count.value)
}

@Test
fun testDecrement() {
    val viewModel = MyViewModel() // 每个测试创建新的实例
    viewModel.decrement()
    assertEquals(0, viewModel.count.value)
}
```

## 🎨 练习

现在，让我们来练习一下：创建一个完整的登录界面测试，包括 ViewModel 测试和 UI 测试。

```kotlin
// ViewModel 层
data class LoginState(
    val email: String = "",
    val password: String = "",
    val loading: Boolean = false,
    val error: String? = null,
    val isLoggedIn: Boolean = false
)

class LoginViewModel(private val authRepository: AuthRepository) : ViewModel() {
    var state by mutableStateOf(LoginState())
    
    fun onEmailChange(email: String) {
        state = state.copy(email = email)
    }
    
    fun onPasswordChange(password: String) {
        state = state.copy(password = password)
    }
    
    fun login() = viewModelScope.launch {
        try {
            state = state.copy(loading = true)
            authRepository.login(state.email, state.password)
            state = state.copy(isLoggedIn = true, loading = false)
        } catch (e: Exception) {
            state = state.copy(error = e.message, loading = false)
        }
    }
}

// UI 层
@Composable
fun LoginScreen(viewModel: LoginViewModel = viewModel()) {
    val state by viewModel.state
    
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        TextField(
            value = state.email,
            onValueChange = { viewModel.onEmailChange(it) },
            label = { Text(text = "Email") },
            modifier = Modifier.fillMaxWidth()
        )
        
        TextField(
            value = state.password,
            onValueChange = { viewModel.onPasswordChange(it) },
            label = { Text(text = "Password") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth()
        )
        
        if (state.loading) {
            CircularProgressIndicator(modifier = Modifier.padding(16.dp))
        }
        
        if (state.error != null) {
            Text(text = state.error!!, color = Color.Red, modifier = Modifier.padding(16.dp))
        }
        
        Button(
            onClick = { viewModel.login() },
            enabled = !state.loading,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(text = "Login")
        }
    }
}

// ViewModel 测试
@RunWith(MockitoJUnitRunner::class)
class LoginViewModelTest {
    @Mock
    private lateinit var authRepository: AuthRepository
    
    private lateinit var viewModel: LoginViewModel
    
    @Before
    fun setUp() {
        viewModel = LoginViewModel(authRepository)
    }
    
    @Test
    fun testLoginSuccess() = runTest {
        // 设置模拟数据
        `when`(authRepository.login("test@example.com", "password")).thenReturn(true)
        
        // 设置状态
        viewModel.onEmailChange("test@example.com")
        viewModel.onPasswordChange("password")
        
        // 执行测试
        viewModel.login()
        
        // 验证结果
        assertTrue(viewModel.state.isLoggedIn)
        assertFalse(viewModel.state.loading)
        assertNull(viewModel.state.error)
    }
    
    @Test
    fun testLoginFailure() = runTest {
        // 设置模拟异常
        `when`(authRepository.login("test@example.com", "wrongpassword")).thenThrow(Exception("Invalid credentials"))
        
        // 设置状态
        viewModel.onEmailChange("test@example.com")
        viewModel.onPasswordChange("wrongpassword")
        
        // 执行测试
        viewModel.login()
        
        // 验证结果
        assertFalse(viewModel.state.isLoggedIn)
        assertFalse(viewModel.state.loading)
        assertEquals("Invalid credentials", viewModel.state.error)
    }
}

// UI 测试
@RunWith(AndroidJUnit4::class)
class LoginScreenTest {
    private val composeTestRule = createComposeRule()
    
    @Test
    fun testLoginButton() {
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
    
    @Test
    fun testEmailInput() {
        val mockViewModel = mock(LoginViewModel::class.java)
        `when`(mockViewModel.state).thenReturn(MutableStateFlow(LoginState()).asStateFlow())
        
        composeTestRule.setContent {
            MyComposeTheme {
                LoginScreen(viewModel = mockViewModel)
            }
        }
        
        // 输入邮箱
        composeTestRule.onNodeWithLabel("Email").performTextInput("test@example.com")
        
        // 验证 ViewModel 的方法是否被调用
        verify(mockViewModel).onEmailChange("test@example.com")
    }
}
```

## 🎉 恭喜

你已经学习了 Compose 中的测试！测试是确保应用质量的重要环节，通过测试可以提高代码的可维护性和可靠性。

下一节，我们将学习 Compose 中的最佳实践，总结 Compose 开发中的经验和技巧。

🚀 继续前进吧！