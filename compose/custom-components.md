# Compose 自定义组件

欢迎来到 Compose 自定义组件的世界！在 Compose 中，创建自定义组件是一件非常简单而有趣的事情。自定义组件可以帮助你复用代码，提高开发效率，让你的应用更加模块化。让我们一起探索吧！

## 🎯 什么是自定义组件？

自定义组件是指开发者根据需要创建的、可复用的 UI 元素。在 Compose 中，任何用 `@Composable` 注解标记的函数都是一个组件。

## 🧩 基本自定义组件

### 简单的自定义组件

创建一个简单的自定义组件非常容易，只需要创建一个带有 `@Composable` 注解的函数即可：

```kotlin
@Composable
fun Greeting(name: String) {
    Text(text = "Hello, $name!")
}
```

使用这个组件：

```kotlin
@Composable
fun MyApp() {
    Greeting(name = "World")
}
```

### 带参数的自定义组件

你可以给自定义组件添加参数，使其更加灵活：

```kotlin
@Composable
fun UserCard(
    name: String,
    email: String,
    avatarUrl: String? = null,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        elevation = 4.dp,
        modifier = Modifier.padding(8.dp).fillMaxWidth()
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(16.dp)
        ) {
            // 头像
            if (avatarUrl != null) {
                Image(
                    painter = rememberImagePainter(avatarUrl),
                    contentDescription = "Avatar",
                    modifier = Modifier.size(48.dp).clip(CircleShape)
                )
            } else {
                Box(
                    modifier = Modifier.size(48.dp).clip(CircleShape).background(Color.Blue),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = name.first().toString(),
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
            
            // 用户信息
            Column(modifier = Modifier.padding(start = 16.dp)) {
                Text(text = name, fontWeight = FontWeight.Bold)
                Text(text = email, fontSize = 14.sp, color = Color.Gray)
            }
        }
    }
}
```

使用这个组件：

```kotlin
@Composable
fun UserList() {
    val users = listOf(
        User("John Doe", "john@example.com", "https://example.com/avatar1.jpg"),
        User("Jane Smith", "jane@example.com")
    )
    
    LazyColumn {
        items(users) {
            UserCard(
                name = it.name,
                email = it.email,
                avatarUrl = it.avatarUrl,
                onClick = { /* 处理点击事件 */ }
            )
        }
    }
}
```

### 带默认参数的自定义组件

你可以为自定义组件的参数提供默认值，使其更加易用：

```kotlin
@Composable
fun AlertDialog(
    title: String? = null,
    message: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
    confirmText: String = "OK",
    dismissText: String = "Cancel"
) {
    // ... 实现
}
```

## 🧩 组合组件

### 组件的组合

Compose 的核心思想是组合而不是继承。你可以将多个组件组合成一个新的组件：

```kotlin
@Composable
fun AuthScreen(onLogin: () -> Unit, onRegister: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // 标题
        Text(text = "Welcome Back!", style = MaterialTheme.typography.h4, modifier = Modifier.padding(bottom = 16.dp))
        
        // 登录表单
        LoginForm(onLogin = onLogin)
        
        // 注册按钮
        TextButton(onClick = onRegister, modifier = Modifier.padding(top = 16.dp)) {
            Text(text = "Don't have an account? Register")
        }
    }
}

@Composable
fun LoginForm(onLogin: () -> Unit) {
    Column(modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = "",
            onValueChange = { /* 更新邮箱 */ },
            label = { Text("Email") },
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
        )
        OutlinedTextField(
            value = "",
            onValueChange = { /* 更新密码 */ },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
        )
        Button(onClick = onLogin, modifier = Modifier.fillMaxWidth()) {
            Text(text = "Login")
        }
    }
}
```

## 🧩 可配置的组件

### 使用 Modifier 参数

为了让组件更加灵活，你应该允许外部提供 `Modifier` 参数：

```kotlin
@Composable
fun CustomButton(
    onClick: () -> Unit,
    text: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier
    ) {
        Text(text = text)
    }
}
```

使用这个组件：

```kotlin
@Composable
fun MyApp() {
    CustomButton(
        onClick = { /* 点击事件 */ },
        text = "Submit",
        modifier = Modifier.fillMaxWidth().padding(16.dp),
        enabled = true
    )
}
```

### 使用 Slot API

Slot API 是 Compose 中一种强大的模式，它允许你在组件中定义可替换的部分：

```kotlin
@Composable
fun CustomCard(
    title: String,
    subtitle: String,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Card(
        elevation = 4.dp,
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = title, fontWeight = FontWeight.Bold)
            Text(text = subtitle, fontSize = 14.sp, color = Color.Gray)
            Spacer(modifier = Modifier.height(16.dp))
            content() // 这是一个 slot
        }
    }
}
```

使用这个组件：

```kotlin
@Composable
fun MyApp() {
    CustomCard(
        title = "My Card",
        subtitle = "This is a custom card with slot API",
        modifier = Modifier.padding(16.dp)
    ) {
        // 填充 slot 内容
        Text(text = "Hello from slot!")
        Button(onClick = { /* 点击事件 */ }) {
            Text(text = "Slot Button")
        }
    }
}
```

### 多 Slot API

你可以定义多个 slot：

```kotlin
@Composable
fun SectionLayout(
    title: String,
    action: @Composable () -> Unit,
    content: @Composable () -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
        // 标题和操作按钮
        Row(
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(text = title, fontWeight = FontWeight.Bold)
            action() // 操作按钮 slot
        }
        
        // 内容
        content() // 内容 slot
    }
}
```

使用这个组件：

```kotlin
@Composable
fun MyApp() {
    SectionLayout(
        title = "My Section",
        action = {
            Button(onClick = { /* 点击事件 */ }) {
                Text(text = "Add")
            }
        }
    ) {
        // 内容
        Text(text = "Section content goes here")
    }
}
```

## 🧩 自定义组件的最佳实践

### 1. 命名规范

- 组件名称使用大驼峰命名法
- 函数名应该清晰地描述组件的功能

```kotlin
// 好的命名
@Composable
fun UserProfileCard(
    user: User,
    onClick: () -> Unit
) {
    // ...
}

// 不好的命名
@Composable
fun UC(
    u: User,
    c: () -> Unit
) {
    // ...
}
```

### 2. 参数顺序

- 必要参数放在前面
- `Modifier` 参数应该放在最后，并提供默认值
- 回调函数（如 `onClick`）放在中间

```kotlin
@Composable
fun Button(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    // 其他参数
    content: @Composable RowScope.() -> Unit
) {
    // ...
}
```

### 3. 提供默认值

为可选参数提供合理的默认值，减少使用者的负担：

```kotlin
@Composable
fun AlertDialog(
    title: String? = null,
    message: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
    confirmText: String = "OK",
    dismissText: String = "Cancel"
) {
    // ...
}
```

### 4. 单一职责原则

每个组件应该只负责一项功能，保持组件的简洁和可复用性：

```kotlin
// 好的做法
@Composable
fun PasswordTextField(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text("Password") },
        visualTransformation = PasswordVisualTransformation(),
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
        modifier = modifier
    )
}

// 不好的做法
@Composable
fun LoginAndRegistration(
    onLogin: () -> Unit,
    onRegister: () -> Unit
) {
    // 这个组件负责太多功能，应该拆分成多个组件
}
```

### 5. 支持主题

确保自定义组件使用主题中的颜色、排版和形状：

```kotlin
@Composable
fun MyButton(
    onClick: () -> Unit,
    text: String,
    modifier: Modifier = Modifier
) {
    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(
            backgroundColor = MaterialTheme.colors.primary,
            contentColor = MaterialTheme.colors.onPrimary
        ),
        shape = MaterialTheme.shapes.medium,
        modifier = modifier
    ) {
        Text(text = text, style = MaterialTheme.typography.button)
    }
}
```

## 🎨 练习

现在，让我们来练习一下：创建一个自定义的 `ProfileScreen` 组件，包含用户信息、统计数据和一个编辑按钮。

```kotlin
// 定义用户数据类
data class User(
    val id: Int,
    val name: String,
    val email: String,
    val avatarUrl: String,
    val followers: Int,
    val following: Int,
    val posts: Int
)

// 自定义用户统计信息组件
@Composable
fun UserStats(followers: Int, following: Int, posts: Int) {
    Row(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
        // 粉丝数
        Column(
            modifier = Modifier.weight(1f),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = "$followers", fontWeight = FontWeight.Bold)
            Text(text = "Followers", fontSize = 14.sp, color = Color.Gray)
        }
        
        // 关注数
        Column(
            modifier = Modifier.weight(1f),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = "$following", fontWeight = FontWeight.Bold)
            Text(text = "Following", fontSize = 14.sp, color = Color.Gray)
        }
        
        // 帖子数
        Column(
            modifier = Modifier.weight(1f),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = "$posts", fontWeight = FontWeight.Bold)
            Text(text = "Posts", fontSize = 14.sp, color = Color.Gray)
        }
    }
}

// 自定义个人资料卡片组件
@Composable
fun ProfileCard(
    user: User,
    onEditClick: () -> Unit
) {
    Card(elevation = 8.dp, modifier = Modifier.padding(16.dp)) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // 个人信息
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(16.dp)
            ) {
                // 头像
                Image(
                    painter = rememberImagePainter(user.avatarUrl),
                    contentDescription = "Avatar",
                    modifier = Modifier.size(80.dp).clip(CircleShape)
                )
                
                // 用户信息
                Column(modifier = Modifier.padding(start = 16.dp)) {
                    Text(text = user.name, fontWeight = FontWeight.Bold, fontSize = 20.sp)
                    Text(text = user.email, fontSize = 14.sp, color = Color.Gray)
                }
            }
            
            // 统计信息
            UserStats(user.followers, user.following, user.posts)
            
            // 编辑按钮
            Button(
                onClick = onEditClick,
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                shape = MaterialTheme.shapes.medium
            ) {
                Text(text = "Edit Profile")
            }
        }
    }
}

// 主应用
@Composable
fun ProfileScreen() {
    // 模拟用户数据
    val user = User(
        id = 1,
        name = "John Doe",
        email = "john@example.com",
        avatarUrl = "https://randomuser.me/api/portraits/men/32.jpg",
        followers = 1234,
        following = 567,
        posts = 89
    )
    
    Scaffold(
        topBar = {
            TopAppBar(title = { Text(text = "Profile") })
        }
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            ProfileCard(
                user = user,
                onEditClick = { /* 处理编辑点击事件 */ }
            )
        }
    }
}
```

## 🎉 恭喜

你已经学习了如何在 Compose 中创建自定义组件！自定义组件是 Compose 开发的核心，它可以帮助你复用代码，提高开发效率，让你的应用更加模块化。

下一节，我们将学习 Compose 与传统 View 系统的互操作性，了解如何在 Compose 中使用传统 View，以及如何在传统 View 系统中使用 Compose。

🚀 继续前进吧！