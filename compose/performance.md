# Compose 性能优化

欢迎来到 Compose 性能优化的世界！性能是应用开发中非常重要的一部分，它直接影响用户体验。Compose 提供了一些优化性能的技巧和工具，让我们一起探索吧！

## 🎯 为什么需要性能优化？

- 提高应用的响应速度
- 减少电池消耗
- 提升用户体验
- 确保应用在各种设备上流畅运行

## 🧩 理解 Compose 的重组机制

### 什么是重组？

重组是 Compose 中更新 UI 的过程。当状态变化时，Compose 会重新执行相关的可组合函数，生成新的 UI 树，并与旧的 UI 树进行比较，只更新需要变化的部分。

### 如何触发重组？

重组通常由状态变化触发，例如：

```kotlin
var count by remember { mutableStateOf(0) }

// 点击按钮时更新状态，触发重组
Button(onClick = { count++ }) {
    Text(text = "Clicked $count times")
}
```

### 重组的范围

Compose 会尽量减少重组的范围，只重组需要变化的部分。例如：

```kotlin
@Composable
fun Parent() {
    var count by remember { mutableStateOf(0) }
    
    Column {
        Text(text = "Count: $count") // 会重组
        Child() // 不会重组，因为它不依赖于 count
        Button(onClick = { count++ }) {
            Text(text = "Increment") // 会重组
        }
    }
}

@Composable
fun Child() {
    Text(text = "I'm a child") // 不会重组
}
```

## 🧩 性能优化的技巧

### 1. 使用 remember 和 mutableStateOf 高效地保存状态

```kotlin
@Composable
fun MyComposable() {
    // 好的做法：使用 remember 保存计算结果
    val expensiveResult = remember { computeExpensiveOperation() }
    
    // 好的做法：使用 mutableStateOf 保存可观察的状态
    var count by remember { mutableStateOf(0) }
    
    // ...
}
```

### 2. 使用 key 参数避免不必要的重组

在列表中使用 `key` 参数可以帮助 Compose 识别列表项，避免不必要的重组：

```kotlin
@Composable
fun MyList(items: List<Item>) {
    LazyColumn {
        items(items, key = { it.id }) {
            ItemComposable(item = it)
        }
    }
}
```

### 3. 避免在可组合函数中执行耗时操作

不要在可组合函数中执行耗时操作，例如网络请求、数据库查询等，这些操作应该在 ViewModel 或其他地方执行：

```kotlin
@Composable
fun MyComposable() {
    // 不好的做法：在可组合函数中执行网络请求
    val result = runBlocking { fetchDataFromNetwork() }
    
    // ...
}

// 好的做法：在 ViewModel 中执行网络请求
class MyViewModel : ViewModel() {
    val data = viewModelScope.launch { fetchDataFromNetwork() }
}
```

### 4. 使用 derivedStateOf 减少重组次数

`derivedStateOf` 可以将一个或多个状态转换为新的状态，只有当输入状态变化时，才会重新计算新的状态：

```kotlin
@Composable
fun MyComposable() {
    val list by remember { mutableStateOf(List(1000) { it } ) }
    val query by remember { mutableStateOf("" ) }
    
    // 只有当 list 或 query 变化时，才会重新计算 filteredList
    val filteredList by remember { derivedStateOf { 
        list.filter { it.toString().contains(query) }
    } }
    
    LazyColumn {
        items(filteredList) {
            Text(text = it.toString())
        }
    }
}
```

### 5. 使用 LaunchedEffect 执行副作用

`LaunchedEffect` 可以在可组合函数中安全地执行副作用，例如网络请求、动画等：

```kotlin
@Composable
fun MyComposable() {
    var data by remember { mutableStateOf(emptyList<Item>()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    
    // 在可组合函数作用域内启动协程
    LaunchedEffect(Unit) {
        try {
            data = fetchDataFromNetwork()
            loading = false
        } catch (e: Exception) {
            error = e.message
            loading = false
        }
    }
    
    // ...
}
```

### 6. 使用 SideEffect 执行副作用

`SideEffect` 可以在可组合函数每次成功重组后执行副作用：

```kotlin
@Composable
fun MyComposable() {
    val analytics = LocalAnalytics.current
    val userId = LocalUserId.current
    
    // 每次重组后更新分析数据
    SideEffect {
        analytics.setUserId(userId)
    }
    
    // ...
}
```

### 7. 使用 DisposableEffect 清理资源

`DisposableEffect` 可以在可组合函数退出组合或 key 变化时执行清理操作：

```kotlin
@Composable
fun MyComposable() {
    val lifecycleOwner = LocalLifecycleOwner.current
    val observer = remember { MyLifecycleObserver() }
    
    // 注册和注销生命周期观察者
    DisposableEffect(lifecycleOwner) {
        lifecycleOwner.lifecycle.addObserver(observer)
        
        // 清理函数
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }
    
    // ...
}
```

### 8. 使用 rememberSaveable 保存配置变化时的状态

`rememberSaveable` 可以在配置变化（如屏幕旋转）时保存状态：

```kotlin
@Composable
fun MyComposable() {
    // 好的做法：使用 rememberSaveable 保存配置变化时的状态
    var count by rememberSaveable { mutableStateOf(0) }
    
    // ...
}
```

### 9. 避免在可组合函数中创建新的对象

不要在可组合函数中创建新的对象，这会导致不必要的重组：

```kotlin
@Composable
fun MyComposable() {
    // 不好的做法：每次重组都会创建新的对象
    val colors = ButtonDefaults.buttonColors(backgroundColor = Color.Blue)
    
    Button(onClick = { /* ... */ }, colors = colors) {
        Text(text = "Button")
    }
    
    // 好的做法：使用 remember 保存对象
    val colors = remember { ButtonDefaults.buttonColors(backgroundColor = Color.Blue) }
    
    Button(onClick = { /* ... */ }, colors = colors) {
        Text(text = "Button")
    }
}
```

### 10. 使用 Modifier 优化布局

```kotlin
@Composable
fun MyComposable() {
    // 好的做法：链式调用 Modifier
    Text(
        text = "Hello",
        modifier = Modifier.padding(16.dp).fillMaxWidth().background(Color.Blue)
    )
    
    // 不好的做法：创建多个 Modifier 对象
    val paddingModifier = Modifier.padding(16.dp)
    val fillModifier = Modifier.fillMaxWidth()
    val backgroundModifier = Modifier.background(Color.Blue)
    
    Text(
        text = "Hello",
        modifier = paddingModifier.then(fillModifier).then(backgroundModifier)
    )
}
```

## 🧩 性能优化的工具

### 1. Android Studio 的 Layout Inspector

Layout Inspector 可以帮助你可视化 Compose 应用的 UI 树，查看组件的属性和状态：

1. 在 Android Studio 中，点击 "View" -> "Tool Windows" -> "Layout Inspector"
2. 选择你的应用进程
3. 查看 UI 树和组件属性

### 2. Compose Debug Inspector

Compose Debug Inspector 是 Android Studio 中的一个工具，可以帮助你查看 Compose 应用的状态和重组情况：

1. 在 Android Studio 中，点击 "View" -> "Tool Windows" -> "Compose Debug"
2. 选择你的应用进程
3. 查看状态和重组情况

### 3. Lint 检查

Lint 检查可以帮助你发现潜在的性能问题：

1. 在 Android Studio 中，点击 "Analyze" -> "Inspect Code"
2. 查看 Lint 检查结果
3. 修复发现的问题

## 🧩 性能优化的最佳实践

### 1. 保持可组合函数的纯度

可组合函数应该是纯函数，即给定相同的输入，总是产生相同的输出，没有副作用：

```kotlin
// 好的做法：纯函数
@Composable
fun Greeting(name: String) {
    Text(text = "Hello, $name!")
}

// 不好的做法：有副作用
@Composable
fun GreetingWithSideEffect(name: String) {
    // 副作用：打印日志
    println("Greeting: $name")
    Text(text = "Hello, $name!")
}
```

### 2. 避免在可组合函数中执行 I/O 操作

不要在可组合函数中执行 I/O 操作，例如网络请求、文件读写等，这些操作应该在 ViewModel 或其他地方执行：

```kotlin
// 不好的做法：在可组合函数中执行网络请求
@Composable
fun MyComposable() {
    val data = runBlocking { fetchDataFromNetwork() }
    Text(text = "Data: $data")
}

// 好的做法：在 ViewModel 中执行网络请求
class MyViewModel : ViewModel() {
    val data = mutableStateOf<Data?>(null)
    
    init {
        viewModelScope.launch {
            data.value = fetchDataFromNetwork()
        }
    }
}

@Composable
fun MyComposable(viewModel: MyViewModel) {
    val data = viewModel.data.value
    if (data != null) {
        Text(text = "Data: $data")
    } else {
        CircularProgressIndicator()
    }
}
```

### 3. 使用 ViewModel 管理复杂状态

对于复杂的状态，应该使用 ViewModel 进行管理，而不是在可组合函数中直接管理：

```kotlin
class MyViewModel : ViewModel() {
    private val _state = mutableStateOf(MyState())
    val state: State<MyState> = _state
    
    fun doSomething() {
        // 更新状态
        _state.value = _state.value.copy(/* ... */)
    }
}

@Composable
fun MyComposable(viewModel: MyViewModel = viewModel()) {
    val state by viewModel.state
    
    // 使用 state 更新 UI
    // ...
}
```

### 4. 避免不必要的状态

只创建必要的状态，避免创建不必要的状态：

```kotlin
// 不好的做法：创建不必要的状态
@Composable
fun MyComposable() {
    var text by remember { mutableStateOf("Hello") }
    val reversedText by remember { derivedStateOf { text.reversed() } }
    
    Column {
        TextField(value = text, onValueChange = { text = it })
        Text(text = reversedText)
    }
}

// 好的做法：直接计算，不创建额外的状态
@Composable
fun MyComposable() {
    var text by remember { mutableStateOf("Hello") }
    
    Column {
        TextField(value = text, onValueChange = { text = it })
        Text(text = text.reversed())
    }
}
```

## 🎨 练习

现在，让我们来练习一下：创建一个高性能的列表应用，实现懒加载和搜索功能。

```kotlin
// 定义数据类
data class Item(val id: Int, val name: String, val description: String)

// 创建模拟数据
fun generateItems(count: Int): List<Item> {
    return (1..count).map { 
        Item(
            id = it,
            name = "Item $it",
            description = "This is the description of Item $it"
        )
    }
}

// 主应用
@Composable
fun HighPerformanceListApp() {
    // 生成 10000 个模拟数据项
    val allItems = remember { generateItems(10000) }
    
    // 搜索查询
    var query by remember { mutableStateOf("") }
    
    // 使用 derivedStateOf 避免不必要的过滤操作
    val filteredItems by remember(allItems, query) {
        derivedStateOf {
            if (query.isEmpty()) {
                allItems
            } else {
                allItems.filter { it.name.contains(query, ignoreCase = true) }
            }
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(title = { Text(text = "High Performance List") })
        }
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // 搜索框
            TextField(
                value = query,
                onValueChange = { query = it },
                modifier = Modifier.fillMaxWidth().padding(8.dp),
                label = { Text(text = "Search") },
                singleLine = true
            )
            
            // 高性能列表
            LazyColumn {
                // 使用 key 参数提高性能
                items(filteredItems, key = { it.id }) {
                    ItemCard(item = it)
                }
            }
        }
    }
}

// 列表项组件
@Composable
fun ItemCard(item: Item) {
    Card(
        elevation = 4.dp,
        modifier = Modifier.padding(8.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = item.name, fontWeight = FontWeight.Bold)
            Text(text = item.description, fontSize = 14.sp, color = Color.Gray)
        }
    }
}
```

## 🎉 恭喜

你已经学习了 Compose 中的性能优化！性能优化是 Compose 开发中非常重要的一部分，它可以帮助你创建出流畅、响应迅速的应用。

下一节，我们将学习 Compose 中的测试，了解如何测试 Compose 应用。

🚀 继续前进吧！