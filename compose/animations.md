# Compose 动画

欢迎来到 Compose 动画的世界！动画可以让你的应用更加生动有趣，提升用户体验。Compose 提供了强大而灵活的动画系统，让我们一起探索吧！

## 🎯 什么是动画？

动画是指通过连续显示一系列不同的图像或状态，在视觉上产生运动或变化的效果。在移动应用中，动画通常用于：

- 引导用户注意重要内容
- 提供反馈（如点击按钮时的涟漪效果）
- 平滑过渡界面状态
- 增强用户体验

## 🧩 基本动画 API

### animate*AsState

`animate*AsState` 是 Compose 中最基本的动画 API，用于为单个值创建动画。它支持多种类型：

- `animateDpAsState`：用于 Dp 值
- `animateFloatAsState`：用于 Float 值
- `animateColorAsState`：用于 Color 值
- `animateIntAsState`：用于 Int 值

### 动画大小变化

```kotlin
@Composable
fun MySizeAnimation() {
    var isExpanded by remember { mutableStateOf(false) }
    val size by animateDpAsState(
        targetValue = if (isExpanded) 200.dp else 100.dp,
        animationSpec = spring(stiffness = Spring.StiffnessMedium)
    )
    
    Box(
        modifier = Modifier
            .size(size)
            .background(Color.Blue)
            .clickable { isExpanded = !isExpanded }
    ) {
        Text(text = "Click me!", color = Color.White, modifier = Modifier.align(Alignment.Center))
    }
}
```

### 动画颜色变化

```kotlin
@Composable
fun MyColorAnimation() {
    var isPressed by remember { mutableStateOf(false) }
    val color by animateColorAsState(
        targetValue = if (isPressed) Color.Green else Color.Blue,
        animationSpec = tween(durationMillis = 500)
    )
    
    Box(
        modifier = Modifier
            .size(150.dp)
            .background(color)
            .clickable { isPressed = !isPressed }
    ) {
        Text(text = "Click me!", color = Color.White, modifier = Modifier.align(Alignment.Center))
    }
}
```

### 动画透明度变化

```kotlin
@Composable
fun MyAlphaAnimation() {
    var isVisible by remember { mutableStateOf(true) }
    val alpha by animateFloatAsState(
        targetValue = if (isVisible) 1f else 0f,
        animationSpec = tween(durationMillis = 1000)
    )
    
    Column {
        Box(
            modifier = Modifier
                .size(150.dp)
                .background(Color.Blue)
                .alpha(alpha)
        )
        Button(onClick = { isVisible = !isVisible }) {
            Text(text = "Toggle Visibility")
        }
    }
}
```

## 🧩 AnimatedVisibility

`AnimatedVisibility` 用于控制组件的显示和隐藏，并提供了多种进入和退出动画：

- `fadeIn`/`fadeOut`：淡入淡出效果
- `slideIn`/`slideOut`：滑入滑出效果
- `scaleIn`/`scaleOut`：缩放效果

### 淡入淡出动画

```kotlin
@Composable
fun MyFadeAnimation() {
    var isVisible by remember { mutableStateOf(true) }
    
    Column {
        AnimatedVisibility(
            visible = isVisible,
            enter = fadeIn(animationSpec = tween(1000)),
            exit = fadeOut(animationSpec = tween(1000))
        ) {
            Box(
                modifier = Modifier
                    .size(150.dp)
                    .background(Color.Blue)
            )
        }
        Button(onClick = { isVisible = !isVisible }) {
            Text(text = "Toggle Visibility")
        }
    }
}
```

### 滑入滑出动画

```kotlin
@Composable
fun MySlideAnimation() {
    var isVisible by remember { mutableStateOf(true) }
    
    Column {
        AnimatedVisibility(
            visible = isVisible,
            enter = slideInVertically(initialOffsetY = { -it }),
            exit = slideOutVertically(targetOffsetY = { -it })
        ) {
            Box(
                modifier = Modifier
                    .size(150.dp)
                    .background(Color.Blue)
            )
        }
        Button(onClick = { isVisible = !isVisible }) {
            Text(text = "Toggle Visibility")
        }
    }
}
```

### 组合动画

你可以组合多种动画效果：

```kotlin
@Composable
fun MyCombinedAnimation() {
    var isVisible by remember { mutableStateOf(true) }
    
    Column {
        AnimatedVisibility(
            visible = isVisible,
            enter = fadeIn() + slideInVertically() + scaleIn(initialScale = 0.5f),
            exit = fadeOut() + slideOutVertically() + scaleOut(targetScale = 0.5f)
        ) {
            Box(
                modifier = Modifier
                    .size(150.dp)
                    .background(Color.Blue)
            )
        }
        Button(onClick = { isVisible = !isVisible }) {
            Text(text = "Toggle Visibility")
        }
    }
}
```

## 🧩 AnimatedContent

`AnimatedContent` 用于在不同内容之间切换时添加动画效果：

### 基本用法

```kotlin
@Composable
fun MyAnimatedContent() {
    var count by remember { mutableStateOf(0) }
    
    Column {
        AnimatedContent(targetState = count, transitionSpec = {
            // 进入动画
            val enter = fadeIn(animationSpec = tween(300)) +
                slideInHorizontally(animationSpec = tween(300), initialOffsetX = { it })
            // 退出动画
            val exit = fadeOut(animationSpec = tween(300)) +
                slideOutHorizontally(animationSpec = tween(300), targetOffsetX = { -it })
            
            enter with exit
        }) {
            Text(
                text = "Count: $it",
                style = TextStyle(fontSize = 24.sp, fontWeight = FontWeight.Bold)
            )
        }
        Button(onClick = { count++ }) {
            Text(text = "Increment")
        }
    }
}
```

## 🧩 Crossfade

`Crossfade` 是 `AnimatedContent` 的简化版本，用于在不同内容之间切换时添加淡入淡出效果：

```kotlin
@Composable
fun MyCrossfade() {
    var currentScreen by remember { mutableStateOf("Screen1") }
    
    Column {
        Crossfade(targetState = currentScreen) {
            when (it) {
                "Screen1" -> Screen1(onNavigateToScreen2 = { currentScreen = "Screen2" })
                "Screen2" -> Screen2(onNavigateToScreen1 = { currentScreen = "Screen1" })
            }
        }
    }
}

@Composable
fun Screen1(onNavigateToScreen2: () -> Unit) {
    Box(
        modifier = Modifier
            .size(200.dp)
            .background(Color.Blue)
            .clickable(onClick = onNavigateToScreen2)
    ) {
        Text(text = "Screen 1", color = Color.White, modifier = Modifier.align(Alignment.Center))
    }
}

@Composable
fun Screen2(onNavigateToScreen1: () -> Unit) {
    Box(
        modifier = Modifier
            .size(200.dp)
            .background(Color.Red)
            .clickable(onClick = onNavigateToScreen1)
    ) {
        Text(text = "Screen 2", color = Color.White, modifier = Modifier.align(Alignment.Center))
    }
}
```

## 🧩 自定义动画

### 使用 Animatable

`Animatable` 提供了更底层的动画控制，允许你创建更复杂的动画：

```kotlin
@Composable
fun MyCustomAnimation() {
    val animatable = remember { Animatable(0f) }
    
    LaunchedEffect(Unit) {
        // 循环动画
        while (true) {
            animatable.animateTo(
                targetValue = 1f,
                animationSpec = tween(1000)
            )
            animatable.animateTo(
                targetValue = 0f,
                animationSpec = tween(1000)
            )
        }
    }
    
    Box(
        modifier = Modifier
            .size(150.dp)
            .background(Color.Blue)
            .alpha(animatable.value)
    )
}
```

### 使用 InfiniteTransition

`InfiniteTransition` 用于创建无限循环的动画：

```kotlin
@Composable
fun MyInfiniteAnimation() {
    val infiniteTransition = rememberInfiniteTransition()
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000),
            repeatMode = RepeatMode.Reverse
        )
    )
    
    Box(
        modifier = Modifier
            .size(150.dp)
            .background(Color.Blue)
            .alpha(alpha)
    )
}
```

## 🎯 动画的最佳实践

### 1. 不要过度使用动画

虽然动画可以提升用户体验，但过度使用会分散用户注意力，影响性能：

```kotlin
// 不好的做法：太多动画效果
@Composable
fun MyOverAnimatedScreen() {
    // 太多动画...
}

// 好的做法：有选择地使用动画
@Composable
fun MyWellAnimatedScreen() {
    // 只在重要的交互和过渡上使用动画
}
```

### 2. 使用合适的动画时间

动画时间应该适中，太快会让用户难以察觉，太慢会让用户感到不耐烦：

```kotlin
// 不好的做法：动画时间太长
@Composable
fun MySlowAnimation() {
    val size by animateDpAsState(
        targetValue = 200.dp,
        animationSpec = tween(durationMillis = 5000) // 5秒太长了
    )
}

// 好的做法：使用合适的动画时间
@Composable
fun MyGoodAnimation() {
    val size by animateDpAsState(
        targetValue = 200.dp,
        animationSpec = tween(durationMillis = 300) // 300毫秒比较合适
    )
}
```

### 3. 保持动画一致性

在整个应用中保持动画风格的一致性：

```kotlin
// 不好的做法：动画风格不一致
@Composable
fun MyInconsistentAnimation() {
    val size1 by animateDpAsState(
        targetValue = 200.dp,
        animationSpec = spring()
    )
    val size2 by animateDpAsState(
        targetValue = 200.dp,
        animationSpec = tween()
    )
}

// 好的做法：动画风格一致
@Composable
fun MyConsistentAnimation() {
    val size1 by animateDpAsState(
        targetValue = 200.dp,
        animationSpec = spring()
    )
    val size2 by animateDpAsState(
        targetValue = 200.dp,
        animationSpec = spring() // 使用相同的动画风格
    )
}
```

## 🎨 练习

现在，让我们来练习一下：创建一个包含动画效果的可展开/折叠列表。

```kotlin
@Composable
fun MyExpandableList() {
    data class Item(val title: String, val content: String)
    
    val items = remember { 
        listOf(
            Item("Item 1", "This is the content of Item 1"),
            Item("Item 2", "This is the content of Item 2"),
            Item("Item 3", "This is the content of Item 3")
        )
    }
    
    val expandedItems = remember { mutableStateMapOf<Int, Boolean>() }
    
    LazyColumn {
        itemsIndexed(items) {
            index, item ->
            val isExpanded = expandedItems[index] ?: false
            val contentHeight by animateDpAsState(
                targetValue = if (isExpanded) 100.dp else 0.dp
            )
            
            Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
                // 标题行
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { expandedItems[index] = !isExpanded }
                ) {
                    Text(
                        text = item.title,
                        style = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Bold),
                        modifier = Modifier.weight(1f)
                    )
                    Icon(
                        imageVector = if (isExpanded) Icons.Filled.ArrowDropUp else Icons.Filled.ArrowDropDown,
                        contentDescription = null
                    )
                }
                
                // 内容行（带动画）
                AnimatedVisibility(visible = isExpanded) {
                    Text(
                        text = item.content,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }
        }
    }
}
```

## 🎉 恭喜

你已经学习了 Compose 中的动画功能！从基本的 `animate*AsState` 到复杂的 `AnimatedContent` 和 `CustomAnimation`，这些 API 可以帮助你创建各种生动有趣的动画效果。

下一节，我们将学习 Compose 中的导航功能，了解如何在不同的屏幕之间进行导航。

🚀 继续前进吧！