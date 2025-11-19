---
title: 字符设备驱动测试
date: 2024-01-15
description: Linux字符设备驱动的测试方法和示例
categories:
  - Linux驱动开发
  - 驱动测试
tags:
  - Linux
  - 驱动开发
  - 字符设备
  - 驱动测试
---

# 字符设备驱动测试

字符设备驱动是Linux内核中最常见的驱动类型之一，为用户空间提供了对硬件设备的字节流访问接口。本文将详细介绍字符设备驱动的测试方法、工具和示例。

## 1. 字符设备驱动测试概述

字符设备驱动测试主要关注以下几个方面：

- 设备节点的创建和权限设置
- 基本I/O操作（open, read, write, close）
- 设备特定的ioctl命令
- 并发访问控制
- 错误处理
- 性能指标

## 2. 基本测试工具

### 2.1 文件操作命令

最基本的字符设备测试可以使用标准的文件操作命令：

```bash
# 查看设备节点
ls -l /dev/mychardev

# 读取设备内容
cat /dev/mychardev

# 写入设备
echo "test data" > /dev/mychardev

# 十六进制查看
dd if=/dev/mychardev of=/tmp/output bs=1 count=100
hexdump -C /tmp/output
```

### 2.2 专用测试工具

- **strace**：跟踪系统调用
- **lsof**：查看设备的打开情况
- **dd**：进行块级I/O测试
- **fio**：进行性能测试

## 3. 用户空间测试程序

### 3.1 基本I/O测试程序

```c
#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>

#define DEVICE_PATH "/dev/mychardev"
#define BUFFER_SIZE 1024

int main() {
    int fd;
    char buffer[BUFFER_SIZE];
    ssize_t bytes_read, bytes_written;

    // 打开设备
    printf("Opening device %s...\n", DEVICE_PATH);
    fd = open(DEVICE_PATH, O_RDWR);
    if (fd < 0) {
        perror("Failed to open device");
        return EXIT_FAILURE;
    }

    // 写入测试数据
    const char *test_data = "Hello, Character Device!";
    printf("Writing data: %s\n", test_data);
    bytes_written = write(fd, test_data, strlen(test_data));
    if (bytes_written < 0) {
        perror("Failed to write to device");
        close(fd);
        return EXIT_FAILURE;
    }
    printf("Written %zd bytes\n", bytes_written);

    // 重置文件指针
    lseek(fd, 0, SEEK_SET);

    // 读取数据
    printf("Reading data...\n");
    bytes_read = read(fd, buffer, BUFFER_SIZE - 1);
    if (bytes_read < 0) {
        perror("Failed to read from device");
        close(fd);
        return EXIT_FAILURE;
    }
    buffer[bytes_read] = '\0';
    printf("Read %zd bytes: %s\n", bytes_read, buffer);

    // 关闭设备
    close(fd);
    printf("Test completed successfully!\n");

    return EXIT_SUCCESS;
}
```

### 3.2 ioctl测试程序

```c
#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/ioctl.h>

#define DEVICE_PATH "/dev/mychardev"

// 假设设备定义了以下ioctl命令
#define MY_IOCTL_SET_VALUE _IOW('M', 1, int)
#define MY_IOCTL_GET_VALUE _IOR('M', 2, int)

int main() {
    int fd;
    int value = 42;
    int result;

    fd = open(DEVICE_PATH, O_RDWR);
    if (fd < 0) {
        perror("Failed to open device");
        return EXIT_FAILURE;
    }

    // 测试SET ioctl
    printf("Setting value to %d\n", value);
    if (ioctl(fd, MY_IOCTL_SET_VALUE, &value) < 0) {
        perror("ioctl SET failed");
        close(fd);
        return EXIT_FAILURE;
    }

    // 测试GET ioctl
    printf("Getting value...\n");
    if (ioctl(fd, MY_IOCTL_GET_VALUE, &result) < 0) {
        perror("ioctl GET failed");
        close(fd);
        return EXIT_FAILURE;
    }

    printf("Retrieved value: %d\n", result);

    close(fd);
    return EXIT_SUCCESS;
}
```

## 4. 并发测试

### 4.1 多进程并发测试

```c
#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>
#include <sys/wait.h>

#define DEVICE_PATH "/dev/mychardev"
#define BUFFER_SIZE 64
#define NUM_PROCESSES 5

void test_process(int id) {
    int fd;
    char buffer[BUFFER_SIZE];
    ssize_t bytes;

    fd = open(DEVICE_PATH, O_RDWR);
    if (fd < 0) {
        perror("Failed to open device");
        exit(EXIT_FAILURE);
    }

    // 写入进程特定的数据
    snprintf(buffer, BUFFER_SIZE, "Data from process %d", id);
    printf("Process %d writing: %s\n", id, buffer);
    bytes = write(fd, buffer, strlen(buffer));
    if (bytes < 0) {
        perror("Write failed");
        close(fd);
        exit(EXIT_FAILURE);
    }

    // 读取数据
    lseek(fd, 0, SEEK_SET);
    bytes = read(fd, buffer, BUFFER_SIZE - 1);
    if (bytes < 0) {
        perror("Read failed");
        close(fd);
        exit(EXIT_FAILURE);
    }
    buffer[bytes] = '\0';
    printf("Process %d read: %s\n", id, buffer);

    close(fd);
}

int main() {
    pid_t pids[NUM_PROCESSES];
    int i;

    // 创建多个测试进程
    for (i = 0; i < NUM_PROCESSES; i++) {
        pids[i] = fork();
        if (pids[i] < 0) {
            perror("Fork failed");
            exit(EXIT_FAILURE);
        } else if (pids[i] == 0) {
            // 子进程
            test_process(i);
            exit(EXIT_SUCCESS);
        }
    }

    // 等待所有子进程完成
    for (i = 0; i < NUM_PROCESSES; i++) {
        waitpid(pids[i], NULL, 0);
    }

    printf("All processes completed\n");
    return EXIT_SUCCESS;
}
```

## 5. 性能测试

### 5.1 使用dd进行基本性能测试

```bash
# 测试写入性能
time dd if=/dev/zero of=/dev/mychardev bs=4k count=10000

# 测试读取性能
time dd if=/dev/mychardev of=/dev/null bs=4k count=10000
```

### 5.2 使用fio进行高级性能测试

```bash
# 随机读写测试
fio --name=chardev_test --filename=/dev/mychardev --rw=randrw --bs=4k --size=100M --numjobs=4 --time_based --runtime=60

# 顺序读写测试
fio --name=chardev_seq_test --filename=/dev/mychardev --rw=rw --bs=64k --size=200M --numjobs=2 --time_based --runtime=30
```

## 6. KUnit单元测试

### 6.1 字符设备核心功能单元测试

```c
#include <kunit/test.h>
#include <linux/cdev.h>
#include <linux/fs.h>

// 假设我们要测试的字符设备操作函数
extern int mychardev_open(struct inode *inode, struct file *file);
extern int mychardev_release(struct inode *inode, struct file *file);
extern ssize_t mychardev_read(struct file *file, char __user *buf, size_t count, loff_t *pos);
extern ssize_t mychardev_write(struct file *file, const char __user *buf, size_t count, loff_t *pos);

static void mychardev_test_open(struct kunit *test) {
    struct inode inode = {0};
    struct file file = {0};
    int result;

    // 模拟inode和file结构
    inode.i_cdev = kunit_kzalloc(test, sizeof(struct cdev), GFP_KERNEL);
    KUNIT_ASSERT_NOT_ERR_OR_NULL(test, inode.i_cdev);

    result = mychardev_open(&inode, &file);
    KUNIT_EXPECT_EQ(test, result, 0);
}

static void mychardev_test_release(struct kunit *test) {
    struct inode inode = {0};
    struct file file = {0};
    int result;

    result = mychardev_release(&inode, &file);
    KUNIT_EXPECT_EQ(test, result, 0);
}

static void mychardev_test_read_write(struct kunit *test) {
    struct file file = {0};
    char kernel_buf[64] = "Hello KUnit!";
    char user_buf[64] = {0};
    ssize_t result;

    // 模拟文件私有数据
    file.private_data = kernel_buf;

    // 测试写入
    result = mychardev_write(&file, kernel_buf, strlen(kernel_buf), NULL);
    KUNIT_EXPECT_EQ(test, result, (ssize_t)strlen(kernel_buf));

    // 测试读取
    result = mychardev_read(&file, user_buf, sizeof(user_buf), NULL);
    KUNIT_EXPECT_GT(test, result, 0);
    KUNIT_EXPECT_STREQ(test, user_buf, kernel_buf);
}

static struct kunit_case mychardev_test_cases[] = {
    KUNIT_CASE(mychardev_test_open),
    KUNIT_CASE(mychardev_test_release),
    KUNIT_CASE(mychardev_test_read_write),
    {}
};

static struct kunit_suite mychardev_test_suite = {
    .name = "mychardev",
    .test_cases = mychardev_test_cases,
};

kunit_test_suite(mychardev_test_suite);

MODULE_LICENSE("GPL");
```

## 7. 错误注入测试

### 7.1 内存不足错误测试

```c
#include <kunit/test.h>
#include <linux/slab.h>

static void mychardev_test_memory_allocation(struct kunit *test) {
    // 模拟内存不足情况
    kunit_set_allocation_limit(test, 0);
    
    struct my_device_data *data = kmalloc(sizeof(*data), GFP_KERNEL);
    
    // 验证内存分配失败
    KUNIT_EXPECT_ERR_OR_NULL(test, data);
    
    // 恢复正常内存分配
    kunit_clear_allocation_limit(test);
}
```

### 7.2 用户空间内存访问错误测试

```c
static void mychardev_test_invalid_user_memory(struct kunit *test) {
    struct file file = {0};
    char kernel_buf[32] = "test data";
    char *invalid_user_ptr = (char *)0x1000; // 无效的用户空间地址
    ssize_t result;

    file.private_data = kernel_buf;

    // 测试写入无效用户内存
    result = mychardev_write(&file, invalid_user_ptr, 10, NULL);
    KUNIT_EXPECT_EQ(test, result, -EFAULT);
}
```

## 8. 集成测试

### 8.1 完整功能测试脚本

```bash
#!/bin/bash

DEVICE="/dev/mychardev"
TEST_FILE="/tmp/test_data.txt"

# 测试1: 设备节点存在性
if [ ! -c "$DEVICE" ]; then
    echo "Error: Device node $DEVICE not found!"
    exit 1
fi

echo "Test 1 passed: Device node exists"

# 测试2: 基本读写操作
echo "Hello from test script" > "$DEVICE"
if [ $? -ne 0 ]; then
    echo "Error: Write operation failed!"
    exit 1
fi

cat "$DEVICE" > "$TEST_FILE"
if [ $? -ne 0 ]; then
    echo "Error: Read operation failed!"
    exit 1
fi

echo "Test 2 passed: Basic read/write operations"

# 测试3: 验证数据完整性
if grep -q "Hello from test script" "$TEST_FILE"; then
    echo "Test 3 passed: Data integrity verified"
else
    echo "Error: Data integrity check failed!"
    exit 1
fi

# 测试4: 权限测试
chmod 600 "$DEVICE"
sudo -u nobody cat "$DEVICE" 2>&1 > /dev/null
if [ $? -ne 0 ]; then
    echo "Test 4 passed: Permission check"
else
    echo "Warning: Permission check failed! Nobody user could access the device"
fi

# 测试5: 性能测试
echo "Running performance test..."
time dd if=/dev/zero of="$DEVICE" bs=1M count=100 2>&1 | grep real
time dd if="$DEVICE" of=/dev/null bs=1M count=100 2>&1 | grep real

echo "All tests completed!"
rm -f "$TEST_FILE"
```

## 9. 测试最佳实践

### 9.1 测试覆盖范围

- **功能测试**：验证所有设备操作是否按预期工作
- **边界测试**：测试极限条件（如最大/最小缓冲区大小）
- **错误处理测试**：验证对各种错误情况的处理
- **并发测试**：验证多进程/多线程访问的正确性
- **性能测试**：验证在不同负载下的性能表现
- **兼容性测试**：验证在不同内核版本和硬件平台上的兼容性

### 9.2 测试自动化

- 将测试集成到CI/CD流程中
- 使用脚本自动化重复测试
- 记录测试结果以便分析和比较

### 9.3 调试技巧

- 使用strace跟踪系统调用
- 使用dmesg查看内核日志
- 在内核代码中添加适当的printk语句
- 使用ftrace跟踪内核函数调用

## 10. 常见问题排查

### 10.1 设备节点不存在

```bash
# 检查设备是否正确注册
lsmod | grep mychardev

# 检查内核日志
dmesg | grep mychardev

# 手动创建设备节点
mknod /dev/mychardev c <major> <minor>
```

### 10.2 权限问题

```bash
# 检查设备权限
ls -l /dev/mychardev

# 修改权限
chmod 666 /dev/mychardev

# 或者使用udev规则自动设置权限
cat > /etc/udev/rules.d/99-mychardev.rules << EOF
KERNEL=="mychardev", MODE="0666"
EOF
```

### 10.3 性能问题

- 检查是否使用了适当的锁机制
- 优化数据复制操作（使用copy_from_user/copy_to_user的批量操作）
- 考虑使用异步I/O或DMA

## 11. 总结

字符设备驱动测试是确保驱动质量和稳定性的关键环节。通过结合用户空间测试、内核空间单元测试和系统级集成测试，可以全面验证驱动的功能正确性、性能表现和可靠性。

测试过程中应注重：
- 测试覆盖的全面性
- 测试的可重复性和自动化
- 错误情况的模拟和处理
- 性能指标的测量和优化

通过建立完善的测试流程，可以显著提高字符设备驱动的开发质量和维护效率。