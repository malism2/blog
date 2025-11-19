---
title: I2C驱动实现
description: I2C驱动的核心数据结构、API接口和实现细节详解
---

# I2C驱动实现

I2C（Inter-Integrated Circuit）是一种简单的两线串行通信协议，广泛应用于连接微控制器与各种外围设备。Linux内核提供了完整的I2C子系统框架，使得开发者可以方便地实现I2C设备驱动。本章将详细介绍I2C驱动的核心数据结构、API接口和实现细节。

## I2C驱动概述

I2C总线的主要特点：
1. **两线通信**：仅使用SCL（时钟线）和SDA（数据线）
2. **主从架构**：支持多主设备和多从设备
3. **地址寻址**：从设备通过7位或10位地址识别
4. **同步通信**：通过SCL时钟线同步数据传输

Linux I2C子系统架构：
- **I2C核心**：提供核心功能和API接口
- **I2C总线驱动**：负责管理物理I2C总线硬件
- **I2C设备驱动**：控制具体的I2C设备
- **用户空间接口**：允许用户空间程序访问I2C设备

## 核心数据结构

### 1. I2C设备结构体

`struct i2c_client`代表一个I2C从设备：

```c
struct i2c_client {
    unsigned short flags;       // 设备标志
    unsigned short addr;        // 7位或10位I2C地址
    char name[I2C_NAME_SIZE];   // 设备名称
    struct i2c_adapter *adapter; // 所属的I2C适配器
    struct device dev;          // 设备模型结构
    int irq;                    // 中断号
    struct list_head detected;  // 用于设备探测的链表
    void *private_data;         // 私有数据指针
};
```

### 2. I2C适配器结构体

`struct i2c_adapter`代表一个I2C主控制器（适配器）：

```c
struct i2c_adapter {
    struct module *owner;       // 模块所有者
    unsigned int class;         // 支持的从设备类型
    const struct i2c_algorithm *algo; // 传输算法
    void *algo_data;            // 算法私有数据
    struct rt_mutex bus_lock;   // 总线锁
    int timeout;                // 超时时间（ms）
    int retries;                // 重试次数
    struct device dev;          // 设备模型结构
    int nr;                     // 适配器编号
    char name[48];              // 适配器名称
    // ... 其他字段
};
```

### 3. I2C算法结构体

`struct i2c_algorithm`定义了I2C适配器的传输算法：

```c
struct i2c_algorithm {
    int (*master_xfer)(struct i2c_adapter *adap, struct i2c_msg *msgs, int num);
    int (*smbus_xfer)(struct i2c_adapter *adap, u16 addr, unsigned short flags,
                      char read_write, u8 command, int size, union i2c_smbus_data *data);
    u32 (*functionality)(struct i2c_adapter *);
};
```

### 4. I2C设备驱动结构体

`struct i2c_driver`定义了一个I2C设备驱动：

```c
struct i2c_driver {
    unsigned int class;
    int (*probe)(struct i2c_client *, const struct i2c_device_id *);
    int (*remove)(struct i2c_client *);
    void (*shutdown)(struct i2c_client *);
    int (*suspend)(struct i2c_client *, pm_message_t mesg);
    int (*resume)(struct i2c_client *);
    const struct i2c_device_id *id_table;
    const struct of_device_id *of_match_table;
    struct device_driver driver;
    struct list_head clients;
};
```

### 5. I2C消息结构体

`struct i2c_msg`定义了一个I2C消息：

```c
truct i2c_msg {
    __u16 addr;        // 设备地址
    __u16 flags;       // 消息标志
#define I2C_M_RD        0x0001  // 读消息
#define I2C_M_TEN       0x0010  // 10位地址
#define I2C_M_DMA_SAFE  0x0200  // DMA安全
    __u16 len;         // 消息长度
    __u8 *buf;         // 消息缓冲区
};
```

## 核心API接口

### 1. I2C设备驱动注册

```c
int i2c_add_driver(struct i2c_driver *driver);
void i2c_del_driver(struct i2c_driver *driver);

// 模块加载和卸载的宏定义
#define module_i2c_driver(__i2c_driver) 
    module_driver(__i2c_driver, i2c_add_driver, i2c_del_driver)
```

### 2. I2C设备创建和销毁

```c
struct i2c_client *i2c_new_client_device(struct i2c_adapter *adap,
                                       const struct i2c_board_info *info);
void i2c_unregister_device(struct i2c_client *client);

struct i2c_client *i2c_new_scanned_device(struct i2c_adapter *adap,
                                        const struct i2c_board_info *info,
                                        const unsigned short *addr_list,
                                        int (*probe)(struct i2c_client *));
```

### 3. I2C数据传输

```c
int i2c_master_send(struct i2c_client *client, const char *buf, int count);
int i2c_master_recv(struct i2c_client *client, char *buf, int count);

int i2c_transfer(struct i2c_adapter *adap, struct i2c_msg *msgs, int num);
int i2c_smbus_xfer(struct i2c_adapter *adap, u16 addr, unsigned short flags,
                  char read_write, u8 command, int size, union i2c_smbus_data *data);
```

### 4. I2C设备操作辅助函数

```c
int i2c_smbus_write_byte(struct i2c_client *client, u8 value);
int i2c_smbus_read_byte(struct i2c_client *client);
int i2c_smbus_write_byte_data(struct i2c_client *client, u8 command, u8 value);
int i2c_smbus_read_byte_data(struct i2c_client *client, u8 command);
int i2c_smbus_write_word_data(struct i2c_client *client, u8 command, u16 value);
int i2c_smbus_read_word_data(struct i2c_client *client, u8 command);
```

## I2C设备驱动实现示例

### 1. 驱动模块初始化

```c
#include <linux/init.h>
#include <linux/module.h>
#include <linux/i2c.h>
#include <linux/fs.h>
#include <linux/uaccess.h>
#include <linux/slab.h>

#define I2C_DEVICE_NAME "i2c_example"
#define I2C_DEVICE_ADDR 0x50  // 示例设备地址

// 设备结构体
struct i2c_example_dev {
    struct i2c_client *client;
    struct class *class;
    struct device *device;
    dev_t dev_no;
    int major;
};

static struct i2c_example_dev *i2c_dev;

// I2C设备ID表
static const struct i2c_device_id i2c_example_id[] = {
    { I2C_DEVICE_NAME, 0 },
    { }
};
MODULE_DEVICE_TABLE(i2c, i2c_example_id);

// 设备树匹配表
static const struct of_device_id i2c_example_of_match[] = {
    { .compatible = "example,i2c-example" },
    { }
};
MODULE_DEVICE_TABLE(of, i2c_example_of_match);
```

### 2. 文件操作函数

```c
// 设备文件打开函数
static int i2c_example_open(struct inode *inode, struct file *file)
{
    file->private_data = i2c_dev;
    return 0;
}

// 设备文件读取函数
static ssize_t i2c_example_read(struct file *file, char __user *buf, size_t count, loff_t *offset)
{
    struct i2c_example_dev *dev = file->private_data;
    char *kernel_buf;
    int ret;

    if (count > PAGE_SIZE)
        count = PAGE_SIZE;

    kernel_buf = kmalloc(count, GFP_KERNEL);
    if (!kernel_buf)
        return -ENOMEM;

    // 使用i2c_master_recv读取数据
    ret = i2c_master_recv(dev->client, kernel_buf, count);
    if (ret < 0) {
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
static ssize_t i2c_example_write(struct file *file, const char __user *buf, size_t count, loff_t *offset)
{
    struct i2c_example_dev *dev = file->private_data;
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

    // 使用i2c_master_send写入数据
    ret = i2c_master_send(dev->client, kernel_buf, count);
    if (ret < 0) {
        kfree(kernel_buf);
        return ret;
    }

    kfree(kernel_buf);
    return count;
}

// 设备文件释放函数
static int i2c_example_release(struct inode *inode, struct file *file)
{
    return 0;
}

// 文件操作结构体
static const struct file_operations i2c_example_fops = {
    .owner = THIS_MODULE,
    .open = i2c_example_open,
    .read = i2c_example_read,
    .write = i2c_example_write,
    .release = i2c_example_release,
};
```

### 3. I2C设备探测和移除函数

```c
// I2C设备探测函数
static int i2c_example_probe(struct i2c_client *client, const struct i2c_device_id *id)
{
    int ret;

    // 分配设备结构体
    i2c_dev = kzalloc(sizeof(struct i2c_example_dev), GFP_KERNEL);
    if (!i2c_dev) {
        return -ENOMEM;
    }

    i2c_dev->client = client;
    i2c_set_clientdata(client, i2c_dev);

    // 注册字符设备
    ret = alloc_chrdev_region(&i2c_dev->dev_no, 0, 1, I2C_DEVICE_NAME);
    if (ret < 0) {
        dev_err(&client->dev, "Failed to allocate chrdev region\n");
        goto fail_alloc;
    }

    i2c_dev->major = MAJOR(i2c_dev->dev_no);

    cdev_init(&i2c_dev->cdev, &i2c_example_fops);
    i2c_dev->cdev.owner = THIS_MODULE;

    ret = cdev_add(&i2c_dev->cdev, i2c_dev->dev_no, 1);
    if (ret < 0) {
        dev_err(&client->dev, "Failed to add cdev\n");
        goto fail_cdev;
    }

    // 创建类
    i2c_dev->class = class_create(THIS_MODULE, I2C_DEVICE_NAME);
    if (IS_ERR(i2c_dev->class)) {
        dev_err(&client->dev, "Failed to create class\n");
        ret = PTR_ERR(i2c_dev->class);
        goto fail_class;
    }

    // 创建设备节点
    i2c_dev->device = device_create(i2c_dev->class, &client->dev, i2c_dev->dev_no,
                                   NULL, I2C_DEVICE_NAME);
    if (IS_ERR(i2c_dev->device)) {
        dev_err(&client->dev, "Failed to create device\n");
        ret = PTR_ERR(i2c_dev->device);
        goto fail_device;
    }

    dev_info(&client->dev, "I2C example driver probed successfully\n");
    return 0;

fail_device:
    class_destroy(i2c_dev->class);
fail_class:
    cdev_del(&i2c_dev->cdev);
fail_cdev:
    unregister_chrdev_region(i2c_dev->dev_no, 1);
fail_alloc:
    kfree(i2c_dev);
    return ret;
}

// I2C设备移除函数
static int i2c_example_remove(struct i2c_client *client)
{
    struct i2c_example_dev *dev = i2c_get_clientdata(client);

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

    dev_info(&client->dev, "I2C example driver removed\n");
    return 0;
}
```

### 4. I2C驱动结构体定义和模块初始化

```c
// I2C驱动结构体
static struct i2c_driver i2c_example_driver = {
    .driver = {
        .name = I2C_DEVICE_NAME,
        .owner = THIS_MODULE,
        .of_match_table = i2c_example_of_match,
    },
    .probe = i2c_example_probe,
    .remove = i2c_example_remove,
    .id_table = i2c_example_id,
};

// 模块初始化函数
static int __init i2c_example_init(void)
{
    int ret;

    ret = i2c_add_driver(&i2c_example_driver);
    if (ret < 0) {
        pr_err("Failed to add I2C driver\n");
        return ret;
    }

    pr_info("I2C example driver initialized\n");
    return 0;
}

// 模块退出函数
static void __exit i2c_example_exit(void)
{
    i2c_del_driver(&i2c_example_driver);
    pr_info("I2C example driver exited\n");
}

module_init(i2c_example_init);
module_exit(i2c_example_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Linux Driver Developer");
MODULE_DESCRIPTION("I2C Example Driver");
MODULE_VERSION("1.0");
```

## I2C中断处理

许多I2C设备支持中断，以下是如何在I2C驱动中处理中断的示例：

```c
// 中断处理函数
static irqreturn_t i2c_example_irq_handler(int irq, void *dev_id)
{
    struct i2c_example_dev *dev = dev_id;
    // 处理中断事件
    // ...
    return IRQ_HANDLED;
}

// 在probe函数中申请中断
static int i2c_example_probe(struct i2c_client *client, const struct i2c_device_id *id)
{
    // ... 其他代码 ...

    // 申请中断
    ret = devm_request_irq(&client->dev, client->irq, i2c_example_irq_handler,
                          IRQF_TRIGGER_FALLING | IRQF_ONESHOT, I2C_DEVICE_NAME, i2c_dev);
    if (ret < 0) {
        dev_err(&client->dev, "Failed to request IRQ\n");
        goto fail_irq;
    }

    // ... 其他代码 ...
}
```

## I2C DMA支持

对于大量数据传输，I2C驱动可以使用DMA来提高性能：

```c
// 使用DMA传输数据
static int i2c_example_dma_transfer(struct i2c_example_dev *dev, char *buf, int len, bool read)
{
    struct i2c_msg msg;
    int ret;

    msg.addr = dev->client->addr;
    msg.flags = read ? I2C_M_RD : 0;
    msg.flags |= I2C_M_DMA_SAFE;  // 标记为DMA安全
    msg.len = len;
    msg.buf = buf;

    ret = i2c_transfer(dev->client->adapter, &msg, 1);
    if (ret < 0) {
        dev_err(&dev->client->dev, "I2C DMA transfer failed: %d\n", ret);
        return ret;
    }

    return 0;
}
```

## 错误处理

I2C驱动中的错误处理：

```c
// 带重试机制的I2C传输
static int i2c_example_transfer_with_retry(struct i2c_client *client, struct i2c_msg *msgs, int num)
{
    int ret;
    int retry = 3;

    do {
        ret = i2c_transfer(client->adapter, msgs, num);
        if (ret == num)
            return 0;
        
        msleep(10);  // 短暂延迟后重试
    } while (--retry);

    return ret;
}

// 错误码处理
static void i2c_example_handle_error(int error_code)
{
    switch (error_code) {
        case -EREMOTEIO:
            dev_err("I2C NACK received\n");
            break;
        case -ETIMEDOUT:
            dev_err("I2C transfer timed out\n");
            break;
        case -EAGAIN:
            dev_err("I2C bus busy\n");
            break;
        default:
            dev_err("I2C error: %d\n", error_code);
            break;
    }
}
```

## 最佳实践

1. **使用设备树**：优先使用设备树来描述I2C设备信息
2. **错误处理**：实现完善的错误处理和重试机制
3. **资源管理**：正确管理内存、中断等资源
4. **并发控制**：使用适当的锁机制保护共享资源
5. **性能优化**：
   - 批量传输减少I2C总线访问次数
   - 合理使用DMA提高传输效率
   - 避免在中断上下文中执行长时间操作
6. **调试信息**：
   - 使用dev_dbg()提供详细的调试信息
   - 实现sysfs接口用于运行时配置和状态查询

## 总结

I2C驱动实现主要包括以下步骤：
1. 定义I2C驱动结构体和设备ID表
2. 实现probe和remove函数
3. 实现文件操作函数
4. 注册I2C驱动
5. 处理中断和DMA（如果需要）
6. 实现错误处理和资源管理

通过Linux I2C子系统提供的API接口，开发者可以方便地实现各种I2C设备驱动，支持从简单的传感器到复杂的存储设备等多种I2C设备。