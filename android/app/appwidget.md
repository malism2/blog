## android appwidget 开发

开发步骤：
1. AndroidManifest.xml 中注册 receiver
2. 创建 Widget 配置文件
3. 实现 AppWidgetProvider
4. 后台获取数据并更新界面

### 1. AndroidManifest.xml 中注册 receiver

```xml
<manifest ...>
    <!-- 网络权限 -->
    <uses-permission android:name="android.permission.INTERNET" />

    <application ...>
        <!-- 声明AppWidget -->
        <receiver
            android:name=".MyAppWidget"
            android:exported="false">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/appwidget_info" />
        </receiver>
    </application>
</manifest>
```

### 2. 创建 Widge 配置文件

在`res/xml`目录下创建`appwidget_info.xml`：
```xml
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="180dp"
    android:minHeight="180dp"
    android:targetCellWidth="2"
    android:targetCellHeight="2"
    android:updatePeriodMillis="3600000" // 1小时更新一次
    android:previewImage="@mipmap/ic_appwidget"
    android:description="@string/widget_desc"
    android:initialLayout="@layout/appwidget_layout"
    android:widgetCategory="home_screen">
</appwidget-provider>
```

### 3. 实现 AppWidgetProvider
```kotlin
class MyAppWidget: AppWidgetProvider() {

    override fun onEnabled(context: Context?) {
        super.onEnabled(context)
        Log.d("widget", "widget added")
    }

    override fun onDisabled(context: Context?) {
        super.onDisabled(context)
        Log.d("widget", "widget removed")
    }

    override fun onUpdate(
        context: Context?,
        appWidgetManager: AppWidgetManager?,
        appWidgetIds: IntArray?
    ) {
        super.onUpdate(context, appWidgetManager, appWidgetIds)
        if (context == null || appWidgetManager == null || appWidgetIds == null || appWidgetIds.isEmpty()) {
            Log.e("widget", "onUpdate: context or appWidgetManager or appWidgetIds is null")
            return
        }
        Logger.d("widget", "onUpdate, appWidgetIds: ${appWidgetIds.joinToString()}")
        updateWidget(context, appWidgetManager, appWidgetIds)
    }
}
```

### 4. 协程更新数据
 ```kotlin
    private var scop: CoroutineScope? = null

    fun updateWidget(context: Context, awm: AppWidgetManager, appWidgetIds: IntArray) {
        if (scop == null) {
                scop = CoroutineScope(SupervisorJob() + Dispatchers.IO)
        }
        scop?.launch {
            update(context, awm, appWidgetIds)
        }
    }

    suspend fun update(context: Context, awm: AppWidgetManager, appWidgetIds: IntArray) {
        val data = getData()
        val image = loadImage(data.image)

        withContext(Dispatchers.Main) {
            val remoteViews = RemoteViews(context.packageName, R.layout.appwidget_layout)
            remoteViews.setTextViewText(R.id.text, data.text)
            if (image != null) {
                remoteViews.setImageViewBitmap(R.id.image, image)
            }
            remoteViews.setOnClickPendingIntent(R.id.image, getPendingIntent(context))
            awm.updateAppWidget(appWidgetIds, remoteViews)
        }
    }

    private fun getPendingIntent(context: Context): PendingIntent {
        val intent = Intent(context, MainActivity::class.java)
        intent.data = "https://app/demo/widget".toUri()
        return PendingIntent.getActivity(context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    private suspend fun loadImage(url: String): Bitmap? {
        // get image from remote, use Coil or gride
    }

 ```
### 5. 图片圆角处理
appwidget 大小不能通过代码获取，圆角效果最好通过裁剪图片实现，图片固定大小和圆角，ImageView 设置拉伸模式 android:scaleType="fitXY"。
这样有一个缺点，图片拉伸变形。

```xml
    <ImageView android:id="@+id/image"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:scaleType="fitXY"
        android:src="@drawable/widget_image_place"/>
```

```kotlin
    // size 110 x 55, corner 10 dp
    private suspend fun loadImage(context: Context, image: String?): Bitmap? {
        if (image.isNullOrEmpty()) return null
        val r = context.imageLoader.execute(
            ImageRequest.Builder(context)
                .data(image)
                .size(110.dp2pxInt, 55.dp2pxInt)
                .allowHardware(false)
                .transformations(RoundedCornersTransformation(10.dp2px))
                .build()
        )
        if (r is SuccessResult) {
            return r.image.toBitmap()
        } else if (r is ErrorResult) {
            Log.e("widget", "loadImage: $image, result = fail, ${r.throwable}")
        } else {
            Log.d("widget", "loadImage: $image, result = fail")
        }
        return null
    }
```

### 6. WorkManager 定时更新

在 Android App Widget 中实现可靠的定时更新，推荐使用WorkManager结合协程，
这比传统的updatePeriodMillis更灵活且受系统限制更少。

MyAppWidget 管理任务的添加和删除。

```kotlin
    override fun onEnabled(context: Context?) {
        super.onEnabled(context)
        Logger.d("widget", "onEnabled")
        setupWidgetUpdate(context, "widget_update")
    }

    override fun onDisabled(context: Context?) {
        super.onDisabled(context)
        Logger.d("widget", "onDisabled")
        WorkManager.getInstance(context).cancelUniqueWork("widget_update")
    }

    // 配置WorkManager定期更新
    fun setupWidgetUpdate(context: Context, tag: String) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
            
        val updateRequest = PeriodicWorkRequestBuilder<WidgetUpdateWorker>(1, TimeUnit.HOURS)
            .setConstraints(constraints)
            .build()
            
        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(
                tag,
                ExistingPeriodicWorkPolicy.REPLACE,
                updateRequest
            )
    }
```

```kotlin
// 定义任务
class WidgetUpdateWorker(val context: Context, params: WorkerParameters) :
    CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        // 1. 获取所有已添加的 Widget 实例 ID
        val awm = AppWidgetManager.getInstance(context)
        val appWidgetIds = inputData.getIntArray("widget_ids") ?: intArrayOf()
        
        // load data and update widget
        if (appWidgetIds.isNotEmpty()) {
            updateWidget(context, awm, appWidgetIds)
        }
        return Result.success()
    }
}
```

不过，有些定制版的ROM，后台任务被严格限制，WorkManager 并不能符合预期地运行。

### 关键点说明：

1. **Widget更新机制**：
   - onUpdate() 协程更新数据
   - WorkManager 定时更新，性能最优 (推荐)
   - AlarmManager 更精确的更新

2. **性能优化**：
   - 图片加载使用Coil的缓存机制
   - 网络请求在后台线程执行
   - 合理设置Widget更新周期减少资源消耗

这样就完成了一个使用Kotlin开发的App Widget，具备协程后台更新数据、Coil加载网络图片并处理圆角的功能。