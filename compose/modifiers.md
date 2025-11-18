# Compose Modifiers

欢迎来到 Compose Modifiers 的魔法世界！Modifiers 是 Compose 中用于装饰组件的强大工具，它们可以改变组件的外观、布局、交互等。如果把 Compose 组件比作一个人，那么 Modifiers 就是这个人的服装、配饰和行为方式。

## 🎨 什么是 Modifiers？

Modifiers 是用于修改 Compose 组件的函数，它们可以：

- 改变组件的大小、位置和排列方式
- 添加背景、边框和阴影
- 处理点击、滚动等用户交互
- 调整组件的可访问性属性
- 等等...

## 🧩 Modifiers 的基本用法

Modifiers 使用链式调用的方式，你可以将多个 Modifiers 连接在一起：

```kotlin
@Composable
fun MyStyledText() {
    Text(
        text = "Hello, Modifiers!",
        modifier = Modifier
            .padding(16.dp) // 添加内边距
            .background(Color.Blue) // 设置背景颜色
            .foregroundColor(Color.White) // 设置文字颜色
            .border(2.dp, Color.Red) // 添加边框
            .clickable { /* 处理点击事件 */ } // 添加点击事件
    )
}
```

## 📏 布局相关的 Modifiers

### size

`size` 用于设置组件的宽度和高度：

```kotlin
@Composable
fun MySizedBox() {
    Box(
        modifier = Modifier
            .size(100.dp) // 设置宽高都为 100dp
            .background(Color.Blue)
    )
}
```

### width 和 height

`width` 和 `height` 用于单独设置组件的宽度和高度：

```kotlin
@Composable
fun MyBoxWithDimensions() {
    Box(
        modifier = Modifier
            .width(200.dp) // 设置宽度为 200dp
            .height(100.dp) // 设置高度为 100dp
            .background(Color.Blue)
    )
}
```

### fillMaxSize、fillMaxWidth、fillMaxHeight

这些 Modifiers 用于让组件填充其父容器的空间：

```kotlin
@Composable
fun MyFillingBox() {
    Box(
        modifier = Modifier
            .fillMaxSize() // 填充整个父容器
            .background(Color.Blue)
    )
}

@Composable
fun MyFillingText() {
    Text(
        text = "Fill Width",
        modifier = Modifier
            .fillMaxWidth() // 填充父容器的宽度
            .background(Color.Blue)
            .foregroundColor(Color.White)
    )
}
```

## 📐 布局排列相关的 Modifiers

### padding

`padding` 用于为组件添加内边距：

```kotlin
@Composable
fun MyPaddedText() {
    Text(
        text = "Padded Text",
        modifier = Modifier
            .background(Color.Blue)
            .padding(16.dp) // 添加 16dp 的内边距
            .foregroundColor(Color.White)
    )
}

@Composable
fun MySpecificPaddedText() {
    Text(
        text = "Specifically Padded Text",
        modifier = Modifier
            .background(Color.Blue)
            .padding( // 分别设置不同方向的内边距
                start = 10.dp,
                top = 20.dp,
                end = 30.dp,
                bottom = 40.dp
            )
            .foregroundColor(Color.White)
    )
}
```

### margin

`margin` 用于为组件添加外边距（注意：在 Compose 中，margin 是通过父组件的 `padding` 或使用 `offset` 实现的）：

```kotlin
@Composable
fun MyBoxWithMargin() {
    Box(modifier = Modifier.padding(16.dp)) { // 父容器的 padding 作为子组件的 margin
        Box(
            modifier = Modifier
                .size(100.dp)
                .background(Color.Blue)
        )
    }
}
```

### offset

`offset` 用于偏移组件的位置：

```kotlin
@Composable
fun MyOffsetBox() {
    Box(
        modifier = Modifier
            .size(100.dp)
            .background(Color.Blue)
            .offset( // 向右偏移 50dp，向下偏移 20dp
                x = 50.dp,
                y = 20.dp
            )
    )
}
```

## 🎨 样式相关的 Modifiers

### background

`background` 用于设置组件的背景：

```kotlin
@Composable
fun MyBackgroundBox() {
    Box(
        modifier = Modifier
            .size(100.dp)
            .background( // 设置蓝色背景
                color = Color.Blue,
                shape = RoundedCornerShape(10.dp) // 圆角
            )
    )
}
```

### border

`border` 用于为组件添加边框：

```kotlin
@Composable
fun MyBorderBox() {
    Box(
        modifier = Modifier
            .size(100.dp)
            .border( // 添加红色边框
                width = 2.dp,
                color = Color.Red,
                shape = RoundedCornerShape(10.dp) // 圆角
            )
    )
}
```

### clip

`clip` 用于裁剪组件的形状：

```kotlin
@Composable
fun MyClippedImage() {
    Image(
        painter = painterResource(id = R.drawable.my_image),
        contentDescription = "My Image",
        modifier = Modifier
            .size(100.dp)
            .clip(CircleShape) // 裁剪成圆形
    )
}
```

## 🖱️ 交互相关的 Modifiers

### clickable

`clickable` 用于处理组件的点击事件：

```kotlin
@Composable
fun MyClickableBox() {
    var isClicked by remember { mutableStateOf(false) }
    Box(
        modifier = Modifier
            .size(100.dp)
            .background(if (isClicked) Color.Green else Color.Blue)
            .clickable( // 添加点击事件
                onClick = { isClicked = !isClicked },
                indication = rememberRipple(), // 添加点击涟漪效果
                interactionSource = remember { MutableInteractionSource() }
            )
    )
}
```

### scrollable

`scrollable` 用于使组件可滚动：

```kotlin
@Composable
fun MyScrollableText() {
    val scrollState = rememberScrollState()
    Column(
        modifier = Modifier
            .size(200.dp)
            .scrollable( // 垂直滚动
                state = scrollState,
                orientation = Orientation.Vertical
            )
    ) {
        repeat(20) {
            Text(text = "Item $it", modifier = Modifier.padding(8.dp))
        }
    }
}
```

### swipeable

`swipeable` 用于处理组件的滑动事件：

```kotlin
@Composable
fun MySwipeableBox() {
    val swipeState = rememberSwipeableState(0)
    Box(
        modifier = Modifier
            .size(200.dp)
            .background(Color.Blue)
            .swipeable( // 水平滑动
                state = swipeState,
                anchors = mapOf(0f to 0, 200f to 1),
                orientation = Orientation.Horizontal
            )
    )
}
```

## 🎯 Modifiers 的顺序

Modifiers 的顺序非常重要！不同的顺序会产生不同的效果：

```kotlin
@Composable
fun MyOrderMattersExample() {
    Column(modifier = Modifier.padding(16.dp)) {
        // 先 padding，再 background
        Box(
            modifier = Modifier
                .padding(16.dp)
                .background(Color.Blue)
                .size(100.dp)
        )
        Spacer(modifier = Modifier.height(16.dp))
        // 先 background，再 padding
        Box(
            modifier = Modifier
                .background(Color.Red)
                .padding(16.dp)
                .size(100.dp)
        )
    }
}
```

在上面的例子中，第一个 Box 会比第二个 Box 看起来更大，因为它先添加了内边距，然后再设置了背景颜色。

## 🚀 高级 Modifiers 技巧

### 条件 Modifiers

你可以根据条件应用不同的 Modifiers：

```kotlin
@Composable
fun MyConditionalModifierBox(isSelected: Boolean) {
    Box(
        modifier = Modifier
            .size(100.dp)
            .background(if (isSelected) Color.Green else Color.Blue)
            .then(if (isSelected) { // 条件 Modifier
                Modifier.border(2.dp, Color.Yellow)
            } else { // 空 Modifier
                Modifier
            })
    )
}
```

### 组合 Modifiers

你可以将多个 Modifiers 组合成一个自定义的 Modifier：

```kotlin
fun Modifier.myCustomModifier() = this
    .background(Color.Blue)
    .border(2.dp, Color.Red)
    .padding(16.dp)

@Composable
fun MyCustomModifierExample() {
    Box(
        modifier = Modifier
            .size(100.dp)
            .myCustomModifier() // 使用自定义 Modifier
    )
}
```

## 🎨 练习

现在，让我们来练习一下：创建一个使用多种 Modifiers 的自定义按钮。

```kotlin
@Composable
fun MyCustomButton(text: String, onClick: () -> Unit) {
    var isPressed by remember { mutableStateOf(false) }
    Text(
        text = text,
        color = Color.White,
        modifier = Modifier
            .padding(horizontal = 20.dp, vertical = 10.dp)
            .background(
                color = if (isPressed) Color.DarkBlue else Color.Blue,
                shape = RoundedCornerShape(20.dp)
            )
            .border(
                width = 2.dp,
                color = Color.White,
                shape = RoundedCornerShape(20.dp)
            )
            .clickable(
                onClick = onClick,
                indication = null,
                interactionSource = remember { MutableInteractionSource() }
            )
            .pointerInput(Unit) { // 处理按下和抬起事件
                detectTapGestures(
                    onPress = { pressed ->
                        isPressed = pressed
                        if (pressed) {
                            awaitRelease()
                            isPressed = false
                        }
                    }
                )
            }
            .padding(16.dp)
    )
}
```

## 🎉 恭喜

你已经学习了 Compose Modifiers 的基本用法和高级技巧！Modifiers 是 Compose 中非常重要的概念，掌握它们可以让你创建出各种精美的 UI。

下一节，我们将学习 Compose 中的状态管理，了解如何使用 State、remember 和 mutableStateOf 来管理 UI 的状态。

🚀 继续前进吧！