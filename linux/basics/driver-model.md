---
title: Linux设备驱动模型
description: 详解Linux设备驱动模型的设计理念、核心组件和实现机制
---

# Linux设备驱动模型

设备驱动模型是Linux内核中一个重要的框架，它为设备管理和驱动程序提供了一套统一的接口和机制。理解设备驱动模型对于编写高质量的驱动程序至关重要。

## 设备驱动模型概述

Linux设备驱动模型的主要目标是：

1. **统一设备管理**：提供一致的设备管理接口
2. **自动配置**：支持设备的自动探测和配置
3. **电源管理**：集成系统级电源管理功能
4. **热插拔支持**：动态处理设备的插入和移除

## 核心概念

### 1. 设备（Device）

在设备驱动模型中，每个硬件设备都由一个`device`结构体表示：

```c
struct device {
    struct device *parent;
    struct device_private *p;
    struct kobject kobj;
    const char *init_name;
    const struct device_type *type;
    struct mutex mutex;
    struct bus_type *bus;
    struct device_driver *driver;
    void *platform_data;
    void *driver_data;
    struct dev_links_info links;
    struct dev_pm_info power;
    // ... 其他字段
};
```

### 2. 驱动（Driver）

每个驱动程序由一个`device_driver`结构体表示：

```c
struct device_driver {
    const char *name;
    struct bus_type *bus;
    struct module *owner;
    const char *mod_name;
    bool suppress_bind_attrs;
    enum probe_type probe_type;
    const struct of_device_id *of_match_table;
    const struct acpi_device_id *acpi_match_table;
    int (*probe) (struct device *dev);
    int (*remove) (struct device *dev);
    void (*shutdown) (struct device *dev);
    int (*suspend) (struct device *dev, pm_message_t state);
    int (*resume) (struct device *dev);
    const struct attribute_group **groups;
    const struct dev_pm_ops *pm;
    struct driver_private *p;
};
```

### 3. 总线（Bus）

总线是连接设备和驱动的桥梁，由`bus_type`结构体表示：

```c
struct bus_type {
    const char *name;
    const char *dev_name;
    struct device *dev_root;
    const struct attribute_group **bus_groups;
    const struct attribute_group **dev_groups;
    const struct attribute_group **drv_groups;
    int (*match)(struct device *dev, struct device_driver *drv);
    int (*uevent)(struct device *dev, struct kobj_uevent_env *env);
    int (*probe)(struct device *dev);
    int (*remove)(struct device *dev);
    void (*shutdown)(struct device *dev);
    int (*online)(struct device *dev);
    int (*offline)(struct device *dev);
    int (*suspend)(struct device *dev, pm_message_t state);
    int (*resume)(struct device *dev);
    int (*num_vf)(struct device *dev);
    // ... 其他字段
};
```

## 设备驱动模型的工作流程

### 1. 设备注册

当一个设备被发现时（例如通过设备树或ACPI），系统会创建一个设备对象并注册到总线上：

```c
// 设备注册示例
int device_register(struct device *dev)
{
    device_initialize(dev);
    return device_add(dev);
}
```

### 2. 驱动注册

驱动程序在初始化时会向总线注册自己：

```c
// 驱动注册示例
int driver_register(struct device_driver *drv)
{
    // 初始化驱动
    drv->p = kzalloc(sizeof(*drv->p), GFP_KERNEL);
    // 注册到总线
    return bus_add_driver(drv);
}
```

### 3. 匹配过程

当设备和驱动都在总线上时，系统会尝试匹配它们：

```c
// 简化的匹配过程
static int __device_attach_driver(struct device_driver *drv, void *_data)
{
    struct device *dev = _data;
    
    // 调用总线特定的匹配函数
    if (!bus_match_device(dev->bus, dev, drv))
        return 0;
        
    // 如果匹配成功，尝试绑定
    return device_bind_driver(dev);
}
```

## 实际示例：平台总线驱动

让我们通过一个具体的平台总线驱动示例来理解设备驱动模型的实际应用：

```c
#include <linux/module.h>
#include <linux/platform_device.h>
#include <linux/of.h>

// 设备私有数据结构
struct my_device_data {
    void __iomem *base_addr;
    int irq;
    // 其他设备相关数据
};

// 探测函数 - 当设备和驱动匹配时调用
static int my_device_probe(struct platform_device *pdev)
{
    struct device *dev = &pdev->dev;
    struct my_device_data *data;
    struct resource *res;
    int ret;
    
    // 分配设备私有数据
    data = devm_kzalloc(dev, sizeof(*data), GFP_KERNEL);
    if (!data)
        return -ENOMEM;
        
    // 获取内存资源
    res = platform_get_resource(pdev, IORESOURCE_MEM, 0);
    data->base_addr = devm_ioremap_resource(dev, res);
    if (IS_ERR(data->base_addr))
        return PTR_ERR(data->base_addr);
        
    // 获取IRQ资源
    data->irq = platform_get_irq(pdev, 0);
    if (data->irq < 0)
        return data->irq;
        
    // 初始化硬件
    // ...
    
    // 保存设备数据
    platform_set_drvdata(pdev, data);
    
    dev_info(dev, "My device probed successfully\n");
    return 0;
}

// 移除函数 - 当设备被移除时调用
static int my_device_remove(struct platform_device *pdev)
{
    struct device *dev = &pdev->dev;
    
    dev_info(dev, "My device removed\n");
    return 0;
}

// 设备树匹配表
static const struct of_device_id my_device_of_match[] = {
    { .compatible = "myvendor,mydevice", },
    { /* sentinel */ }
};
MODULE_DEVICE_TABLE(of, my_device_of_match);

// 平台驱动结构体
static struct platform_driver my_device_driver = {
    .probe = my_device_probe,
    .remove = my_device_remove,
    .driver = {
        .name = "my-device",
        .of_match_table = my_device_of_match,
    },
};

// 模块初始化和退出
module_platform_driver(my_device_driver);

MODULE_AUTHOR("Your Name");
MODULE_DESCRIPTION("My Device Driver");
MODULE_LICENSE("GPL");
```

## 属性和sysfs接口

设备驱动模型通过sysfs文件系统向用户空间暴露设备信息：

```c
// 定义设备属性
static ssize_t my_attr_show(struct device *dev,
                           struct device_attribute *attr, char *buf)
{
    struct my_device_data *data = dev_get_drvdata(dev);
    
    return sprintf(buf, "%d\n", data->some_value);
}

static ssize_t my_attr_store(struct device *dev,
                            struct device_attribute *attr,
                            const char *buf, size_t count)
{
    struct my_device_data *data = dev_get_drvdata(dev);
    int value;
    
    if (kstrtoint(buf, 0, &value))
        return -EINVAL;
        
    data->some_value = value;
    return count;
}

// 创建设备属性
static DEVICE_ATTR_RW(my_attr);

// 在探测函数中创建属性
static int my_device_probe(struct platform_device *pdev)
{
    // ... 其他初始化代码 ...
    
    // 创建sysfs属性
    ret = device_create_file(dev, &dev_attr_my_attr);
    if (ret)
        return ret;
        
    return 0;
}
```

## 电源管理集成

设备驱动模型集成了电源管理功能：

```c
#ifdef CONFIG_PM_SLEEP
static int my_device_suspend(struct device *dev)
{
    struct my_device_data *data = dev_get_drvdata(dev);
    
    // 保存设备状态
    data->saved_state = readl(data->base_addr + STATE_REG);
    
    // 关闭设备
    writel(0, data->base_addr + CONTROL_REG);
    
    return 0;
}

static int my_device_resume(struct device *dev)
{
    struct my_device_data *data = dev_get_drvdata(dev);
    
    // 恢复设备状态
    writel(data->saved_state, data->base_addr + STATE_REG);
    
    return 0;
}
#endif

// 定义电源管理操作
static const struct dev_pm_ops my_device_pm_ops = {
    SET_SYSTEM_SLEEP_PM_OPS(my_device_suspend, my_device_resume)
};

// 在驱动结构体中引用电源管理操作
static struct platform_driver my_device_driver = {
    .probe = my_device_probe,
    .remove = my_device_remove,
    .driver = {
        .name = "my-device",
        .of_match_table = my_device_of_match,
        .pm = &my_device_pm_ops,
    },
};
```

## 调试技巧

### 1. 使用dev_dbg和相关宏

```c
// 在文件开头定义DEBUG
#define DEBUG
#include <linux/device.h>

// 在代码中使用调试输出
dev_dbg(dev, "Debug message: value = %d\n", value);
dev_info(dev, "Info message\n");
dev_warn(dev, "Warning message\n");
dev_err(dev, "Error message\n");
```

### 2. 查看sysfs信息

```bash
# 查看设备信息
ls /sys/devices/platform/my-device/
cat /sys/devices/platform/my-device/my_attr

# 查看驱动信息
ls /sys/bus/platform/drivers/my-device/
```

## 最佳实践

1. **正确使用内存管理函数**：使用`devm_*`系列函数进行资源管理
2. **错误处理**：确保在任何错误路径上都正确清理资源
3. **设备树支持**：为现代设备提供设备树匹配支持
4. **电源管理**：实现适当的电源管理回调函数
5. **调试信息**：合理使用不同级别的调试输出

通过深入理解Linux设备驱动模型，你可以编写出更加健壮、易于维护的驱动程序，并充分利用内核提供的各种基础设施。