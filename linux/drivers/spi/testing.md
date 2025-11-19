---
title: SPI驱动测试
description: SPI驱动的编译、加载、测试方法和常见问题解决方案
---

# SPI驱动测试

本章介绍SPI驱动的编译、模块加载、功能测试方法以及常见问题的解决方案。

## 编译SPI驱动

### 1. 内核源码树编译

如果SPI驱动是内核源码的一部分，可以通过以下步骤编译：

```bash
# 进入内核源码目录
cd /usr/src/linux

# 配置内核，确保SPI支持和相关驱动选项被启用
make menuconfig

# 启用SPI支持
Device Drivers  --->
    [*] SPI support  --->
        <*>   SPI device interface
        [*]   Enhanced SPI debugging messages

# 启用SPI设备驱动
Device Drivers  --->
    [*] SPI support  --->
        <*>   SPI Hardware Bus support  --->
            <*>   <Your SPI Bus Driver>
        <*>   SPI Protocol Masters  --->
            <*>   <Your SPI Protocol Driver>

# 编译内核和模块
make -j$(nproc)

# 安装内核和模块
make modules_install
make install
```

### 2. 独立模块编译

如果SPI驱动是独立开发的，可以使用Makefile进行编译：

```makefile
obj-m += spi_driver.o

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

## 加载SPI驱动

### 1. 加载驱动模块

```bash
# 加载SPI核心模块
modprobe spi-core

# 加载SPI设备接口模块
modprobe spi-dev

# 加载SPI总线驱动模块
modprobe spi-<bus-type>

# 加载SPI设备驱动模块
insmod spi_driver.ko

# 查看模块是否加载成功
lsmod | grep spi
```

### 2. 自动加载驱动

可以通过以下方式实现驱动的自动加载：

1. **添加到模块依赖文件**：
   ```bash
echo "spi_driver" >> /etc/modules
```

2. **使用设备树（适用于嵌入式系统）**：
   在设备树中添加SPI设备节点：
   ```dts
   &spi1 {
       status = "okay";
       
       my_spi_device@0 {
           compatible = "my,vendor,spi-device";
           reg = <0>;
           spi-max-frequency = <10000000>;
           spi-cpol;
           spi-cpha;
       };
   };
   ```

## SPI设备检测

### 1. 查看SPI总线

```bash
# 查看系统中的SPI总线
ls /dev/spi*

# 查看SPI主控制器信息
cat /sys/class/spi_master/
```

### 2. 查看SPI设备

```bash
# 查看SPI设备信息
ls -la /dev/spidev*
```

## 功能测试

### 1. 使用spidev-test测试

Linux内核提供了spidev-test工具用于测试SPI设备：

```bash
# 编译spidev-test
cd /usr/src/linux/tools/spi
gcc spidev-test.c -o spidev-test

# 运行SPI测试
sudo ./spidev-test -D /dev/spidev1.0 -s 1000000 -b 8 -v
```

参数说明：
- `-D /dev/spidev1.0`：指定SPI设备
- `-s 1000000`：设置传输速率为1MHz
- `-b 8`：设置每字位数为8位
- `-v`：启用详细输出

### 2. 基本SPI读写测试

```bash
# 向SPI设备写入数据
sudo ./spidev-test -D /dev/spidev1.0 -s 1000000 -b 8 -w 0x12 0x34 0x56

# 从SPI设备读取数据
sudo ./spidev-test -D /dev/spidev1.0 -s 1000000 -b 8 -r 3

# 同时读写数据
sudo ./spidev-test -D /dev/spidev1.0 -s 1000000 -b 8 -R 0x01 0x02 0x03
```

### 3. 使用用户空间程序测试

以下是一个简单的SPI测试程序：

```c
#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <linux/spi/spidev.h>
#include <sys/ioctl.h>
#include <unistd.h>

#define SPI_DEVICE "/dev/spidev1.0"
#define SPI_MODE SPI_MODE_0
#define SPI_BITS 8
#define SPI_SPEED 1000000

int main(void)
{
    int fd;
    uint8_t tx_buf[3] = {0x01, 0x02, 0x03};
    uint8_t rx_buf[3] = {0};
    struct spi_ioc_transfer tr = {
        .tx_buf = (unsigned long)tx_buf,
        .rx_buf = (unsigned long)rx_buf,
        .len = 3,
        .speed_hz = SPI_SPEED,
        .bits_per_word = SPI_BITS,
        .delay_usecs = 0,
        .cs_change = 0,
        .tx_nbits = 0,
        .rx_nbits = 0,
        .word_delay_usecs = 0,
        .pad = 0,
    };

    /* 打开SPI设备 */
    fd = open(SPI_DEVICE, O_RDWR);
    if (fd < 0) {
        perror("open");
        return 1;
    }

    /* 设置SPI模式 */
    if (ioctl(fd, SPI_IOC_WR_MODE, &SPI_MODE) < 0) {
        perror("ioctl: SPI_IOC_WR_MODE");
        close(fd);
        return 1;
    }

    /* 设置每字位数 */
    if (ioctl(fd, SPI_IOC_WR_BITS_PER_WORD, &SPI_BITS) < 0) {
        perror("ioctl: SPI_IOC_WR_BITS_PER_WORD");
        close(fd);
        return 1;
    }

    /* 设置传输速率 */
    if (ioctl(fd, SPI_IOC_WR_MAX_SPEED_HZ, &SPI_SPEED) < 0) {
        perror("ioctl: SPI_IOC_WR_MAX_SPEED_HZ");
        close(fd);
        return 1;
    }

    /* 执行SPI传输 */
    if (ioctl(fd, SPI_IOC_MESSAGE(1), &tr) < 0) {
        perror("ioctl: SPI_IOC_MESSAGE");
        close(fd);
        return 1;
    }

    /* 打印传输结果 */
    printf("发送数据: %02X %02X %02X\n", tx_buf[0], tx_buf[1], tx_buf[2]);
    printf("接收数据: %02X %02X %02X\n", rx_buf[0], rx_buf[1], rx_buf[2]);

    /* 关闭设备 */
    close(fd);

    return 0;
}
```

编译和运行：
```bash
gcc spi_test.c -o spi_test
sudo ./spi_test
```

## 性能测试

### 1. 传输速度测试

```bash
# 测试SPI传输速度
time sudo ./spidev-test -D /dev/spidev1.0 -s 10000000 -b 8 -n 10000 -p "test"
```

参数说明：
- `-s 10000000`：设置传输速率为10MHz
- `-n 10000`：传输10000次
- `-p "test"`：传输的数据

### 2. 带宽测试

```bash
# 测试SPI传输带宽
sudo ./spidev-test -D /dev/spidev1.0 -s 50000000 -b 8 -n 1000000 -p "\x00" > /dev/null
```

## 调试SPI驱动

### 1. 内核日志查看

```bash
# 查看SPI相关的内核日志
dmesg | grep -i spi

# 实时查看内核日志
journalctl -k -f | grep -i spi
```

### 2. 启用SPI调试

```bash
# 启用SPI核心调试
echo 1 > /sys/module/spi_core/parameters/debug

# 启用SPI总线驱动调试
echo 1 > /sys/module/spi_<bus-type>/parameters/debug
```

### 3. SPI调试工具

- **spidev-test**：内核提供的SPI测试工具
- **oscilloscope**：硬件示波器，用于观察SPI信号
- **logic analyzer**：逻辑分析仪，用于分析SPI通信时序

### 4. 调试SPI驱动的常见问题

1. **设备无法被识别**
   - 检查SPI总线是否正常工作
   - 检查设备树配置是否正确
   - 检查片选信号是否正常

2. **数据传输失败**
   - 检查SPI模式（CPOL/CPHA）是否正确
   - 检查传输速率是否在设备支持范围内
   - 检查每字位数是否正确

3. **数据传输错误**
   - 检查SPI信号是否有干扰
   - 检查传输速率是否过高
   - 检查数据线连接是否可靠

4. **驱动模块加载失败**
   - 检查内核版本是否匹配
   - 检查模块依赖是否满足
   - 检查编译选项是否正确

## 卸载SPI驱动

```bash
# 卸载SPI设备驱动模块
rmmod spi_driver

# 卸载SPI总线驱动模块
rmmod spi-<bus-type>

# 卸载SPI设备接口模块
rmmod spi-dev

# 卸载SPI核心模块
rmmod spi-core
```

## 常见问题解决方案

### 1. SPI总线冲突

如果SPI设备出现总线冲突，可以通过以下方式解决：

1. **降低传输速率**：
   ```bash
sudo ./spidev-test -D /dev/spidev1.0 -s 5000000 -b 8
```

2. **检查片选信号**：
   确保片选信号在传输过程中保持稳定。

### 2. SPI模式错误

如果SPI模式配置错误，可以通过以下方式修复：

```c
// 尝试不同的SPI模式
int spi_modes[] = {SPI_MODE_0, SPI_MODE_1, SPI_MODE_2, SPI_MODE_3};
for (int i = 0; i < 4; i++) {
    if (ioctl(fd, SPI_IOC_WR_MODE, &spi_modes[i]) < 0) {
        perror("ioctl: SPI_IOC_WR_MODE");
        continue;
    }
    // 测试传输
}
```

### 3. SPI设备权限问题

如果普通用户无法访问SPI设备，可以通过以下方式解决：

```bash
# 添加udev规则，设置设备权限
sudo cat > /etc/udev/rules.d/99-spi-dev.rules << EOF
KERNEL=="spidev*", GROUP="spi", MODE="0660"
EOF

# 创建spi组
sudo groupadd spi

# 将用户添加到spi组
sudo usermod -aG spi $USER

# 重新加载udev规则
sudo udevadm control --reload-rules
sudo udevadm trigger
```

## 总结

SPI驱动测试是确保驱动正常工作的重要步骤。通过本章介绍的编译、加载、测试和调试方法，可以有效地开发和调试SPI驱动。在测试过程中，应该注意观察内核日志，使用适当的调试工具，及时发现和解决问题。

此外，还应该根据具体SPI设备的特点，设计专门的测试用例，确保驱动在各种情况下都能正常工作。