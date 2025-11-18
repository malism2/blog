# Compose 列表组件

欢迎来到 Compose 列表组件的世界！在移动应用开发中，列表是最常用的 UI 模式之一，用于显示大量数据。Compose 提供了强大的列表组件，让我们一起探索吧！

## 🎯 什么是列表？

列表是一种用于显示多个相似项目的 UI 组件。在 Compose 中，列表通常用于：

- 显示联系人列表
- 展示产品列表
- 列出新闻文章
- 等等...

Compose 提供了两种主要的列表组件：

- LazyColumn：用于垂直滚动列表
- LazyRow：用于水平滚动列表

## 🧩 LazyColumn 组件

LazyColumn 用于创建垂直滚动的列表，它只会组合和渲染可见的项目，这使得它非常高效，即使列表包含数千个项目。

### 基本用法

```kotlin
@Composable
fun MySimpleList() {
    LazyColumn {
        items(100) { index ->
            Text(
                text = "Item $index",
                modifier = Modifier.padding(16.dp)
            )
        }
    }
}
```

### 显示对象列表

你可以使用 `items` 函数的另一个重载版本来显示对象列表：

```kotlin
// 定义数据类
data class User(val id: Int, val name: String, val email: String)

@Composable
fun MyUserList() {
    val users = listOf(
        User(1, "John Doe", "john@example.com"),
        User(2, "Jane Smith", "jane@example.com"),
        User(3, "Bob Johnson", "bob@example.com")
    )
    
    LazyColumn {
        items(users) { user ->
            UserItem(user)
        }
    }
}

@Composable
fun UserItem(user: User) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(Color.Blue)
                .clip(CircleShape)
        ) {
            Text(
                text = user.name.first().toString(),
                color = Color.White,
                modifier = Modifier.align(Alignment.Center)
            )
        }
        Column(modifier = Modifier.padding(start = 16.dp)) {
            Text(text = user.name, style = TextStyle(fontWeight = FontWeight.Bold))
            Text(text = user.email, style = TextStyle(fontSize = 14.sp, color = Color.Gray))
        }
    }
}
```

### 添加分隔线

你可以使用 `item` 函数在列表中添加分隔线：

```kotlin
@Composable
fun MyListWithDividers() {
    LazyColumn {
        itemsIndexed(users) { index, user ->
            UserItem(user)
            if (index < users.size - 1) {
                Divider(modifier = Modifier.padding(horizontal = 16.dp))
            }
        }
    }
}
```

### 添加头部和底部

你可以使用 `item` 函数在列表中添加头部和底部：

```kotlin
@Composable
fun MyListWithHeaderFooter() {
    LazyColumn {
        // 头部
        item {
            Text(
                text = "User List",
                style = TextStyle(fontSize = 24.sp, fontWeight = FontWeight.Bold),
                modifier = Modifier.padding(16.dp)
            )
        }
        
        // 列表项
        items(users) {
            UserItem(it)
            Divider(modifier = Modifier.padding(horizontal = 16.dp))
        }
        
        // 底部
        item {
            Text(
                text = "Total Users: ${users.size}",
                style = TextStyle(fontSize = 14.sp, color = Color.Gray),
                modifier = Modifier.padding(16.dp)
            )
        }
    }
}
```

## 🧩 LazyRow 组件

LazyRow 用于创建水平滚动的列表，用法与 LazyColumn 类似：

### 基本用法

```kotlin
@Composable
fun MySimpleRow() {
    LazyRow {
        items(50) { index ->
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .background(Color.Blue)
                    .padding(8.dp)
            ) {
                Text(text = "Item $index", color = Color.White)
            }
        }
    }
}
```

### 添加头部和底部

```kotlin
@Composable
fun MyRowWithHeaderFooter() {
    LazyRow(modifier = Modifier.padding(16.dp)) {
        // 头部
        item {
            Text(text = "Start", modifier = Modifier.padding(8.dp))
        }
        
        // 列表项
        items(20) { index ->
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .background(Color.Blue)
                    .padding(8.dp)
            ) {
                Text(text = "$index", color = Color.White)
            }
        }
        
        // 底部
        item {
            Text(text = "End", modifier = Modifier.padding(8.dp))
        }
    }
}
```

## 🧩 网格布局

### LazyVerticalGrid

LazyVerticalGrid 用于创建垂直滚动的网格布局：

```kotlin
@Composable
fun MyVerticalGrid() {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2), // 固定 2 列
        modifier = Modifier.padding(16.dp),
        content = {
            items(20) { index ->
                Box(
                    modifier = Modifier
                        .size(150.dp)
                        .background(Color.Blue)
                        .padding(8.dp)
                ) {
                    Text(text = "Item $index", color = Color.White)
                }
            }
        }
    )
}
```

### LazyHorizontalGrid

LazyHorizontalGrid 用于创建水平滚动的网格布局：

```kotlin
@Composable
fun MyHorizontalGrid() {
    LazyHorizontalGrid(
        rows = GridCells.Fixed(3), // 固定 3 行
        modifier = Modifier.height(300.dp).padding(16.dp),
        content = {
            items(30) { index ->
                Box(
                    modifier = Modifier
                        .size(100.dp)
                        .background(Color.Blue)
                        .padding(8.dp)
                ) {
                    Text(text = "Item $index", color = Color.White)
                }
            }
        }
    )
}
```

## 🎯 列表性能优化

### 1. 使用 key 参数

当列表数据发生变化时，使用 `key` 参数可以帮助 Compose 更高效地更新列表：

```kotlin
@Composable
fun MyListWithKeys() {
    LazyColumn {
        items(users, key = { it.id }) { user ->
            UserItem(user)
        }
    }
}
```

### 2. 避免在 items 中创建 Composable 函数

尽量避免在 `items` 函数中创建新的 Composable 函数，这会影响性能：

```kotlin
// 不好的做法
@Composable
fun MyBadList() {
    LazyColumn {
        items(users) {
            @Composable
            fun UserItem() {
                // 用户项内容
            }
            UserItem()
        }
    }
}

// 好的做法
@Composable
fun MyGoodList() {
    LazyColumn {
        items(users) {
            UserItem(it)
        }
    }
}

@Composable
fun UserItem(user: User) {
    // 用户项内容
}
```

### 3. 避免不必要的重新组合

使用 `remember` 和 `derivedStateOf` 来避免不必要的重新组合：

```kotlin
@Composable
fun MyOptimizedList() {
    val users by remember { mutableStateOf(getUsers()) }
    val searchQuery by remember { mutableStateOf("") }
    
    // 使用 derivedStateOf 只在依赖项变化时重新计算
    val filteredUsers by remember {
        derivedStateOf {
            if (searchQuery.isEmpty()) {
                users
            } else {
                users.filter { it.name.contains(searchQuery, ignoreCase = true) }
            }
        }
    }
    
    LazyColumn {
        items(filteredUsers) {
            UserItem(it)
        }
    }
}
```

## 🎯 列表的高级用法

### 列表项动画

你可以为列表项添加动画效果：

```kotlin
@Composable
fun MyAnimatedList() {
    LazyColumn {
        items(users) { user ->
            val animatedVisibility = rememberAnimatedVisibility(visible = true)
            animatedVisibility(enter = fadeIn() + slideInVertically(), exit = fadeOut() + slideOutVertically()) {
                UserItem(user)
            }
        }
    }
}
```

### 列表项交互

你可以为列表项添加点击、长按等交互效果：

```kotlin
@Composable
fun MyInteractiveList() {
    val selectedUser by remember { mutableStateOf<User?>(null) }
    
    LazyColumn {
        items(users) { user ->
            val isSelected = selectedUser == user
            UserItem(
                user = user,
                isSelected = isSelected,
                onClick = { selectedUser = user },
                onLongClick = { /* 处理长按事件 */ }
            )
        }
    }
}

@Composable
fun UserItem(user: User, isSelected: Boolean, onClick: () -> Unit, onLongClick: () -> Unit) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .background(if (isSelected) Color.LightGray else Color.Transparent)
            .clickable(onClick = onClick)
            .pointerInput(Unit) {
                detectTapGestures(onLongPress = { onLongClick() })
            }
    ) {
        // 用户项内容
    }
}
```

## 🎨 练习

现在，让我们来练习一下：创建一个包含懒加载列表的应用，显示联系人列表，并支持搜索功能。

```kotlin
@Composable
fun MyContactListApp() {
    var searchQuery by remember { mutableStateOf("") }
    val contacts = remember { getContacts() }
    
    // 过滤联系人
    val filteredContacts by remember {
        derivedStateOf {
            if (searchQuery.isEmpty()) {
                contacts
            } else {
                contacts.filter { it.name.contains(searchQuery, ignoreCase = true) }
            }
        }
    }
    
    Column(modifier = Modifier.fillMaxSize()) {
        // 搜索栏
        TextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            label = { Text(text = "Search contacts") },
            leadingIcon = { Icon(imageVector = Icons.Filled.Search, contentDescription = null) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        )
        
        // 联系人列表
        if (filteredContacts.isEmpty()) {
            // 空列表提示
            Text(
                text = "No contacts found",
                modifier = Modifier.fillMaxSize().wrapContentSize(Alignment.Center)
            )
        } else {
            // 联系人列表
            LazyColumn {
                items(filteredContacts) { contact ->
                    ContactItem(contact)
                    Divider(modifier = Modifier.padding(horizontal = 16.dp))
                }
            }
        }
    }
}

@Composable
fun ContactItem(contact: Contact) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .clickable { /* 处理点击事件 */ }
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .background(Color.Blue)
                .clip(CircleShape)
        ) {
            Text(
                text = contact.name.first().toString(),
                color = Color.White,
                style = TextStyle(fontWeight = FontWeight.Bold),
                modifier = Modifier.align(Alignment.Center)
            )
        }
        Column(modifier = Modifier.padding(start = 16.dp)) {
            Text(text = contact.name, style = TextStyle(fontWeight = FontWeight.Bold))
            Text(text = contact.phoneNumber, style = TextStyle(fontSize = 14.sp, color = Color.Gray))
        }
        Icon(imageVector = Icons.Filled.ArrowForward, contentDescription = null, modifier = Modifier.padding(start = 8.dp))
    }
}
```

## 🎉 恭喜

你已经学习了 Compose 中的列表组件！从基本的 LazyColumn 和 LazyRow 到网格布局和性能优化，这些知识将帮助你创建高效、美观的列表 UI。

下一节，我们将学习 Compose 中的动画，了解如何为应用添加生动的动画效果。

🚀 继续前进吧！