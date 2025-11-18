# Compose 状态管理基础

欢迎来到 Compose 状态管理的世界！状态管理是 Compose 中非常重要的概念，它决定了 UI 如何响应用户的交互和数据的变化。如果把 Compose UI 比作一个舞台，那么状态就是舞台上的演员，它们的一举一动都会影响舞台的呈现效果。

## 🎯 什么是状态？

在 Compose 中，状态是指那些可能会随时间变化的数据。当状态发生变化时，Compose 会自动重新组合使用该状态的组件，从而更新 UI。

状态可以是：

- 用户输入（如文本框中的内容、开关的状态）
- 网络请求的结果
- 应用程序的数据（如用户信息、购物车内容）
- 等等...

## 🧩 基本状态管理

### remember

`remember` 用于在 Composable 函数的重新组合之间保存状态：

```kotlin
@Composable
fun MyCounter() {
    var count by remember { mutableStateOf(0) } // 使用 remember 保存状态
    Button(onClick = { count++ }) {
        Text(text = "Count: $count")
    }
}
```

如果没有 `remember`，每次点击按钮时，count 都会被重置为 0，因为 Composable 函数会重新执行。

### mutableStateOf

`mutableStateOf` 用于创建一个可变的状态对象。当状态值发生变化时，Compose 会自动重新组合使用该状态的组件：

```kotlin
@Composable
fun MyTextField() {
    var text by remember { mutableStateOf("") } // 创建可变状态
    TextField(
        value = text,
        onValueChange = { text = it }, // 更新状态
        label = { Text(text = "Enter your name") }
    )
    Text(text = "Hello, $text!")
}
```

### rememberSaveable

`rememberSaveable` 用于在配置更改（如屏幕旋转）时保存状态：

```kotlin
@Composable
fun MyScreenRotationCounter() {
    var count by rememberSaveable { mutableStateOf(0) } // 使用 rememberSaveable 保存状态
    Button(onClick = { count++ }) {
        Text(text = "Count: $count")
    }
}
```

与 `remember` 不同，`rememberSaveable` 会将状态保存到 Bundle 中，因此在配置更改时不会丢失。

## 📦 状态提升

状态提升是指将状态从子组件移动到父组件，以便在多个子组件之间共享状态。这是 Compose 中推荐的状态管理模式。

### 为什么需要状态提升？

- 提高组件的复用性
- 使组件更易于测试
- 更好地控制状态的变化

### 状态提升的示例

```kotlin
// 子组件：不包含状态，只接收状态和更新状态的函数
@Composable
fun MyTextField(
    text: String,
    onTextChange: (String) -> Unit
) {
    TextField(
        value = text,
        onValueChange = onTextChange,
        label = { Text(text = "Enter your name") }
    )
}

// 父组件：管理状态，并将状态和更新函数传递给子组件
@Composable
fun MyScreen() {
    var text by remember { mutableStateOf("") }
    Column {
        MyTextField(text = text, onTextChange = { text = it })
        Text(text = "Hello, $text!")
    }
}
```

## 🎨 状态管理的最佳实践

### 1. 最小化状态范围

只在需要使用状态的最小范围内声明状态：

```kotlin
// 好的做法：状态只在需要的范围内
@Composable
fun MyScreen() {
    Column {
        Text(text = "Welcome to My App")
        MyCounter() // Counter 自己管理状态
    }
}

@Composable
fun MyCounter() {
    var count by remember { mutableStateOf(0) }
    Button(onClick = { count++ }) {
        Text(text = "Count: $count")
    }
}
```

### 2. 避免在 Composable 中进行副作用操作

副作用是指那些在 Composable 函数执行期间修改应用程序状态或执行 I/O 操作的代码。Compose 建议将副作用操作放在专门的副作用函数中，如 `LaunchedEffect`、`DisposableEffect` 等。

```kotlin
// 不好的做法：在 Composable 中进行副作用操作
@Composable
fun MyNetworkRequest() {
    var result by remember { mutableStateOf<String?>(null) }
    // 不要这样做！每次重新组合都会执行网络请求
    result = fetchDataFromNetwork()
    Text(text = result ?: "Loading...")
}

// 好的做法：使用 LaunchedEffect 进行副作用操作
@Composable
fun MyNetworkRequest() {
    var result by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(Unit) {
        // 只在组件首次组合时执行网络请求
        result = fetchDataFromNetwork()
    }
    Text(text = result ?: "Loading...")
}
```

### 3. 使用状态提升

如前所述，状态提升可以提高组件的复用性和可测试性。

## 🎯 副作用管理

### LaunchedEffect

`LaunchedEffect` 用于在 Composable 中启动协程，并在 Composable 脱离组合树时取消协程：

```kotlin
@Composable
fun MyNetworkRequest() {
    var result by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    
    LaunchedEffect(Unit) {
        // 在协程中执行网络请求
        try {
            result = fetchDataFromNetwork()
            isLoading = false
        } catch (e: Exception) {
            error = e.message
            isLoading = false
        }
    }
    
    when {
        isLoading -> CircularProgressIndicator()
        error != null -> Text(text = "Error: $error", color = Color.Red)
        result != null -> Text(text = "Result: $result")
    }
}
```

`LaunchedEffect` 的参数是一个键，当键发生变化时，协程会被取消并重新启动。

### DisposableEffect

`DisposableEffect` 用于在 Composable 进入或离开组合树时执行清理操作：

```kotlin
@Composable
fun MyDisposableEffectExample() {
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleObserver { /* 处理生命周期事件 */ }
        lifecycleOwner.lifecycle.addObserver(observer)
        // 清理操作
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }
}
```

### SideEffect

`SideEffect` 用于在 Composable 成功组合后执行副作用操作：

```kotlin
@Composable
fun MySideEffectExample() {
    val currentTheme = remember { mutableStateOf(Theme.LIGHT) }
    SideEffect {
        // 保存当前主题到偏好设置
        saveThemeToPreferences(currentTheme.value)
    }
}
```

## 🎨 练习

现在，让我们来练习一下：创建一个包含状态管理的简单待办事项应用。

```kotlin
@Composable
fun MyTodoApp() {
    var todoText by remember { mutableStateOf("") }
    var todos by rememberSaveable { mutableStateOf(listOf<String>()) }
    Column(modifier = Modifier.padding(16.dp)) {
        Text(text = "My Todo List", style = TextStyle(fontSize = 24.sp, fontWeight = FontWeight.Bold))
        TextField(
            value = todoText,
            onValueChange = { todoText = it },
            label = { Text(text = "Add a todo") },
            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)
        )
        Button(
            onClick = {
                if (todoText.isNotBlank()) {
                    todos = todos + todoText
                    todoText = ""
                }
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(text = "Add Todo")
        }
        LazyColumn(modifier = Modifier.padding(vertical = 16.dp)) {
            items(todos) {
                Text(text = "• $it", modifier = Modifier.padding(4.dp))
            }
        }
    }
}
```

## 🎉 恭喜

你已经学习了 Compose 中的状态管理基础！从 `remember` 和 `mutableStateOf` 到状态提升和副作用管理，这些都是你构建响应式 UI 的重要工具。

下一节，我们将学习 Compose 中的布局基础，了解如何使用 Column、Row、Box 等布局组件来组织你的 UI。

🚀 继续前进吧！