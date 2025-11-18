# Compose 导航

欢迎来到 Compose 导航的世界！导航是移动应用中非常重要的一部分，它决定了用户如何在不同的屏幕之间切换。Compose 提供了一个名为 Jetpack Navigation Compose 的库，用于处理应用内的导航，让我们一起探索吧！

## 🎯 什么是导航？

导航是指用户在应用中从一个屏幕（或目的地）移动到另一个屏幕的过程。在 Compose 中，导航通常用于：

- 在不同的功能模块之间切换
- 展示详细信息
- 处理用户流程（如注册、登录）
- 等等...

## 🧩 集成导航库

首先，你需要在项目中添加 Navigation Compose 的依赖：

```kotlin
dependencies {
    implementation("androidx.navigation:navigation-compose:2.5.3")
}
```

## 🧩 设置导航

### 创建 NavController

`NavController` 是导航的核心，用于管理应用的导航状态：

```kotlin
@Composable
fun MyApp() {
    val navController = rememberNavController()
    // ...
}
```

### 创建导航图

导航图定义了应用中的所有目的地和它们之间的连接：

```kotlin
@Composable
fun MyApp() {
    val navController = rememberNavController()
    
    NavHost(navController = navController, startDestination = "home") {
        composable(route = "home") {
            HomeScreen(navController = navController)
        }
        composable(route = "detail") {
            DetailScreen(navController = navController)
        }
    }
}
```

## 🧩 导航操作

### 导航到新目的地

使用 `navigate` 方法导航到新目的地：

```kotlin
@Composable
fun HomeScreen(navController: NavController) {
    Button(onClick = { navController.navigate("detail") }) {
        Text(text = "Go to Detail")
    }
}
```

### 返回上一目的地

使用 `popBackStack` 方法返回上一目的地：

```kotlin
@Composable
fun DetailScreen(navController: NavController) {
    Button(onClick = { navController.popBackStack() }) {
        Text(text = "Go back")
    }
}
```

### 替换当前目的地

使用 `navigate` 方法并设置 `launchSingleTop = true` 来替换当前目的地：

```kotlin
@Composable
fun HomeScreen(navController: NavController) {
    Button(onClick = {
        navController.navigate("detail") {
            launchSingleTop = true
        }
    }) {
        Text(text = "Go to Detail")
    }
}
```

## 🧩 传递参数

### 定义带参数的路由

你可以在路由中定义参数：

```kotlin
NavHost(navController = navController, startDestination = "home") {
    composable(route = "home") {
        HomeScreen(navController = navController)
    }
    composable(route = "detail/{itemId}") {
        backStackEntry ->
        val itemId = backStackEntry.arguments?.getString("itemId")
        DetailScreen(itemId = itemId, navController = navController)
    }
}
```

### 传递参数

使用参数导航到目的地：

```kotlin
@Composable
fun HomeScreen(navController: NavController) {
    Button(onClick = {
        navController.navigate("detail/123")
    }) {
        Text(text = "Go to Detail with ID 123")
    }
}
```

### 可选参数

你可以使用查询参数的形式传递可选参数：

```kotlin
NavHost(navController = navController, startDestination = "home") {
    composable(
        route = "detail?id={itemId}&name={itemName}",
        arguments = listOf(
            navArgument("itemId") {
                type = NavType.IntType
                defaultValue = 0
            },
            navArgument("itemName") {
                type = NavType.StringType
                defaultValue = ""
            }
        )
    ) {
        backStackEntry ->
        val itemId = backStackEntry.arguments?.getInt("itemId")
        val itemName = backStackEntry.arguments?.getString("itemName")
        DetailScreen(itemId = itemId, itemName = itemName, navController = navController)
    }
}
```

```kotlin
@Composable
fun HomeScreen(navController: NavController) {
    Button(onClick = {
        navController.navigate("detail?id=123&name=Item%201")
    }) {
        Text(text = "Go to Detail with params")
    }
}
```

## 🧩 深层链接

深层链接允许用户从应用外部直接导航到应用内部的特定目的地：

### 定义深层链接

```kotlin
NavHost(navController = navController, startDestination = "home") {
    composable(
        route = "detail/{itemId}",
        deepLinks = listOf(
            navDeepLink {
                uriPattern = "https://myapp.com/detail/{itemId}"
            }
        )
    ) {
        backStackEntry ->
        val itemId = backStackEntry.arguments?.getString("itemId")
        DetailScreen(itemId = itemId, navController = navController)
    }
}
```

### 在 AndroidManifest.xml 中注册深层链接

```xml
<activity
    android:name=".MainActivity"
    android:exported="true"
    android:theme="@style/Theme.MyApp">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data
            android:scheme="https"
            android:host="myapp.com"
            android:pathPrefix="/detail" />
    </intent-filter>
</activity>
```

## 🧩 导航过渡动画

你可以为导航添加过渡动画：

```kotlin
NavHost(navController = navController, startDestination = "home") {
    composable(
        route = "home",
        enterTransition = { slideInHorizontally(initialOffsetX = { -it }) },
        exitTransition = { slideOutHorizontally(targetOffsetX = { -it }) },
        popEnterTransition = { slideInHorizontally(initialOffsetX = { it }) },
        popExitTransition = { slideOutHorizontally(targetOffsetX = { it }) }
    ) {
        HomeScreen(navController = navController)
    }
    // ...
}
```

## 🎯 导航的最佳实践

### 1. 避免传递复杂对象

导航参数应该是简单的类型（如字符串、整数等），避免传递复杂对象：

```kotlin
// 不好的做法：传递复杂对象
@Composable
fun HomeScreen(navController: NavController) {
    val item = Item(id = 1, name = "Item 1")
    Button(onClick = {
        navController.currentBackStackEntry?.arguments?.putParcelable("item", item)
        navController.navigate("detail")
    }) {
        Text(text = "Go to Detail")
    }
}

// 好的做法：传递简单参数
@Composable
fun HomeScreen(navController: NavController) {
    Button(onClick = {
        navController.navigate("detail/1")
    }) {
        Text(text = "Go to Detail")
    }
}

// 在目的地中获取对象
@Composable
fun DetailScreen(navController: NavController) {
    val itemId = navController.currentBackStackEntry?.arguments?.getString("itemId")
    val item = repository.getItemById(itemId?.toInt() ?: 0)
    // ...
}
```

### 2. 使用 ViewModel 管理导航数据

你可以使用 ViewModel 来管理导航数据，避免在目的地之间直接传递数据：

```kotlin
class SharedViewModel : ViewModel() {
    private val _selectedItem = MutableLiveData<Item>()
    val selectedItem: LiveData<Item> = _selectedItem
    
    fun selectItem(item: Item) {
        _selectedItem.value = item
    }
}

@Composable
fun HomeScreen(navController: NavController, sharedViewModel: SharedViewModel) {
    val item = Item(id = 1, name = "Item 1")
    Button(onClick = {
        sharedViewModel.selectItem(item)
        navController.navigate("detail")
    }) {
        Text(text = "Go to Detail")
    }
}

@Composable
fun DetailScreen(sharedViewModel: SharedViewModel) {
    val item by sharedViewModel.selectedItem.observeAsState()
    // ...
}
```

### 3. 保持导航图的简洁

导航图应该保持简洁，避免包含太多的逻辑：

```kotlin
// 不好的做法：导航图包含太多逻辑
NavHost(navController = navController, startDestination = "home") {
    composable(route = "home") {
        val viewModel = viewModel<HomeViewModel>()
        val items by viewModel.items.observeAsState()
        HomeScreen(items = items, navController = navController)
    }
    // ...
}

// 好的做法：导航图只负责导航
NavHost(navController = navController, startDestination = "home") {
    composable(route = "home") {
        HomeScreen(navController = navController)
    }
    // ...
}

@Composable
fun HomeScreen(navController: NavController) {
    val viewModel: HomeViewModel = viewModel()
    val items by viewModel.items.observeAsState()
    // ...
}
```

## 🎨 练习

现在，让我们来练习一下：创建一个包含两个屏幕的简单导航应用。

```kotlin
@Composable
fun MyNavigationApp() {
    val navController = rememberNavController()
    
    NavHost(navController = navController, startDestination = "list") {
        composable(route = "list") {
            ListScreen(navController = navController)
        }
        composable(route = "detail/{itemId}") {
            backStackEntry ->
            val itemId = backStackEntry.arguments?.getString("itemId")?.toInt() ?: 0
            DetailScreen(itemId = itemId, navController = navController)
        }
    }
}

@Composable
fun ListScreen(navController: NavController) {
    val items = listOf(
        Item(1, "Item 1"),
        Item(2, "Item 2"),
        Item(3, "Item 3")
    )
    
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text(text = "Item List", style = TextStyle(fontSize = 24.sp, fontWeight = FontWeight.Bold))
        LazyColumn(modifier = Modifier.fillMaxSize()) {
            items(items) {
                item ->
                Text(
                    text = item.name,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .clickable { navController.navigate("detail/${item.id}") }
                )
                Divider()
            }
        }
    }
}

@Composable
fun DetailScreen(itemId: Int, navController: NavController) {
    val item = remember { 
        when (itemId) {
            1 -> Item(1, "Item 1", "This is the detail of Item 1")
            2 -> Item(2, "Item 2", "This is the detail of Item 2")
            3 -> Item(3, "Item 3", "This is the detail of Item 3")
            else -> Item(0, "Unknown", "Unknown item")
        }
    }
    
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text(text = item.name, style = TextStyle(fontSize = 24.sp, fontWeight = FontWeight.Bold))
        Text(text = item.description, modifier = Modifier.padding(vertical = 16.dp))
        Button(onClick = { navController.popBackStack() }) {
            Text(text = "Go back")
        }
    }
}

data class Item(val id: Int, val name: String, val description: String = "")
```

## 🎉 恭喜

你已经学习了 Compose 中的导航功能！从基本的导航设置到参数传递和深层链接，这些知识将帮助你创建出具有良好导航体验的应用。

下一节，我们将学习 Compose 中的主题和样式，了解如何自定义应用的外观。

🚀 继续前进吧！