# Compose 布局基础

欢迎来到 Compose 布局的世界！布局是 UI 设计中非常重要的一部分，它决定了组件如何在屏幕上排列和组织。在 Compose 中，布局系统非常灵活和强大，让我们一起探索吧！

## 🎯 什么是布局？

布局是指将 UI 组件排列在屏幕上的过程。在 Compose 中，布局由专门的布局组件处理，这些组件可以控制子组件的大小、位置和排列方式。

Compose 提供了三种基本的布局组件：

- Column：垂直排列子组件
- Row：水平排列子组件
- Box：在同一位置叠加子组件

## 🧩 Column 组件

Column 组件用于垂直排列子组件：

### 基本用法

```kotlin
@Composable
fun MyColumn() {
    Column {
        Text(text = "Item 1")
        Text(text = "Item 2")
        Text(text = "Item 3")
    }
}
```

### 对齐方式

你可以使用 `horizontalAlignment` 参数来设置子组件的水平对齐方式：

```kotlin
@Composable
fun MyAlignedColumn() {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally, // 水平居中
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(text = "Item 1")
        Text(text = "Item 2")
        Text(text = "Item 3")
    }
}
```

水平对齐选项：
- Alignment.Start：左对齐
- Alignment.CenterHorizontally：居中对齐
- Alignment.End：右对齐

### 排列方式

你可以使用 `verticalArrangement` 参数来设置子组件的垂直排列方式：

```kotlin
@Composable
fun MyArrangedColumn() {
    Column(
        verticalArrangement = Arrangement.SpaceBetween, // 均匀分布
        modifier = Modifier.fillMaxHeight()
    ) {
        Text(text = "Top Item")
        Text(text = "Middle Item")
        Text(text = "Bottom Item")
    }
}
```

垂直排列选项：
- Arrangement.Top：顶部对齐
- Arrangement.Center：居中对齐
- Arrangement.Bottom：底部对齐
- Arrangement.SpaceBetween：均匀分布，两端无间距
- Arrangement.SpaceAround：均匀分布，两端有间距
- Arrangement.SpaceEvenly：均匀分布，间距相等

### 间距

你可以使用 `spacing` 参数来设置子组件之间的间距：

```kotlin
@Composable
fun MySpacedColumn() {
    Column(
        verticalArrangement = Arrangement.spacedBy(16.dp), // 子组件之间间距为 16dp
        modifier = Modifier.padding(16.dp)
    ) {
        Text(text = "Item 1")
        Text(text = "Item 2")
        Text(text = "Item 3")
    }
}
```

## 🧩 Row 组件

Row 组件用于水平排列子组件：

### 基本用法

```kotlin
@Composable
fun MyRow() {
    Row {
        Text(text = "Item 1")
        Text(text = "Item 2")
        Text(text = "Item 3")
    }
}
```

### 对齐方式

你可以使用 `verticalAlignment` 参数来设置子组件的垂直对齐方式：

```kotlin
@Composable
fun MyAlignedRow() {
    Row(
        verticalAlignment = Alignment.CenterVertically, // 垂直居中
        modifier = Modifier.fillMaxHeight()
    ) {
        Text(text = "Item 1")
        Text(text = "Item 2")
        Text(text = "Item 3")
    }
}
```

垂直对齐选项：
- Alignment.Top：顶部对齐
- Alignment.CenterVertically：居中对齐
- Alignment.Bottom：底部对齐

### 排列方式

你可以使用 `horizontalArrangement` 参数来设置子组件的水平排列方式：

```kotlin
@Composable
fun MyArrangedRow() {
    Row(
        horizontalArrangement = Arrangement.SpaceBetween, // 均匀分布
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(text = "Left Item")
        Text(text = "Center Item")
        Text(text = "Right Item")
    }
}
```

水平排列选项：
- Arrangement.Start：左对齐
- Arrangement.Center：居中对齐
- Arrangement.End：右对齐
- Arrangement.SpaceBetween：均匀分布，两端无间距
- Arrangement.SpaceAround：均匀分布，两端有间距
- Arrangement.SpaceEvenly：均匀分布，间距相等

### 间距

你可以使用 `spacing` 参数来设置子组件之间的间距：

```kotlin
@Composable
fun MySpacedRow() {
    Row(
        horizontalArrangement = Arrangement.spacedBy(16.dp), // 子组件之间间距为 16dp
        modifier = Modifier.padding(16.dp)
    ) {
        Text(text = "Item 1")
        Text(text = "Item 2")
        Text(text = "Item 3")
    }
}
```

## 🧩 Box 组件

Box 组件用于在同一位置叠加子组件：

### 基本用法

```kotlin
@Composable
fun MyBox() {
    Box {
        // 背景
        Box(modifier = Modifier.size(200.dp).background(Color.Blue))
        // 前景文本
        Text(text = "Hello, Box!", color = Color.White)
    }
}
```

### 对齐方式

你可以使用 `contentAlignment` 参数来设置子组件的对齐方式：

```kotlin
@Composable
fun MyAlignedBox() {
    Box(
        contentAlignment = Alignment.Center, // 居中对齐
        modifier = Modifier.size(200.dp).background(Color.Blue)
    ) {
        Text(text = "Hello, Box!", color = Color.White)
    }
}
```

对齐选项：
- Alignment.TopStart：左上对齐
- Alignment.TopCenter：上中对齐
- Alignment.TopEnd：右上对齐
- Alignment.CenterStart：左中对齐
- Alignment.Center：居中对齐
- Alignment.CenterEnd：右中对齐
- Alignment.BottomStart：左下对齐
- Alignment.BottomCenter：下中对齐
- Alignment.BottomEnd：右下对齐

### 子组件定位

你可以使用 `align` Modifier 来定位 Box 中的单个子组件：

```kotlin
@Composable
fun MyPositionedBox() {
    Box(modifier = Modifier.size(200.dp).background(Color.Blue)) {
        Text(
            text = "Top Left",
            color = Color.White,
            modifier = Modifier.align(Alignment.TopStart)
        )
        Text(
            text = "Center",
            color = Color.White,
            modifier = Modifier.align(Alignment.Center)
        )
        Text(
            text = "Bottom Right",
            color = Color.White,
            modifier = Modifier.align(Alignment.BottomEnd)
        )
    }
}
```

## 🧩 组合布局

你可以将多个布局组件组合在一起，创建更复杂的 UI：

```kotlin
@Composable
fun MyCombinedLayout() {
    Column(modifier = Modifier.padding(16.dp)) {
        // 头部
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
        ) {
            Image(
                painter = painterResource(id = R.drawable.logo),
                contentDescription = "Logo",
                modifier = Modifier.size(40.dp)
            )
            Text(
                text = "My App",
                style = TextStyle(fontSize = 24.sp, fontWeight = FontWeight.Bold),
                modifier = Modifier.padding(start = 8.dp)
            )
        }
        
        // 内容
        Box(modifier = Modifier.fillMaxWidth().height(200.dp).background(Color.Gray)) {
            Text(
                text = "Content Area",
                color = Color.White,
                modifier = Modifier.align(Alignment.Center)
            )
        }
        
        // 底部按钮
        Row(
            horizontalArrangement = Arrangement.End,
            modifier = Modifier.fillMaxWidth().padding(top = 16.dp)
        ) {
            Button(onClick = { /* 取消操作 */ }, modifier = Modifier.padding(end = 8.dp)) {
                Text(text = "Cancel")
            }
            Button(onClick = { /* 确认操作 */ }) {
                Text(text = "OK")
            }
        }
    }
}
```

## 🎯 尺寸控制

### 固定尺寸

使用 `size`、`width` 和 `height` Modifiers 来设置固定尺寸：

```kotlin
@Composable
fun MyFixedSizeBox() {
    Box(
        modifier = Modifier
            .width(200.dp) // 固定宽度
            .height(100.dp) // 固定高度
            .background(Color.Blue)
    ) {
        Text(text = "Fixed Size Box", color = Color.White, modifier = Modifier.align(Alignment.Center))
    }
}
```

### 填充父容器

使用 `fillMaxWidth`、`fillMaxHeight` 和 `fillMaxSize` Modifiers 来填充父容器：

```kotlin
@Composable
fun MyFillParentBox() {
    Box(
        modifier = Modifier
            .fillMaxWidth() // 填充父容器宽度
            .height(100.dp)
            .background(Color.Blue)
    ) {
        Text(text = "Fill Width Box", color = Color.White, modifier = Modifier.align(Alignment.Center))
    }
}
```

### 包裹内容

使用 `wrapContentWidth`、`wrapContentHeight` 和 `wrapContentSize` Modifiers 来包裹内容：

```kotlin
@Composable
fun MyWrapContentBox() {
    Box(
        modifier = Modifier
            .wrapContentSize() // 包裹内容
            .background(Color.Blue)
            .padding(16.dp)
    ) {
        Text(text = "Wrap Content Box", color = Color.White)
    }
}
```

### 权重

使用 `weight` Modifier 来分配剩余空间：

```kotlin
@Composable
fun MyWeightedRow() {
    Row(modifier = Modifier.fillMaxWidth()) {
        Box(modifier = Modifier.weight(1f).height(100.dp).background(Color.Blue)) {
            Text(text = "1/3", color = Color.White, modifier = Modifier.align(Alignment.Center))
        }
        Box(modifier = Modifier.weight(2f).height(100.dp).background(Color.Red)) {
            Text(text = "2/3", color = Color.White, modifier = Modifier.align(Alignment.Center))
        }
    }
}
```

## 🎨 练习

现在，让我们来练习一下：创建一个包含 Column、Row 和 Box 的简单登录界面。

```kotlin
@Composable
fun MyLoginScreen() {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .background(Color.LightGray)
    ) {
        // 应用图标
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(120.dp)
                .clip(CircleShape)
                .background(Color.Blue)
        ) {
            Text(text = "App", color = Color.White, style = TextStyle(fontSize = 24.sp, fontWeight = FontWeight.Bold))
        }
        
        // 标题
        Text(
            text = "Welcome Back",
            style = TextStyle(fontSize = 24.sp, fontWeight = FontWeight.Bold),
            modifier = Modifier.padding(top = 16.dp, bottom = 32.dp)
        )
        
        // 登录表单
        Column(modifier = Modifier.fillMaxWidth(0.8f)) {
            TextField(
                value = email,
                onValueChange = { email = it },
                label = { Text(text = "Email") },
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
            )
            TextField(
                value = password,
                onValueChange = { password = it },
                label = { Text(text = "Password") },
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp)
            )
            
            // 登录按钮
            Button(
                onClick = { /* 登录逻辑 */ },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(text = "Login")
            }
        }
        
        // 底部链接
        Row(
            horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxWidth(0.8f).padding(top = 16.dp)
        ) {
            TextButton(onClick = { /* 注册逻辑 */ }) {
                Text(text = "Create Account")
            }
            TextButton(onClick = { /* 忘记密码逻辑 */ }) {
                Text(text = "Forgot Password?")
            }
        }
    }
}
```

## 🎉 恭喜

你已经学习了 Compose 布局的基础知识！Column、Row 和 Box 是 Compose 中最基本的布局组件，它们可以帮助你创建各种复杂的 UI。

下一节，我们将学习 Compose 中的列表组件，了解如何高效地显示大量数据。

🚀 继续前进吧！