---
title: 网络设备驱动实现
description: 网络设备驱动的核心数据结构、API接口和实现细节详解
---

# 网络设备驱动实现

网络设备驱动是Linux内核中负责管理网络接口卡（NIC）的关键组件。它使操作系统能够通过网络硬件发送和接收数据包。本章将详细介绍网络设备驱动的核心数据结构、API接口和实现细节。

## 网络设备驱动概述

网络设备驱动的主要特点：
1. **数据包处理**：专门处理网络数据包的发送和接收
2. **协议栈接口**：与内核网络协议栈紧密集成
3. **中断驱动**：通过硬件中断处理数据包到达事件
4. **缓冲管理**：高效管理数据包缓冲区（sk_buff）

## 核心数据结构

### 1. 网络设备结构体

`struct net_device`是网络设备驱动的核心结构体：

```c
struct net_device {
    char name[IFNAMSIZ];           // 设备名称，如eth0
    unsigned long state;           // 设备状态标志
    struct net_device_stats stats; // 设备统计信息
    const struct net_device_ops *netdev_ops;  // 设备操作函数
    const struct ethtool_ops *ethtool_ops;    // 以太网工具操作
    struct netdev_rx_handler *rx_handler;     // 接收处理函数
    void *priv;                    // 私有数据指针
    unsigned int flags;            // 接口标志
    unsigned int mtu;              // 最大传输单元
    unsigned char dev_addr[ETH_ALEN];  // MAC地址
    unsigned char addr_len;        // 地址长度
    // ... 其他字段
};
```

### 2. 网络设备操作结构体

`struct net_device_ops`定义了网络设备支持的操作：

```c
struct net_device_ops {
    int (*ndo_open)(struct net_device *dev);
    int (*ndo_stop)(struct net_device *dev);
    netdev_tx_t (*ndo_start_xmit)(struct sk_buff *skb, struct net_device *dev);
    void (*ndo_set_rx_mode)(struct net_device *dev);
    int (*ndo_set_mac_address)(struct net_device *dev, void *addr);
    int (*ndo_do_ioctl)(struct net_device *dev, struct ifreq *ifr, int cmd);
    // ... 其他操作
};
```

### 3. 数据包缓冲区结构体

`struct sk_buff`是网络数据包的核心结构体：

```c
struct sk_buff {
    union {
        struct {
            /* These two members must be first. */
            struct sk_buff *next;
            struct sk_buff *prev;
        };
        // ... 其他联合体成员
    };
    struct net_device *dev;       // 接收到此skb的设备或要发送的设备
    unsigned int len;             // 数据包总长度
    unsigned int data_len;        // 分片数据长度
    __u16 mac_len;                // MAC头部长度
    skb_frag_t *frags;            // 分片数组
    struct sock *sk;              // 关联的套接字
    // ... 其他字段
};
```

### 4. 网络设备统计数据结构

`struct net_device_stats`记录网络设备的统计信息：

```c
struct net_device_stats {
    unsigned long rx_packets;     // 接收的数据包数
    unsigned long tx_packets;     // 发送的数据包数
    unsigned long rx_bytes;       // 接收的字节数
    unsigned long tx_bytes;       // 发送的字节数
    unsigned long rx_errors;      // 接收错误数
    unsigned long tx_errors;      // 发送错误数
    unsigned long rx_dropped;     // 接收丢弃数
    unsigned long tx_dropped;     // 发送丢弃数
    // ... 其他统计项
};
```

## 网络设备驱动实现步骤

### 1. 分配和初始化网络设备

```c
#include <linux/netdevice.h>
#include <linux/etherdevice.h>

static struct net_device *my_netdev;

// 分配网络设备（使用以太网设备分配函数）
my_netdev = alloc_etherdev(sizeof(struct my_private_data));
if (!my_netdev) {
    printk(KERN_ALERT "Failed to allocate network device\n");
    return -ENOMEM;
}

// 设置设备名称（可选，系统会自动分配）
strcpy(my_netdev->name, "mynet%d");  // %d会被替换为数字

// 设置MAC地址
memcpy(my_netdev->dev_addr, my_mac_addr, ETH_ALEN);

// 设置最大传输单元
my_netdev->mtu = 1500;

// 设置私有数据
struct my_private_data *priv = netdev_priv(my_netdev);
memset(priv, 0, sizeof(struct my_private_data));

// 设置网络设备操作函数
my_netdev->netdev_ops = &my_netdev_ops;

// 设置设备标志
my_netdev->flags |= IFF_UP | IFF_RUNNING;
```

### 2. 实现网络设备操作函数

```c
// 打开网络设备
static int my_netdev_open(struct net_device *dev)
{
    struct my_private_data *priv = netdev_priv(dev);
    
    // 启动发送队列
    netif_start_queue(dev);
    
    // 启动定时器或其他硬件初始化
    mod_timer(&priv->timer, jiffies + HZ);
    
    printk(KERN_INFO "Network device opened\n");
    return 0;
}

// 关闭网络设备
static int my_netdev_close(struct net_device *dev)
{
    struct my_private_data *priv = netdev_priv(dev);
    
    // 停止发送队列
    netif_stop_queue(dev);
    
    // 删除定时器
    del_timer_sync(&priv->timer);
    
    printk(KERN_INFO "Network device closed\n");
    return 0;
}

// 发送数据包
static netdev_tx_t my_netdev_start_xmit(struct sk_buff *skb, struct net_device *dev)
{
    struct my_private_data *priv = netdev_priv(dev);
    
    // 检查设备是否准备好发送
    if (!priv->link_up) {
        // 如果链路未连接，丢弃数据包
        dev_kfree_skb(skb);
        return NETDEV_TX_OK;
    }
    
    // 将数据包放入硬件发送队列
    if (my_hardware_send_packet(skb)) {
        // 发送失败，重新排队
        return NETDEV_TX_BUSY;
    }
    
    // 更新统计信息
    dev->stats.tx_packets++;
    dev->stats.tx_bytes += skb->len;
    
    // 释放skb
    dev_kfree_skb(skb);
    
    return NETDEV_TX_OK;
}

// 设置MAC地址
static int my_netdev_set_mac_address(struct net_device *dev, void *addr)
{
    struct sockaddr *sa = (struct sockaddr *)addr;
    
    // 验证地址长度
    if (!is_valid_ether_addr(sa->sa_data))
        return -EADDRNOTAVAIL;
    
    // 设置新的MAC地址
    memcpy(dev->dev_addr, sa->sa_data, ETH_ALEN);
    
    // 更新硬件寄存器
    my_hardware_set_mac_address(sa->sa_data);
    
    return 0;
}

// 定义网络设备操作结构体
static const struct net_device_ops my_netdev_ops = {
    .ndo_open = my_netdev_open,
    .ndo_stop = my_netdev_close,
    .ndo_start_xmit = my_netdev_start_xmit,
    .ndo_set_mac_address = my_netdev_set_mac_address,
    .ndo_get_stats = my_netdev_get_stats,
};
```

### 3. 实现统计数据获取函数

```c
static struct net_device_stats *my_netdev_get_stats(struct net_device *dev)
{
    struct my_private_data *priv = netdev_priv(dev);
    
    // 可以在这里从硬件获取实时统计数据
    // priv->stats = my_hardware_get_stats();
    
    return &dev->stats;
}
```

### 4. 实现数据包接收处理

```c
// 接收数据包处理函数
static void my_netdev_rx_packet(struct net_device *dev, void *data, int len)
{
    struct sk_buff *skb;
    
    // 分配skb
    skb = netdev_alloc_skb(dev, len + 2);
    if (!skb) {
        // 内存不足，更新丢弃计数
        dev->stats.rx_dropped++;
        return;
    }
    
    // 调整skb数据指针，预留2字节对齐
    skb_reserve(skb, 2);
    
    // 将数据复制到skb
    memcpy(skb_put(skb, len), data, len);
    
    // 设置skb属性
    skb->dev = dev;
    skb->protocol = eth_type_trans(skb, dev);
    skb->ip_summed = CHECKSUM_NONE;
    
    // 更新统计信息
    dev->stats.rx_packets++;
    dev->stats.rx_bytes += len;
    
    // 将数据包传递给网络协议栈
    netif_rx(skb);
}
```

### 5. 实现中断处理函数

```c
#include <linux/interrupt.h>

static irqreturn_t my_netdev_interrupt(int irq, void *dev_id)
{
    struct net_device *dev = (struct net_device *)dev_id;
    struct my_private_data *priv = netdev_priv(dev);
    unsigned int status;
    
    // 读取中断状态寄存器
    status = my_hardware_get_irq_status();
    
    // 清除中断标志
    my_hardware_clear_irq();
    
    // 处理接收中断
    if (status & RX_INTERRUPT) {
        // 处理接收数据包
        my_process_received_packets(dev);
    }
    
    // 处理发送完成中断
    if (status & TX_INTERRUPT) {
        // 处理发送完成
        my_process_transmitted_packets(dev);
        
        // 重新启动发送队列
        if (netif_queue_stopped(dev))
            netif_wake_queue(dev);
    }
    
    return IRQ_HANDLED;
}
```

### 6. 模块初始化和退出函数

```c
static int __init my_netdev_init(void)
{
    int ret;
    
    // 分配网络设备
    my_netdev = alloc_etherdev(sizeof(struct my_private_data));
    if (!my_netdev) {
        printk(KERN_ALERT "Failed to allocate network device\n");
        return -ENOMEM;
    }
    
    // 设置设备名称
    strcpy(my_netdev->name, "mynet%d");
    
    // 设置网络设备操作函数
    my_netdev->netdev_ops = &my_netdev_ops;
    
    // 设置MAC地址
    memcpy(my_netdev->dev_addr, my_mac_addr, ETH_ALEN);
    
    // 注册网络设备
    ret = register_netdev(my_netdev);
    if (ret) {
        printk(KERN_ALERT "Failed to register network device\n");
        free_netdev(my_netdev);
        return ret;
    }
    
    // 注册中断处理函数
    ret = request_irq(my_irq_number, my_netdev_interrupt, IRQF_SHARED, 
                      "my_network_device", my_netdev);
    if (ret) {
        printk(KERN_ALERT "Failed to register interrupt handler\n");
        unregister_netdev(my_netdev);
        free_netdev(my_netdev);
        return ret;
    }
    
    printk(KERN_INFO "My network device driver loaded successfully\n");
    return 0;
}

static void __exit my_netdev_exit(void)
{
    // 释放中断
    free_irq(my_irq_number, my_netdev);
    
    // 注销网络设备
    unregister_netdev(my_netdev);
    
    // 释放网络设备
    free_netdev(my_netdev);
    
    printk(KERN_INFO "My network device driver unloaded\n");
}

module_init(my_netdev_init);
module_exit(my_netdev_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Your Name");
MODULE_DESCRIPTION("A simple network device driver");
MODULE_VERSION("1.0");
```

## 高级特性实现

### 1. 实现NAPI（New API）轮询模式

```c
// NAPI轮询函数
static int my_netdev_poll(struct napi_struct *napi, int budget)
{
    struct my_private_data *priv = container_of(napi, struct my_private_data, napi);
    struct net_device *dev = priv->netdev;
    int work_done = 0;
    
    // 处理接收数据包，直到达到预算限制
    while (work_done < budget) {
        struct sk_buff *skb;
        
        // 从硬件接收队列获取数据包
        skb = my_hardware_receive_packet();
        if (!skb)
            break;
            
        // 更新统计信息
        dev->stats.rx_packets++;
        dev->stats.rx_bytes += skb->len;
        
        // 将数据包传递给网络协议栈
        skb->dev = dev;
        skb->protocol = eth_type_trans(skb, dev);
        netif_receive_skb(skb);
        
        work_done++;
    }
    
    // 如果处理的数据包少于预算，重新启用中断并停止轮询
    if (work_done < budget) {
        napi_complete_done(napi, work_done);
        my_hardware_enable_rx_interrupt();
    }
    
    return work_done;
}

// 修改中断处理函数以支持NAPI
static irqreturn_t my_netdev_interrupt(int irq, void *dev_id)
{
    struct net_device *dev = (struct net_device *)dev_id;
    struct my_private_data *priv = netdev_priv(dev);
    
    // 禁用接收中断
    my_hardware_disable_rx_interrupt();
    
    // 调度NAPI轮询
    napi_schedule(&priv->napi);
    
    return IRQ_HANDLED;
}

// 在设备打开时初始化NAPI
static int my_netdev_open(struct net_device *dev)
{
    struct my_private_data *priv = netdev_priv(dev);
    
    // 初始化NAPI结构
    netif_napi_add(dev, &priv->napi, my_netdev_poll, 64);
    
    // 启动NAPI
    napi_enable(&priv->napi);
    
    // 启动发送队列
    netif_start_queue(dev);
    
    return 0;
}

// 在设备关闭时清理NAPI
static int my_netdev_close(struct net_device *dev)
{
    struct my_private_data *priv = netdev_priv(dev);
    
    // 停止NAPI
    napi_disable(&priv->napi);
    
    // 清理NAPI结构
    netif_napi_del(&priv->napi);
    
    // 停止发送队列
    netif_stop_queue(dev);
    
    return 0;
}
```

### 2. 实现ethtool支持

```c
#include <linux/ethtool.h>

// 获取驱动信息
static void my_ethtool_get_drvinfo(struct net_device *dev, struct ethtool_drvinfo *info)
{
    strlcpy(info->driver, "my_driver", sizeof(info->driver));
    strlcpy(info->version, "1.0", sizeof(info->version));
    strlcpy(info->fw_version, "1.0", sizeof(info->fw_version));
    strlcpy(info->bus_info, "PCI", sizeof(info->bus_info));
}

// 获取链接状态
static u32 my_ethtool_get_link(struct net_device *dev)
{
    struct my_private_data *priv = netdev_priv(dev);
    return priv->link_up;
}

// 获取统计信息
static void my_ethtool_get_stats(struct net_device *dev, 
                                struct ethtool_stats *stats, u64 *data)
{
    struct net_device_stats *net_stats = &dev->stats;
    
    data[0] = net_stats->rx_packets;
    data[1] = net_stats->tx_packets;
    data[2] = net_stats->rx_bytes;
    data[3] = net_stats->tx_bytes;
    // ... 其他统计项
}

// 定义统计字符串
static const char my_ethtool_stats_keys[][ETH_GSTRING_LEN] = {
    "rx_packets",
    "tx_packets",
    "rx_bytes",
    "tx_bytes",
    // ... 其他统计项名称
};

// 获取统计字符串数量
static int my_ethtool_get_sset_count(struct net_device *dev, int sset)
{
    switch (sset) {
    case ETH_SS_STATS:
        return ARRAY_SIZE(my_ethtool_stats_keys);
    default:
        return -EOPNOTSUPP;
    }
}

// 获取统计字符串
static void my_ethtool_get_strings(struct net_device *dev, u32 stringset, u8 *data)
{
    switch (stringset) {
    case ETH_SS_STATS:
        memcpy(data, *my_ethtool_stats_keys, 
               sizeof(my_ethtool_stats_keys));
        break;
    }
}

// 定义ethtool操作结构体
static const struct ethtool_ops my_ethtool_ops = {
    .get_drvinfo = my_ethtool_get_drvinfo,
    .get_link = my_ethtool_get_link,
    .get_stats = my_ethtool_get_stats,
    .get_strings = my_ethtool_get_strings,
    .get_sset_count = my_ethtool_get_sset_count,
};

// 在设备初始化时设置ethtool操作
static int __init my_netdev_init(void)
{
    // ... 前面的初始化代码 ...
    
    // 设置ethtool操作
    my_netdev->ethtool_ops = &my_ethtool_ops;
    
    // ... 后面的初始化代码 ...
}
```

### 3. 实现多队列支持

```c
// 定义发送队列数量
#define MAX_TX_QUEUES 4
#define MAX_RX_QUEUES 4

// 多队列发送函数
static netdev_tx_t my_netdev_start_xmit(struct sk_buff *skb, struct net_device *dev)
{
    struct my_private_data *priv = netdev_priv(dev);
    unsigned int queue_index = skb_get_queue_mapping(skb);
    
    // 确保队列索引有效
    if (queue_index >= MAX_TX_QUEUES)
        queue_index = 0;
    
    // 将数据包放入对应队列
    if (my_hardware_send_packet_queue(skb, queue_index)) {
        return NETDEV_TX_BUSY;
    }
    
    // 更新统计信息
    dev->stats.tx_packets++;
    dev->stats.tx_bytes += skb->len;
    
    dev_kfree_skb(skb);
    return NETDEV_TX_OK;
}

// 设置发送队列数量
static int my_netdev_setup_tc(struct net_device *dev, enum tc_setup_type type, void *type_data)
{
    struct tc_mqprio_qopt_offload *mqprio = type_data;
    
    if (type != TC_SETUP_QDISC_MQPRIO)
        return -EOPNOTSUPP;
        
    mqprio->qopt.num_tc = 4;
    return 0;
}

// 在网络设备操作中添加TC设置函数
static const struct net_device_ops my_netdev_ops = {
    .ndo_open = my_netdev_open,
    .ndo_stop = my_netdev_close,
    .ndo_start_xmit = my_netdev_start_xmit,
    .ndo_set_mac_address = my_netdev_set_mac_address,
    .ndo_get_stats = my_netdev_get_stats,
    .ndo_setup_tc = my_netdev_setup_tc,  // 添加这一行
};
```

## 调试技巧

### 1. 使用netconsole进行远程调试

```bash
# 加载netconsole模块
modprobe netconsole netconsole=@/eth0,@192.168.1.100/

# 查看内核日志
dmesg | tail -f
```

### 2. 使用tcpdump抓包分析

```bash
# 抓取特定接口的数据包
tcpdump -i mynet0 -nn -vv

# 抓取特定协议的数据包
tcpdump -i mynet0 tcp port 80
```

### 3. 内核调试输出

```c
#define DEBUG
#ifdef DEBUG
#define net_dbg(fmt, ...) \
    printk(KERN_DEBUG "my_net: %s:%d: " fmt, __func__, __LINE__, ##__VA_ARGS__)
#else
#define net_dbg(fmt, ...)
#endif

// 在关键位置添加调试信息
net_dbg("Sending packet: len=%d, queue=%d\n", skb->len, skb_get_queue_mapping(skb));
```

### 4. 使用dynamic debug

```c
#define dy_dbg(fmt, ...) \
    dynamic_pr_debug("my_net: " fmt, ##__VA_ARGS__)

// 启用动态调试
// echo 'file my_netdev_driver.c +p' > /sys/kernel/debug/dynamic_debug/control
```

## 性能优化建议

1. **NAPI轮询**：使用NAPI减少中断负载，提高高负载下的性能
2. **多队列支持**：利用多CPU核心并行处理网络数据包
3. **零拷贝技术**：尽量减少数据包在内存中的拷贝次数
4. **缓冲区管理**：预分配skb缓冲区，避免动态分配的开销
5. **中断绑定**：将网络中断绑定到特定CPU核心，提高缓存命中率

## 最佳实践

1. **错误处理**：确保在每个可能失败的步骤都有适当的错误处理
2. **资源管理**：正确分配和释放所有内核资源，包括中断、内存和设备
3. **并发保护**：使用适当的锁机制保护共享数据，特别是在SMP环境下
4. **内存安全**：正确处理skb的分配和释放，避免内存泄漏
5. **兼容性**：遵循内核API规范，确保代码在不同内核版本间的兼容性
6. **电源管理**：实现适当的电源管理回调函数，支持系统休眠和唤醒