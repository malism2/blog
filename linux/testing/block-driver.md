---
title: 块设备驱动测试
date: 2024-01-15
description: Linux块设备驱动的测试方法和示例
categories:
  - Linux驱动开发
  - 驱动测试
tags:
  - Linux
  - 驱动开发
  - 块设备
  - 驱动测试
---

# 块设备驱动测试

块设备驱动是Linux内核中负责处理磁盘、SD卡等存储设备的驱动类型，提供了以块为单位的I/O访问接口。本文将详细介绍块设备驱动的测试方法、工具和示例。

## 1. 块设备驱动测试概述

块设备驱动测试主要关注以下几个方面：

- 设备识别与注册
- 分区表支持
- 基本块I/O操作
- 缓存机制
- 并发访问控制
- 性能与可靠性
- 错误恢复机制

## 2. 基本测试工具

### 2.1 设备管理命令

```bash
# 查看块设备列表
lsblk

# 查看详细块设备信息
fdisk -l

# 查看设备分区
parted /dev/myblockdev print

# 检查设备健康状态
smartctl -a /dev/sda
```

### 2.2 I/O性能测试工具

- **dd**：基本的块I/O测试
- **fio**：全面的I/O性能测试
- **iostat**：监控设备I/O统计信息
- **hdparm**：测试磁盘读取性能

## 3. 基本功能测试

### 3.1 设备识别测试

```bash
# 检查设备是否被识别
dmesg | grep myblockdev

# 检查设备节点
ls -l /dev/myblockdev

# 检查sysfs中的设备信息
ls -la /sys/block/myblockdev/
```

### 3.2 分区测试

```bash
# 创建分区
sfdisk /dev/myblockdev << EOF
,,L
EOF

# 查看新创建的分区
fdisk -l /dev/myblockdev

# 格式化分区
mkfs.ext4 /dev/myblockdev1

# 挂载分区
mkdir -p /mnt/test
mount /dev/myblockdev1 /mnt/test

# 验证挂载
mount | grep myblockdev
```

## 4. I/O性能测试

### 4.1 使用dd进行基本测试

```bash
# 测试顺序写入性能
time dd if=/dev/zero of=/dev/myblockdev bs=1M count=1000 conv=fdatasync

# 测试顺序读取性能
time dd if=/dev/myblockdev of=/dev/null bs=1M count=1000

# 测试随机写入性能
time dd if=/dev/urandom of=/dev/myblockdev bs=4k count=10000 conv=fdatasync
```

### 4.2 使用fio进行高级测试

#### 4.2.1 顺序读写测试

```bash
fio --name=sequential_test --filename=/dev/myblockdev \
    --rw=readwrite --bs=1M --size=1G --numjobs=4 \
    --time_based --runtime=60 --iodepth=64 \
    --direct=1 --group_reporting
```

#### 4.2.2 随机读写测试

```bash
fio --name=random_test --filename=/dev/myblockdev \
    --rw=randrw --bs=4k --size=500M --numjobs=8 \
    --time_based --runtime=60 --iodepth=32 \
    --direct=1 --group_reporting
```

#### 4.2.3 混合工作负载测试

```bash
fio --name=mixed_test --filename=/dev/myblockdev \
    --rw=randrw --rwmixread=70 --bs=8k --size=1G \
    --numjobs=2 --time_based --runtime=120 \
    --iodepth=16 --direct=1 --group_reporting
```

## 5. 压力测试与稳定性测试

### 5.1 长时间稳定性测试

```bash
# 连续写入测试，持续24小时
fio --name=longevity_test --filename=/dev/myblockdev \
    --rw=randrw --bs=4k --size=2G --numjobs=2 \
    --time_based --runtime=86400 --iodepth=16 \
    --direct=1 --group_reporting --log_avg_msec=1000
```

### 5.2 负载测试

```bash
# 高IOPS测试
fio --name=high_iops_test --filename=/dev/myblockdev \
    --rw=randread --bs=512 --size=1G --numjobs=16 \
    --time_based --runtime=300 --iodepth=256 \
    --direct=1 --group_reporting
```

## 6. 错误处理测试

### 6.1 坏块测试

```bash
# 使用badblocks测试坏块
badblocks -v /dev/myblockdev

# 非破坏性读写测试
badblocks -nvs /dev/myblockdev

# 破坏性写入测试
badblocks -wvs /dev/myblockdev
```

### 6.2 错误注入测试

```bash
# 加载错误注入模块
modprobe scsi_debug dev_size_mb=1024

# 启用错误注入
echo "sector=100,count=10,action=read,errno=5" > /sys/block/sdX/device/error_inject

# 测试读取错误扇区
dd if=/dev/sdX of=/dev/null bs=512 skip=100 count=10

# 查看错误信息
dmesg | grep -i error
```

## 7. 内核空间测试

### 7.1 KUnit单元测试

```c
#include <kunit/test.h>
#include <linux/blkdev.h>

// 假设我们要测试的块设备相关函数
extern int myblockdev_init_queue(struct myblockdev *dev);
extern void myblockdev_exit_queue(struct myblockdev *dev);
extern int myblockdev_make_request(struct request_queue *q, struct bio *bio);

static void myblockdev_test_queue_init(struct kunit *test) {
    struct myblockdev *dev;
    int result;

    dev = kunit_kzalloc(test, sizeof(*dev), GFP_KERNEL);
    KUNIT_ASSERT_NOT_ERR_OR_NULL(test, dev);

    result = myblockdev_init_queue(dev);
    KUNIT_EXPECT_EQ(test, result, 0);
    KUNIT_ASSERT_NOT_ERR_OR_NULL(test, dev->queue);

    myblockdev_exit_queue(dev);
}

static void myblockdev_test_make_request(struct kunit *test) {
    struct bio bio = {0};
    struct request_queue q = {0};
    struct bio_vec bv = {0};
    char *buffer;
    int result;

    // 分配测试缓冲区
    buffer = kunit_kzalloc(test, PAGE_SIZE, GFP_KERNEL);
    KUNIT_ASSERT_NOT_ERR_OR_NULL(test, buffer);

    // 设置bio_vec
    bv.bv_page = virt_to_page(buffer);
    bv.bv_len = PAGE_SIZE;
    bv.bv_offset = 0;

    // 初始化bio
    bio_init(&bio, NULL, &bv, 1, 0);
    bio.bi_opf = REQ_OP_READ;
    bio.bi_iter.bi_sector = 0;
    bio.bi_iter.bi_size = PAGE_SIZE;

    // 测试请求处理
    result = myblockdev_make_request(&q, &bio);
    
    // 根据驱动的实现，这里可能返回0或-EINVAL等
    KUNIT_EXPECT_LE(test, result, 0);
}

static struct kunit_case myblockdev_test_cases[] = {
    KUNIT_CASE(myblockdev_test_queue_init),
    KUNIT_CASE(myblockdev_test_make_request),
    {}
};

static struct kunit_suite myblockdev_test_suite = {
    .name = "myblockdev",
    .test_cases = myblockdev_test_cases,
};

kunit_test_suite(myblockdev_test_suite);

MODULE_LICENSE("GPL");
```

### 7.2 块设备模拟测试

```c
#include <linux/module.h>
#include <linux/blkdev.h>
#include <linux/hdreg.h>

#define MYBLOCKDEV_NAME "myblockdev_test"
#define MYBLOCKDEV_SECTORS 102400  // 50MB

static struct myblockdev {
    struct gendisk *disk;
    struct request_queue *queue;
    spinlock_t lock;
    u8 *data;
} dev;

static int myblockdev_open(struct block_device *bdev, fmode_t mode) {
    pr_info("%s called\n", __func__);
    return 0;
}

static void myblockdev_release(struct gendisk *disk, fmode_t mode) {
    pr_info("%s called\n", __func__);
}

static int myblockdev_getgeo(struct block_device *bdev, struct hd_geometry *geo) {
    geo->cylinders = MYBLOCKDEV_SECTORS / (16 * 63);
    geo->heads = 16;
    geo->sectors = 63;
    return 0;
}

static const struct block_device_operations myblockdev_fops = {
    .owner = THIS_MODULE,
    .open = myblockdev_open,
    .release = myblockdev_release,
    .getgeo = myblockdev_getgeo,
};

static void myblockdev_make_request(struct request_queue *q, struct bio *bio) {
    struct bio_vec bv;
    struct bvec_iter iter;
    sector_t sector = bio->bi_iter.bi_sector;
    unsigned int sectors = bio_sectors(bio);
    int rw = bio_data_dir(bio);

    if (sector + sectors > MYBLOCKDEV_SECTORS) {
        bio_endio(bio, -EIO);
        return;
    }

    bio_for_each_segment(bv, bio, iter) {
        unsigned int len = bv.bv_len;
        void *ptr = page_address(bv.bv_page) + bv.bv_offset;
        void *disk_addr = dev.data + sector * 512;

        if (rw == WRITE) {
            memcpy(disk_addr, ptr, len);
        } else {
            memcpy(ptr, disk_addr, len);
        }

        sector += len / 512;
    }

    bio_endio(bio, 0);
}

static int __init myblockdev_test_init(void) {
    int result = 0;

    // 分配模拟磁盘数据
    dev.data = vmalloc(MYBLOCKDEV_SECTORS * 512);
    if (!dev.data) {
        return -ENOMEM;
    }
    memset(dev.data, 0, MYBLOCKDEV_SECTORS * 512);

    // 初始化请求队列
    spin_lock_init(&dev.lock);
    dev.queue = blk_alloc_queue(GFP_KERNEL);
    if (!dev.queue) {
        result = -ENOMEM;
        goto out_free_data;
    }

    blk_queue_make_request(dev.queue, myblockdev_make_request);

    // 分配gendisk
    dev.disk = alloc_disk(1);
    if (!dev.disk) {
        result = -ENOMEM;
        goto out_free_queue;
    }

    // 配置gendisk
    dev.disk->major = register_blkdev(0, MYBLOCKDEV_NAME);
    if (dev.disk->major <= 0) {
        result = dev.disk->major;
        goto out_free_disk;
    }

    dev.disk->first_minor = 0;
    dev.disk->fops = &myblockdev_fops;
    dev.disk->queue = dev.queue;
    dev.disk->private_data = &dev;
    sprintf(dev.disk->disk_name, MYBLOCKDEV_NAME);
    set_capacity(dev.disk, MYBLOCKDEV_SECTORS);

    // 注册设备
    add_disk(dev.disk);

    pr_info("%s: Registered block device with major %d\n",
            MYBLOCKDEV_NAME, dev.disk->major);
    return 0;

out_free_disk:
    put_disk(dev.disk);
out_free_queue:
    blk_cleanup_queue(dev.queue);
out_free_data:
    vfree(dev.data);
    return result;
}

static void __exit myblockdev_test_exit(void) {
    del_gendisk(dev.disk);
    unregister_blkdev(dev.disk->major, MYBLOCKDEV_NAME);
    put_disk(dev.disk);
    blk_cleanup_queue(dev.queue);
    vfree(dev.data);

    pr_info("%s: Unregistered block device\n", MYBLOCKDEV_NAME);
}

module_init(myblockdev_test_init);
module_exit(myblockdev_test_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Test Author");
MODULE_DESCRIPTION("Block device driver test module");
```

## 8. 测试最佳实践

### 8.1 测试策略

- **功能测试优先**：确保设备的基本功能正常工作
- **渐进式测试**：从简单测试到复杂测试逐步进行
- **全面测试覆盖**：包括正常路径和错误路径
- **性能基准测试**：建立性能基线以便比较

### 8.2 性能调优建议

- **调整队列参数**：优化请求队列的深度和调度算法
- **启用直接I/O**：避免缓存开销，提高性能
- **使用适当的块大小**：根据设备特性选择最佳块大小
- **并行处理**：利用多队列和多线程提高并发性能

### 8.3 错误处理建议

- **实现完整的错误检测**：检查所有可能的错误情况
- **提供有意义的错误信息**：便于问题诊断
- **实现错误恢复机制**：提高设备可靠性
- **记录详细的错误日志**：帮助调试和分析

## 9. 常见问题排查

### 9.1 设备无法识别

```bash
# 检查驱动是否加载
lsmod | grep myblockdev

# 检查内核日志
dmesg | grep -i error

# 检查设备树配置（对于嵌入式系统）
dtc -I fs -O dts /proc/device-tree > /tmp/dt.dts
grep -A 20 "myblockdev" /tmp/dt.dts
```

### 9.2 I/O性能差

```bash
# 检查I/O调度器
cat /sys/block/myblockdev/queue/scheduler

# 更改I/O调度器
echo "none" > /sys/block/myblockdev/queue/scheduler

# 检查队列参数
cat /sys/block/myblockdev/queue/nr_requests
cat /sys/block/myblockdev/queue/iodepth
```

### 9.3 设备读写错误

```bash
# 检查坏块
badblocks -v /dev/myblockdev

# 检查设备连接
lspci | grep -i storage

# 检查驱动错误信息
dmesg | grep myblockdev
```

## 10. 总结

块设备驱动测试是确保存储设备性能和可靠性的关键环节。通过结合用户空间工具和内核空间测试，可以全面验证块设备驱动的功能正确性、性能表现和错误处理能力。

测试过程中应注重：
- 基本功能的完整性验证
- 各种I/O模式下的性能测试
- 错误场景的模拟和处理
- 长时间稳定性测试

通过建立完善的测试流程和自动化测试脚本，可以显著提高块设备驱动的开发质量和维护效率。