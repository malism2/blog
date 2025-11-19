---
title: CAN驱动测试
description: CAN驱动的编译、加载、测试方法和常见问题解决方案
---

# CAN驱动测试

本章介绍CAN驱动的编译、模块加载、功能测试方法以及常见问题的解决方案。

## 编译CAN驱动

### 1. 内核源码树编译

如果CAN驱动是内核源码的一部分，可以通过以下步骤编译：

```bash
# 进入内核源码目录
cd /usr/src/linux

# 配置内核，确保CAN支持和相关驱动选项被启用
make menuconfig

# 启用CAN支持
[*] Networking support  --->
    <*>   CAN bus subsystem support  --->
        <*>   Raw CAN Protocol (raw access with CAN-ID filtering)
        <*>   Broadcast Manager CAN Protocol (with content filtering)
        <*>   CAN Gateway/Router (with netlink configuration)

# 启用CAN设备驱动
Device Drivers  --->
    [*] Network device support  --->
        <*>   CAN bus subsystem support  --->
            <*>   Platform CAN drivers with Netlink support
            <*>   <Your CAN Driver>

# 编译内核和模块
make -j$(nproc)

# 安装内核和模块
make modules_install
make install
```

### 2. 独立模块编译

如果CAN驱动是独立开发的，可以使用Makefile进行编译：

```makefile
obj-m += can_driver.o

KDIR := /lib/modules/$(shell uname -r)/build
PWD := $(shell pwd)

default:
	$(MAKE) -C $(KDIR) M=$(PWD) modules

clean:
	$(MAKE) -C $(KDIR) M=$(PWD) clean
```

编译命令：
```bash
make
```

## 加载CAN驱动

### 1. 加载驱动模块

```bash
# 加载CAN驱动模块
insmod can_driver.ko

# 查看模块是否加载成功
lsmod | grep can_driver
```

### 2. 加载SocketCAN核心模块

```bash
# 加载CAN核心模块
modprobe can

# 加载Raw CAN协议模块
modprobe can_raw

# 加载CAN广播管理器模块
modprobe can_bcm

# 加载CAN网关模块
modprobe can_gw
```

## CAN设备配置

### 1. 配置CAN接口

```bash
# 设置CAN接口波特率
ip link set can0 type can bitrate 500000

# 设置CAN接口模式（可选）
ip link set can0 type can bitrate 500000 loopback on
tc qdisc add dev can0 root pfifo_fast

# 启用CAN接口
ip link set can0 up

# 查看CAN接口状态
ip -details link show can0
```

### 2. 常用配置参数

```bash
# 设置采样点
ip link set can0 type can bitrate 500000 sample-point 0.875

# 设置同步跳转宽度
ip link set can0 type can bitrate 500000 sjw 1

# 设置时间段1和时间段2
ip link set can0 type can bitrate 500000 tq 125 prop-seg 6 phase-seg1 7 phase-seg2 2 sjw 1
```

## 功能测试

### 1. 使用candump和cansend测试

```bash
# 安装CAN工具
apt-get install can-utils

# 在一个终端接收CAN数据
candump can0

# 在另一个终端发送CAN数据
cansend can0 123#1122334455667788
```

### 2. 环回测试

```bash
# 启用环回模式
ip link set can0 type can bitrate 500000 loopback on
ip link set can0 up

# 同时运行发送和接收命令
cansend can0 123#1122334455667788 && candump can0 -n 1
```

### 3. 使用SocketCAN进行编程测试

以下是一个简单的SocketCAN测试程序：

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
    int nbytes;
    struct sockaddr_can addr;
    struct ifreq ifr;
    struct can_frame frame;

    /* 创建CAN套接字 */
    if ((s = socket(PF_CAN, SOCK_RAW, CAN_RAW)) < 0) {
        perror("socket");
        return 1;
    }

    /* 指定CAN接口 */
    strcpy(ifr.ifr_name, "can0");
    ioctl(s, SIOCGIFINDEX, &ifr);

    /* 绑定CAN接口 */
    addr.can_family = AF_CAN;
    addr.can_ifindex = ifr.ifr_ifindex;
    if (bind(s, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("bind");
        return 1;
    }

    /* 准备发送数据 */
    frame.can_id = 0x123;
    frame.can_dlc = 8;
    sprintf(frame.data, "HelloCAN");

    /* 发送数据 */
    nbytes = write(s, &frame, sizeof(struct can_frame));
    if (nbytes != sizeof(struct can_frame)) {
        perror("write");
        return 1;
    }

    /* 接收数据 */
    nbytes = read(s, &frame, sizeof(struct can_frame));
    if (nbytes < 0) {
        perror("read");
        return 1;
    }

    /* 打印接收数据 */
    printf("CAN ID: 0x%X\n", frame.can_id);
    printf("DLC: %d\n", frame.can_dlc);
    printf("Data: ");
    for (int i = 0; i < frame.can_dlc; i++) {
        printf("%02X ", frame.data[i]);
    }
    printf("\n");

    /* 关闭套接字 */
    close(s);

    return 0;
}
```

编译和运行：
```bash
gcc can_test.c -o can_test
./can_test
```

## 性能测试

### 1. 带宽测试

```bash
# 发送大量CAN帧并测量带宽
cangen can0 -g 100 -n 10000 -v
```

参数说明：
- `-g 100`：每100微秒发送一帧
- `-n 10000`：发送10000帧
- `-v`：显示详细信息

### 2. 延迟测试

```bash
# 测量CAN帧的往返延迟
canbusload can0 -b 500000 -r 100 -t
```

参数说明：
- `-b 500000`：波特率500kbps
- `-r 100`：接收100帧
- `-t`：显示时间戳

## 调试CAN驱动

### 1. 内核日志查看

```bash
# 查看CAN相关的内核日志
dmesg | grep -i can

# 实时查看内核日志
journalctl -k -f | grep -i can
```

### 2. CAN驱动调试工具

- **candump**：接收并显示CAN帧
- **cansend**：发送CAN帧
- **cangen**：生成CAN帧流量
- **canbusload**：测量CAN总线负载
- **canfdtest**：测试CAN FD功能
- **ip**：配置CAN接口

### 3. 调试CAN驱动的常见问题

1. **CAN接口无法启动**
   - 检查CAN驱动是否正确加载
   - 检查CAN控制器硬件是否正常
   - 检查波特率配置是否正确

2. **CAN帧发送失败**
   - 检查CAN接口是否处于UP状态
   - 检查CAN总线是否连接正常
   - 检查CAN控制器是否有错误状态

3. **CAN帧接收失败**
   - 检查CAN滤波器配置是否正确
   - 检查CAN总线是否有干扰
   - 检查CAN控制器的接收缓冲区是否溢出

4. **驱动模块加载失败**
   - 检查内核版本是否匹配
   - 检查模块依赖是否满足
   - 检查编译选项是否正确

## 卸载CAN驱动

```bash
# 禁用CAN接口
ip link set can0 down

# 卸载CAN驱动模块
rmmod can_driver

# 卸载SocketCAN模块
rmmod can_gw
rmmod can_bcm
rmmod can_raw
rmmod can
```

## 常见问题解决方案

### 1. CAN总线错误

如果CAN总线出现错误，可以通过以下命令查看错误状态：

```bash
# 查看CAN接口错误统计
ip -details -statistics link show can0
```

常见错误类型：
- **bit error**：位错误
- **stuff error**：填充错误
- **crc error**：CRC校验错误
- **form error**：格式错误
- **ack error**：确认错误

### 2. 波特率配置问题

如果波特率配置不正确，可以使用以下命令重新配置：

```bash
# 重新配置CAN接口波特率
ip link set can0 down
ip link set can0 type can bitrate 250000
ip link set can0 up
```

### 3. CAN滤波器配置

如果需要配置CAN滤波器，可以使用以下方法：

```c
struct can_filter rfilter[1];

rfilter[0].can_id = 0x123;
rfilter[0].can_mask = CAN_SFF_MASK;

if (setsockopt(s, SOL_CAN_RAW, CAN_RAW_FILTER, &rfilter, sizeof(rfilter)) < 0) {
    perror("setsockopt");
    return 1;
}
```

## 总结

CAN驱动测试是确保驱动正常工作的重要步骤。通过本章介绍的编译、加载、配置、测试和调试方法，可以有效地开发和调试CAN驱动。在测试过程中，应该注意观察内核日志，使用适当的调试工具，及时发现和解决问题。

此外，还应该根据具体CAN设备的特点，设计专门的测试用例，确保驱动在各种情况下都能正常工作。