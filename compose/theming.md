# Compose 主题和样式

欢迎来到 Compose 主题和样式的世界！主题和样式是应用设计的重要组成部分，它们决定了应用的整体外观和感觉。Compose 提供了灵活而强大的主题系统，让我们一起探索吧！

## 🎯 什么是主题？

主题是指应用中统一的视觉风格，包括颜色、字体、形状等。主题的作用是：

- 确保应用外观的一致性
- 便于维护和更新设计
- 支持深色模式等多种模式
- 提升用户体验

## 🧩 主题的组成部分

Compose 的主题系统主要包含三个部分：

1. **颜色**：定义应用中使用的颜色方案
2. **排版**：定义应用中使用的字体样式
3. **形状**：定义应用中 UI 元素的形状（如圆角）

## 🧩 创建自定义主题

### 基本主题结构

```kotlin
@Composable
fun MyTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    val colors = if (darkTheme) {
        DarkColorPalette
    } else {
        LightColorPalette
    }
    
    MaterialTheme(
        colors = colors,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}
```

### 定义颜色方案

```kotlin
private val LightColorPalette = lightColors(
    primary = Color(0xFF6200EE),
    primaryVariant = Color(0xFF3700B3),
    secondary = Color(0xFF03DAC6),
    background = Color.White,
    surface = Color.White,
    error = Color(0xFFB00020),
    onPrimary = Color.White,
    onSecondary = Color.Black,
    onBackground = Color.Black,
    onSurface = Color.Black,
    onError = Color.White
)

private val DarkColorPalette = darkColors(
    primary = Color(0xFFBB86FC),
    primaryVariant = Color(0xFF3700B3),
    secondary = Color(0xFF03DAC6),
    background = Color(0xFF121212),
    surface = Color(0xFF121212),
    error = Color(0xFFCF6679),
    onPrimary = Color.Black,
    onSecondary = Color.Black,
    onBackground = Color.White,
    onSurface = Color.White,
    onError = Color.Black
)
```

### 定义排版

```kotlin
val Typography = Typography(
    body1 = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp
    ),
    h1 = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 32.sp
    ),
    button = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        letterSpacing = 1.25.sp
    )
    // 更多样式...
)
```

### 定义形状

```kotlin
val Shapes = Shapes(
    small = RoundedCornerShape(4.dp),
    medium = RoundedCornerShape(8.dp),
    large = RoundedCornerShape(16.dp)
)
```

### 使用自定义主题

```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MyTheme {
                // 应用内容
                MyApp()
            }
        }
    }
}
```

## 🧩 使用主题

### 使用主题颜色

```kotlin
@Composable
fun MyButton() {
    Button(
        onClick = { /* 点击事件 */ },
        colors = ButtonDefaults.buttonColors(
            backgroundColor = MaterialTheme.colors.primary,
            contentColor = MaterialTheme.colors.onPrimary
        )
    ) {
        Text(text = "My Button")
    }
}
```

### 使用主题排版

```kotlin
@Composable
fun MyText() {
    Text(
        text = "Hello, World!",
        style = MaterialTheme.typography.h1
    )
}
```

### 使用主题形状

```kotlin
@Composable
fun MyCard() {
    Card(
        shape = MaterialTheme.shapes.medium,
        elevation = 8.dp,
        modifier = Modifier.padding(16.dp)
    ) {
        Text(text = "My Card", modifier = Modifier.padding(16.dp))
    }
}
```

## 🧩 深色模式支持

### 系统深色模式

Compose 默认支持系统深色模式：

```kotlin
@Composable
fun MyTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    // ...
}
```

### 手动切换深色模式

你也可以手动切换深色模式：

```kotlin
@Composable
fun MyApp() {
    var isDarkMode by rememberSaveable { mutableStateOf(false) }
    
    MyTheme(darkTheme = isDarkMode) {
        Scaffold {
            Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                Switch(
                    checked = isDarkMode,
                    onCheckedChange = { isDarkMode = it },
                    modifier = Modifier.padding(16.dp)
                )
                Text(text = "Toggle Dark Mode")
            }
        }
    }
}
```

## 🧩 自定义主题扩展

### 自定义颜色

你可以扩展主题的颜色方案：

```kotlin
@Stable
class CustomColors(
    val myCustomColor: Color,
    val myOtherColor: Color
)

val MaterialTheme.customColors: CustomColors
    @Composable
    @ReadOnlyComposable
    get() = LocalCustomColors.current

@Composable
fun MyTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    // ...
    
    val customColors = if (darkTheme) {
        DarkCustomColors
    } else {
        LightCustomColors
    }
    
    CompositionLocalProvider(LocalCustomColors provides customColors) {
        MaterialTheme(
            colors = colors,
            typography = Typography,
            shapes = Shapes,
            content = content
        )
    }
}
```

### 使用自定义颜色

```kotlin
@Composable
fun MyCustomComponent() {
    Box(
        modifier = Modifier
            .size(100.dp)
            .background(MaterialTheme.customColors.myCustomColor)
    )
}
```

## 🎯 主题的最佳实践

### 1. 遵循 Material Design 原则

Material Design 提供了一套完整的设计指南，遵循这些原则可以确保应用具有良好的用户体验：

```kotlin
// 好的做法：使用 Material Design 的颜色方案
private val LightColorPalette = lightColors(
    primary = Color(0xFF6200EE),
    primaryVariant = Color(0xFF3700B3),
    // ...
)
```

### 2. 避免硬编码颜色

避免在代码中硬编码颜色，应该使用主题中的颜色：

```kotlin
// 不好的做法：硬编码颜色
@Composable
fun MyBadComponent() {
    Box(modifier = Modifier.size(100.dp).background(Color(0xFF6200EE)))
}

// 好的做法：使用主题颜色
@Composable
fun MyGoodComponent() {
    Box(modifier = Modifier.size(100.dp).background(MaterialTheme.colors.primary))
}
```

### 3. 支持深色模式

确保你的应用支持深色模式，以提升用户体验：

```kotlin
// 好的做法：同时定义浅色和深色方案
private val LightColorPalette = lightColors(/* ... */)
private val DarkColorPalette = darkColors(/* ... */)
```

## 🎨 练习

现在，让我们来练习一下：创建一个包含自定义主题的应用，支持深色模式切换。

```kotlin
// 定义颜色方案
private val LightColorPalette = lightColors(
    primary = Color(0xFF6200EE),
    primaryVariant = Color(0xFF3700B3),
    secondary = Color(0xFF03DAC6),
    background = Color.White,
    surface = Color.White,
    error = Color(0xFFB00020),
    onPrimary = Color.White,
    onSecondary = Color.Black,
    onBackground = Color.Black,
    onSurface = Color.Black,
    onError = Color.White
)

private val DarkColorPalette = darkColors(
    primary = Color(0xFFBB86FC),
    primaryVariant = Color(0xFF3700B3),
    secondary = Color(0xFF03DAC6),
    background = Color(0xFF121212),
    surface = Color(0xFF121212),
    error = Color(0xFFCF6679),
    onPrimary = Color.Black,
    onSecondary = Color.Black,
    onBackground = Color.White,
    onSurface = Color.White,
    onError = Color.Black
)

// 定义排版
val Typography = Typography(
    body1 = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp
    ),
    h1 = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 32.sp
    ),
    button = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        letterSpacing = 1.25.sp
    )
)

// 定义形状
val Shapes = Shapes(
    small = RoundedCornerShape(4.dp),
    medium = RoundedCornerShape(8.dp),
    large = RoundedCornerShape(16.dp)
)

// 创建主题
@Composable
fun MyTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    val colors = if (darkTheme) {
        DarkColorPalette
    } else {
        LightColorPalette
    }
    
    MaterialTheme(
        colors = colors,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}

// 主应用
@Composable
fun MyApp() {
    var isDarkMode by rememberSaveable { mutableStateOf(false) }
    
    MyTheme(darkTheme = isDarkMode) {
        Scaffold {
            Column(
                modifier = Modifier.fillMaxSize().padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                // 深色模式开关
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(text = if (isDarkMode) "Dark Mode" else "Light Mode")
                    Switch(
                        checked = isDarkMode,
                        onCheckedChange = { isDarkMode = it },
                        modifier = Modifier.padding(start = 8.dp)
                    )
                }
                
                // 使用主题的组件
                Text(
                    text = "Hello, Theme!",
                    style = MaterialTheme.typography.h1,
                    modifier = Modifier.padding(vertical = 16.dp)
                )
                
                Button(
                    onClick = { /* 点击事件 */ },
                    shape = MaterialTheme.shapes.large
                ) {
                    Text(text = "My Button")
                }
                
                Card(
                    shape = MaterialTheme.shapes.medium,
                    elevation = 8.dp,
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "This is a card with theme shape",
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        }
    }
}
```

## 🎉 恭喜

你已经学习了 Compose 中的主题和样式！主题系统是 Compose 中非常重要的一部分，它可以帮助你创建出外观一致、易于维护的应用。

下一节，我们将学习 Compose 中的自定义组件，了解如何创建可复用的组件。

🚀 继续前进吧！