---
title: CAN驱动实现
description: CAN驱动的核心数据结构、API接口和实现细节详解
---

# CAN驱动实现

CAN（Controller Area Network）是一种串行通信总线，广泛应用于汽车电子、工业自动化和嵌入式系统领域。Linux内核提供了完整的CAN子系统框架（SocketCAN），使得开发者可以方便地实现CAN设备驱动。本章将详细介绍CAN驱动的核心数据结构、API接口和实现细节。

## CAN驱动概述

CAN总线的主要特点：
1. **多主架构**：支持多个节点同时作为主节点发送数据
2. **优先级仲裁**：通过标识符实现数据帧的优先级仲裁
3. **错误检测与恢复**：具备强大的错误检测和自动恢复机制
4. **长距离通信**：支持长达数公里的通信距离
5. **实时性**：适用于实时控制系统
6. **抗干扰能力强**：差分信号传输，抗电磁干扰能力强

Linux CAN子系统架构：
- **CAN核心**：提供核心功能和API接口
- **CAN总线驱动**：负责管理物理CAN控制器硬件
- **SocketCAN接口**：提供类似网络套接字的用户空间接口
- **CAN协议驱动**：实现各种CAN高层协议（如CANopen、J1939等）

## 核心数据结构

### 1. CAN设备结构体

`struct net_device`是网络设备的通用结构体，CAN设备也使用这个结构体：

```c
struct net_device {
    char name[IFNAMSIZ];        // 设备名称
    unsigned long mem_start;    // 设备内存起始地址
    unsigned long mem_end;      // 设备内存结束地址
    int base_addr;              // I/O基地址
    int irq;                    // 中断号
    unsigned char if_port;      // 接口类型
    unsigned char dma;          // DMA通道
    unsigned long state;        // 设备状态
    struct net_device_stats stats; // 设备统计信息
    const struct net_device_ops *netdev_ops; // 网络设备操作函数
    const struct ethtool_ops *ethtool_ops;   // ethtool操作函数
    unsigned int flags;         // 设备标志
    // ... 其他字段
};
```

### 2. CAN私有数据结构体

CAN设备驱动通常定义一个私有数据结构体，包含CAN特定的信息：

```c
struct can_priv {
    struct net_device *dev;     // 网络设备指针
    struct can_bittiming_const bittiming_const; // 位时序约束
    struct can_bittiming bittiming; // 当前位时序
    struct can_clock clock;     // 时钟信息
    struct can_berr_counter bec; // 总线错误计数器
    unsigned int echo_skb_max;  // 回显skb最大数量
    struct sk_buff *echo_skb[CAN_ECHO_SKB_MAX]; // 回显skb数组
    int echo_idx;               // 回显索引
    struct napi_struct napi;    // NAPI结构
    unsigned int restart_ms;    // 自动重启延迟（毫秒）
    unsigned int controller_mode; // 控制器模式
    unsigned int ctrlmode;      // 控制模式
    unsigned int can_stats_err_mask; // CAN统计错误掩码
    struct work_struct restart_work; // 重启工作队列
    struct work_struct tx_work; // 发送工作队列
    struct sk_buff_head tx_queue; // 发送队列
    struct sk_buff_head rx_queue; // 接收队列
    spinlock_t tx_queue_lock;   // 发送队列锁
    spinlock_t rx_queue_lock;   // 接收队列锁
    // ... 其他字段
};
```

### 3. CAN帧结构体

`struct can_frame`定义了CAN数据帧的格式：

```c
struct can_frame {
    canid_t can_id;             // CAN标识符
#define CAN_EFF_FLAG 0x80000000U // 扩展帧标志
#define CAN_RTR_FLAG 0x40000000U // 远程传输请求标志
#define CAN_ERR_FLAG 0x20000000U // 错误帧标志
#define CAN_SFF_MASK 0x000007FFU // 标准帧ID掩码
#define CAN_EFF_MASK 0x1FFFFFFFU // 扩展帧ID掩码
    __u8 can_dlc;               // 数据长度码（0-8）
    __u8 __pad;                 // 填充字节
    __u8 __res0;                // 保留字节
    __u8 __res1;                // 保留字节
    __u8 data[8];               // 数据字段
};
```

### 4. CAN错误帧结构体

`struct can_berr_counter`定义了CAN总线错误计数器：

```c
struct can_berr_counter {
    __u16 txerr;                // 发送错误计数器
    __u16 rxerr;                // 接收错误计数器
};
```

### 5. CAN位时序结构体

`struct can_bittiming`定义了CAN总线的位时序：

```c
struct can_bittiming {
    __u32 bitrate;              // 位速率（bits/s）
    __u32 sample_point;         // 采样点位置（1/1000）
    __u32 tq;                   // 时间量子长度（ns）
    __u32 prop_seg;             // 传播段长度（tq）
    __u32 phase_seg1;           // 相位段1长度（tq）
    __u32 phase_seg2;           // 相位段2长度（tq）
    __u32 sjw;                  // 同步跳转宽度（tq）
    __u32 brp;                  // 波特率预分频器
};
```

### 6. CAN位时序约束结构体

`struct can_bittiming_const`定义了CAN控制器支持的位时序约束：

```c
struct can_bittiming_const {
    char name[16];              // 约束名称
    __u32 tseg1_min;            // 最小tseg1值
    __u32 tseg1_max;            // 最大tseg1值
    __u32 tseg2_min;            // 最小tseg2值
    __u32 tseg2_max;            // 最大tseg2值
    __u32 sjw_max;              // 最大sjw值
    __u32 brp_min;              // 最小brp值
    __u32 brp_max;              // 最大brp值
    __u32 brp_inc;              // brp增量
    __u32 clock_freq;           // 控制器时钟频率（Hz）
};
```

## 核心API接口

### 1. CAN设备注册与注销

```c
// 注册CAN网络设备
int register_netdev(struct net_device *dev);

// 注销CAN网络设备
void unregister_netdev(struct net_device *dev);

// 分配CAN网络设备
struct net_device *alloc_candev(int sizeof_priv, unsigned int echo_skb_max);

// 释放CAN网络设备
void free_candev(struct net_device *dev);
```

### 2. CAN帧处理

```c
// 发送CAN帧
int can_send(struct sk_buff *skb, int flags);

// 接收CAN帧
struct sk_buff *alloc_can_skb(struct net_device *dev, struct can_frame **cf);
void can_put_echo_skb(struct sk_buff *skb, struct net_device *dev, int idx);

// 处理CAN错误
void can_error(struct net_device *dev, const struct can_frame *cf);
```

### 3. CAN位时序配置

```c
// 计算CAN位时序
int can_calc_bittiming(struct net_device *dev, struct can_bittiming *bt);

// 设置CAN位时序
int can_set_bittiming(struct net_device *dev);

// 自动配置CAN位时序
int can_auto_set_bittiming(struct net_device *dev);
```

### 4. CAN控制器模式配置

```c
// 设置CAN控制器模式
int can_change_mode(struct net_device *dev, unsigned int mode);

// 检查CAN控制器模式支持
int can_check_mode(struct net_device *dev, unsigned int mode);
```

### 5. CAN中断与NAPI

```c
// 启用NAPI
void napi_enable(struct napi_struct *n);

// 禁用NAPI
void napi_disable(struct napi_struct *n);

// 调度NAPI
void napi_schedule(struct napi_struct *n);

// NAPI轮询完成
int napi_complete(struct napi_struct *n);
```

## CAN设备驱动实现示例

### 1. 驱动模块初始化

```c
#include <linux/init.h>
#include <linux/module.h>
#include <linux/netdevice.h>
#include <linux/can.h>
#include <linux/can/dev.h>
#include <linux/can/error.h>
#include <linux/io.h>
#include <linux/irq.h>
#include <linux/delay.h>

#define CAN_DEVICE_NAME "can0"
#define CAN_IRQ_NUM     42          // 假设CAN控制器使用IRQ 42
#define CAN_BASE_ADDR   0x1000      // 假设CAN控制器I/O基地址为0x1000
#define CAN_CLOCK_FREQ  24000000    // CAN控制器时钟频率为24MHz

// CAN控制器寄存器定义
#define CAN_REG_CTRL    0x00        // 控制寄存器
#define CAN_REG_STATUS  0x04        // 状态寄存器
#define CAN_REG_INT     0x08        // 中断寄存器
#define CAN_REG_BTR     0x0C        // 波特率寄存器
#define CAN_REG_DATA    0x10        // 数据寄存器
#define CAN_REG_ID      0x14        // 标识符寄存器

// CAN私有数据结构体
struct can_priv_data {
    struct net_device *dev;     // 网络设备指针
    void __iomem *base;         // 映射后的I/O基地址
    int irq;                    // 中断号
    struct can_bittiming_const bittiming_const; // 位时序约束
    struct can_priv can;        // CAN私有数据
    struct napi_struct napi;    // NAPI结构
    struct sk_buff_head tx_queue; // 发送队列
    spinlock_t tx_queue_lock;   // 发送队列锁
};

// CAN设备实例
static struct can_priv_data *can_dev_priv;
```

### 2. CAN设备操作函数

```c
// 打开CAN设备
static int can_open(struct net_device *dev)
{
    struct can_priv_data *priv = netdev_priv(dev);
    int ret;

    // 申请中断
    ret = request_irq(priv->irq, can_interrupt, IRQF_SHARED, dev->name, dev);
    if (ret < 0) {
        netdev_err(dev, "Failed to request IRQ %d\n", priv->irq);
        return ret;
    }

    // 启用CAN控制器
    writel(0x01, priv->base + CAN_REG_CTRL);
    msleep(10);

    // 启用NAPI
    napi_enable(&priv->napi);

    // 启用中断
    writel(0x0F, priv->base + CAN_REG_INT); // 启用接收、发送、错误和状态中断

    return 0;
}

// 关闭CAN设备
static int can_stop(struct net_device *dev)
{
    struct can_priv_data *priv = netdev_priv(dev);

    // 禁用中断
    writel(0x00, priv->base + CAN_REG_INT);

    // 禁用NAPI
    napi_disable(&priv->napi);

    // 禁用CAN控制器
    writel(0x00, priv->base + CAN_REG_CTRL);

    // 释放中断
    free_irq(priv->irq, dev);

    return 0;
}

// 启动CAN设备队列
static int can_start_xmit(struct sk_buff *skb, struct net_device *dev)
{
    struct can_priv_data *priv = netdev_priv(dev);
    struct can_frame *cf = (struct can_frame *)skb->data;
    unsigned long flags;

    // 检查帧长度
    if (skb->len != sizeof(struct can_frame)) {
        dev_kfree_skb(skb);
        return NETDEV_TX_OK;
    }

    // 检查CAN控制器是否可以发送
    if (!(readl(priv->base + CAN_REG_STATUS) & 0x02)) {
        // 发送队列已满，将帧加入发送队列
        spin_lock_irqsave(&priv->tx_queue_lock, flags);
        if (skb_queue_len(&priv->tx_queue) < 10) {
            skb_queue_tail(&priv->tx_queue, skb);
            spin_unlock_irqrestore(&priv->tx_queue_lock, flags);
            return NETDEV_TX_BUSY;
        }
        spin_unlock_irqrestore(&priv->tx_queue_lock, flags);

        // 发送队列已满，丢弃帧
        dev_kfree_skb(skb);
        dev->stats.tx_dropped++;
        return NETDEV_TX_OK;
    }

    // 发送CAN帧
    can_transmit_frame(priv, cf);

    // 保存回显帧
    can_put_echo_skb(skb, dev, 0);

    // 更新统计信息
    dev->stats.tx_packets++;
    dev->stats.tx_bytes += cf->can_dlc;

    return NETDEV_TX_OK;
}

// CAN设备NAPI轮询函数
static int can_poll(struct napi_struct *napi, int budget)
{
    struct can_priv_data *priv = container_of(napi, struct can_priv_data, napi);
    struct net_device *dev = priv->dev;
    int work_done = 0;

    // 处理接收的CAN帧
    while (work_done < budget && (readl(priv->base + CAN_REG_STATUS) & 0x01)) {
        struct sk_buff *skb = alloc_can_skb(dev, NULL);
        if (!skb) {
            dev->stats.rx_dropped++;
            break;
        }

        struct can_frame *cf = (struct can_frame *)skb->data;
        
        // 从硬件读取CAN帧
        can_receive_frame(priv, cf);

        // 设置帧长度
        skb->len = sizeof(struct can_frame);
        skb->protocol = htons(ETH_P_CAN);

        // 提交接收帧
        netif_receive_skb(skb);
        dev->stats.rx_packets++;
        dev->stats.rx_bytes += cf->can_dlc;
        work_done++;
    }

    // 如果没有更多工作要做，退出NAPI
    if (work_done < budget) {
        napi_complete(napi);
        // 重新启用中断
        writel(0x0F, priv->base + CAN_REG_INT);
    }

    return work_done;
}

// 设置CAN网络设备参数
static int can_set_config(struct net_device *dev, struct ifreq *ifr)
{
    struct can_priv_data *priv = netdev_priv(dev);
    int ret;

    // 处理CAN设备配置
    ret = can_do_set_bittiming(dev, ifr);
    if (ret < 0)
        return ret;

    ret = can_do_set_bitrate(dev, ifr);
    if (ret < 0)
        return ret;

    ret = can_do_set_mode(dev, ifr);
    if (ret < 0)
        return ret;

    return 0;
}

// 获取CAN网络设备参数
static int can_get_config(struct net_device *dev, struct ifreq *ifr)
{
    return can_do_get_bittiming(dev, ifr);
}

// CAN网络设备操作函数结构体
static const struct net_device_ops can_netdev_ops = {
    .ndo_open = can_open,
    .ndo_stop = can_stop,
    .ndo_start_xmit = can_start_xmit,
    .ndo_set_config = can_set_config,
    .ndo_get_config = can_get_config,
};
```

### 3. CAN中断处理函数

```c
// CAN中断处理函数
static irqreturn_t can_interrupt(int irq, void *dev_id)
{
    struct net_device *dev = dev_id;
    struct can_priv_data *priv = netdev_priv(dev);
    u32 int_status, status;

    // 读取中断状态
    int_status = readl(priv->base + CAN_REG_INT);
    status = readl(priv->base + CAN_REG_STATUS);

    // 处理接收中断
    if (int_status & 0x01 && (status & 0x01)) {
        // 禁用接收中断
        writel(0x0E, priv->base + CAN_REG_INT);
        
        // 调度NAPI
        napi_schedule(&priv->napi);
    }

    // 处理发送完成中断
    if (int_status & 0x02 && (status & 0x04)) {
        struct sk_buff *skb;
        unsigned long flags;

        // 处理发送队列中的下一个帧
        spin_lock_irqsave(&priv->tx_queue_lock, flags);
        skb = skb_dequeue(&priv->tx_queue);
        spin_unlock_irqrestore(&priv->tx_queue_lock, flags);

        if (skb) {
            struct can_frame *cf = (struct can_frame *)skb->data;
            
            // 发送CAN帧
            can_transmit_frame(priv, cf);

            // 保存回显帧
            can_put_echo_skb(skb, dev, 0);

            // 更新统计信息
            dev->stats.tx_packets++;
            dev->stats.tx_bytes += cf->can_dlc;
        }
    }

    // 处理错误中断
    if (int_status & 0x04) {
        // 读取错误状态并处理
        u32 error = readl(priv->base + CAN_REG_STATUS);
        struct can_frame cf = {
            .can_id = CAN_ERR_FLAG | CAN_ERR_CRTL,
            .can_dlc = 8,
        };
        
        // 设置错误信息
        cf.data[0] = error;
        can_error(dev, &cf);
    }

    return IRQ_HANDLED;
}

// 从CAN硬件接收帧
static void can_receive_frame(struct can_priv_data *priv, struct can_frame *cf)
{
    u32 id_reg, data_reg;
    
    // 读取标识符寄存器
    id_reg = readl(priv->base + CAN_REG_ID);
    
    // 设置CAN帧标识符
    if (id_reg & 0x80000000) {
        // 扩展帧
        cf->can_id = CAN_EFF_FLAG | (id_reg & 0x1FFFFFFF);
    } else {
        // 标准帧
        cf->can_id = id_reg & 0x7FF;
    }
    
    // 检查是否为远程帧
    if (id_reg & 0x40000000) {
        cf->can_id |= CAN_RTR_FLAG;
    }
    
    // 读取数据长度
    cf->can_dlc = (id_reg >> 16) & 0x0F;
    
    // 读取数据
    data_reg = readl(priv->base + CAN_REG_DATA);
    cf->data[0] = (data_reg >> 0) & 0xFF;
    cf->data[1] = (data_reg >> 8) & 0xFF;
    cf->data[2] = (data_reg >> 16) & 0xFF;
    cf->data[3] = (data_reg >> 24) & 0xFF;
    
    if (cf->can_dlc > 4) {
        data_reg = readl(priv->base + CAN_REG_DATA + 4);
        cf->data[4] = (data_reg >> 0) & 0xFF;
        cf->data[5] = (data_reg >> 8) & 0xFF;
        cf->data[6] = (data_reg >> 16) & 0xFF;
        cf->data[7] = (data_reg >> 24) & 0xFF;
    }
}

// 向CAN硬件发送帧
static void can_transmit_frame(struct can_priv_data *priv, struct can_frame *cf)
{
    u32 id_reg = 0, data_reg = 0;
    
    // 设置标识符
    if (cf->can_id & CAN_EFF_FLAG) {
        // 扩展帧
        id_reg = CAN_EFF_FLAG | (cf->can_id & CAN_EFF_MASK);
    } else {
        // 标准帧
        id_reg = cf->can_id & CAN_SFF_MASK;
    }
    
    // 设置远程帧标志
    if (cf->can_id & CAN_RTR_FLAG) {
        id_reg |= CAN_RTR_FLAG;
    }
    
    // 设置数据长度
    id_reg |= (cf->can_dlc & 0x0F) << 16;
    
    // 写入标识符寄存器
    writel(id_reg, priv->base + CAN_REG_ID);
    
    // 写入数据
    data_reg = (cf->data[0] << 0) | (cf->data[1] << 8) |
               (cf->data[2] << 16) | (cf->data[3] << 24);
    writel(data_reg, priv->base + CAN_REG_DATA);
    
    if (cf->can_dlc > 4) {
        data_reg = (cf->data[4] << 0) | (cf->data[5] << 8) |
                   (cf->data[6] << 16) | (cf->data[7] << 24);
        writel(data_reg, priv->base + CAN_REG_DATA + 4);
    }
    
    // 启动发送
    writel(0x02, priv->base + CAN_REG_CTRL);
}
```

### 4. CAN设备初始化与清理

```c
// 初始化CAN位时序约束
static void can_init_bittiming_const(struct can_priv_data *priv)
{
    struct can_bittiming_const *btc = &priv->bittiming_const;
    
    strcpy(btc->name, "can_example");
    btc->tseg1_min = 1;
    btc->tseg1_max = 16;
    btc->tseg2_min = 1;
    btc->tseg2_max = 8;
    btc->sjw_max = 4;
    btc->brp_min = 1;
    btc->brp_max = 128;
    btc->brp_inc = 1;
    btc->clock_freq = CAN_CLOCK_FREQ;
}

// 初始化CAN设备
static struct net_device *can_init_dev(void)
{
    struct net_device *dev;
    struct can_priv_data *priv;
    
    // 分配CAN网络设备
    dev = alloc_candev(sizeof(struct can_priv_data), 1);
    if (!dev) {
        pr_err("Failed to allocate CAN device\n");
        return NULL;
    }
    
    priv = netdev_priv(dev);
    priv->dev = dev;
    priv->irq = CAN_IRQ_NUM;
    
    // 映射I/O基地址
    priv->base = ioremap(CAN_BASE_ADDR, 0x20);
    if (!priv->base) {
        pr_err("Failed to ioremap CAN base address\n");
        free_candev(dev);
        return NULL;
    }
    
    // 初始化CAN位时序约束
    can_init_bittiming_const(priv);
    
    // 初始化CAN私有数据
    priv->can.bittiming_const = &priv->bittiming_const;
    priv->can.clock.freq = CAN_CLOCK_FREQ;
    
    // 设置网络设备操作函数
    dev->netdev_ops = &can_netdev_ops;
    
    // 设置设备名称
    strcpy(dev->name, CAN_DEVICE_NAME);
    
    // 初始化NAPI
    netif_napi_add(dev, &priv->napi, can_poll, 64);
    
    // 初始化发送队列
    skb_queue_head_init(&priv->tx_queue);
    spin_lock_init(&priv->tx_queue_lock);
    
    return dev;
}

// 清理CAN设备
static void can_cleanup_dev(struct net_device *dev)
{
    struct can_priv_data *priv = netdev_priv(dev);
    
    // 释放I/O映射
    iounmap(priv->base);
    
    // 释放网络设备
    free_candev(dev);
}
```

### 5. 模块初始化与退出

```c
// 模块初始化函数
static int __init can_driver_init(void)
{
    int ret;
    
    // 初始化CAN设备
    can_dev_priv = netdev_priv(can_init_dev());
    if (!can_dev_priv) {
        return -ENOMEM;
    }
    
    // 注册CAN网络设备
    ret = register_netdev(can_dev_priv->dev);
    if (ret < 0) {
        pr_err("Failed to register CAN device\n");
        can_cleanup_dev(can_dev_priv->dev);
        return ret;
    }
    
    pr_info("CAN driver initialized successfully\n");
    return 0;
}

// 模块退出函数
static void __exit can_driver_exit(void)
{
    // 注销CAN网络设备
    unregister_netdev(can_dev_priv->dev);
    
    // 清理CAN设备
    can_cleanup_dev(can_dev_priv->dev);
    
    pr_info("CAN driver exited\n");
}

module_init(can_driver_init);
module_exit(can_driver_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Linux Driver Developer");
MODULE_DESCRIPTION("CAN Example Driver");
MODULE_VERSION("1.0");
```

## CAN错误处理

CAN驱动需要处理各种错误情况，包括：

### 1. 总线错误处理

```c
// 处理CAN总线错误
static void can_handle_bus_error(struct can_priv_data *priv)
{
    struct net_device *dev = priv->dev;
    u32 error_status = readl(priv->base + CAN_REG_STATUS);
    
    // 更新错误计数器
    if (error_status & 0x10) {
        dev->stats.tx_errors++;
    }
    
    if (error_status & 0x20) {
        dev->stats.rx_errors++;
    }
    
    // 发送错误帧
    struct can_frame cf = {
        .can_id = CAN_ERR_FLAG | CAN_ERR_PROT,
        .can_dlc = 8,
        .data = { error_status, 0, 0, 0, 0, 0, 0, 0 }
    };
    
    can_error(dev, &cf);
}
```

### 2. 超时处理

```c
// CAN发送超时处理
static void can_tx_timeout(struct net_device *dev)
{
    struct can_priv_data *priv = netdev_priv(dev);
    
    // 重置CAN控制器
    writel(0x00, priv->base + CAN_REG_CTRL);
    msleep(10);
    writel(0x01, priv->base + CAN_REG_CTRL);
    msleep(10);
    
    // 重新启用中断
    writel(0x0F, priv->base + CAN_REG_INT);
    
    // 重置发送队列
    spin_lock_bh(&priv->tx_queue_lock);
    while (!skb_queue_empty(&priv->tx_queue)) {
        struct sk_buff *skb = skb_dequeue(&priv->tx_queue);
        dev_kfree_skb(skb);
        dev->stats.tx_dropped++;
    }
    spin_unlock_bh(&priv->tx_queue_lock);
    
    netif_wake_queue(dev);
    
    netdev_warn(dev, "CAN TX timeout occurred\n");
}
```

## CAN设备的用户空间接口

通过SocketCAN，用户空间可以使用标准的套接字接口访问CAN设备：

### 1. 基本CAN套接字操作

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <net/if.h>
#include <sys/ioctl.h>
#include <sys/socket.h>
#include <linux/can.h>
#include <linux/can/raw.h>

int main(void)
{
    int s;
    struct sockaddr_can addr;
    struct ifreq ifr;
    struct can_frame frame;
    
    // 创建CAN套接字
    s = socket(PF_CAN, SOCK_RAW, CAN_RAW);
    if (s < 0) {
        perror("socket");
        return 1;
    }
    
    // 指定CAN接口
    strcpy(ifr.ifr_name, "can0");
    ioctl(s, SIOCGIFINDEX, &ifr);
    
    // 绑定CAN接口
    addr.can_family = AF_CAN;
    addr.can_ifindex = ifr.ifr_ifindex;
    bind(s, (struct sockaddr *)&addr, sizeof(addr));
    
    // 发送CAN帧
    frame.can_id = 0x123;
    frame.can_dlc = 2;
    frame.data[0] = 0x11;
    frame.data[1] = 0x22;
    write(s, &frame, sizeof(frame));
    
    // 接收CAN帧
    read(s, &frame, sizeof(frame));
    printf("Received CAN frame: ID=0x%X, DLC=%d, Data=0x%02X 0x%02X\n",
           frame.can_id, frame.can_dlc, frame.data[0], frame.data[1]);
    
    close(s);
    return 0;
}
```

### 2. CAN过滤器配置

```c
// 配置CAN过滤器
struct can_filter rfilter;
rfilter.can_id = 0x123;
rfilter.can_mask = CAN_SFF_MASK; // 只接收ID为0x123的标准帧

// 设置过滤器
int nfilters = 1;
if (setsockopt(s, SOL_CAN_RAW, CAN_RAW_FILTER, &rfilter, sizeof(rfilter)) < 0) {
    perror("setsockopt");
    return 1;
}
```

## 高级CAN功能

### 1. CAN FD支持

CAN FD（Flexible Data-Rate）是CAN总线的扩展，支持更高的数据传输速率和更长的数据帧。Linux内核从3.6版本开始支持CAN FD：

```c
// 启用CAN FD模式
int enable_fd = 1;
if (setsockopt(s, SOL_CAN_RAW, CAN_RAW_FD_FRAMES, &enable_fd, sizeof(enable_fd)) < 0) {
    perror("setsockopt CAN_RAW_FD_FRAMES");
    return 1;
}

// 发送CAN FD帧
struct canfd_frame frame;
frame.can_id = 0x123;
frame.len = 16; // CAN FD支持最多64字节数据
frame.data[0] = 0x11;
// ... 设置其他数据字节
write(s, &frame, sizeof(frame));
```

### 2. CAN错误帧监控

```c
// 启用错误帧监控
int enable_err = 1;
if (setsockopt(s, SOL_CAN_RAW, CAN_RAW_ERR_FILTER, &enable_err, sizeof(enable_err)) < 0) {
    perror("setsockopt CAN_RAW_ERR_FILTER");
    return 1;
}

// 接收错误帧
struct can_frame err_frame;
read(s, &err_frame, sizeof(err_frame));
if (err_frame.can_id & CAN_ERR_FLAG) {
    printf("CAN error occurred: 0x%X\n", err_frame.can_id);
}
```

## 最佳实践

1. **使用NAPI**：对于高速CAN控制器，使用NAPI可以提高中断处理效率
2. **错误检测与恢复**：实现完善的错误检测和自动恢复机制
3. **位时序配置**：提供灵活的位时序配置选项，支持多种波特率
4. **资源管理**：正确管理内存、中断、DMA等资源
5. **性能优化**：
   - 使用环形缓冲区提高数据传输效率
   - 批量处理接收和发送的CAN帧
   - 减少中断延迟
6. **调试信息**：
   - 使用dev_dbg()提供详细的调试信息
   - 实现sysfs接口用于运行时配置和状态查询
7. **标准兼容性**：
   - 遵循SocketCAN接口标准
   - 支持CAN FD等扩展功能
   - 实现标准的网络设备操作函数

## 总结

CAN驱动实现主要包括以下步骤：
1. 定义CAN私有数据结构体和网络设备操作函数
2. 实现CAN设备的打开、关闭和数据传输功能
3. 实现中断处理和NAPI轮询机制
4. 处理CAN帧的接收和发送
5. 实现错误处理和恢复机制
6. 配置CAN位时序和控制器参数
7. 注册和注销CAN网络设备

通过Linux CAN子系统提供的API接口，开发者可以方便地实现各种CAN设备驱动，支持从低速传感器到高速控制单元等多种CAN设备。SocketCAN接口使得用户空间程序可以像使用网络套接字一样方便地访问CAN设备，大大简化了CAN应用程序的开发。