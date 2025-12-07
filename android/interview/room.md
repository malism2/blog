## Room

请说明 Room 数据库的核心组成部分（Entity、DAO、Database）的作用，以及 Room 如何保证数据一致性？同时解释 @Insert、@Update、@Delete 注解的常用参数及区别？

### 一、Room 核心组成部分及作用

Room 是 Jetpack 提供的 ORM（对象关系映射）框架，封装了 SQLite，核心通过 Entity、DAO、Database 三层结构简化数据库操作，三者各司其职、缺一不可：

#### 1. Entity（实体类）—— 映射数据库表

- 作用：对应 SQLite 中的一张表，用 @Entity 注解标记，类中的字段对应表中的列，通过注解配置表结构（主键、约束等）。

- 核心要点：

  - 必须用 @Entity 注解，可通过 tableName 指定表名（默认类名）；

  - 必须包含主键（@PrimaryKey），支持复合主键（@PrimaryKey(autoGenerate = true) 自增主键）；

  - 字段默认映射为列，可通过 @ColumnInfo(name = "xxx") 指定列名，@Ignore 忽略不需要映射的字段。

- 示例：
````
@Entity(tableName = "user") // 表名：user
data class User(
    @PrimaryKey(autoGenerate = true) // 自增主键
    val id: Long = 0,
    @ColumnInfo(name = "user_name") // 列名：user_name（默认字段名）
    val userName: String,
    @ColumnInfo(unique = true) // 约束：该列值唯一
    val phone: String,
    @Ignore // 忽略该字段，不生成列
    val tempData: String = ""
)
````
#### 2. DAO（数据访问对象）—— 封装数据操作

- 作用：定义数据库的 CRUD（增删改查）操作接口，用 @Dao 注解标记，Room 会自动生成实现类，无需手动写 SQLite 语句（简单操作）。

- 核心要点：

  - 必须是抽象类或接口，加 @Dao 注解；

  - 方法通过 @Insert/@Update/@Delete 注解实现简单增删改，复杂查询用 @Query 注解（支持自定义 SQL）；

  - 方法参数为 Entity 实例或集合，返回值可根据需求指定（如插入返回自增主键，查询返回 Entity 列表）。

- 示例：

````
@Dao
interface UserDao {
    // 插入单条用户数据
    @Insert
    suspend fun insertUser(user: User): Long // 返回自增主键id
    
    // 查询所有用户
    @Query("SELECT * FROM user")
    suspend fun getAllUsers(): List<User>
    
    // 根据手机号查询用户（自定义SQL）
    @Query("SELECT * FROM user WHERE phone = :phone")
    suspend fun getUserByPhone(phone: String): User?
}
````

#### 3. Database（数据库实例）—— 数据库入口

- 作用：抽象类，继承 RoomDatabase，是访问数据库的唯一入口，负责创建数据库实例、管理表结构、提供 DAO 实例。

- 核心要点：

  - 必须是抽象类，加 @Database 注解，entities 参数指定关联的 Entity（表），version 指定数据库版本；

  - 包含所有 DAO 的抽象方法（无实现，Room 自动生成）；

  - 必须通过单例模式获取实例（数据库创建开销大，避免重复创建导致内存泄漏）。

- 示例：

````
@Database(entities = [User::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    // 提供DAO实例
    abstract fun userDao(): UserDao
    
    // 单例模式（避免内存泄漏）
    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null
        
        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext, // 用Application Context避免内存泄漏
                    AppDatabase::class.java,
                    "app_db" // 数据库文件名
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
````

### 二、Room 如何保证数据一致性？

数据一致性核心是“数据准确、无脏数据、操作可靠”，Room 基于 SQLite 的特性，结合自身设计提供多层保障：

#### 1. 继承 SQLite 的 ACID 特性

Room 底层是 SQLite，而 SQLite 是符合 ACID 原则的数据库：

- 原子性（Atomicity）：单个操作（如插入一条数据）要么全成功，要么全失败；

- 一致性（Consistency）：操作前后数据库状态符合约束（如主键唯一、非空）；

- 隔离性（Isolation）：多线程并发操作时，互不干扰（SQLite 本身是单线程数据库，Room 通过线程池调度避免冲突）；

- 持久性（Durability）：操作成功后，数据永久存储在磁盘，即使应用崩溃也不丢失。

#### 2. 编译时 SQL 语法校验

@Query 注解中的 SQL 语句会在 编译时 进行语法检查，若表名、列名错误（如拼写错误），直接编译失败，避免运行时因 SQL 错误导致数据异常。

#### 3. 实体类约束注解

通过 @PrimaryKey（主键唯一）、@Unique（列值唯一）、@NotNull（列值非空）、@Check（自定义条件约束）等注解，强制数据符合业务规则，例如：

````
@Entity(
    tableName = "user",
    indices = [Index(value = ["phone"], unique = true)] // 索引+唯一约束
)
data class User(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    @NotNull // 非空约束
    val userName: String,
    @Check("phone LIKE '1%'") // 自定义约束：手机号以1开头
    val phone: String
)
````

#### 4. 事务支持（@Transaction 注解）

对于“多步操作必须同时成功/失败”的场景（如转账：扣减A的余额 + 增加B的余额），用 @Transaction 注解标记方法，Room 会将方法内所有操作包装为一个事务，确保原子性：

````
@Dao
interface TransferDao {
    @Transaction // 事务注解：两个更新操作要么全成，要么全败
    suspend fun transfer(fromUserId: Long, toUserId: Long, amount: Double) {
        deductBalance(fromUserId, amount) // 扣减余额
        addBalance(toUserId, amount) // 增加余额
    }
    
    @Query("UPDATE user SET balance = balance - :amount WHERE id = :userId")
    suspend fun deductBalance(userId: Long, amount: Double)
    
    @Query("UPDATE user SET balance = balance + :amount WHERE id = :userId")
    suspend fun addBalance(userId: Long, amount: Double)
}
````

#### 5. 类型转换（TypeConverter）

避免因“数据类型不匹配”导致的数据存储异常，通过 TypeConverter 将 Room 不支持的类型（如 Date、List）转换为支持的类型（Long、String）：

````
// 类型转换器：Date ↔ Long
class DateConverter {
    @TypeConverter
    fun dateToLong(date: Date): Long = date.time
    
    @TypeConverter
    fun longToDate(time: Long): Date = Date(time)
}

// 在Database中注册转换器
@Database(entities = [User::class], version = 1)
@TypeConverters(DateConverter::class) // 注册转换器
abstract class AppDatabase : RoomDatabase() { ... }
````

### 三、@Insert、@Update、@Delete 注解的常用参数及区别

三者均为 Room 提供的“简化 CRUD 注解”，无需手动写 SQL，核心区别在于操作目的，常用参数集中在“冲突处理”：

| 注解 | 核心作用 | 常用参数 | 参数说明（onConflictStrategy）|
| ---- | ------ | ----- | ----- |
| @Insert | 插入数据（新增记录） | onConflict: Int（默认 ABORT）| - REPLACE：冲突时替换旧数据；<br>- IGNORE：冲突时忽略新数据；<br>- ABORT：冲突时终止操作（默认）；<br>- FAIL：冲突时抛出异常 |
| @Update | 更新数据（修改已有记录）| onConflict: Int（默认 ABORT）| 仅更新“主键匹配”的记录；冲突处理逻辑同 @Insert |
| @Delete | 删除数据（移除已有记录）| 无核心参数（无需冲突处理）|仅删除“主键匹配”的记录；若无匹配主键，操作无效果（不报错）|

### 四、关键补充及示例：

#### 1. @Insert 示例（冲突处理）：
````
// 手机号冲突时，替换旧数据（因phone列有@Unique约束）
@Insert(onConflict = OnConflictStrategy.REPLACE)
suspend fun insertOrReplaceUser(user: User)
````
#### 2. @Update 注意点：

  - 必须通过“主键匹配”更新：若传入的 Entity 实例主键不存在，更新无效果；

  - 仅更新传入的非空字段（若 Entity 字段允许为 null，未赋值的字段不会更新）。

#### 3. @Delete 注意点：

  - 无需传入完整 Entity 实例，仅需主键字段：
````
// 仅需主键id即可删除，其他字段可忽略
@Delete
suspend fun deleteUserById(user: User) // 传入 User(id=123, userName="", phone="") 即可删除id=123的用户
````
### 五、总结

1. Room 核心三层：Entity（表结构）、DAO（数据操作）、Database（入口实例），职责分离且通过注解简化开发；

2. 数据一致性保障：依赖 SQLite ACID、编译时 SQL 校验、实体约束、事务支持；

3. 三大注解：@Insert（新增，支持冲突处理）、@Update（按主键更新）、@Delete（按主键删除），覆盖基础 CRUD 场景。

接下来是第六道面试题，[请说明 Coil 相比 Glide 的核心优势，以及 Coil 加载图片并实现圆角、占位图、错误图的核心 API 用法？同时解释 Coil 如何避免 OOM？](./coil)
