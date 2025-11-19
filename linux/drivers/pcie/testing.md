---
title: PCIe驱动测试
description: PCIe驱动的编译、加载、测试方法和常见问题解决方案
---

# PCIe驱动测试

本章介绍PCIe驱动的编译、模块加载、功能测试方法以及常见问题的解决方案。

## 编译PCIe驱动

### 1. 内核源码树编译

如果PCIe驱动是内核源码的一部分，可以通过以下步骤编译：

```bash
# 进入内核源码目录
cd /usr/src/linux

# 配置内核，确保PCI支持和相关驱动选项被启用
make menuconfig

# 启用PCI支持
Device Drivers  --->
    [*] PCI support  --->
        <*>   PCI Express support
        [*]   PCI Express ASPM control

# 启用PCI设备驱动
Device Drivers  --->
    <*>   Network device support  --->
        <*>   Ethernet driver support  --->
            <*>   <Your PCIe Ethernet Driver>

# 编译内核和模块
make -j$(nproc)

# 安装内核和模块
make modules_install
make install
```

### 2. 独立模块编译

如果PCIe驱动是独立开发的，可以使用Makefile进行编译：

```makefile
obj-m += pcie_driver.o

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

## 加载PCIe驱动

### 1. 加载驱动模块

```bash
# 加载PCI核心模块
modprobe pci

# 加载PCIe ASPM模块（可选）
modprobe pcie_aspm

# 加载PCIe设备驱动模块
insmod pcie_driver.ko

# 查看模块是否加载成功
lsmod | grep pcie_driver
```

### 2. 自动加载驱动

可以通过以下方式实现驱动的自动加载：

1. **添加到模块依赖文件**：
   ```bash
echo "pcie_driver" >> /etc/modules
```

2. **使用udev规则**：
   ```bash
sudo cat > /etc/udev/rules.d/99-pcie-driver.rules << EOF
SUBSYSTEM=="pci", ATTR{vendor}=="0x1234", ATTR{device}=="0x5678", RUN+="/sbin/modprobe pcie_driver"
EOF
```

## PCIe设备检测

### 1. 查看PCI设备

```bash
# 查看所有PCI设备
lspci

# 查看PCI设备详细信息
lspci -v

# 查看PCI设备的配置空间
lspci -x

# 查看特定PCI设备的信息
lspci -d <vendor>:<device>
```

### 2. 查看PCIe设备信息

```bash
# 查看PCIe设备的链路状态
lspci -vv | grep -A 10 "LnkSta"

# 查看PCIe设备的扩展能力
lspci -vv | grep -A 20 "Capabilities: [.*] Express"
```

### 3. 查看PCI设备驱动绑定情况

```bash
# 查看PCI设备与驱动的绑定情况
lspci -k

# 查看特定PCI设备的驱动信息
lspci -s 01:00.0 -k
```

## 功能测试

### 1. 设备绑定测试

```bash
# 绑定设备到驱动
echo "0000:01:00.0" > /sys/bus/pci/drivers/pcie_driver/bind

# 解绑设备
echo "0000:01:00.0" > /sys/bus/pci/drivers/pcie_driver/unbind
```

### 2. 配置空间访问测试

```bash
# 查看PCI设备的配置空间
sudo setpci -s 01:00.0 -dump

# 读取特定配置寄存器
sudo setpci -s 01:00.0 0x00.l

# 写入配置寄存器
sudo setpci -s 01:00.0 0x40.w=0x1234
```

### 3. 内存映射测试

可以使用以下程序测试PCIe设备的内存映射功能：

```c
#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <sys/mman.h>
#include <unistd.h>

int main(void)
{
    int fd;
    void *bar0;
    unsigned long bar0_size = 0x10000; // 假设BAR0大小为64KB

    /* 打开PCI设备文件 */
    fd = open("/sys/bus/pci/devices/0000:01:00.0/resource0", O_RDWR);
    if (fd < 0) {
        perror("open");
        return 1;
    }

    /* 映射BAR0到用户空间 */
    bar0 = mmap(NULL, bar0_size, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    if (bar0 == MAP_FAILED) {
        perror("mmap");
        close(fd);
        return 1;
    }

    /* 读取BAR0的前4个字节 */
    printf("BAR0[0x0000]: 0x%08X\n", *((unsigned int *)bar0));

    /* 写入BAR0 */
    *((unsigned int *)bar0) = 0x12345678;
    printf("BAR0[0x0000] after write: 0x%08X\n", *((unsigned int *)bar0));

    /* 取消映射 */
    if (munmap(bar0, bar0_size) < 0) {
        perror("munmap");
        close(fd);
        return 1;
    }

    /* 关闭设备文件 */
    close(fd);

    return 0;
}
```

编译和运行：
```bash
gcc pcie_mmap_test.c -o pcie_mmap_test
sudo ./pcie_mmap_test
```

### 4. 中断测试

可以使用以下命令测试PCIe设备的中断：

```bash
# 查看设备的中断信息
cat /proc/interrupts | grep 01:00.0

# 查看中断统计信息
cat /proc/stat | grep intr
```

## 性能测试

### 1. PCIe带宽测试

可以使用PCITree或PCIeBench等工具测试PCIe带宽：

```bash
# 使用PCITree测试PCIe带宽
sudo ./pcitree -b -d 01:00.0

# 使用lspci测试PCIe链路速度
lspci -vv | grep -A 1 "LnkSta:"
```

### 2. 延迟测试

可以使用以下程序测试PCIe设备的延迟：

```c
#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <sys/mman.h>
#include <unistd.h>
#include <time.h>

int main(void)
{
    int fd;
    void *bar0;
    unsigned long bar0_size = 0x10000;
    struct timespec start, end;
    double elapsed;
    int i;

    fd = open("/sys/bus/pci/devices/0000:01:00.0/resource0", O_RDWR);
    if (fd < 0) {
        perror("open");
        return 1;
    }

    bar0 = mmap(NULL, bar0_size, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    if (bar0 == MAP_FAILED) {
        perror("mmap");
        close(fd);
        return 1;
    }

    /* 预热 */
    for (i = 0; i < 1000; i++) {
        *((unsigned int *)bar0) = i;
        __sync_synchronize();
    }

    /* 测试延迟 */
    clock_gettime(CLOCK_MONOTONIC, &start);
    for (i = 0; i < 1000000; i++) {
        *((unsigned int *)bar0) = i;
        __sync_synchronize();
        unsigned int val = *((unsigned int *)bar0);
        __sync_synchronize();
    }
    clock_gettime(CLOCK_MONOTONIC, &end);

    elapsed = (end.tv_sec - start.tv_sec) + (end.tv_nsec - start.tv_nsec) / 1e9;
    printf("Average latency: %.2f ns\n", (elapsed * 1e9) / 2000000);

    munmap(bar0, bar0_size);
    close(fd);

    return 0;
}
```

编译和运行：
```bash
gcc pcie_latency_test.c -o pcie_latency_test
sudo ./pcie_latency_test
```

## 调试PCIe驱动

### 1. 内核日志查看

```bash
# 查看PCI相关的内核日志
dmesg | grep -i pci

# 实时查看内核日志
journalctl -k -f | grep -i pci
```

### 2. 启用PCI调试

```bash
# 启用PCI核心调试
echo 1 > /sys/module/pci/parameters/debug

# 启用PCI设备驱动调试
echo 1 > /sys/module/pcie_driver/parameters/debug
```

### 3. PCI调试工具

- **lspci**：列出PCI设备和详细信息
- **setpci**：读取和写入PCI配置空间
- **pcitree**：PCI设备树查看和带宽测试工具
- **pcieutils**：PCIe设备调试和测试工具集
- **devmem2**：读写物理内存的工具

### 4. 调试PCIe驱动的常见问题

1. **设备无法被识别**
   - 检查PCIe插槽是否正确插入
   - 检查设备电源是否正常
   - 检查BIOS设置是否启用了该PCIe插槽

2. **驱动加载失败**
   - 检查内核版本是否匹配
   - 检查模块依赖是否满足
   - 查看内核日志获取详细错误信息

3. **中断不触发**
   - 检查中断线是否正确配置
   - 检查中断屏蔽寄存器
   - 确保设备中断使能

4. **内存访问错误**
   - 检查BAR映射是否正确
   - 检查内存访问权限
   - 确保内存访问对齐

## 卸载PCIe驱动

```bash
# 卸载PCIe设备驱动模块
rmmod pcie_driver

# 卸载PCIe ASPM模块（可选）
rmmod pcie_aspm
```

## 常见问题解决方案

### 1. PCIe设备无法枚举

**问题**：系统启动后无法识别PCIe设备

**解决方案**：
1. 检查设备是否正确插入PCIe插槽
2. 检查设备电源是否正常
3. 尝试更换PCIe插槽
4. 更新BIOS到最新版本
5. 检查内核是否支持该设备

### 2. PCIe链路速度协商失败

**问题**：PCIe设备链路速度低于预期

**解决方案**：
1. 查看PCIe链路状态：`lspci -vv | grep -A 1 "LnkSta:"`
2. 禁用ASPM：`echo performance > /sys/module/pcie_aspm/parameters/policy`
3. 检查PCIe插槽和设备是否支持相同的速率
4. 尝试降低PCIe总线的传输速率

### 3. PCIe设备中断冲突

**问题**：PCIe设备中断与其他设备冲突

**解决方案**：
1. 查看中断分配情况：`cat /proc/interrupts`
2. 在BIOS中重新分配PCI中断
3. 使用MSI/MSI-X中断代替传统中断
4. 禁用其他设备的中断（临时测试）

### 4. PCIe设备DMA错误

**问题**：PCIe设备DMA传输失败

**解决方案**：
1. 检查DMA地址映射是否正确
2. 确保DMA缓冲区对齐
3. 检查设备DMA能力
4. 启用IOMMU：`intel_iommu=on iommu=pt`

### 5. PCIe设备性能问题

**问题**：PCIe设备性能低于预期

**解决方案**：
1. 检查PCIe链路宽度和速率
2. 优化DMA缓冲区大小
3. 使用分散-聚集（scatter-gather）DMA
4. 减少PCIe事务的数量
5. 优化内存访问模式

## 总结

PCIe驱动测试是确保驱动正常工作的重要步骤。通过本章介绍的编译、加载、测试和调试方法，可以有效地开发和调试PCIe驱动。在测试过程中，应该注意观察内核日志，使用适当的调试工具，及时发现和解决问题。

此外，还应该根据具体PCIe设备的特点，设计专门的测试用例，确保驱动在各种情况下都能正常工作。