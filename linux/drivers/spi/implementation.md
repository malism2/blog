---
title: SPI驱动实现
description: SPI驱动的核心数据结构、API接口和实现细节详解
---

# SPI驱动实现

SPI（Serial Peripheral Interface）是一种高速同步串行通信协议，广泛应用于连接微控制器与各种高速外围设备。Linux内核提供了完整的SPI子系统框架，使得开发者可以方便地实现SPI设备驱动。本章将详细介绍SPI驱动的核心数据结构、API接口和实现细节。

## SPI驱动概述

SPI总线的主要特点：
1. **四线通信**：使用SCLK（时钟线）、MOSI（主机输出/从机输入）、MISO（主机输入/从机输出）和SS（从机选择线）
2. **主从架构**：支持单主设备和多从设备
3. **全双工通信**：可以同时发送和接收数据
4. **高速传输**：传输速率通常在几Mbps到几十Mbps之间
5. **简单协议**：协议简单，易于实现

Linux SPI子系统架构：
- **SPI核心**：提供核心功能和API接口
- **SPI总线驱动**：负责管理物理SPI总线硬件
- **SPI设备驱动**：控制具体的SPI设备
- **用户空间接口**：允许用户空间程序访问SPI设备

## 核心数据结构

### 1. SPI设备结构体

`struct spi_device`代表一个SPI从设备：

```c
struct spi_device {
    struct device dev;          // 设备模型结构
    struct spi_master *master;   // 所属的SPI主控制器
    u32 max_speed_hz;           // 最大传输速率
    u8 chip_select;             // 片选信号编号
    u8 bits_per_word;           // 每字位数（通常为8位）
    u16 mode;                   // 设备模式
#define SPI_CPHA        0x01    // 时钟相位
#define SPI_CPOL        0x02    // 时钟极性
#define SPI_MODE_0      0x00    // CPOL=0, CPHA=0
#define SPI_MODE_1      0x01    // CPOL=0, CPHA=1
#define SPI_MODE_2      0x02    // CPOL=1, CPHA=0
#define SPI_MODE_3      0x03    // CPOL=1, CPHA=1
#define SPI_CS_HIGH     0x04    // 片选高有效
#define SPI_LSB_FIRST   0x08    // 低位优先
#define SPI_3WIRE       0x10    // 三线模式（无MISO）
#define SPI_LOOP        0x20    // 回环模式
#define SPI_NO_CS       0x40    // 无片选信号
#define SPI_READY       0x80    // 准备就绪信号
    int irq;                    // 中断号
    void *controller_state;     // 控制器状态
    void *controller_data;      // 控制器私有数据
    char modalias[SPI_NAME_SIZE]; // 模块别名
    int cs_gpio;                // 片选GPIO编号
};
```

### 2. SPI主控制器结构体

`struct spi_master`代表一个SPI主控制器：

```c
struct spi_master {
    struct device dev;          // 设备模型结构
    struct list_head list;      // 链表结构
    s16 bus_num;                // 总线编号
    u16 num_chipselect;         // 片选数量
    u16 dma_alignment;          // DMA对齐要求
    u16 mode_bits;              // 支持的模式位
    u32 min_speed_hz;           // 最小传输速率
    u32 max_speed_hz;           // 最大传输速率
    u16 bits_per_word_mask;     // 支持的每字位数掩码
    u32 flags;                  // 标志位
#define SPI_MASTER_HALF_DUPLEX  0x0001  // 半双工
#define SPI_MASTER_NO_RX        0x0002  // 无接收
#define SPI_MASTER_NO_TX        0x0004  // 无发送
    int (*setup)(struct spi_device *spi); // 设置函数
    int (*transfer)(struct spi_device *spi, struct spi_message *mesg); // 传输函数
    void (*cleanup)(struct spi_device *spi); // 清理函数
    bool auto_runtime_pm;       // 自动运行时电源管理
    struct dma_chan *dma_tx;    // TX DMA通道
    struct dma_chan *dma_rx;    // RX DMA通道
    struct mutex io_mutex;      // I/O互斥锁
    struct list_head queue;     // 消息队列
    struct spi_message *cur_msg; // 当前正在处理的消息
    spinlock_t queue_lock;      // 队列锁
    // ... 其他字段
};
```

### 3. SPI消息结构体

`struct spi_message`定义了一个SPI消息（由多个SPI传输组成）：

```c
struct spi_message {
    struct list_head transfers;  // 传输链表
    struct spi_device *spi;      // 目标设备
    unsigned is_dma_mapped:1;    // 是否映射DMA
    void (*complete)(void *context); // 完成回调函数
    void *context;               // 回调上下文
    unsigned actual_length;      // 实际传输长度
    int status;                  // 状态
    struct list_head queue;      // 队列链表
    void *state;                 // 状态指针
};
```

### 4. SPI传输结构体

`struct spi_transfer`定义了一个SPI传输片段：

```c
struct spi_transfer {
    const void *tx_buf;          // 发送缓冲区
    void *rx_buf;                // 接收缓冲区
    unsigned len;                // 传输长度
    dma_addr_t tx_dma;           // TX DMA地址
    dma_addr_t rx_dma;           // RX DMA地址
    struct sg_table tx_sg;       // TX scatter-gather表
    struct sg_table rx_sg;       // RX scatter-gather表
    unsigned cs_change:1;        // 传输后改变片选
    unsigned tx_nbits:3;         // TX位数（1, 2, 4, 8）
    unsigned rx_nbits:3;         // RX位数（1, 2, 4, 8）
#define SPI_NBITS_SINGLE     0x01 // 1位
#define SPI_NBITS_DUAL       0x02 // 2位
#define SPI_NBITS_QUAD       0x04 // 4位
    u32 speed_hz;                // 传输速率
    u16 delay_usecs;             // 传输后延迟（微秒）
    struct list_head transfer_list; // 传输链表
};
```

### 5. SPI设备驱动结构体

`struct spi_driver`定义了一个SPI设备驱动：

```c
struct spi_driver {
    const struct spi_device_id *id_table; // 设备ID表
    const struct of_device_id *of_match_table; // 设备树匹配表
    int (*probe)(struct spi_device *spi); // 探测函数
    int (*remove)(struct spi_device *spi); // 移除函数
    void (*shutdown)(struct spi_device *spi); // 关闭函数
    int (*suspend)(struct spi_device *spi, pm_message_t mesg); // 挂起函数
    int (*resume)(struct spi_device *spi); // 恢复函数
    struct device_driver driver; // 设备驱动结构
};
```

## 核心API接口

### 1. SPI设备驱动注册

```c
int spi_register_driver(struct spi_driver *sdrv);
void spi_unregister_driver(struct spi_driver *sdrv);

// 模块加载和卸载的宏定义
#define module_spi_driver(__spi_driver) 
    module_driver(__spi_driver, spi_register_driver, spi_unregister_driver)
```

### 2. SPI消息和传输操作

```c
// 初始化SPI消息
void spi_message_init(struct spi_message *m);

// 添加SPI传输到消息
void spi_message_add_tail(struct spi_transfer *t, struct spi_message *m);

// 同步传输SPI消息
int spi_sync(struct spi_device *spi, struct spi_message *message);

// 异步传输SPI消息
int spi_async(struct spi_device *spi, struct spi_message *message);

// 简化的同步传输API
int spi_write(struct spi_device *spi, const void *buf, size_t len);
int spi_read(struct spi_device *spi, void *buf, size_t len);
int spi_write_then_read(struct spi_device *spi, const void *txbuf, unsigned n_tx,
                      void *rxbuf, unsigned n_rx);
int spi_write_then_write(struct spi_device *spi, const void *txbuf1, unsigned n_tx1,
                       const void *txbuf2, unsigned n_tx2);
```

### 3. SPI设备创建和销毁

```c
struct spi_device *spi_new_device(struct spi_master *master,
                                struct spi_board_info *chip);
void spi_unregister_device(struct spi_device *spi);

struct spi_master *spi_busnum_to_master(unsigned int bus_num);
struct spi_master *spi_alloc_master(struct device *dev, unsigned size);
int spi_register_master(struct spi_master *master);
void spi_unregister_master(struct spi_master *master);
```

## SPI设备驱动实现示例

### 1. 驱动模块初始化

```c
#include <linux/init.h>
#include <linux/module.h>
#include <linux/spi/spi.h>
#include <linux/fs.h>
#include <linux/uaccess.h>
#include <linux/slab.h>

#define SPI_DEVICE_NAME "spi_example"
#define SPI_DEVICE_CS   0       // 片选信号编号

// 设备结构体
struct spi_example_dev {
    struct spi_device *spi;
    struct class *class;
    struct device *device;
    dev_t dev_no;
    int major;
    struct cdev cdev;
};

static struct spi_example_dev *spi_dev;

// SPI设备ID表
static const struct spi_device_id spi_example_id[] = {
    { SPI_DEVICE_NAME, 0 },
    { }
};
MODULE_DEVICE_TABLE(spi, spi_example_id);

// 设备树匹配表
static const struct of_device_id spi_example_of_match[] = {
    { .compatible = "example,spi-example" },
    { }
};
MODULE_DEVICE_TABLE(of, spi_example_of_match);
```

### 2. 文件操作函数

```c
// 设备文件打开函数
static int spi_example_open(struct inode *inode, struct file *file)
{
    file->private_data = spi_dev;
    return 0;
}

// 设备文件读取函数
static ssize_t spi_example_read(struct file *file, char __user *buf, size_t count, loff_t *offset)
{
    struct spi_example_dev *dev = file->private_data;
    char *kernel_buf;
    int ret;

    if (count > PAGE_SIZE)
        count = PAGE_SIZE;

    kernel_buf = kmalloc(count, GFP_KERNEL);
    if (!kernel_buf)
        return -ENOMEM;

    // 使用spi_read读取数据
    ret = spi_read(dev->spi, kernel_buf, count);
    if (ret < 0) {
        dev_err(&dev->spi->dev, "SPI read failed: %d\n", ret);
        kfree(kernel_buf);
        return ret;
    }

    // 复制数据到用户空间
    if (copy_to_user(buf, kernel_buf, count)) {
        kfree(kernel_buf);
        return -EFAULT;
    }

    kfree(kernel_buf);
    return count;
}

// 设备文件写入函数
static ssize_t spi_example_write(struct file *file, const char __user *buf, size_t count, loff_t *offset)
{
    struct spi_example_dev *dev = file->private_data;
    char *kernel_buf;
    int ret;

    if (count > PAGE_SIZE)
        count = PAGE_SIZE;

    kernel_buf = kmalloc(count, GFP_KERNEL);
    if (!kernel_buf)
        return -ENOMEM;

    // 从用户空间复制数据
    if (copy_from_user(kernel_buf, buf, count)) {
        kfree(kernel_buf);
        return -EFAULT;
    }

    // 使用spi_write写入数据
    ret = spi_write(dev->spi, kernel_buf, count);
    if (ret < 0) {
        dev_err(&dev->spi->dev, "SPI write failed: %d\n", ret);
        kfree(kernel_buf);
        return ret;
    }

    kfree(kernel_buf);
    return count;
}

// 设备文件IO控制函数
static long spi_example_ioctl(struct file *file, unsigned int cmd, unsigned long arg)
{
    struct spi_example_dev *dev = file->private_data;
    struct spi_transfer t;
    struct spi_message m;
    char tx_buf[4] = {0};
    char rx_buf[4] = {0};
    int ret;

    // 示例：处理一个简单的IO控制命令
    switch (cmd) {
        case 0x100: // 示例命令：写入然后读取
            if (copy_from_user(tx_buf, (void __user *)arg, sizeof(tx_buf))) {
                return -EFAULT;
            }

            // 使用spi_write_then_read
            ret = spi_write_then_read(dev->spi, tx_buf, sizeof(tx_buf),
                                    rx_buf, sizeof(rx_buf));
            if (ret < 0) {
                dev_err(&dev->spi->dev, "spi_write_then_read failed: %d\n", ret);
                return ret;
            }

            if (copy_to_user((void __user *)arg, rx_buf, sizeof(rx_buf))) {
                return -EFAULT;
            }
            break;

        default:
            return -ENOTTY;
    }

    return 0;
}

// 设备文件释放函数
static int spi_example_release(struct inode *inode, struct file *file)
{
    return 0;
}

// 文件操作结构体
static const struct file_operations spi_example_fops = {
    .owner = THIS_MODULE,
    .open = spi_example_open,
    .read = spi_example_read,
    .write = spi_example_write,
    .unlocked_ioctl = spi_example_ioctl,
    .release = spi_example_release,
};
```

### 3. SPI设备探测和移除函数

```c
// SPI设备探测函数
static int spi_example_probe(struct spi_device *spi)
{
    int ret;

    // 分配设备结构体
    spi_dev = kzalloc(sizeof(struct spi_example_dev), GFP_KERNEL);
    if (!spi_dev) {
        return -ENOMEM;
    }

    spi_dev->spi = spi;
    spi_set_drvdata(spi, spi_dev);

    // 配置SPI设备参数
    spi->mode = SPI_MODE_0;          // CPOL=0, CPHA=0
    spi->bits_per_word = 8;          // 8位数据宽度
    spi->max_speed_hz = 10000000;    // 10MHz传输速率
    
    ret = spi_setup(spi);
    if (ret < 0) {
        dev_err(&spi->dev, "Failed to setup SPI device\n");
        goto fail_setup;
    }

    // 注册字符设备
    ret = alloc_chrdev_region(&spi_dev->dev_no, 0, 1, SPI_DEVICE_NAME);
    if (ret < 0) {
        dev_err(&spi->dev, "Failed to allocate chrdev region\n");
        goto fail_alloc;
    }

    spi_dev->major = MAJOR(spi_dev->dev_no);

    cdev_init(&spi_dev->cdev, &spi_example_fops);
    spi_dev->cdev.owner = THIS_MODULE;

    ret = cdev_add(&spi_dev->cdev, spi_dev->dev_no, 1);
    if (ret < 0) {
        dev_err(&spi->dev, "Failed to add cdev\n");
        goto fail_cdev;
    }

    // 创建类
    spi_dev->class = class_create(THIS_MODULE, SPI_DEVICE_NAME);
    if (IS_ERR(spi_dev->class)) {
        dev_err(&spi->dev, "Failed to create class\n");
        ret = PTR_ERR(spi_dev->class);
        goto fail_class;
    }

    // 创建设备节点
    spi_dev->device = device_create(spi_dev->class, &spi->dev, spi_dev->dev_no,
                                   NULL, SPI_DEVICE_NAME);
    if (IS_ERR(spi_dev->device)) {
        dev_err(&spi->dev, "Failed to create device\n");
        ret = PTR_ERR(spi_dev->device);
        goto fail_device;
    }

    dev_info(&spi->dev, "SPI example driver probed successfully\n");
    return 0;

fail_device:
    class_destroy(spi_dev->class);
fail_class:
    cdev_del(&spi_dev->cdev);
fail_cdev:
    unregister_chrdev_region(spi_dev->dev_no, 1);
fail_alloc:
    kfree(spi_dev);
fail_setup:
    return ret;
}

// SPI设备移除函数
static int spi_example_remove(struct spi_device *spi)
{
    struct spi_example_dev *dev = spi_get_drvdata(spi);

    // 销毁设备节点
    device_destroy(dev->class, dev->dev_no);

    // 销毁类
    class_destroy(dev->class);

    // 移除字符设备
    cdev_del(&dev->cdev);

    // 释放设备号
    unregister_chrdev_region(dev->dev_no, 1);

    // 释放设备结构体
    kfree(dev);

    dev_info(&spi->dev, "SPI example driver removed\n");
    return 0;
}
```

### 4. SPI驱动结构体定义和模块初始化

```c
// SPI驱动结构体
static struct spi_driver spi_example_driver = {
    .driver = {
        .name = SPI_DEVICE_NAME,
        .owner = THIS_MODULE,
        .of_match_table = spi_example_of_match,
    },
    .probe = spi_example_probe,
    .remove = spi_example_remove,
    .id_table = spi_example_id,
};

// 模块初始化函数
static int __init spi_example_init(void)
{
    int ret;

    ret = spi_register_driver(&spi_example_driver);
    if (ret < 0) {
        pr_err("Failed to register SPI driver\n");
        return ret;
    }

    pr_info("SPI example driver initialized\n");
    return 0;
}

// 模块退出函数
static void __exit spi_example_exit(void)
{
    spi_unregister_driver(&spi_example_driver);
    pr_info("SPI example driver exited\n");
}

module_init(spi_example_init);
module_exit(spi_example_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Linux Driver Developer");
MODULE_DESCRIPTION("SPI Example Driver");
MODULE_VERSION("1.0");
```

## SPI中断处理

许多SPI设备支持中断，以下是如何在SPI驱动中处理中断的示例：

```c
// 中断处理函数
static irqreturn_t spi_example_irq_handler(int irq, void *dev_id)
{
    struct spi_example_dev *dev = dev_id;
    struct spi_device *spi = dev->spi;
    char rx_data;
    int ret;

    // 从SPI设备读取中断状态
    ret = spi_read(spi, &rx_data, 1);
    if (ret < 0) {
        dev_err(&spi->dev, "Failed to read interrupt status\n");
        return IRQ_NONE;
    }

    // 处理中断事件
    // ...

    return IRQ_HANDLED;
}

// 在probe函数中申请中断
static int spi_example_probe(struct spi_device *spi)
{
    // ... 其他代码 ...

    // 申请中断
    if (spi->irq) {
        ret = devm_request_irq(&spi->dev, spi->irq, spi_example_irq_handler,
                              IRQF_TRIGGER_FALLING | IRQF_ONESHOT, SPI_DEVICE_NAME, spi_dev);
        if (ret < 0) {
            dev_err(&spi->dev, "Failed to request IRQ\n");
            goto fail_irq;
        }
    }

    // ... 其他代码 ...
}
```

## SPI DMA支持

对于大量数据传输，SPI驱动可以使用DMA来提高性能：

```c
// 使用DMA传输数据
static int spi_example_dma_transfer(struct spi_example_dev *dev, char *tx_buf, char *rx_buf, int len)
{
    struct spi_device *spi = dev->spi;
    struct spi_transfer t = {0};
    struct spi_message m;
    int ret;

    // 初始化SPI消息
    spi_message_init(&m);

    // 设置SPI传输参数
    t.tx_buf = tx_buf;
    t.rx_buf = rx_buf;
    t.len = len;
    t.delay_usecs = 0;
    t.speed_hz = spi->max_speed_hz;
    t.bits_per_word = spi->bits_per_word;

    // 添加传输到消息
    spi_message_add_tail(&t, &m);

    // 使用同步DMA传输
    ret = spi_sync(spi, &m);
    if (ret < 0) {
        dev_err(&spi->dev, "SPI DMA transfer failed: %d\n", ret);
        return ret;
    }

    return 0;
}
```

## 高级SPI传输示例

### 1. 使用scatter-gather传输

```c
// 使用scatter-gather传输大量数据
static int spi_example_sg_transfer(struct spi_example_dev *dev, struct scatterlist *tx_sg,
                                 struct scatterlist *rx_sg, int nents)
{
    struct spi_device *spi = dev->spi;
    struct spi_transfer t = {0};
    struct spi_message m;
    int ret;

    // 初始化SPI消息
    spi_message_init(&m);

    // 设置scatter-gather传输
    t.tx_sg.sgl = tx_sg;
    t.tx_sg.nents = nents;
    t.rx_sg.sgl = rx_sg;
    t.rx_sg.nents = nents;
    t.len = sg_nents(tx_sg) * PAGE_SIZE; // 示例：假设每个sg项是一页

    // 添加传输到消息
    spi_message_add_tail(&t, &m);

    // 同步传输
    ret = spi_sync(spi, &m);
    if (ret < 0) {
        dev_err(&spi->dev, "SPI SG transfer failed: %d\n", ret);
        return ret;
    }

    return 0;
}
```

### 2. 使用异步传输

```c
// 异步传输完成回调
static void spi_example_async_complete(void *context)
{
    struct spi_example_dev *dev = context;
    // 处理传输完成事件
    dev_info(&dev->spi->dev, "SPI async transfer completed\n");
}

// 异步传输示例
static int spi_example_async_transfer(struct spi_example_dev *dev, const void *tx_buf,
                                     void *rx_buf, int len)
{
    struct spi_device *spi = dev->spi;
    struct spi_transfer *t;
    struct spi_message *m;
    int ret;

    // 分配传输和消息结构
    t = kzalloc(sizeof(*t), GFP_KERNEL);
    if (!t) {
        return -ENOMEM;
    }

    m = kzalloc(sizeof(*m), GFP_KERNEL);
    if (!m) {
        kfree(t);
        return -ENOMEM;
    }

    // 初始化消息
    spi_message_init(m);
    m->spi = spi;
    m->complete = spi_example_async_complete;
    m->context = dev;

    // 设置传输参数
    t->tx_buf = tx_buf;
    t->rx_buf = rx_buf;
    t->len = len;

    // 添加传输到消息
    spi_message_add_tail(t, m);

    // 启动异步传输
    ret = spi_async(spi, m);
    if (ret < 0) {
        dev_err(&spi->dev, "SPI async transfer failed: %d\n", ret);
        kfree(t);
        kfree(m);
        return ret;
    }

    return 0;
}
```

## 错误处理

SPI驱动中的错误处理：

```c
// 带重试机制的SPI传输
static int spi_example_transfer_with_retry(struct spi_device *spi, struct spi_message *msg, int retries)
{
    int ret;
    int retry = retries;

    do {
        ret = spi_sync(spi, msg);
        if (ret == 0)
            return 0;
        
        msleep(1);  // 短暂延迟后重试
    } while (--retry);

    return ret;
}

// 错误码处理
static void spi_example_handle_error(int error_code)
{
    switch (error_code) {
        case -EIO:
            dev_err("SPI I/O error\n");
            break;
        case -ETIMEDOUT:
            dev_err("SPI transfer timed out\n");
            break;
        case -EREMOTEIO:
            dev_err("SPI remote I/O error\n");
            break;
        case -EINVAL:
            dev_err("SPI invalid argument\n");
            break;
        default:
            dev_err("SPI error: %d\n", error_code);
            break;
    }
}
```

## 最佳实践

1. **使用设备树**：优先使用设备树来描述SPI设备信息
2. **错误处理**：实现完善的错误处理和重试机制
3. **资源管理**：正确管理内存、中断等资源
4. **并发控制**：
   - 使用互斥锁保护共享资源
   - 避免在中断上下文中执行长时间操作
5. **性能优化**：
   - 对于大量数据使用DMA传输
   - 使用scatter-gather提高内存访问效率
   - 批量传输减少SPI总线访问次数
6. **调试信息**：
   - 使用dev_dbg()提供详细的调试信息
   - 实现sysfs接口用于运行时配置和状态查询
7. **电源管理**：
   - 支持运行时电源管理
   - 在空闲时关闭设备电源
8. **可扩展性**：
   - 设计驱动以支持多种设备变体
   - 使用设备树属性进行运行时配置

## 总结

SPI驱动实现主要包括以下步骤：
1. 定义SPI驱动结构体和设备ID表
2. 实现probe和remove函数
3. 实现文件操作函数
4. 注册SPI驱动
5. 配置SPI设备参数
6. 处理中断和DMA（如果需要）
7. 实现错误处理和资源管理

通过Linux SPI子系统提供的API接口，开发者可以方便地实现各种SPI设备驱动，支持从简单的传感器到复杂的高速存储设备等多种SPI设备。SPI协议的高速特性使其特别适合用于需要高带宽通信的应用场景。