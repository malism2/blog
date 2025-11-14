## strings.xml 如何部分引用其他的 string

比如有这样的需求, 在 strings.xml 中，新增的 string 需要部分引用其他的 string，如下意思

```xml
    <string name="app_name">demo</string>
    <string name="welcome">welcom，@string/app_name</string>
```
以上的写法意思很明白，但是很不幸，是会编译错误的。

一般的做法是通过参数 %s 实现, 在代码里面获取的时候拼接起来，

```xml
    <string name="app_name">demo</string>
    <string name="welcome">welcom，%s</string>
```
代码 getString(R.string.welcome, getString(app_name)) 读取。

无意中发现另一种方法

 ```xml
     <string name="welcome" >welcom, <xliff:g>{Link: app_name}</xliff:g></string>
 ```

 这样不用代码拼接，直接 xml 中实现。

