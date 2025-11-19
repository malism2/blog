---
title: DMA子系统
description: 详解Linux内核DMA子系统的原理和使用方法，包括DMA引擎框架、一致性DMA映射和流式DMA映射
---

# DMA子系统

直接内存访问(DMA)是一种硬件机制，允许外设直接访问系统内存而无需CPU干预。在现代计算机系统中，大多数I/O设备都使用DMA来提高数据传输效率。本章将详细介绍Linux内核中的DMA子系统。

## DMA基本概念

### 什么是DMA

DMA（Direct Memory Access，直接内存访问）是一种数据传输方式，它允许某些硬件子系统直接读写系统内存，而不需要中央处理器(CPU)的介入。这种机制大大提高了数据传输效率，减轻了CPU负担。

### DMA控制器

DMA控制器是专门负责DMA传输的硬件组件。它通常包含以下寄存器：
- 源地址寄存器
- 目标地址寄存器
- 传输计数寄存器
- 控制寄存器

## Linux DMA子系统架构

### DMA引擎框架

Linux内核提供了统一的DMA引擎框架，为驱动开发者提供了一套标准的API来使用DMA功能。DMA引擎框架的主要优势包括：

1. 异步传输能力
2. 统一的API接口
3. 支持多种DMA控制器
4. 提供通道管理机制

### DMA通道

每个DMA控制器通常包含多个DMA通道，每个通道可以独立地执行DMA传输操作。驱动程序需要申请DMA通道才能进行DMA操作。

## DMA映射类型

### 一致性DMA映射

一致性DMA映射用于需要在CPU和设备之间共享的内存缓冲区。这类映射具有以下特点：
- CPU和设备可以同时访问同一块内存
- 内存缓存一致性得到保证
- 映射在整个设备生命周期内有效

```c
#include <linux/dma-mapping.h>

// 分配一致性DMA内存
void *cpu_addr;
dma_addr_t dma_handle;
size_t size = 1024;

cpu_addr = dma_alloc_coherent(dev, size, &dma_handle, GFP_KERNEL);
if (!cpu_addr) {
    pr_err("Failed to allocate coherent DMA memory\n");
    return -ENOMEM;
}

// 使用内存...
// cpu_addr用于CPU访问
// dma_handle用于设备访问

// 释放一致性DMA内存
dma_free_coherent(dev, size, cpu_addr, dma_handle);
```

### 流式DMA映射

流式DMA映射用于临时的、单向的数据传输。这类映射具有以下特点：
- 适用于单次数据传输
- 需要在每次传输前建立映射
- 传输完成后必须解除映射

```c
#include <linux/dma-mapping.h>

// 建立流式DMA映射（设备到内存）
dma_addr_t dma_handle;
size_t size = 1024;
void *buffer; // 已分配的缓冲区

dma_handle = dma_map_single(dev, buffer, size, DMA_FROM_DEVICE);
if (dma_mapping_error(dev, dma_handle)) {
    pr_err("DMA mapping error\n");
    return -ENOMEM;
}

// 发起DMA传输...

// 同步DMA缓冲区
dma_sync_single_for_cpu(dev, dma_handle, size, DMA_FROM_DEVICE);

// 访问数据...

// 同步回设备
dma_sync_single_for_device(dev, dma_handle, size, DMA_FROM_DEVICE);

// 解除DMA映射
dma_unmap_single(dev, dma_handle, size, DMA_FROM_DEVICE);
```

## DMA引擎API详解

### 申请DMA通道

```c
#include <linux/dmaengine.h>

struct dma_chan *chan;

// 根据能力掩码查找DMA通道
dma_cap_mask_t mask;
dma_cap_zero(mask);
dma_cap_set(DMA_MEMCPY, mask);

chan = dma_request_channel(mask, NULL, NULL);
if (!chan) {
    pr_err("Failed to request DMA channel\n");
    return -ENODEV;
}
```

### 准备DMA传输描述符

```c
struct dma_async_tx_descriptor *tx;
dma_cookie_t cookie;

// 准备memcpy类型的DMA传输
tx = dmaengine_prep_dma_memcpy(chan, dest_addr, src_addr, len, 
                               DMA_PREP_INTERRUPT | DMA_CTRL_ACK);
if (!tx) {
    pr_err("Failed to prepare DMA memcpy\n");
    dma_release_channel(chan);
    return -ENOMEM;
}

// 设置回调函数
tx->callback = dma_transfer_complete;
tx->callback_param = &my_data;

// 提交传输
cookie = dmaengine_submit(tx);
if (dma_submit_error(cookie)) {
    pr_err("Failed to submit DMA transfer\n");
    dma_release_channel(chan);
    return -EIO;
}
```

### 发起DMA传输

```c
// 发起DMA传输
dma_async_issue_pending(chan);

// 等待传输完成（可选）
unsigned long timeout = msecs_to_jiffies(1000);
unsigned long expires = jiffies + timeout;

while (time_before(jiffies, expires)) {
    enum dma_status status = dma_async_is_tx_complete(chan, cookie, NULL, NULL);
    if (status != DMA_IN_PROGRESS) {
        if (status == DMA_COMPLETE) {
            pr_info("DMA transfer completed successfully\n");
        } else {
            pr_err("DMA transfer failed\n");
        }
        break;
    }
    msleep(10);
}
```

## 设备树中的DMA配置

在设备树中配置DMA相关信息：

```dts
my_device: my-device@10000000 {
    compatible = "vendor,my-device";
    reg = <0x10000000 0x1000>;
    
    // DMA相关属性
    dmas = <&dma_controller 0 1>, <&dma_controller 1 2>;
    dma-names = "tx", "rx";
};
```

在驱动程序中获取DMA资源：

```c
struct device_node *np = dev->of_node;
struct dma_chan *tx_chan, *rx_chan;

if (np) {
    // 获取发送DMA通道
    tx_chan = dma_request_slave_channel(dev, "tx");
    if (IS_ERR(tx_chan)) {
        pr_err("Failed to request TX DMA channel\n");
        return PTR_ERR(tx_chan);
    }
    
    // 获取接收DMA通道
    rx_chan = dma_request_slave_channel(dev, "rx");
    if (IS_ERR(rx_chan)) {
        pr_err("Failed to request RX DMA channel\n");
        dma_release_channel(tx_chan);
        return PTR_ERR(rx_chan);
    }
}
```

## DMA驱动开发实例

下面是一个完整的DMA驱动开发示例：

```c
#include <linux/module.h>
#include <linux/platform_device.h>
#include <linux/dmaengine.h>
#include <linux/dma-mapping.h>
#include <linux/interrupt.h>
#include <linux/of.h>

#define BUFFER_SIZE 4096

struct my_dma_device {
    struct platform_device *pdev;
    struct dma_chan *tx_chan;
    struct dma_chan *rx_chan;
    void *tx_buf;
    void *rx_buf;
    dma_addr_t tx_phys;
    dma_addr_t rx_phys;
};

static void dma_tx_callback(void *data)
{
    struct my_dma_device *mydev = data;
    pr_info("TX DMA transfer completed\n");
}

static void dma_rx_callback(void *data)
{
    struct my_dma_device *mydev = data;
    pr_info("RX DMA transfer completed\n");
    
    // 处理接收到的数据
    // ...
}

static int setup_dma_channels(struct my_dma_device *mydev)
{
    struct device *dev = &mydev->pdev->dev;
    struct dma_async_tx_descriptor *tx_desc, *rx_desc;
    dma_cookie_t tx_cookie, rx_cookie;
    
    // 分配DMA缓冲区
    mydev->tx_buf = dma_alloc_coherent(dev, BUFFER_SIZE, &mydev->tx_phys, GFP_KERNEL);
    if (!mydev->tx_buf) {
        dev_err(dev, "Failed to allocate TX buffer\n");
        return -ENOMEM;
    }
    
    mydev->rx_buf = dma_alloc_coherent(dev, BUFFER_SIZE, &mydev->rx_phys, GFP_KERNEL);
    if (!mydev->rx_buf) {
        dev_err(dev, "Failed to allocate RX buffer\n");
        dma_free_coherent(dev, BUFFER_SIZE, mydev->tx_buf, mydev->tx_phys);
        return -ENOMEM;
    }
    
    // 初始化发送缓冲区
    memset(mydev->tx_buf, 0xAA, BUFFER_SIZE);
    
    // 请求DMA通道
    mydev->tx_chan = dma_request_slave_channel(dev, "tx");
    if (IS_ERR(mydev->tx_chan)) {
        dev_err(dev, "Failed to request TX DMA channel\n");
        goto err_free_buffers;
    }
    
    mydev->rx_chan = dma_request_slave_channel(dev, "rx");
    if (IS_ERR(mydev->rx_chan)) {
        dev_err(dev, "Failed to request RX DMA channel\n");
        goto err_release_tx;
    }
    
    // 准备发送传输
    tx_desc = dmaengine_prep_slave_single(mydev->tx_chan, mydev->tx_phys,
                                          BUFFER_SIZE, DMA_MEM_TO_DEV,
                                          DMA_PREP_INTERRUPT | DMA_CTRL_ACK);
    if (!tx_desc) {
        dev_err(dev, "Failed to prepare TX descriptor\n");
        goto err_release_channels;
    }
    
    tx_desc->callback = dma_tx_callback;
    tx_desc->callback_param = mydev;
    
    tx_cookie = dmaengine_submit(tx_desc);
    if (dma_submit_error(tx_cookie)) {
        dev_err(dev, "Failed to submit TX transfer\n");
        goto err_release_channels;
    }
    
    // 准备接收传输
    rx_desc = dmaengine_prep_slave_single(mydev->rx_chan, mydev->rx_phys,
                                          BUFFER_SIZE, DMA_DEV_TO_MEM,
                                          DMA_PREP_INTERRUPT | DMA_CTRL_ACK);
    if (!rx_desc) {
        dev_err(dev, "Failed to prepare RX descriptor\n");
        goto err_release_channels;
    }
    
    rx_desc->callback = dma_rx_callback;
    rx_desc->callback_param = mydev;
    
    rx_cookie = dmaengine_submit(rx_desc);
    if (dma_submit_error(rx_cookie)) {
        dev_err(dev, "Failed to submit RX transfer\n");
        goto err_release_channels;
    }
    
    // 发起传输
    dma_async_issue_pending(mydev->tx_chan);
    dma_async_issue_pending(mydev->rx_chan);
    
    return 0;
    
err_release_channels:
    dma_release_channel(mydev->rx_chan);
err_release_tx:
    dma_release_channel(mydev->tx_chan);
err_free_buffers:
    dma_free_coherent(dev, BUFFER_SIZE, mydev->rx_buf, mydev->rx_phys);
    dma_free_coherent(dev, BUFFER_SIZE, mydev->tx_buf, mydev->tx_phys);
    return -EIO;
}

static int my_dma_probe(struct platform_device *pdev)
{
    struct my_dma_device *mydev;
    int ret;
    
    mydev = devm_kzalloc(&pdev->dev, sizeof(*mydev), GFP_KERNEL);
    if (!mydev)
        return -ENOMEM;
    
    mydev->pdev = pdev;
    platform_set_drvdata(pdev, mydev);
    
    ret = setup_dma_channels(mydev);
    if (ret) {
        dev_err(&pdev->dev, "Failed to setup DMA channels\n");
        return ret;
    }
    
    dev_info(&pdev->dev, "DMA device initialized successfully\n");
    return 0;
}

static int my_dma_remove(struct platform_device *pdev)
{
    struct my_dma_device *mydev = platform_get_drvdata(pdev);
    struct device *dev = &pdev->dev;
    
    if (mydev->tx_chan) {
        dmaengine_terminate_all(mydev->tx_chan);
        dma_release_channel(mydev->tx_chan);
    }
    
    if (mydev->rx_chan) {
        dmaengine_terminate_all(mydev->rx_chan);
        dma_release_channel(mydev->rx_chan);
    }
    
    if (mydev->tx_buf) {
        dma_free_coherent(dev, BUFFER_SIZE, mydev->tx_buf, mydev->tx_phys);
    }
    
    if (mydev->rx_buf) {
        dma_free_coherent(dev, BUFFER_SIZE, mydev->rx_buf, mydev->rx_phys);
    }
    
    dev_info(dev, "DMA device removed\n");
    return 0;
}

static const struct of_device_id my_dma_of_match[] = {
    { .compatible = "vendor,my-dma-device", },
    { /* sentinel */ }
};
MODULE_DEVICE_TABLE(of, my_dma_of_match);

static struct platform_driver my_dma_driver = {
    .probe = my_dma_probe,
    .remove = my_dma_remove,
    .driver = {
        .name = "my-dma-device",
        .of_match_table = my_dma_of_match,
    },
};

module_platform_driver(my_dma_driver);

MODULE_AUTHOR("Your Name");
MODULE_DESCRIPTION("DMA Device Driver Example");
MODULE_LICENSE("GPL");
```

## DMA调试技巧

### 启用DMA调试

在内核配置中启用DMA调试选项：

```
Device Drivers --->
  DMA Engine support --->
    [*] DMA Engine debugging interface
```

### 使用DMA测试工具

```bash
# 查看系统DMA通道信息
cat /sys/kernel/debug/dmaengine/dmatest

# 运行DMA测试
echo 1 > /sys/kernel/debug/dmaengine/run
```

### 内核日志分析

```bash
# 查看DMA相关的内核消息
dmesg | grep -i dma

# 实时监控DMA事件
tail -f /var/log/kern.log | grep -i dma
```

## 性能优化建议

### DMA缓冲区大小优化

1. 选择合适的缓冲区大小以平衡内存使用和传输效率
2. 对于频繁的小数据传输，考虑使用环形缓冲区
3. 避免过度分片，尽量使用较大的连续缓冲区

### 缓冲区对齐

```c
// 确保缓冲区按CACHE_LINE_SIZE对齐
#define CACHE_LINE_SIZE 64

void *buffer = kmalloc(size, GFP_KERNEL | __GFP_ZERO);
void *aligned_buffer = PTR_ALIGN(buffer, CACHE_LINE_SIZE);
```

### 减少DMA映射次数

1. 对于频繁使用的缓冲区，使用一致性DMA映射
2. 批量处理数据以减少映射/解映射操作
3. 重用DMA描述符以减少开销

## 故障排除

### 常见问题

1. **DMA映射失败**：检查设备地址空间和内存限制
2. **传输超时**：验证DMA控制器配置和中断处理
3. **数据损坏**：确认缓冲区对齐和缓存一致性

### 调试方法

1. 使用`dma_mapping_error()`检查映射错误
2. 添加详细的日志记录跟踪DMA操作
3. 使用逻辑分析仪监控DMA信号

通过掌握Linux内核DMA子系统的原理和使用方法，您可以开发出高效、稳定的设备驱动程序，充分利用硬件DMA功能提升系统性能。