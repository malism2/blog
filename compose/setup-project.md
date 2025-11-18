# 搭建 Compose 项目

上一节我们了解了 Compose 是什么，现在让我们来搭建第一个 Compose 项目吧！别担心，这个过程就像搭积木一样简单，我会一步一步地教你。

## 🔧 环境准备

在开始之前，我们需要确保我们的开发环境已经准备就绪：

### 1. Android Studio
确保你使用的是 Android Studio Arctic Fox (2020.3.1) 或更高版本，因为这些版本内置了对 Compose 的支持。如果你还在使用旧版本，快去更新吧！

### 2. Gradle 版本
确保你的 Gradle 版本至少为 7.0.2。Compose 需要最新的 Gradle 功能来支持它的构建过程。

### 3. Kotlin 版本
确保你的 Kotlin 版本至少为 1.5.31。Compose 是用 Kotlin 编写的，所以需要最新的 Kotlin 版本来支持它的特性。

## 🎨 创建新项目

现在，让我们开始创建第一个 Compose 项目：

### 1. 打开 Android Studio
启动 Android Studio，你会看到一个欢迎界面。

### 2. 选择模板
在欢迎界面中，点击 "New Project"。然后在 "Create New Project" 对话框中，选择 "Empty Compose Activity" 模板。

### 3. 填写项目信息
填写你的项目信息：
- **Name**：你的项目名称，比如 "MyFirstComposeApp"
- **Package name**：你的应用包名，比如 "com.example.myfirstcomposeapp"
- **Save location**：项目的保存位置
- **Language**：选择 "Kotlin"（Compose 只支持 Kotlin）
- **Minimum SDK**：选择至少 "API 21: Android 5.0 (Lollipop)"（Compose 支持的最低版本）

### 4. 完成创建
点击 "Finish"，Android Studio 会自动创建一个 Compose 项目。

## 📁 项目结构

创建好的 Compose 项目结构与传统的 Android 项目类似，但有一些不同之处：

```
MyFirstComposeApp/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/example/myfirstcomposeapp/
│   │   │   │       ├── MainActivity.kt  // 包含 Compose UI 的主活动
│   │   │   │       └── ui/
│   │   │   │           ├── theme/
│   │   │   │           │   ├── Color.kt    // 主题颜色定义
│   │   │   │           │   ├── Shape.kt    // 主题形状定义
│   │   │   │           │   ├── Theme.kt    // 主题定义
│   │   │   │           │   └── Type.kt     // 主题文字样式定义
│   │   │   │           └── MainContent.kt  // 主内容 UI 组件
│   │   │   └── res/
│   │   │       ├── drawable/              // 图像资源
│   │   │       ├── values/                // 字符串、颜色等资源
│   │   │       └── xml/                   // 布局文件（如果需要）
│   │   └── test/
│   └── build.gradle.kts  // 模块级 Gradle 配置
└── build.gradle.kts      // 项目级 Gradle 配置
```

## 📋 Gradle 配置

Compose 项目的 Gradle 配置与传统的 Android 项目也有一些不同。让我们来看看模块级的 `build.gradle.kts` 文件：

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.example.myfirstcomposeapp"
    compileSdk = 33

    defaultConfig {
        applicationId = "com.example.myfirstcomposeapp"
        minSdk = 21
        targetSdk = 33
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        compose = true  // 启用 Compose 功能
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.4.3"  // Compose 编译器扩展版本
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.10.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.1")
    implementation("androidx.activity:activity-compose:1.7.2")
    implementation(platform("androidx.compose:compose-bom:2023.06.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation(platform("androidx.compose:compose-bom:2023.06.01"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
```

## 👀 查看效果

现在，让我们运行这个项目，看看 Compose 的效果：

### 1. 运行项目
点击 Android Studio 工具栏中的 "Run" 按钮，或者按下 `Shift + F10` 快捷键，运行你的项目。

### 2. 查看实时预览
在 Android Studio 中，打开 `MainActivity.kt` 文件，你会看到一个 "Preview" 面板。这个面板会实时显示你的 Compose UI 效果。

## 🎉 恭喜

你已经成功搭建了第一个 Compose 项目！现在，你可以开始学习 Compose 的其他知识了。

下一节，我们将学习 Compose 的基础组件，比如 Text、Button、Image 等。

🚀 继续前进吧！