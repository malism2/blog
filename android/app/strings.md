## strings.xml 如何拼接字符串

比如有这样的需求, 在 strings.xml 中，多个字符串拼接，如下意思

```xml
    <string name="app_name">demo</string>
    <string name="welcome">welcom，@string/app_name</string>
```
以上的写法意思很明白，但是很不幸，是不会正确显示的。

### 占位符

一般的做法是通过占位符 %s 实现, 在代码里面获取的时候拼接起来，

```xml
    <string name="app_name">demo</string>
    <string name="welcome">welcom，%s</string>
```
代码 getString(R.string.welcome, getString(app_name)) 读取。

### 实体引用

 ```xml
<!DOCTYPE resources [
    <!ENTITY name "Demo">
    ]>

<resources>
    <string name="app_name">Demo</string>
    <string name="welcome">Welcome to &name; enjoy yourself</string>
</resources>
 ```

 这样不用代码拼接，直接 xml 中实现。

