# Compose 基础组件

欢迎来到 Compose 组件的奇妙世界！在这一节中，我们将学习 Compose 中最常用的基础组件，比如 Text、Button、Image 等。这些组件就像是 Compose 世界中的积木，你可以用它们来搭建各种复杂的 UI。

## 📝 Text 组件

Text 组件是 Compose 中用于显示文本的最基本组件。让我们来看看它的用法：

### 基本用法

```kotlin
@Composable
fun MyText() {
    Text(text = "Hello, Compose!")
}
```

就是这么简单！你只需要告诉 Text 组件你想要显示的文本内容即可。

### 自定义样式

你可以使用 `style` 参数来自定义文本的样式：

```kotlin
@Composable
fun MyStyledText() {
    Text(
        text = "Hello, Compose!",
        style = TextStyle(
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = Color.Blue,
            textAlign = TextAlign.Center
        )
    )
}
```

或者，你也可以使用 `Modifier` 来设置文本的对齐方式等：

```kotlin
@Composable
fun MyCenteredText() {
    Text(
        text = "Hello, Compose!",
        modifier = Modifier.fillMaxWidth(),
        textAlign = TextAlign.Center
    )
}
```

## 🖱️ Button 组件

Button 组件用于创建可点击的按钮。它可以包含文本、图标或其他组件。

### 基本用法

```kotlin
@Composable
fun MyButton() {
    Button(onClick = { /* 点击事件处理 */ }) {
        Text(text = "Click Me")
    }
}
```

### 带图标的按钮

你可以在按钮中添加图标：

```kotlin
@Composable
fun MyIconButton() {
    Button(onClick = { /* 点击事件处理 */ }) {
        Icon(
            imageVector = Icons.Filled.Add,
            contentDescription = "Add",
            modifier = Modifier.padding(end = 8.dp)
        )
        Text(text = "Add Item")
    }
}
```

### 不同样式的按钮

Compose 提供了不同样式的按钮：

```kotlin
@Composable
fun MyButtons() {
    Column(spacing = 8.dp) {
        // 普通按钮
        Button(onClick = { /* 点击事件处理 */ }) {
            Text(text = "Normal Button")
        }
        
        // 文本按钮
        TextButton(onClick = { /* 点击事件处理 */ }) {
            Text(text = "Text Button")
        }
        
        // 轮廓按钮
        OutlinedButton(onClick = { /* 点击事件处理 */ }) {
            Text(text = "Outlined Button")
        }
    }
}
```

## 🖼️ Image 组件

Image 组件用于显示图像。它可以显示资源文件中的图像、网络图像或其他来源的图像。

### 显示资源图像

```kotlin
@Composable
fun MyImage() {
    Image(
        painter = painterResource(id = R.drawable.my_image),
        contentDescription = "My Image",
        modifier = Modifier.size(200.dp)
    )
}
```

### 显示网络图像

要显示网络图像，你需要使用 `Coil` 库：

首先，添加依赖：

```kotlin
dependencies {
    implementation("io.coil-kt:coil-compose:2.2.2")
}
```

然后，使用 `AsyncImage` 组件：

```kotlin
@Composable
fun MyNetworkImage() {
    AsyncImage(
        model = "https://example.com/image.jpg",
        contentDescription = "Network Image",
        modifier = Modifier.size(200.dp),
        contentScale = ContentScale.Crop
    )
}
```

## ✏️ TextField 组件

TextField 组件用于创建文本输入框，允许用户输入和编辑文本。

### 基本用法

```kotlin
@Composable
fun MyTextField() {
    var text by remember { mutableStateOf("") }
    TextField(
        value = text,
        onValueChange = { text = it },
        label = { Text(text = "Enter your name") }
    )
}
```

### 自定义样式

你可以自定义 TextField 的样式：

```kotlin
@Composable
fun MyStyledTextField() {
    var text by remember { mutableStateOf("") }
    TextField(
        value = text,
        onValueChange = { text = it },
        label = { Text(text = "Enter your name") },
        leadingIcon = { Icon(imageVector = Icons.Filled.Person, contentDescription = null) },
        trailingIcon = { Icon(imageVector = Icons.Filled.Clear, contentDescription = null) },
        singleLine = true,
        modifier = Modifier.fillMaxWidth()
    )
}
```

## 🎯 Switch 和 Checkbox 组件

Switch 和 Checkbox 组件用于创建开关和复选框。

### Switch 组件

```kotlin
@Composable
fun MySwitch() {
    var isChecked by remember { mutableStateOf(false) }
    Switch(
        checked = isChecked,
        onCheckedChange = { isChecked = it },
        modifier = Modifier.padding(8.dp)
    )
}
```

### Checkbox 组件

```kotlin
@Composable
fun MyCheckbox() {
    var isChecked by remember { mutableStateOf(false) }
    Row(verticalAlignment = Alignment.CenterVertically) {
        Checkbox(
            checked = isChecked,
            onCheckedChange = { isChecked = it }
        )
        Text(text = "I agree to the terms and conditions")
    }
}
```

## 🎨 组合组件

你可以将多个组件组合在一起，创建更复杂的 UI：

```kotlin
@Composable
fun MyUserProfile() {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(16.dp)) {
        Image(
            painter = painterResource(id = R.drawable.avatar),
            contentDescription = "User Avatar",
            modifier = Modifier
                .size(60.dp)
                .clip(CircleShape)
        )
        Column(modifier = Modifier.padding(start = 16.dp)) {
            Text(
                text = "John Doe",
                style = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Bold)
            )
            Text(
                text = "Android Developer",
                style = TextStyle(fontSize = 14.sp, color = Color.Gray)
            )
        }
    }
}
```

## 🚀 练习

现在，让我们来练习一下：创建一个包含 Text、Button、Image 和 TextField 的简单登录界面。

```kotlin
@Composable
fun MyLoginScreen() {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Image(
            painter = painterResource(id = R.drawable.logo),
            contentDescription = "App Logo",
            modifier = Modifier.size(120.dp)
        )
        Text(
            text = "Welcome to My App",
            style = TextStyle(fontSize = 24.sp, fontWeight = FontWeight.Bold),
            modifier = Modifier.padding(16.dp)
        )
        TextField(
            value = username,
            onValueChange = { username = it },
            label = { Text(text = "Username") },
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
        )
        TextField(
            value = password,
            onValueChange = { password = it },
            label = { Text(text = "Password") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp)
        )
        Button(
            onClick = { /* 登录逻辑 */ },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(text = "Login")
        }
    }
}
```

## 🎉 恭喜

你已经学习了 Compose 中最常用的基础组件！这些组件是你构建 Compose UI 的基础，掌握它们后，你可以开始学习更复杂的组件和布局了。

下一节，我们将学习 Compose 的布局基础，了解如何使用 Column、Row、Box 等布局组件来组织你的 UI。

🚀 继续前进吧！