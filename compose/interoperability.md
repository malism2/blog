# Compose 与传统 View 系统的互操作性

欢迎来到 Compose 与传统 View 系统的互操作性世界！在实际开发中，我们可能需要将 Compose 与传统 View 系统结合使用。Compose 提供了强大的互操作性支持，让我们一起探索吧！

## 🎯 什么是互操作性？

互操作性是指不同技术或系统之间能够相互协作的能力。在 Android 开发中，互操作性通常指 Compose 与传统 View 系统之间的相互调用和使用。

## 🧩 在 Compose 中使用传统 View

有时候，我们可能需要在 Compose 中使用一些传统的 View 组件（如 `WebView`、`MapView` 等）。Compose 提供了 `AndroidView` 组件来实现这一功能。

### 使用 AndroidView

```kotlin
@Composable
fun MyWebView(url: String) {
    // 用于存储 WebView 的引用
    val webViewRef = remember { mutableStateOf<WebView?>(null) }
    
    AndroidView(
        factory = { context ->
            WebView(context).apply {
                // 设置 WebView 客户端
                webViewClient = WebViewClient()
                // 启用 JavaScript
                settings.javaScriptEnabled = true
                // 加载网页
                loadUrl(url)
                // 保存 WebView 引用
                webViewRef.value = this
            }
        },
        update = { webView ->
            // 当 url 变化时更新 WebView
            if (webView.url != url) {
                webView.loadUrl(url)
            }
        }
    )
}
```

使用这个组件：

```kotlin
@Composable
fun WebViewScreen() {
    Scaffold(
        topBar = {
            TopAppBar(title = { Text(text = "WebView") })
        }
    ) {
        MyWebView(url = "https://www.google.com")
    }
}
```

### 使用自定义 View

你也可以在 Compose 中使用自定义 View：

```kotlin
// 自定义 View
class MyCustomView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {
    
    var text by Delegates.observable("Hello") { _, _, _ ->
        invalidate()
    }
    
    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        // 绘制文本
        val paint = Paint()
        paint.textSize = 48f
        paint.color = Color.BLACK
        canvas.drawText(text, 0f, 100f, paint)
    }
}

// 在 Compose 中使用自定义 View
@Composable
fun MyComposableCustomView(text: String) {
    AndroidView(
        factory = { context ->
            MyCustomView(context)
        },
        update = { view ->
            view.text = text
        }
    )
}
```

## 🧩 在传统 View 系统中使用 Compose

有时候，我们可能需要在传统 View 系统中使用 Compose 组件。Compose 提供了 `ComposeView` 来实现这一功能。

### 使用 ComposeView

#### 在 XML 布局中使用

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">
    
    <TextView
        android:id="@+id/text_view"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Traditional View" />
    
    <androidx.compose.ui.platform.ComposeView
        android:id="@+id/compose_view"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1" />
</LinearLayout>
```

#### 在 Activity 或 Fragment 中使用

```kotlin
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // 获取 ComposeView
        val composeView = findViewById<ComposeView>(R.id.compose_view)
        
        // 设置 Compose 内容
        composeView.setContent {
            MyComposeTheme {
                Column(modifier = Modifier.fillMaxSize()) {
                    Text(text = "Hello from Compose!")
                    Button(onClick = { /* 点击事件 */ }) {
                        Text(text = "Compose Button")
                    }
                }
            }
        }
    }
}
```

### 在 RecyclerView 中使用 Compose

你也可以在 RecyclerView 中使用 Compose 组件：

```kotlin
class ComposeViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
    private val composeView = itemView.findViewById<ComposeView>(R.id.compose_view)
    
    fun bind(item: MyItem) {
        composeView.setContent {
            MyComposeTheme {
                // 渲染 Compose 内容
                MyComposeItem(item = item)
            }
        }
    }
}
```

## 🧩 数据传递

### 在 Compose 和传统 View 之间传递数据

#### 从 Compose 传递数据到传统 View

```kotlin
@Composable
fun MyComposable() {
    var text by remember { mutableStateOf("Hello") }
    
    Column(modifier = Modifier.fillMaxSize()) {
        // Compose TextField
        TextField(
            value = text,
            onValueChange = { text = it },
            modifier = Modifier.padding(16.dp)
        )
        
        // 传统 View
        AndroidView(
            factory = { context ->
                TextView(context)
            },
            update = { textView ->
                // 从 Compose 传递数据到传统 View
                textView.text = text
            }
        )
    }
}
```

#### 从传统 View 传递数据到 Compose

```kotlin
@Composable
fun MyComposable() {
    var text by remember { mutableStateOf("Hello") }
    
    Column(modifier = Modifier.fillMaxSize()) {
        // 传统 EditText
        AndroidView(
            factory = { context ->
                EditText(context).apply {
                    // 从传统 View 传递数据到 Compose
                    addTextChangedListener(object : TextWatcher {
                        override fun afterTextChanged(s: Editable?) {
                            text = s.toString()
                        }
                        
                        override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                        override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
                    })
                }
            }
        )
        
        // Compose Text
        Text(text = text, modifier = Modifier.padding(16.dp))
    }
}
```

## 🧩 生命周期管理

### 传统 View 的生命周期

当在 Compose 中使用传统 View 时，需要注意传统 View 的生命周期管理：

```kotlin
@Composable
fun MyWebView(url: String) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    
    AndroidView(
        factory = { context ->
            WebView(context).apply {
                // 加载网页
                loadUrl(url)
                
                // 注册生命周期观察者
                lifecycleOwner.lifecycle.addObserver(object : LifecycleObserver {
                    @OnLifecycleEvent(Lifecycle.Event.ON_RESUME)
                    fun onResume() {
                        resumeTimers()
                        onResume()
                    }
                    
                    @OnLifecycleEvent(Lifecycle.Event.ON_PAUSE)
                    fun onPause() {
                        pauseTimers()
                        onPause()
                    }
                    
                    @OnLifecycleEvent(Lifecycle.Event.ON_DESTROY)
                    fun onDestroy() {
                        destroy()
                    }
                })
            }
        }
    )
}
```

## 🧩 互操作性的最佳实践

### 1. 优先使用 Compose 组件

尽可能使用 Compose 组件，只有在必要时才使用传统 View。

### 2. 合理使用互操作性

不要过度使用互操作性，否则会降低 Compose 的性能优势。

### 3. 注意生命周期管理

当在 Compose 中使用传统 View 时，要注意传统 View 的生命周期管理。

### 4. 保持代码整洁

将互操作性代码与业务逻辑分离，保持代码整洁。

### 5. 测试

确保对互操作性代码进行充分的测试，以确保其正常工作。

## 🎨 练习

现在，让我们来练习一下：创建一个同时使用 Compose 和传统 View 的应用，实现一个带有 WebView 的页面，并在 Compose 中控制 WebView 的加载。

```kotlin
// 在 Compose 中使用 WebView
@Composable
fun WebViewScreen() {
    var url by remember { mutableStateOf("https://www.google.com") }
    var webViewRef by remember { mutableStateOf<WebView?>(null) }
    
    Scaffold(
        topBar = {
            TopAppBar(title = { Text(text = "WebView Demo") })
        }
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // URL 输入框
            Row(modifier = Modifier.padding(8.dp)) {
                TextField(
                    value = url,
                    onValueChange = { url = it },
                    modifier = Modifier.weight(1f),
                    label = { Text(text = "URL") }
                )
                Button(
                    onClick = { webViewRef?.loadUrl(url) },
                    modifier = Modifier.padding(start = 8.dp)
                ) {
                    Text(text = "Go")
                }
            }
            
            // 控制按钮
            Row(modifier = Modifier.padding(8.dp)) {
                Button(
                    onClick = { webViewRef?.goBack() },
                    modifier = Modifier.weight(1f).padding(end = 4.dp)
                ) {
                    Text(text = "Back")
                }
                Button(
                    onClick = { webViewRef?.goForward() },
                    modifier = Modifier.weight(1f).padding(start = 4.dp)
                ) {
                    Text(text = "Forward")
                }
            }
            
            // WebView
            AndroidView(
                factory = { context ->
                    WebView(context).apply {
                        webViewClient = WebViewClient()
                        settings.javaScriptEnabled = true
                        loadUrl(url)
                        webViewRef = this
                    }
                },
                update = { webView ->
                    if (webView.url != url) {
                        webView.loadUrl(url)
                    }
                },
                modifier = Modifier.weight(1f)
            )
        }
    }
}
```

## 🎉 恭喜

你已经学习了 Compose 与传统 View 系统的互操作性！互操作性是 Compose 开发中的重要知识点，它可以帮助你在迁移现有应用或使用传统 View 组件时更加灵活。

下一节，我们将学习 Compose 性能优化，了解如何提高 Compose 应用的性能。

🚀 继续前进吧！