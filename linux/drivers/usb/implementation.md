---
title: USB驱动实现
description: USB驱动的核心数据结构、API接口和实现细节详解
---

# USB驱动实现

USB（Universal Serial Bus）是一种广泛使用的串行总线标准，用于连接各种外部设备，如键盘、鼠标、打印机、移动存储设备等。Linux内核提供了完整的USB子系统框架，使得开发者可以方便地实现USB设备驱动。本章将详细介绍USB驱动的核心数据结构、API接口和实现细节。

## USB驱动概述

USB总线的主要特点：
1. **即插即用**：支持设备的热插拔和自动配置
2. **统一接口**：为各种设备提供统一的连接接口
3. **分层架构**：由主机控制器、集线器和设备组成的树形结构
4. **多种传输类型**：支持控制传输、批量传输、中断传输和等时传输
5. **供电能力**：可为设备提供5V电源，最大电流可达500mA
6. **高速传输**：支持USB 1.1（12 Mbps）、USB 2.0（480 Mbps）、USB 3.0（5 Gbps）、USB 3.1（10 Gbps）和USB 4（40 Gbps）

Linux USB子系统架构：
- **USB核心**：提供核心功能和API接口
- **USB主机控制器驱动（HCD）**：负责管理USB主机控制器硬件
- **USB设备驱动**：实现具体设备的功能
- **USB设备文件系统**：提供用户空间访问USB设备的接口
- **USB协议栈**：实现USB协议的各个层次

## 核心数据结构

### 1. USB设备结构体

`struct usb_device`是USB设备的核心结构体：

```c
struct usb_device {
    int devnum;                 // 设备编号
    char devpath[16];           // 设备路径
    enum usb_device_state state; // 设备状态
    enum usb_device_speed speed; // 设备速度
    struct usb_tt *tt;          // 事务翻译器指针
    int ttport;                 // 事务翻译器端口
    struct usb_device *parent;  // 父设备（集线器）
    struct usb_bus *bus;        // 所属总线
    struct usb_host_endpoint ep0; // 端点0
    struct device dev;          // 设备模型设备
    struct usb_device_descriptor descriptor; // 设备描述符
    struct usb_host_config *config; // 配置数组
    struct usb_host_config *actconfig; // 当前激活配置
    struct usb_host_endpoint *ep_in[16]; // 输入端点数组
    struct usb_host_endpoint *ep_out[16]; // 输出端点数组
    char **rawdescriptors;      // 原始描述符数组
    unsigned short bus_mA;      // 总线提供的最大电流
    u8 portnum;                 // 端口号
    u8 level;                   // 设备在总线拓扑中的级别
    unsigned can_submit:1;      // 是否可以提交URB
    unsigned persist_enabled:1; // 是否启用持久化
    unsigned have_langid:1;     // 是否有语言ID
    unsigned authorized:1;      // 是否授权
    unsigned authenticated:1;   // 是否认证
    unsigned wusb:1;            // 是否为WUSB设备
    unsigned lpm_capable:1;     // 是否支持LPM
    unsigned usb3_lpm_u1_enabled:1; // 是否启用USB 3.0 LPM U1
    unsigned usb3_lpm_u2_enabled:1; // 是否启用USB 3.0 LPM U2
    int string_langid;          // 字符串语言ID
    /* static strings from the device */
    char *product;              // 产品名称
    char *manufacturer;         // 厂商名称
    char *serial;               // 序列号
    struct list_head filelist;  // 文件列表
    struct usb_bus *bus;        // 所属总线
    struct dentry *debug_dir;   // 调试目录
    struct usb_hcd *hcd;        // 主机控制器驱动
    struct list_head configs;   // 配置列表
    int pm_usage_cnt;           // 电源管理使用计数
    struct mutex pm_mutex;      // 电源管理互斥锁
    struct mutex udev_mutex;    // 设备互斥锁
    // ... 其他字段
};
```

### 2. USB驱动结构体

`struct usb_driver`定义了USB驱动的操作函数和设备ID表：

```c
struct usb_driver {
    const char *name;           // 驱动名称
    int (*probe) (struct usb_interface *intf, const struct usb_device_id *id); // 探测函数
    void (*disconnect) (struct usb_interface *intf); // 断开函数
    int (*unlocked_ioctl) (struct usb_interface *intf, unsigned int code, void *buf); // IO控制函数
    int (*suspend) (struct usb_interface *intf, pm_message_t message); // 挂起函数
    int (*resume) (struct usb_interface *intf); // 恢复函数
    int (*reset_resume) (struct usb_interface *intf); // 重置恢复函数
    int (*pre_reset) (struct usb_interface *intf); // 重置前函数
    int (*post_reset) (struct usb_interface *intf); // 重置后函数
    const struct usb_device_id *id_table; // 设备ID表
    struct usb_dynids dynids;   // 动态设备ID
    struct usbdrv_wrap drvwrap; // 驱动包装器
    unsigned int no_dynamic_id:1; // 禁止动态ID
    unsigned int supports_autosuspend:1; // 支持自动挂起
    unsigned int soft_unbind:1; // 软解绑
    // ... 其他字段
};
```

### 3. USB设备ID表

`struct usb_device_id`定义了驱动支持的设备ID：

```c
struct usb_device_id {
    /* 匹配设备的标志 */
    __u16 match_flags;

    /* 用于匹配的特定值 */
    __u16 idVendor;             // 厂商ID
    __u16 idProduct;            // 产品ID
    __u16 bcdDevice_lo;         // 设备版本号下限
    __u16 bcdDevice_hi;         // 设备版本号上限

    /* 用于匹配的设备类、子类和协议 */
    __u8 bDeviceClass;          // 设备类
    __u8 bDeviceSubClass;       // 设备子类
    __u8 bDeviceProtocol;       // 设备协议

    /* 用于匹配的接口类、子类和协议 */
    __u8 bInterfaceClass;       // 接口类
    __u8 bInterfaceSubClass;    // 接口子类
    __u8 bInterfaceProtocol;    // 接口协议

    /* 驱动私有数据 */
    kernel_ulong_t driver_info;
};
```

### 4. USB接口结构体

`struct usb_interface`定义了USB设备的接口：

```c
struct usb_interface {
    struct usb_host_interface *altsetting; // 备用设置数组
    struct usb_host_interface *cur_altsetting; // 当前备用设置
    unsigned num_altsetting;    // 备用设置数量
    struct usb_device *dev;     // 所属设备
    int minor;                  // 次设备号
    enum usb_interface_condition condition; // 接口条件
    unsigned sysfs_files_created:1; // 是否已创建sysfs文件
    unsigned ep_devs_created:1; // 是否已创建端点设备
    unsigned unregistering:1;   // 是否正在注销
    unsigned needs_remote_wakeup:1; // 是否需要远程唤醒
    unsigned needs_altsetting0:1; // 是否需要备用设置0
    unsigned needs_binding:1;   // 是否需要绑定
    unsigned reset_running:1;   // 是否正在重置
    unsigned resetting_device:1; // 是否正在重置设备
    struct device dev;          // 设备模型设备
    struct device *usb_dev;     // USB设备
    atomic_t pm_usage_cnt;      // 电源管理使用计数
    struct work_struct reset_ws; // 重置工作队列
    struct mutex mutex;         // 接口互斥锁
    struct usb_driver *driver;  // 驱动指针
    struct list_head filelist;  // 文件列表
    struct usb_interface_cache *cache; // 接口缓存
    // ... 其他字段
};
```

### 5. USB端点结构体

`struct usb_host_endpoint`定义了USB端点：

```c
struct usb_host_endpoint {
    struct usb_endpoint_descriptor desc; // 端点描述符
    struct usb_ss_ep_comp_descriptor ss_ep_comp; // 超级速度端点补充描述符
    struct usb_host_endpoint *companion; // 超级速度伴生端点
    struct list_head urb_list;  // URB列表
    void *hcpriv;               // 主机控制器私有数据
    struct ep_device *ep_dev;   // 端点设备
    unsigned char *extra;       // 额外描述符
    int extralen;               // 额外描述符长度
    int enabled;                // 是否启用
};```

### 6. USB请求块（URB）

`struct urb`是USB请求块，用于在USB设备和主机之间传输数据：

```c
struct urb {
    struct kref kref;           // 引用计数
    void *hcpriv;               // 主机控制器私有数据
    atomic_t use_count;         // 使用计数
    atomic_t reject;            // 拒绝计数
    int unlinked;               // 取消链接状态

    struct list_head urb_list;  // 用于将URB添加到端点的列表
    struct usb_device *dev;     // 目标设备
    struct usb_host_endpoint *ep; // 目标端点
    unsigned int pipe;          // 管道
    unsigned int stream_id;     // 流ID
    int status;                 // 状态
    unsigned int transfer_flags; // 传输标志
    void *transfer_buffer;      // 传输缓冲区
    dma_addr_t transfer_dma;    // 传输缓冲区DMA地址
    struct scatterlist *sg;     // 分散/聚集列表
    int num_mapped_sgs;         // 映射的SG条目数
    int num_sgs;                // SG条目数
    u32 transfer_buffer_length; // 传输缓冲区长度
    u32 actual_length;          // 实际传输长度
    unsigned char *setup_packet; // 设置包
    dma_addr_t setup_dma;       // 设置包DMA地址
    int start_frame;            // 起始帧
    int number_of_packets;      // 数据包数量
    int interval;               // 间隔
    int error_count;            // 错误计数
    void *context;              // 上下文
    urb_complete_t complete;    // 完成回调函数
    struct usb_iso_packet_descriptor iso_frame_desc[0]; // 等时帧描述符
};
```

### 7. USB接口描述符

`struct usb_host_interface`定义了USB接口的备用设置：

```c
struct usb_host_interface {
    struct usb_interface_descriptor desc; // 接口描述符
    struct usb_host_endpoint *endpoint; // 端点数组
    char *string;               // 接口字符串
    unsigned char *extra;       // 额外描述符
    int extralen;               // 额外描述符长度
    int num_altsetting;         // 备用设置数量
};
```

## 核心API接口

### 1. USB驱动注册与注销

```c
// 注册USB驱动
int usb_register_driver(struct usb_driver *driver, struct module *owner, const char *mod_name);

// 注销USB驱动
void usb_deregister(struct usb_driver *driver);

// 辅助宏定义
#define module_usb_driver(__usb_driver) \
    module_driver(__usb_driver, usb_register_driver, usb_deregister)
```

### 2. USB设备和接口操作

```c
// 获取USB设备
struct usb_device *interface_to_usbdev(struct usb_interface *intf);

// 获取USB设备的父设备
struct usb_device *usb_get_parent(struct usb_device *dev);

// 获取USB设备的速度
enum usb_device_speed usb_device_speed(struct usb_device *dev);

// 获取USB设备的描述符
struct usb_device_descriptor *usb_device_descriptor(struct usb_device *dev);

// 获取USB接口的备用设置
struct usb_host_interface *usb_altnum_to_altsetting(struct usb_interface *intf, unsigned int altnum);

// 获取USB接口的当前备用设置
struct usb_host_interface *usb_get_current_interface(struct usb_interface *intf);

// 设置USB接口的备用设置
int usb_set_interface(struct usb_device *dev, unsigned int interface, unsigned int alternate);
```

### 3. URB操作

```c
// 创建URB
struct urb *usb_alloc_urb(int iso_packets, gfp_t mem_flags);

// 释放URB
void usb_free_urb(struct urb *urb);

// 提交URB
int usb_submit_urb(struct urb *urb, gfp_t mem_flags);

// 取消URB
int usb_unlink_urb(struct urb *urb);

// 同步取消URB
int usb_kill_urb(struct urb *urb);

// 初始化控制传输URB
void usb_fill_control_urb(struct urb *urb, struct usb_device *dev, unsigned int pipe,
                          unsigned char *setup_packet, void *transfer_buffer,
                          int buffer_length, urb_complete_t complete, void *context);

// 初始化批量传输URB
void usb_fill_bulk_urb(struct urb *urb, struct usb_device *dev, unsigned int pipe,
                      void *transfer_buffer, int buffer_length,
                      urb_complete_t complete, void *context);

// 初始化中断传输URB
void usb_fill_int_urb(struct urb *urb, struct usb_device *dev, unsigned int pipe,
                     void *transfer_buffer, int buffer_length,
                     urb_complete_t complete, void *context, int interval);

// 初始化等时传输URB
void usb_fill_iso_urb(struct urb *urb, struct usb_device *dev, unsigned int pipe,
                     void *transfer_buffer, int buffer_length, int iso_packets,
                     urb_complete_t complete, void *context, int interval);
```

### 4. USB管道操作

```c
// 创建控制传输管道
unsigned int usb_sndctrlpipe(struct usb_device *dev, unsigned int endpoint);
unsigned int usb_rcvctrlpipe(struct usb_device *dev, unsigned int endpoint);

// 创建批量传输管道
unsigned int usb_sndbulkpipe(struct usb_device *dev, unsigned int endpoint);
unsigned int usb_rcvbulkpipe(struct usb_device *dev, unsigned int endpoint);

// 创建中断传输管道
unsigned int usb_sndintpipe(struct usb_device *dev, unsigned int endpoint);
unsigned int usb_rcvintpipe(struct usb_device *dev, unsigned int endpoint);

// 创建等时传输管道
unsigned int usb_sndisocpipe(struct usb_device *dev, unsigned int endpoint);
unsigned int usb_rcvisocpipe(struct usb_device *dev, unsigned int endpoint);

// 从管道获取端点号
unsigned int usb_pipeendpoint(unsigned int pipe);

// 从管道获取方向
unsigned int usb_pipein(unsigned int pipe);
unsigned int usb_pipeout(unsigned int pipe);

// 从管道获取类型
unsigned int usb_pipetype(unsigned int pipe);
```

### 5. USB控制传输

```c
// 同步USB控制传输
int usb_control_msg(struct usb_device *dev, unsigned int pipe, __u8 request,
                   __u8 requesttype, __u16 value, __u16 index, void *data,
                   __u16 size, int timeout);

// 异步USB控制传输
int usb_control_msg_recv(struct usb_device *dev, __u8 request, __u8 requesttype,
                        __u16 value, __u16 index, void *data, __u16 size);

// 获取USB字符串描述符
int usb_string(struct usb_device *dev, int index, char *buf, size_t size);
```

### 6. USB批量传输

```c
// 同步USB批量传输
int usb_bulk_msg(struct usb_device *dev, unsigned int pipe, void *data, int len,
                int *actual_length, int timeout);
```

### 7. USB中断传输

```c
// 同步USB中断传输
int usb_interrupt_msg(struct usb_device *dev, unsigned int pipe, void *data, int len,
                     int *actual_length, int timeout);
```

### 8. USB设备文件系统

```c
// 在sysfs中创建属性文件
int usb_create_sysfs_attr(struct usb_interface *intf, const struct device_attribute *attr);

// 在sysfs中删除属性文件
void usb_remove_sysfs_attr(struct usb_interface *intf, const struct device_attribute *attr);

// 在sysfs中创建二进制属性文件
int usb_create_bin_file(struct usb_interface *intf, const struct bin_attribute *attr);

// 在sysfs中删除二进制属性文件
void usb_remove_bin_file(struct usb_interface *intf, const struct bin_attribute *attr);
```

## USB设备驱动实现示例

### 1. 驱动模块初始化

```c
#include <linux/module.h>
#include <linux/usb.h>
#include <linux/slab.h>
#include <linux/uaccess.h>

// 设备ID表
static const struct usb_device_id usb_example_ids[] = {
    { USB_DEVICE(0x1234, 0x5678) }, // 厂商ID: 0x1234, 产品ID: 0x5678
    { } /* Terminating entry */
};

MODULE_DEVICE_TABLE(usb, usb_example_ids);

// USB设备私有数据结构体
struct usb_example_priv {
    struct usb_device *dev;         // USB设备指针
    struct usb_interface *intf;     // USB接口指针
    unsigned char ep_in;            // 输入端点
    unsigned char ep_out;           // 输出端点
    int max_packet_size;            // 最大包大小
    struct urb *int_urb;            // 中断URB
    unsigned char *int_buffer;      // 中断缓冲区
    size_t int_buffer_size;         // 中断缓冲区大小
    struct urb *bulk_urb_in;        // 批量输入URB
    struct urb *bulk_urb_out;       // 批量输出URB
    unsigned char *bulk_buffer_in;  // 批量输入缓冲区
    unsigned char *bulk_buffer_out; // 批量输出缓冲区
    size_t bulk_buffer_size;        // 批量缓冲区大小
    struct mutex lock;              // 互斥锁
    wait_queue_head_t bulk_wait;    // 批量传输等待队列
    int bulk_transfer_done;         // 批量传输完成标志
};
```

### 2. 设备探测与断开函数

```c
// 设备探测函数
static int usb_example_probe(struct usb_interface *intf, const struct usb_device_id *id)
{
    struct usb_device *dev = interface_to_usbdev(intf);
    struct usb_interface_descriptor *desc = &intf->cur_altsetting->desc;
    struct usb_example_priv *priv;
    struct usb_host_endpoint *ep_in = NULL, *ep_out = NULL;
    int i, ret;

    // 查找输入和输出端点
    for (i = 0; i < desc->bNumEndpoints; i++) {
        struct usb_host_endpoint *ep = &intf->cur_altsetting->endpoint[i];
        struct usb_endpoint_descriptor *ep_desc = &ep->desc;

        if (usb_endpoint_is_bulk_in(ep_desc)) {
            ep_in = ep;
            priv->ep_in = ep_desc->bEndpointAddress;
            priv->max_packet_size = usb_endpoint_maxp(ep_desc);
        } else if (usb_endpoint_is_bulk_out(ep_desc)) {
            ep_out = ep;
            priv->ep_out = ep_desc->bEndpointAddress;
        }
    }

    // 检查是否找到所有需要的端点
    if (!ep_in || !ep_out) {
        dev_err(&intf->dev, "Could not find bulk endpoints\n");
        return -ENODEV;
    }

    // 分配私有数据
    priv = devm_kzalloc(&intf->dev, sizeof(*priv), GFP_KERNEL);
    if (!priv) {
        return -ENOMEM;
    }

    // 初始化私有数据
    priv->dev = dev;
    priv->intf = intf;
    priv->max_packet_size = usb_endpoint_maxp(&ep_in->desc);
    mutex_init(&priv->lock);
    init_waitqueue_head(&priv->bulk_wait);

    // 分配中断缓冲区和URB
    priv->int_buffer_size = 8; // 假设中断包大小为8字节
    priv->int_buffer = devm_kmalloc(&intf->dev, priv->int_buffer_size, GFP_KERNEL);
    if (!priv->int_buffer) {
        return -ENOMEM;
    }

    priv->int_urb = usb_alloc_urb(0, GFP_KERNEL);
    if (!priv->int_urb) {
        return -ENOMEM;
    }

    // 分配批量缓冲区
    priv->bulk_buffer_size = priv->max_packet_size;
    priv->bulk_buffer_in = devm_kmalloc(&intf->dev, priv->bulk_buffer_size, GFP_KERNEL);
    priv->bulk_buffer_out = devm_kmalloc(&intf->dev, priv->bulk_buffer_size, GFP_KERNEL);
    if (!priv->bulk_buffer_in || !priv->bulk_buffer_out) {
        goto free_int_urb;
    }

    // 分配批量URB
    priv->bulk_urb_in = usb_alloc_urb(0, GFP_KERNEL);
    priv->bulk_urb_out = usb_alloc_urb(0, GFP_KERNEL);
    if (!priv->bulk_urb_in || !priv->bulk_urb_out) {
        goto free_bulk_urb;
    }

    // 初始化中断URB
    usb_fill_int_urb(priv->int_urb, dev, 
                    usb_rcvintpipe(dev, priv->ep_in),
                    priv->int_buffer, priv->int_buffer_size,
                    usb_example_int_complete, priv,
                    100); // 100ms间隔

    // 提交中断URB
    ret = usb_submit_urb(priv->int_urb, GFP_KERNEL);
    if (ret) {
        dev_err(&intf->dev, "Failed to submit interrupt URB: %d\n", ret);
        goto free_bulk_urb;
    }

    // 设置驱动数据
    usb_set_intfdata(intf, priv);

    dev_info(&intf->dev, "USB example device connected\n");
    dev_info(&intf->dev, "Input endpoint: 0x%02x\n", priv->ep_in);
    dev_info(&intf->dev, "Output endpoint: 0x%02x\n", priv->ep_out);
    dev_info(&intf->dev, "Max packet size: %d\n", priv->max_packet_size);

    return 0;

free_bulk_urb:
    usb_free_urb(priv->bulk_urb_in);
    usb_free_urb(priv->bulk_urb_out);
free_int_urb:
    usb_free_urb(priv->int_urb);
    return -ENOMEM;
}

// 设备断开函数
static void usb_example_disconnect(struct usb_interface *intf)
{
    struct usb_example_priv *priv = usb_get_intfdata(intf);

    // 取消中断URB
    if (priv->int_urb) {
        usb_kill_urb(priv->int_urb);
        usb_free_urb(priv->int_urb);
    }

    // 取消批量URB
    if (priv->bulk_urb_in) {
        usb_kill_urb(priv->bulk_urb_in);
        usb_free_urb(priv->bulk_urb_in);
    }
    if (priv->bulk_urb_out) {
        usb_kill_urb(priv->bulk_urb_out);
        usb_free_urb(priv->bulk_urb_out);
    }

    // 清理互斥锁
    mutex_destroy(&priv->lock);

    // 清除驱动数据
    usb_set_intfdata(intf, NULL);

    dev_info(&intf->dev, "USB example device disconnected\n");
}
```

### 3. 中断传输处理

```c
// 中断传输完成回调函数
static void usb_example_int_complete(struct urb *urb)
{
    struct usb_example_priv *priv = urb->context;
    int ret;

    // 检查传输状态
    if (urb->status) {
        if (urb->status != -ENOENT && urb->status != -ECONNRESET &&
            urb->status != -ESHUTDOWN) {
            dev_err(&priv->intf->dev, "Interrupt URB failed: %d\n", urb->status);
        }
        return;
    }

    // 处理接收到的中断数据
    dev_info(&priv->intf->dev, "Received interrupt data: ");
    for (int i = 0; i < urb->actual_length; i++) {
        dev_info(&priv->intf->dev, "%02x ", priv->int_buffer[i]);
    }
    dev_info(&priv->intf->dev, "\n");

    // 重新提交中断URB
    ret = usb_submit_urb(urb, GFP_ATOMIC);
    if (ret) {
        dev_err(&priv->intf->dev, "Failed to resubmit interrupt URB: %d\n", ret);
    }
}
```

### 4. 批量传输处理

```c
// 批量输入传输完成回调函数
static void usb_example_bulk_in_complete(struct urb *urb)
{
    struct usb_example_priv *priv = urb->context;

    // 检查传输状态
    if (urb->status) {
        if (urb->status != -ENOENT && urb->status != -ECONNRESET &&
            urb->status != -ESHUTDOWN) {
            dev_err(&priv->intf->dev, "Bulk in URB failed: %d\n", urb->status);
        }
    }

    // 设置传输完成标志并唤醒等待队列
    priv->bulk_transfer_done = 1;
    wake_up_interruptible(&priv->bulk_wait);
}

// 批量输出传输完成回调函数
static void usb_example_bulk_out_complete(struct urb *urb)
{
    struct usb_example_priv *priv = urb->context;

    // 检查传输状态
    if (urb->status) {
        if (urb->status != -ENOENT && urb->status != -ECONNRESET &&
            urb->status != -ESHUTDOWN) {
            dev_err(&priv->intf->dev, "Bulk out URB failed: %d\n", urb->status);
        }
    }

    // 设置传输完成标志并唤醒等待队列
    priv->bulk_transfer_done = 1;
    wake_up_interruptible(&priv->bulk_wait);
}

// 同步批量输入传输
static int usb_example_bulk_read(struct usb_example_priv *priv, void *data, size_t size)
{
    int ret;

    // 检查参数
    if (!data || size > priv->bulk_buffer_size) {
        return -EINVAL;
    }

    // 初始化URB
    usb_fill_bulk_urb(priv->bulk_urb_in, priv->dev,
                     usb_rcvbulkpipe(priv->dev, priv->ep_in),
                     priv->bulk_buffer_in, size,
                     usb_example_bulk_in_complete, priv);

    // 重置传输完成标志
    priv->bulk_transfer_done = 0;

    // 提交URB
    ret = usb_submit_urb(priv->bulk_urb_in, GFP_KERNEL);
    if (ret) {
        dev_err(&priv->intf->dev, "Failed to submit bulk in URB: %d\n", ret);
        return ret;
    }

    // 等待传输完成
    wait_event_interruptible(priv->bulk_wait, priv->bulk_transfer_done);

    // 检查传输状态
    if (priv->bulk_urb_in->status) {
        return priv->bulk_urb_in->status;
    }

    // 复制数据到用户空间
    memcpy(data, priv->bulk_buffer_in, priv->bulk_urb_in->actual_length);

    return priv->bulk_urb_in->actual_length;
}

// 同步批量输出传输
static int usb_example_bulk_write(struct usb_example_priv *priv, const void *data, size_t size)
{
    int ret;

    // 检查参数
    if (!data || size > priv->bulk_buffer_size) {
        return -EINVAL;
    }

    // 复制数据到输出缓冲区
    memcpy(priv->bulk_buffer_out, data, size);

    // 初始化URB
    usb_fill_bulk_urb(priv->bulk_urb_out, priv->dev,
                     usb_sndbulkpipe(priv->dev, priv->ep_out),
                     priv->bulk_buffer_out, size,
                     usb_example_bulk_out_complete, priv);

    // 重置传输完成标志
    priv->bulk_transfer_done = 0;

    // 提交URB
    ret = usb_submit_urb(priv->bulk_urb_out, GFP_KERNEL);
    if (ret) {
        dev_err(&priv->intf->dev, "Failed to submit bulk out URB: %d\n", ret);
        return ret;
    }

    // 等待传输完成
    wait_event_interruptible(priv->bulk_wait, priv->bulk_transfer_done);

    // 检查传输状态
    if (priv->bulk_urb_out->status) {
        return priv->bulk_urb_out->status;
    }

    return size;
}
```

### 5. 控制传输处理

```c
// 发送控制命令
static int usb_example_send_command(struct usb_example_priv *priv, __u8 request,
                                  __u8 requesttype, __u16 value, __u16 index,
                                  void *data, __u16 size)
{
    int ret;
    unsigned char setup_packet[8];

    // 构建设置包
    setup_packet[0] = requesttype;
    setup_packet[1] = request;
    setup_packet[2] = value & 0xFF;
    setup_packet[3] = value >> 8;
    setup_packet[4] = index & 0xFF;
    setup_packet[5] = index >> 8;
    setup_packet[6] = size & 0xFF;
    setup_packet[7] = size >> 8;

    // 发送控制命令
    ret = usb_control_msg(priv->dev, usb_sndctrlpipe(priv->dev, 0),
                         request, requesttype, value, index,
                         data, size, 1000); // 1秒超时

    if (ret < 0) {
        dev_err(&priv->intf->dev, "Control message failed: %d\n", ret);
        return ret;
    }

    return ret;
}

// 接收控制命令
static int usb_example_recv_command(struct usb_example_priv *priv, __u8 request,
                                  __u8 requesttype, __u16 value, __u16 index,
                                  void *data, __u16 size)
{
    int ret;

    // 接收控制命令
    ret = usb_control_msg(priv->dev, usb_rcvctrlpipe(priv->dev, 0),
                         request, requesttype, value, index,
                         data, size, 1000); // 1秒超时

    if (ret < 0) {
        dev_err(&priv->intf->dev, "Control message failed: %d\n", ret);
        return ret;
    }

    return ret;
}
```

### 6. 设备初始化

```c
// 设备初始化
static int usb_example_init_device(struct usb_example_priv *priv)
{
    int ret;
    unsigned char init_data[4] = {0x01, 0x02, 0x03, 0x04};

    // 发送初始化命令
    ret = usb_example_send_command(priv, 0x01, USB_TYPE_VENDOR | USB_RECIP_DEVICE | USB_DIR_OUT,
                                 0x0000, 0x0000, init_data, sizeof(init_data));
    if (ret < 0) {
        return ret;
    }

    // 读取设备状态
    unsigned char status;
    ret = usb_example_recv_command(priv, 0x02, USB_TYPE_VENDOR | USB_RECIP_DEVICE | USB_DIR_IN,
                                 0x0000, 0x0000, &status, 1);
    if (ret < 0) {
        return ret;
    }

    dev_info(&priv->intf->dev, "Device initialized, status: 0x%02x\n", status);

    return 0;
}
```

### 7. 驱动结构体定义

```c
// USB驱动结构体
static struct usb_driver usb_example_driver = {
    .name = "usb_example",
    .probe = usb_example_probe,
    .disconnect = usb_example_disconnect,
    .id_table = usb_example_ids,
};

// 模块初始化和退出
module_usb_driver(usb_example_driver);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Linux Driver Developer");
MODULE_DESCRIPTION("USB Example Driver");
MODULE_VERSION("1.0");
```

## USB传输类型和实现

### 1. 控制传输

控制传输用于设备的配置和管理，是USB设备必须支持的传输类型：

```c
// 发送控制命令示例
int usb_example_set_config(struct usb_example_priv *priv, unsigned char config)
{
    int ret;

    // 发送设置配置命令
    ret = usb_example_send_command(priv, USB_REQ_SET_CONFIGURATION,
                                 USB_TYPE_STANDARD | USB_RECIP_DEVICE | USB_DIR_OUT,
                                 config, 0, NULL, 0);
    if (ret < 0) {
        return ret;
    }

    dev_info(&priv->intf->dev, "Device configuration set to %d\n", config);

    return 0;
}

// 获取设备描述符示例
int usb_example_get_descriptor(struct usb_example_priv *priv)
{
    int ret;
    struct usb_device_descriptor desc;

    // 发送获取设备描述符命令
    ret = usb_example_recv_command(priv, USB_REQ_GET_DESCRIPTOR,
                                 USB_TYPE_STANDARD | USB_RECIP_DEVICE | USB_DIR_IN,
                                 USB_DT_DEVICE << 8, 0,
                                 &desc, sizeof(struct usb_device_descriptor));
    if (ret < 0) {
        return ret;
    }

    dev_info(&priv->intf->dev, "Device descriptor:\n");
    dev_info(&priv->intf->dev, "  bLength: %d\n", desc.bLength);
    dev_info(&priv->intf->dev, "  bDescriptorType: %d\n", desc.bDescriptorType);
    dev_info(&priv->intf->dev, "  bcdUSB: %04x\n", desc.bcdUSB);
    dev_info(&priv->intf->dev, "  bDeviceClass: %d\n", desc.bDeviceClass);
    dev_info(&priv->intf->dev, "  bDeviceSubClass: %d\n", desc.bDeviceSubClass);
    dev_info(&priv->intf->dev, "  bDeviceProtocol: %d\n", desc.bDeviceProtocol);
    dev_info(&priv->intf->dev, "  bMaxPacketSize0: %d\n", desc.bMaxPacketSize0);
    dev_info(&priv->intf->dev, "  idVendor: 0x%04x\n", desc.idVendor);
    dev_info(&priv->intf->dev, "  idProduct: 0x%04x\n", desc.idProduct);
    dev_info(&priv->intf->dev, "  bcdDevice: %04x\n", desc.bcdDevice);
    dev_info(&priv->intf->dev, "  iManufacturer: %d\n", desc.iManufacturer);
    dev_info(&priv->intf->dev, "  iProduct: %d\n", desc.iProduct);
    dev_info(&priv->intf->dev, "  iSerialNumber: %d\n", desc.iSerialNumber);
    dev_info(&priv->intf->dev, "  bNumConfigurations: %d\n", desc.bNumConfigurations);

    return 0;
}
```

### 2. 批量传输

批量传输用于传输大量数据，具有错误检测和重试机制，适用于存储设备等：

```c
// 批量传输示例
int usb_example_transfer_data(struct usb_example_priv *priv, const void *tx_data, size_t tx_size,
                             void *rx_data, size_t rx_size)
{
    int ret;

    // 发送数据
    ret = usb_example_bulk_write(priv, tx_data, tx_size);
    if (ret < 0) {
        return ret;
    }

    // 接收数据
    ret = usb_example_bulk_read(priv, rx_data, rx_size);
    if (ret < 0) {
        return ret;
    }

    return ret;
}
```

### 3. 中断传输

中断传输用于传输小量数据，具有固定的间隔，适用于键盘、鼠标等设备：

```c
// 中断传输示例
int usb_example_start_int_transfer(struct usb_example_priv *priv)
{
    int ret;

    // 初始化中断URB
    usb_fill_int_urb(priv->int_urb, priv->dev,
                     usb_rcvintpipe(priv->dev, priv->ep_in),
                     priv->int_buffer, priv->int_buffer_size,
                     usb_example_int_complete, priv,
                     100); // 100ms间隔

    // 提交URB
    ret = usb_submit_urb(priv->int_urb, GFP_KERNEL);
    if (ret) {
        dev_err(&priv->intf->dev, "Failed to submit interrupt URB: %d\n", ret);
        return ret;
    }

    return 0;
}

int usb_example_stop_int_transfer(struct usb_example_priv *priv)
{
    // 取消URB
    if (priv->int_urb) {
        usb_kill_urb(priv->int_urb);
    }

    return 0;
}
```

### 4. 等时传输

等时传输用于传输实时数据，没有错误检测和重试机制，适用于音频、视频等设备：

```c
// 等时传输示例
int usb_example_isoc_transfer(struct usb_example_priv *priv, unsigned char endpoint,
                             void *data, size_t size, int num_packets)
{
    struct urb *urb;
    int ret, i;

    // 创建等时URB
    urb = usb_alloc_urb(num_packets, GFP_KERNEL);
    if (!urb) {
        return -ENOMEM;
    }

    // 初始化等时URB
    usb_fill_iso_urb(urb, priv->dev,
                    usb_rcvisocpipe(priv->dev, endpoint),
                    data, size,
                    num_packets, usb_example_isoc_complete, priv,
                    1); // 间隔1帧

    // 设置每个等时包的长度
    for (i = 0; i < num_packets; i++) {
        urb->iso_frame_desc[i].offset = i * (size / num_packets);
        urb->iso_frame_desc[i].length = size / num_packets;
    }

    // 提交URB
    ret = usb_submit_urb(urb, GFP_KERNEL);
    if (ret) {
        dev_err(&priv->intf->dev, "Failed to submit isochronous URB: %d\n", ret);
        usb_free_urb(urb);
        return ret;
    }

    // 等待传输完成
    wait_event_interruptible(priv->bulk_wait, priv->bulk_transfer_done);

    // 检查传输状态
    if (urb->status) {
        ret = urb->status;
    } else {
        ret = urb->actual_length;
    }

    // 释放URB
    usb_free_urb(urb);

    return ret;
}

// 等时传输完成回调函数
static void usb_example_isoc_complete(struct urb *urb)
{
    struct usb_example_priv *priv = urb->context;
    int i;

    // 检查传输状态
    if (urb->status) {
        if (urb->status != -ENOENT && urb->status != -ECONNRESET &&
            urb->status != -ESHUTDOWN) {
            dev_err(&priv->intf->dev, "Isochronous URB failed: %d\n", urb->status);
        }
        goto out;
    }

    // 处理接收到的等时数据
    dev_info(&priv->intf->dev, "Received isochronous data:\n");
    for (i = 0; i < urb->number_of_packets; i++) {
        if (urb->iso_frame_desc[i].status) {
            dev_err(&priv->intf->dev, "  Packet %d failed: %d\n", i, urb->iso_frame_desc[i].status);
        } else {
            dev_info(&priv->intf->dev, "  Packet %d: %d bytes\n", i, urb->iso_frame_desc[i].actual_length);
        }
    }

out:
    // 设置传输完成标志并唤醒等待队列
    priv->bulk_transfer_done = 1;
    wake_up_interruptible(&priv->bulk_wait);
}
```

## USB设备的用户空间接口

### 1. 使用字符设备接口

```c
// 文件操作结构体
static const struct file_operations usb_example_fops = {
    .owner = THIS_MODULE,
    .open = usb_example_open,
    .release = usb_example_release,
    .read = usb_example_read,
    .write = usb_example_write,
    .unlocked_ioctl = usb_example_ioctl,
    .poll = usb_example_poll,
};

// 字符设备结构体
static struct cdev usb_example_cdev;
static dev_t usb_example_devno;
static struct class *usb_example_class;
static atomic_t usb_example_available = ATOMIC_INIT(1);

// 文件打开函数
static int usb_example_open(struct inode *inode, struct file *file)
{
    struct usb_example_priv *priv;
    struct usb_interface *intf;

    // 检查设备是否可用
    if (!atomic_dec_and_test(&usb_example_available)) {
        atomic_inc(&usb_example_available);
        return -EBUSY;
    }

    // 获取USB接口
    intf = usb_find_interface(&usb_example_driver, iminor(inode));
    if (!intf) {
        atomic_inc(&usb_example_available);
        return -ENODEV;
    }

    // 获取私有数据
    priv = usb_get_intfdata(intf);
    if (!priv) {
        atomic_inc(&usb_example_available);
        return -ENODEV;
    }

    // 保存私有数据到文件结构体
    file->private_data = priv;

    dev_info(&intf->dev, "Device opened\n");

    return 0;
}

// 文件释放函数
static int usb_example_release(struct inode *inode, struct file *file)
{
    struct usb_example_priv *priv = file->private_data;

    // 标记设备为可用
    atomic_inc(&usb_example_available);

    dev_info(&priv->intf->dev, "Device closed\n");

    return 0;
}

// 文件读取函数
static ssize_t usb_example_read(struct file *file, char __user *buf, size_t count, loff_t *ppos)
{
    struct usb_example_priv *priv = file->private_data;
    int ret;
    unsigned char *data;

    // 分配缓冲区
    data = kmalloc(count, GFP_KERNEL);
    if (!data) {
        return -ENOMEM;
    }

    // 执行批量读取
    ret = usb_example_bulk_read(priv, data, count);
    if (ret < 0) {
        kfree(data);
        return ret;
    }

    // 复制数据到用户空间
    if (copy_to_user(buf, data, ret)) {
        kfree(data);
        return -EFAULT;
    }

    // 释放缓冲区
    kfree(data);

    return ret;
}

// 文件写入函数
static ssize_t usb_example_write(struct file *file, const char __user *buf, size_t count, loff_t *ppos)
{
    struct usb_example_priv *priv = file->private_data;
    int ret;
    unsigned char *data;

    // 分配缓冲区
    data = kmalloc(count, GFP_KERNEL);
    if (!data) {
        return -ENOMEM;
    }

    // 从用户空间复制数据
    if (copy_from_user(data, buf, count)) {
        kfree(data);
        return -EFAULT;
    }

    // 执行批量写入
    ret = usb_example_bulk_write(priv, data, count);
    if (ret < 0) {
        kfree(data);
        return ret;
    }

    // 释放缓冲区
    kfree(data);

    return ret;
}

// IO控制函数
static long usb_example_ioctl(struct file *file, unsigned int cmd, unsigned long arg)
{
    struct usb_example_priv *priv = file->private_data;
    int ret;
    unsigned char value;

    switch (cmd) {
    case USB_EXAMPLE_SET_LED:
        // 设置LED状态
        if (copy_from_user(&value, (unsigned char __user *)arg, sizeof(unsigned char))) {
            return -EFAULT;
        }
        ret = usb_example_send_command(priv, 0x03, USB_TYPE_VENDOR | USB_RECIP_DEVICE | USB_DIR_OUT,
                                     value, 0, NULL, 0);
        if (ret < 0) {
            return ret;
        }
        dev_info(&priv->intf->dev, "LED state set to %d\n", value);
        return 0;

    case USB_EXAMPLE_GET_SWITCH:
        // 获取开关状态
        ret = usb_example_recv_command(priv, 0x04, USB_TYPE_VENDOR | USB_RECIP_DEVICE | USB_DIR_IN,
                                     0, 0, &value, 1);
        if (ret < 0) {
            return ret;
        }
        if (copy_to_user((unsigned char __user *)arg, &value, sizeof(unsigned char))) {
            return -EFAULT;
        }
        dev_info(&priv->intf->dev, "Switch state: %d\n", value);
        return 0;

    default:
        return -ENOTTY;
    }
}

// 轮询函数
static unsigned int usb_example_poll(struct file *file, poll_table *wait)
{
    struct usb_example_priv *priv = file->private_data;
    unsigned int mask = 0;

    // 将等待队列添加到轮询表
    poll_wait(file, &priv->bulk_wait, wait);

    // 检查是否有数据可读
    if (priv->bulk_transfer_done) {
        mask |= POLLIN | POLLRDNORM;
    }

    return mask;
}

// 初始化字符设备
static int __init usb_example_init_chrdev(void)
{
    int ret;

    // 分配设备号
    ret = alloc_chrdev_region(&usb_example_devno, 0, 1, "usb_example");
    if (ret) {
        return ret;
    }

    // 初始化字符设备
    cdev_init(&usb_example_cdev, &usb_example_fops);
    usb_example_cdev.owner = THIS_MODULE;

    // 添加字符设备到系统
    ret = cdev_add(&usb_example_cdev, usb_example_devno, 1);
    if (ret) {
        unregister_chrdev_region(usb_example_devno, 1);
        return ret;
    }

    // 创建类
    usb_example_class = class_create(THIS_MODULE, "usb_example");
    if (IS_ERR(usb_example_class)) {
        cdev_del(&usb_example_cdev);
        unregister_chrdev_region(usb_example_devno, 1);
        return PTR_ERR(usb_example_class);
    }

    // 创建设备节点
    device_create(usb_example_class, NULL, usb_example_devno, NULL, "usb_example");

    return 0;
}

// 清理字符设备
static void __exit usb_example_cleanup_chrdev(void)
{
    device_destroy(usb_example_class, usb_example_devno);
    class_destroy(usb_example_class);
    cdev_del(&usb_example_cdev);
    unregister_chrdev_region(usb_example_devno, 1);
}

// 模块初始化和退出
module_init(usb_example_init_chrdev);
module_exit(usb_example_cleanup_chrdev);
```

### 2. 使用sysfs接口

```c
// sysfs显示设备信息
static ssize_t usb_example_show_info(struct device *dev, struct device_attribute *attr, char *buf)
{
    struct usb_interface *intf = to_usb_interface(dev);
    struct usb_example_priv *priv = usb_get_intfdata(intf);

    return sprintf(buf, "Vendor ID: 0x%04x\n" 
                       "Product ID: 0x%04x\n" 
                       "Endpoint In: 0x%02x\n" 
                       "Endpoint Out: 0x%02x\n" 
                       "Max Packet Size: %d\n",
                   priv->dev->descriptor.idVendor, priv->dev->descriptor.idProduct,
                   priv->ep_in, priv->ep_out, priv->max_packet_size);
}

// sysfs属性定义
static DEVICE_ATTR(info, 0444, usb_example_show_info, NULL);

// sysfs写入LED控制
static ssize_t usb_example_store_led(struct device *dev, struct device_attribute *attr, 
                                   const char *buf, size_t count)
{
    struct usb_interface *intf = to_usb_interface(dev);
    struct usb_example_priv *priv = usb_get_intfdata(intf);
    unsigned char value;
    int ret;

    if (kstrtou8(buf, 10, &value)) {
        return -EINVAL;
    }

    // 发送LED控制命令
    ret = usb_example_send_command(priv, 0x03, USB_TYPE_VENDOR | USB_RECIP_DEVICE | USB_DIR_OUT,
                                 value, 0, NULL, 0);
    if (ret < 0) {
        return ret;
    }

    dev_info(dev, "LED state set to %d\n", value);

    return count;
}

// sysfs读取LED状态
static ssize_t usb_example_show_led(struct device *dev, struct device_attribute *attr, char *buf)
{
    struct usb_interface *intf = to_usb_interface(dev);
    struct usb_example_priv *priv = usb_get_intfdata(intf);
    unsigned char value;
    int ret;

    // 发送LED状态查询命令
    ret = usb_example_recv_command(priv, 0x05, USB_TYPE_VENDOR | USB_RECIP_DEVICE | USB_DIR_IN,
                                 0, 0, &value, 1);
    if (ret < 0) {
        return ret;
    }

    return sprintf(buf, "%d\n", value);
}

// sysfs属性定义
static DEVICE_ATTR(led, 0644, usb_example_show_led, usb_example_store_led);

// sysfs属性组
static struct attribute *usb_example_attrs[] = {
    &dev_attr_info.attr,
    &dev_attr_led.attr,
    NULL,
};

ATTRIBUTE_GROUPS(usb_example);

// 在驱动结构体中添加sysfs支持
static struct usb_driver usb_example_driver = {
    .name = "usb_example",
    .probe = usb_example_probe,
    .disconnect = usb_example_disconnect,
    .id_table = usb_example_ids,
    .driver = {
        .dev_groups = usb_example_groups,
    },
};
```

## 高级USB功能

### 1. USB电源管理

```c
// 设备挂起函数
static int usb_example_suspend(struct usb_interface *intf, pm_message_t message)
{
    struct usb_example_priv *priv = usb_get_intfdata(intf);
    int ret;

    // 停止中断传输
    usb_kill_urb(priv->int_urb);

    // 停止批量传输
    usb_kill_urb(priv->bulk_urb_in);
    usb_kill_urb(priv->bulk_urb_out);

    // 设置设备为挂起状态
    ret = usb_example_send_command(priv, 0x06, USB_TYPE_VENDOR | USB_RECIP_DEVICE | USB_DIR_OUT,
                                 0, 0, NULL, 0);
    if (ret < 0) {
        dev_warn(&intf->dev, "Failed to set suspend state: %d\n", ret);
    }

    dev_info(&intf->dev, "Device suspended\n");

    return 0;
}

// 设备恢复函数
static int usb_example_resume(struct usb_interface *intf)
{
    struct usb_example_priv *priv = usb_get_intfdata(intf);
    int ret;

    // 设置设备为恢复状态
    ret = usb_example_send_command(priv, 0x07, USB_TYPE_VENDOR | USB_RECIP_DEVICE | USB_DIR_OUT,
                                 0, 0, NULL, 0);
    if (ret < 0) {
        dev_warn(&intf->dev, "Failed to set resume state: %d\n", ret);
    }

    // 重新启动中断传输
    ret = usb_example_start_int_transfer(priv);
    if (ret < 0) {
        dev_warn(&intf->dev, "Failed to restart interrupt transfer: %d\n", ret);
    }

    dev_info(&intf->dev, "Device resumed\n");

    return 0;
}

// 在驱动结构体中添加电源管理支持
static struct usb_driver usb_example_driver = {
    .name = "usb_example",
    .probe = usb_example_probe,
    .disconnect = usb_example_disconnect,
    .id_table = usb_example_ids,
    .suspend = usb_example_suspend,
    .resume = usb_example_resume,
    .supports_autosuspend = 1,
};
```

### 2. USB设备重置

```c
// 设备重置函数
static int usb_example_reset_device(struct usb_interface *intf)
{
    struct usb_example_priv *priv = usb_get_intfdata(intf);
    int ret;

    // 重置设备
    ret = usb_reset_device(priv->dev);
    if (ret) {
        dev_err(&intf->dev, "Failed to reset device: %d\n", ret);
        return ret;
    }

    // 重新初始化设备
    ret = usb_example_init_device(priv);
    if (ret) {
        dev_err(&intf->dev, "Failed to reinitialize device: %d\n", ret);
        return ret;
    }

    dev_info(&intf->dev, "Device reset and reinitialized\n");

    return 0;
}
```

### 3. USB设备唤醒

```c
// 设备唤醒函数
static int usb_example_enable_remote_wakeup(struct usb_example_priv *priv)
{
    int ret;

    // 启用远程唤醒
    ret = usb_control_msg(priv->dev, usb_sndctrlpipe(priv->dev, 0),
                         USB_REQ_SET_FEATURE, USB_RECIP_DEVICE | USB_TYPE_STANDARD | USB_DIR_OUT,
                         USB_DEVICE_REMOTE_WAKEUP, 0, NULL, 0, 1000);
    if (ret < 0) {
        dev_err(&priv->intf->dev, "Failed to enable remote wakeup: %d\n", ret);
        return ret;
    }

    // 设置接口需要远程唤醒
    priv->intf->needs_remote_wakeup = 1;

    dev_info(&priv->intf->dev, "Remote wakeup enabled\n");

    return 0;
}

// 禁用设备唤醒函数
static int usb_example_disable_remote_wakeup(struct usb_example_priv *priv)
{
    int ret;

    // 禁用远程唤醒
    ret = usb_control_msg(priv->dev, usb_sndctrlpipe(priv->dev, 0),
                         USB_REQ_CLEAR_FEATURE, USB_RECIP_DEVICE | USB_TYPE_STANDARD | USB_DIR_OUT,
                         USB_DEVICE_REMOTE_WAKEUP, 0, NULL, 0, 1000);
    if (ret < 0) {
        dev_err(&priv->intf->dev, "Failed to disable remote wakeup: %d\n", ret);
        return ret;
    }

    // 清除接口需要远程唤醒的标志
    priv->intf->needs_remote_wakeup = 0;

    dev_info(&priv->intf->dev, "Remote wakeup disabled\n");

    return 0;
}
```

## 最佳实践

1. **资源管理**：
   - 正确管理URB的生命周期，及时分配和释放URB
   - 使用引用计数保护共享资源
   - 实现适当的错误处理和资源回滚

2. **并发控制**：
   - 使用互斥锁保护共享数据结构
   - 避免在中断上下文和原子上下文中执行耗时操作
   - 使用工作队列处理耗时的中断处理

3. **性能优化**：
   - 选择合适的传输类型（控制、批量、中断、等时）
   - 使用最大包大小以提高传输效率
   - 批量处理数据减少URB提交次数
   - 避免频繁的USB控制传输

4. **错误处理**：
   - 检查所有USB API调用的返回值
   - 处理URB传输失败的情况
   - 实现设备重置和恢复机制
   - 提供详细的错误日志

5. **兼容性**：
   - 支持不同的USB版本和速度
   - 处理设备描述符的变化
   - 支持热插拔和动态设备枚举

6. **安全性**：
   - 验证所有用户输入
   - 实现适当的访问控制
   - 防止缓冲区溢出攻击
   - 保护设备免受恶意操作

7. **可维护性**：
   - 清晰的代码结构和注释
   - 模块化设计
   - 遵循Linux内核编码风格
   - 使用标准的USB API

8. **调试支持**：
   - 提供详细的调试日志
   - 实现sysfs接口用于运行时配置和状态查询
   - 支持动态调试（dynamic debug）
   - 使用USB调试工具（如usbmon、lsusb）

## 总结

USB驱动实现主要包括以下步骤：
1. 定义设备ID表和驱动结构体
2. 实现设备探测和断开函数
3. 查找和配置设备端点
4. 实现URB的创建、提交和处理
5. 支持不同类型的USB传输（控制、批量、中断、等时）
6. 提供用户空间接口（字符设备、sysfs等）
7. 实现电源管理和设备唤醒功能

通过Linux USB子系统提供的API接口，开发者可以方便地实现各种USB设备驱动。USB驱动的关键在于理解USB协议的各个方面，正确管理URB和端点，实现高效的数据传输，以及提供友好的用户空间接口。

随着USB技术的不断发展，新的特性如USB 4、USB PD（Power Delivery）等也在不断涌现，开发者需要持续关注USB技术的最新发展，以实现更加高效和功能丰富的USB设备驱动。