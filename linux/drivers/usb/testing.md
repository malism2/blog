---
title: USB驱动测试
description: USB驱动的编译、加载、测试方法和常见问题解决方案
---

# USB驱动测试

本章介绍USB驱动的编译、模块加载、功能测试方法以及常见问题的解决方案。

## 编译USB驱动

### 1. 内核源码树编译

如果USB驱动是内核源码的一部分，可以通过以下步骤编译：

```bash
# 进入内核源码目录
cd /usr/src/linux

# 配置内核，确保USB支持和相关驱动选项被启用
make menuconfig

# 编译内核和模块
make -j$(nproc)

# 安装内核和模块
make modules_install
make install
```

### 2. 独立模块编译

如果USB驱动是独立开发的，可以使用Makefile进行编译：

```makefile
obj-m += usb_driver.o

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

## 加载USB驱动

### 1. 加载驱动模块

```bash
# 加载USB驱动模块
insmod usb_driver.ko

# 查看模块是否加载成功
lsmod | grep usb_driver
```

### 2. 自动加载驱动

可以通过以下方式实现驱动的自动加载：

1. **添加到模块依赖文件**：
   ```bash
echo "usb_driver" >> /etc/modules
```

2. **使用udev规则**：
   创建文件 `/etc/udev/rules.d/99-usb-driver.rules`：
   ```
   SUBSYSTEM=="usb", ATTRS{idVendor}=="1234", ATTRS{idProduct}=="5678", RUN+="/sbin/modprobe usb_driver"
   ```

## USB设备检测

### 1. 查看USB设备信息

```bash
# 查看所有USB设备
lsusb

# 查看详细USB设备信息
lsusb -v

# 查看USB总线信息
lspci | grep USB
```

### 2. 内核日志查看

```bash
# 查看内核日志
dmesg | grep -i usb

# 实时查看内核日志
journalctl -k -f | grep -i usb
```

## 功能测试

### 1. 控制传输测试

使用`usb-devices`工具查看设备信息，然后使用`usbtest`模块进行控制传输测试：

```bash
# 加载usbtest模块
modprobe usbtest

# 运行控制传输测试
echo 0 > /sys/class/usb_host/usb1/device/usbtest/0/run
```

### 2. 批量传输测试

使用`dd`命令测试批量传输：

```bash
# 向USB设备写入数据
dd if=/dev/zero of=/dev/usb_device bs=1M count=10

# 从USB设备读取数据
dd if=/dev/usb_device of=/dev/null bs=1M count=10
```

### 3. 中断传输测试

对于使用中断传输的设备（如键盘、鼠标），可以通过使用设备本身进行测试。

### 4. 等时传输测试

对于音频、视频等实时设备，可以使用相应的应用程序进行测试：

```bash
# 测试USB音频设备
aplay -D plughw:1,0 test.wav
```

## 性能测试

### 1. 带宽测试

使用`usbmon`工具监控USB带宽：

```bash
# 加载usbmon模块
modprobe usbmon

# 使用wireshark捕获USB流量
wireshark -i usbmon1

# 或者使用cat命令查看原始数据
cat /dev/usbmon1 > usb_trace.log
```

### 2. 延迟测试

使用`usbtest`模块测试传输延迟：

```bash
# 运行延迟测试
echo 1 > /sys/class/usb_host/usb1/device/usbtest/0/run
```

## 调试USB驱动

### 1. 内核调试工具

```bash
# 使用ftrace跟踪USB函数调用
cd /sys/kernel/debug/tracing
echo function > current_tracer
echo usb_ > set_ftrace_filter
echo 1 > tracing_on
# 执行USB操作
echo 0 > tracing_on
cat trace > usb_trace.txt
```

### 2. USB调试工具

- **usbmon**：USB流量监控工具
- **usbtop**：USB带宽监控工具
- **lsusb**：USB设备信息查看工具
- **usb-devices**：USB设备详细信息查看工具

### 3. 调试USB驱动的常见问题

1. **设备无法被识别**
   - 检查USB设备是否正常工作
   - 检查USB驱动是否正确加载
   - 检查USB主机控制器是否正常

2. **数据传输失败**
   - 检查URB的设置是否正确
   - 检查端点描述符是否匹配
   - 检查设备的电源供应是否充足

3. **驱动模块加载失败**
   - 检查内核版本是否匹配
   - 检查模块依赖是否满足
   - 检查编译选项是否正确

4. **设备枚举失败**
   - 检查USB描述符是否正确
   - 检查设备地址分配是否成功
   - 检查配置选择是否正确

## 卸载USB驱动

```bash
# 卸载驱动模块
rmmod usb_driver

# 查看内核日志，确认卸载成功
dmesg | tail
```

## 常见问题解决方案

### 1. USB设备权限问题

如果普通用户无法访问USB设备，可以通过以下方式解决：

```bash
# 添加udev规则，设置设备权限
cat > /etc/udev/rules.d/99-usb-device.rules << EOF
SUBSYSTEM=="usb", ATTRS{idVendor}=="1234", ATTRS{idProduct}=="5678", MODE="0666"
EOF

# 重新加载udev规则
udevadm control --reload-rules
udevadm trigger
```

### 2. USB设备休眠问题

如果USB设备在休眠后无法正常工作，可以通过以下方式解决：

```bash
# 禁用USB自动挂起
cat > /etc/modprobe.d/usb-power.conf << EOF
options usbcore autosuspend=-1
EOF

# 重新加载usbcore模块
modprobe -r usbcore
modprobe usbcore
```

### 3. USB设备速度问题

如果USB设备运行速度低于预期，可以通过以下方式检查：

```bash
# 查看USB设备速度
lsusb -t

# 检查USB总线带宽使用情况
usbtop
```

## 总结

USB驱动测试是确保驱动正常工作的重要步骤。通过本章介绍的编译、加载、测试和调试方法，可以有效地开发和调试USB驱动。在测试过程中，应该注意观察内核日志，使用适当的调试工具，及时发现和解决问题。

此外，还应该根据具体USB设备的特点，设计专门的测试用例，确保驱动在各种情况下都能正常工作。