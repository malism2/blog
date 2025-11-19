---
title: 块设备驱动实现
description: 块设备驱动的核心数据结构、API接口和实现细节详解
---

# 块设备驱动实现

块设备驱动是Linux内核中用于管理块存储设备（如硬盘、SSD、USB存储设备等）的重要组件。与字符设备不同，块设备以固定大小的数据块为单位进行读写操作，并支持随机访问。本章将详细介绍块设备驱动的核心数据结构、API接口和实现细节。

## 块设备驱动概述

块设备驱动的主要特点：
1. **随机访问**：可以读写任意位置的数据块
2. **缓冲机制**：通过页缓存提高访问效率
3. **块大小固定**：通常为512字节或4KB
4. **异步操作**：支持异步I/O操作

## 核心数据结构

### 1. 块设备结构体

`struct block_device`代表一个块设备：

```c
struct block_device {
    dev_t bd_dev;
    int bd_openers;
    struct inode *bd_inode;
    struct gendisk *bd_disk;
    struct block_device *bd_contains;
    // ... 其他字段
};
```

### 2. 通用磁盘结构体

`struct gendisk`是块设备驱动的核心结构体：

```c
struct gendisk {
    int major;
    int first_minor;
    int minors;
    char disk_name[DISK_NAME_LEN];
    struct block_device_operations *fops;
    struct request_queue *queue;
    void *private_data;
    sector_t capacity;
    // ... 其他字段
};
```

### 3. 请求队列结构体

`struct request_queue`管理对块设备的I/O请求：

```c
struct request_queue {
    struct list_head queue_head;
    struct elevator_queue *elevator;
    struct blk_mq_tag_set *tag_set;
    // ... 其他字段
};
```

### 4. 请求结构体

`struct request`表示一个I/O请求：

```c
struct request {
    struct list_head queuelist;
    struct request_queue *q;
    unsigned int cmd_flags;
    sector_t sector;
    unsigned int nr_sectors;
    // ... 其他字段
};
```

### 5. 块设备操作结构体

`struct block_device_operations`定义了块设备支持的操作：

```c
struct block_device_operations {
    int (*open) (struct block_device *, fmode_t);
    void (*release) (struct gendisk *, fmode_t);
    int (*ioctl) (struct block_device *, fmode_t, unsigned, unsigned long);
    int (*getgeo) (struct block_device *, struct hd_geometry *);
    // ... 其他操作
};
```

## 块设备驱动实现步骤

### 1. 分配和初始化gendisk结构体

```c
#include <linux/blkdev.h>
#include <linux/genhd.h>

static struct gendisk *my_gendisk;
static int major_number;

// 分配设备号
major_number = register_blkdev(0, "my_block_device");
if (major_number < 0) {
    printk(KERN_ALERT "Failed to register block device\n");
    return major_number;
}

// 分配gendisk结构体
my_gendisk = alloc_disk(1);  // 1个次设备号
if (!my_gendisk) {
    printk(KERN_ALERT "Failed to allocate gendisk\n");
    unregister_blkdev(major_number, "my_block_device");
    return -ENOMEM;
}
```

### 2. 初始化请求队列

```c
static struct request_queue *my_queue;

// 初始化请求队列（使用请求队列方式）
my_queue = blk_init_queue(my_request_fn, &my_queue_lock);
if (!my_queue) {
    printk(KERN_ALERT "Failed to initialize request queue\n");
    put_disk(my_gendisk);
    unregister_blkdev(major_number, "my_block_device");
    return -ENOMEM;
}

// 或者使用多队列方式（推荐）
static struct blk_mq_ops my_mq_ops = {
    .queue_rq = my_queue_rq,
};

static struct blk_mq_tag_set my_tag_set = {
    .ops = &my_mq_ops,
    .nr_hw_queues = 1,
    .queue_depth = 128,
    .numa_node = NUMA_NO_NODE,
    .flags = BLK_MQ_F_SHOULD_MERGE,
};

if (blk_mq_init_tag_set(&my_tag_set)) {
    printk(KERN_ALERT "Failed to initialize tag set\n");
    put_disk(my_gendisk);
    unregister_blkdev(major_number, "my_block_device");
    return -ENOMEM;
}

my_queue = blk_mq_init_queue(&my_tag_set);
if (IS_ERR(my_queue)) {
    printk(KERN_ALERT "Failed to initialize MQ queue\n");
    blk_mq_free_tag_set(&my_tag_set);
    put_disk(my_gendisk);
    unregister_blkdev(major_number, "my_block_device");
    return PTR_ERR(my_queue);
}
```

### 3. 配置gendisk结构体

```c
// 设置设备名称
strcpy(my_gendisk->disk_name, "my_block0");

// 设置次设备号数量
my_gendisk->minors = 1;

// 设置主设备号
my_gendisk->major = major_number;

// 设置请求队列
my_gendisk->queue = my_queue;

// 设置容量（以扇区为单位，1扇区=512字节）
set_capacity(my_gendisk, TOTAL_SECTORS);

// 设置块设备操作
my_gendisk->fops = &my_block_fops;

// 设置私有数据
my_gendisk->private_data = &my_device_data;
```

### 4. 实现请求处理函数

#### 传统请求队列方式

```c
static void my_request_fn(struct request_queue *q)
{
    struct request *req;
    
    while ((req = blk_fetch_request(q)) != NULL) {
        // 处理请求
        if (req->cmd_type != REQ_TYPE_FS) {
            __blk_end_request_all(req, -EIO);
            continue;
        }
        
        // 执行实际的读写操作
        my_handle_request(req);
        
        // 结束请求
        if (!__blk_end_request_cur(req, 0))
            continue;
    }
}

static void my_handle_request(struct request *req)
{
    sector_t sector = blk_rq_pos(req);
    unsigned int nr_sectors = blk_rq_sectors(req);
    char *buffer = bio_data(req->bio);
    int dir = rq_data_dir(req);
    
    // 根据方向执行读或写操作
    if (dir == READ) {
        // 读操作
        my_read_sector(sector, nr_sectors, buffer);
    } else {
        // 写操作
        my_write_sector(sector, nr_sectors, buffer);
    }
}
```

#### 多队列方式（推荐）

```c
static blk_status_t my_queue_rq(struct blk_mq_hw_ctx *hctx,
                               const struct blk_mq_queue_data *bd)
{
    struct request *req = bd->rq;
    
    // 标记请求已经开始处理
    blk_mq_start_request(req);
    
    // 将请求加入处理队列或直接处理
    my_process_request(req);
    
    // 返回状态
    return BLK_STS_OK;
}

static void my_process_request(struct request *req)
{
    sector_t sector = blk_rq_pos(req);
    unsigned int nr_sectors = blk_rq_sectors(req);
    struct bio_vec bvec;
    struct bvec_iter iter;
    blk_status_t status = BLK_STS_OK;
    
    // 遍历bio中的所有段
    bio_for_each_segment(bvec, req->bio, iter) {
        char *buffer = page_address(bvec.bv_page) + bvec.bv_offset;
        unsigned int len = bvec.bv_len;
        
        // 计算对应的扇区数
        unsigned int sectors = len >> 9;  // len / 512
        
        // 执行读写操作
        if (rq_data_dir(req) == READ) {
            if (my_read_sector(sector, sectors, buffer)) {
                status = BLK_STS_IOERR;
                break;
            }
        } else {
            if (my_write_sector(sector, sectors, buffer)) {
                status = BLK_STS_IOERR;
                break;
            }
        }
        
        sector += sectors;
    }
    
    // 完成请求
    blk_mq_end_request(req, status);
}
```

### 5. 实现块设备操作函数

```c
static int my_open(struct block_device *bdev, fmode_t mode)
{
    printk(KERN_INFO "Block device opened\n");
    return 0;
}

static void my_release(struct gendisk *disk, fmode_t mode)
{
    printk(KERN_INFO "Block device released\n");
}

static int my_ioctl(struct block_device *bdev, fmode_t mode,
                   unsigned int cmd, unsigned long arg)
{
    switch (cmd) {
    case BLKGETSIZE64:
        return copy_to_user((void __user *)arg, &device_size, sizeof(u64)) ? -EFAULT : 0;
    default:
        return -ENOTTY;
    }
}

static const struct block_device_operations my_block_fops = {
    .owner = THIS_MODULE,
    .open = my_open,
    .release = my_release,
    .ioctl = my_ioctl,
};
```

### 6. 模块初始化和退出函数

```c
static int __init my_block_driver_init(void)
{
    // 注册块设备
    major_number = register_blkdev(0, "my_block_device");
    if (major_number < 0) {
        printk(KERN_ALERT "Failed to register block device\n");
        return major_number;
    }
    
    // 分配gendisk结构体
    my_gendisk = alloc_disk(1);
    if (!my_gendisk) {
        printk(KERN_ALERT "Failed to allocate gendisk\n");
        unregister_blkdev(major_number, "my_block_device");
        return -ENOMEM;
    }
    
    // 初始化请求队列
    my_queue = blk_mq_init_queue(&my_tag_set);
    if (IS_ERR(my_queue)) {
        printk(KERN_ALERT "Failed to initialize MQ queue\n");
        put_disk(my_gendisk);
        unregister_blkdev(major_number, "my_block_device");
        return PTR_ERR(my_queue);
    }
    
    // 配置gendisk
    strcpy(my_gendisk->disk_name, "my_block0");
    my_gendisk->minors = 1;
    my_gendisk->major = major_number;
    my_gendisk->queue = my_queue;
    set_capacity(my_gendisk, TOTAL_SECTORS);
    my_gendisk->fops = &my_block_fops;
    my_gendisk->private_data = &my_device_data;
    
    // 添加gendisk到系统
    add_disk(my_gendisk);
    
    printk(KERN_INFO "My block device driver loaded successfully\n");
    return 0;
}

static void __exit my_block_driver_exit(void)
{
    // 删除gendisk
    del_gendisk(my_gendisk);
    
    // 清理请求队列
    blk_cleanup_queue(my_queue);
    
    // 释放gendisk
    put_disk(my_gendisk);
    
    // 注销块设备
    unregister_blkdev(major_number, "my_block_device");
    
    printk(KERN_INFO "My block device driver unloaded\n");
}

module_init(my_block_driver_init);
module_exit(my_block_driver_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Your Name");
MODULE_DESCRIPTION("A simple block device driver");
MODULE_VERSION("1.0");
```

## 高级特性实现

### 1. 使用bio层直接处理

```c
static void my_submit_bio(struct bio *bio)
{
    struct bio_vec bvec;
    struct bvec_iter iter;
    sector_t sector = bio->bi_iter.bi_sector;
    
    bio_for_each_segment(bvec, bio, iter) {
        char *buffer = page_address(bvec.bv_page) + bvec.bv_offset;
        unsigned int len = bvec.bv_len;
        unsigned int sectors = len >> 9;
        
        if (bio_data_dir(bio) == READ) {
            my_read_sector(sector, sectors, buffer);
        } else {
            my_write_sector(sector, sectors, buffer);
        }
        
        sector += sectors;
    }
    
    // 完成bio
    bio_endio(bio);
}
```

### 2. 实现分区支持

```c
// 在模块初始化后扫描分区
static int __init my_block_driver_init(void)
{
    // ... 前面的初始化代码 ...
    
    // 添加gendisk到系统
    add_disk(my_gendisk);
    
    // 扫描分区
    rescan_partitions(my_gendisk->disk_name, my_gendisk);
    
    return 0;
}
```

### 3. 实现统计信息

```c
#include <linux/blktrace_api.h>

// 更新统计信息
static void my_update_stats(int rw, unsigned long bytes)
{
    struct gendisk *disk = my_gendisk;
    
    if (rw == READ) {
        part_stat_lock();
        part_stat_inc(&disk->part0, ios[READ]);
        part_stat_add(&disk->part0, sectors[READ], bytes >> 9);
        part_stat_unlock();
    } else {
        part_stat_lock();
        part_stat_inc(&disk->part0, ios[WRITE]);
        part_stat_add(&disk->part0, sectors[WRITE], bytes >> 9);
        part_stat_unlock();
    }
}
```

## 调试技巧

### 1. 使用blktrace工具

```bash
# 跟踪块设备I/O
blktrace -d /dev/my_block0 -o - | blkparse -i -

# 或者保存到文件
blktrace /dev/my_block0
blkparse my_block0.blktrace.*
```

### 2. 内核调试输出

```c
#define DEBUG
#ifdef DEBUG
#define blk_dbg(fmt, ...) \
    printk(KERN_DEBUG "my_block: %s:%d: " fmt, __func__, __LINE__, ##__VA_ARGS__)
#else
#define blk_dbg(fmt, ...)
#endif

// 在关键位置添加调试信息
blk_dbg("Processing request: sector=%llu, nr_sectors=%u\n", 
        (unsigned long long)sector, nr_sectors);
```

### 3. 使用dynamic debug

```c
#define dy_dbg(fmt, ...) \
    dynamic_pr_debug("my_block: " fmt, ##__VA_ARGS__)

// 启用动态调试
// echo 'file my_block_driver.c +p' > /sys/kernel/debug/dynamic_debug/control
```

## 性能优化建议

1. **批量处理请求**：合并相邻的请求以减少寻道时间
2. **预读机制**：预测性地读取可能需要的数据
3. **缓存策略**：合理使用页缓存提高访问效率
4. **中断处理优化**：使用底半部处理耗时操作
5. **内存管理**：使用DMA一致性内存提高数据传输效率

## 最佳实践

1. **错误处理**：确保在每个可能失败的步骤都有适当的错误处理
2. **资源管理**：正确分配和释放所有内核资源
3. **并发保护**：使用适当的锁机制保护共享数据
4. **内存安全**：正确处理用户空间和内核空间的数据传输
5. **兼容性**：遵循内核API规范，确保代码在不同内核版本间的兼容性

通过深入理解块设备驱动的实现细节，你可以开发出高性能、稳定的块设备驱动程序，为各种存储设备提供可靠的支持。