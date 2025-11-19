# Linux内核内存管理

内存管理是操作系统的核心功能之一，也是驱动开发中必须深入理解的重要概念。Linux内核提供了多层次的内存管理机制，从物理内存的分配到虚拟内存的映射，再到内核对象的高效管理。

## 内存管理概述

Linux内核的内存管理可以分为以下几个层次：

1. **物理内存管理**：管理实际的物理内存页
2. **虚拟内存管理**：处理虚拟地址到物理地址的映射
3. **内核内存分配器**：为内核代码提供内存分配服务
4. **用户空间内存管理**：管理进程的虚拟地址空间

## 物理内存管理

### 页帧管理

Linux内核以页（通常为4KB）为单位管理物理内存。每个物理页由`struct page`结构体描述：

```c
struct page {
    unsigned long flags;
    struct address_space *mapping;
    pgoff_t index;
    struct list_head lru;
    // ... 其他字段
};
```

### 页分配器

内核提供了一系列函数来分配和释放物理页：

```c
#include <linux/gfp.h>
#include <linux/mm.h>

// 分配单个页面
struct page *page = alloc_page(GFP_KERNEL);

// 分配多个连续页面
struct page *pages = alloc_pages(GFP_KERNEL, order);  // 2^order 个页面

// 释放页面
__free_page(page);
__free_pages(pages, order);

// 获取页面的虚拟地址
void *addr = page_address(page);
```

## 虚拟内存管理

### 虚拟地址空间布局

每个进程都有自己的虚拟地址空间，典型的布局如下：

```
+------------------+  <- TASK_SIZE (用户空间上限)
|                  |
|   用户空间       |
|                  |
+------------------+  <- TASK_SIZE - PAGE_SIZE
|   vDSO           |
+------------------+
|   栈             |
|                  |
|   堆             |
|                  |
|   数据段         |
|   代码段         |
+------------------+  <- PAGE_OFFSET (用户空间下限)
|                  |
|   内核空间       |
|                  |
+------------------+  <- 0x00000000
```

### 内存描述符

进程的内存管理信息由`mm_struct`结构体维护：

```c
struct mm_struct {
    struct vm_area_struct *mmap;
    struct rb_root mm_rb;
    unsigned long task_size;
    pgd_t *pgd;
    atomic_t mm_users;
    atomic_t mm_count;
    // ... 其他字段
};
```

### 虚拟内存区域

虚拟内存区域（VMA）由`vm_area_struct`结构体描述：

```c
struct vm_area_struct {
    unsigned long vm_start;
    unsigned long vm_end;
    struct vm_area_struct *vm_next, *vm_prev;
    struct rb_node vm_rb;
    pgprot_t vm_page_prot;
    unsigned long vm_flags;
    struct mm_struct *vm_mm;
    // ... 其他字段
};
```

## 内核内存分配器

### 1. kmalloc/kfree

最基本的内核内存分配函数，分配连续的物理内存：

```c
#include <linux/slab.h>

// 分配内存
void *ptr = kmalloc(size, GFP_KERNEL);

// 释放内存
kfree(ptr);

// 分配并清零内存
void *ptr_zero = kzalloc(size, GFP_KERNEL);

// 重新调整内存大小
void *new_ptr = krealloc(old_ptr, new_size, GFP_KERNEL);
```

常用的分配标志：
- `GFP_KERNEL`：在内核空间中分配，可以睡眠
- `GFP_ATOMIC`：原子上下文中分配，不能睡眠
- `GFP_DMA`：为DMA分配内存

### 2. vmalloc/vfree

分配非连续的物理内存，但虚拟地址连续：

```c
#include <linux/vmalloc.h>

// 分配大块内存
void *ptr = vmalloc(size);

// 释放内存
vfree(ptr);
```

### 3. Slab分配器

Slab分配器专门用于分配小对象，减少内部碎片：

```c
// 创建缓存
struct kmem_cache *cache = kmem_cache_create("my_cache", 
                                            sizeof(struct my_struct),
                                            0, SLAB_HWCACHE_ALIGN, NULL);

// 从缓存中分配对象
struct my_struct *obj = kmem_cache_alloc(cache, GFP_KERNEL);

// 释放对象到缓存
kmem_cache_free(cache, obj);

// 销毁缓存
kmem_cache_destroy(cache);
```

### 4. 内存池

内存池提供了一种预分配内存的方式：

```c
#include <linux/mempool.h>

// 创建内存池
mempool_t *pool = mempool_create_kmalloc_pool(min_nr, size);

// 从内存池分配内存
void *ptr = mempool_alloc(pool, GFP_KERNEL);

// 释放内存到内存池
mempool_free(ptr, pool);

// 销毁内存池
mempool_destroy(pool);
```

## 设备内存映射

在驱动开发中，经常需要访问设备的内存映射I/O区域：

```c
#include <linux/io.h>

// 映射设备内存
void __iomem *io_base = ioremap(phys_addr, size);

// 读写设备寄存器
writel(value, io_base + offset);
value = readl(io_base + offset);

// 取消映射
iounmap(io_base);
```

## DMA内存管理

对于需要DMA操作的设备，内核提供了专门的DMA内存分配函数：

```c
#include <linux/dma-mapping.h>

// 分配一致性DMA内存
void *cpu_addr = dma_alloc_coherent(dev, size, &dma_handle, GFP_KERNEL);

// 同步单向DMA缓冲区
dma_sync_single_for_device(dev, dma_handle, size, DMA_TO_DEVICE);
dma_sync_single_for_cpu(dev, dma_handle, size, DMA_FROM_DEVICE);

// 释放DMA内存
dma_free_coherent(dev, size, cpu_addr, dma_handle);
```

## 内存屏障

在多处理器系统中，需要使用内存屏障来保证内存操作的顺序：

```c
#include <linux/barrier.h>

// 编译器屏障
barrier();

// 内存屏障
mb();   // 全局内存屏障
rmb();  // 读内存屏障
wmb();  // 写内存屏障

// SMP内存屏障
smp_mb();
smp_rmb();
smp_wmb();
```

## 内存调试技术

### 1. KASAN（Kernel Address Sanitizer）

KASAN是一种内存错误检测工具，可以帮助发现内存越界访问等问题：

```c
// 启用KASAN后，内核会在分配内存时添加影子区域
// 当发生非法访问时会打印详细的错误报告
```

### 2. 内存泄漏检测

使用`kmemleak`工具检测内核内存泄漏：

```bash
# 启用kmemleak
echo 1 > /proc/sys/kernel/kmemleak

# 扫描内存泄漏
echo scan > /proc/sys/kernel/kmemleak

# 查看内存泄漏报告
cat /sys/kernel/debug/kmemleak
```

### 3. 调试宏

在代码中使用调试宏来跟踪内存分配：

```c
#define DEBUG_ALLOC

#ifdef DEBUG_ALLOC
#define dbg_alloc(fmt, ...) \
    pr_debug("ALLOC: %s:%d: " fmt, __func__, __LINE__, ##__VA_ARGS__)
#else
#define dbg_alloc(fmt, ...)
#endif

void *my_kmalloc(size_t size)
{
    void *ptr = kmalloc(size, GFP_KERNEL);
    dbg_alloc("kmalloc(%zu) = %p\n", size, ptr);
    return ptr;
}
```

## 实际驱动示例

以下是一个简单的字符设备驱动，演示了如何在驱动中使用内存管理：

```c
#include <linux/module.h>
#include <linux/fs.h>
#include <linux/uaccess.h>
#include <linux/slab.h>

#define DEVICE_NAME "mem_example"
#define BUFFER_SIZE 1024

static int major_number;
static char *device_buffer;
static int buffer_pointer;

static int dev_open(struct inode *inodep, struct file *filep)
{
    pr_info("Device opened\n");
    return 0;
}

static ssize_t dev_read(struct file *filep, char *buffer, size_t len, loff_t *offset)
{
    int bytes_to_read = min(len, (size_t)(buffer_pointer - *offset));
    
    if (bytes_to_read <= 0)
        return 0;
        
    if (copy_to_user(buffer, device_buffer + *offset, bytes_to_read))
        return -EFAULT;
        
    *offset += bytes_to_read;
    return bytes_to_read;
}

static ssize_t dev_write(struct file *filep, const char *buffer, size_t len, loff_t *offset)
{
    int bytes_to_write = min(len, BUFFER_SIZE - buffer_pointer);
    
    if (bytes_to_write <= 0)
        return -ENOSPC;
        
    if (copy_from_user(device_buffer + buffer_pointer, buffer, bytes_to_write))
        return -EFAULT;
        
    buffer_pointer += bytes_to_write;
    return bytes_to_write;
}

static int dev_release(struct inode *inodep, struct file *filep)
{
    pr_info("Device closed\n");
    return 0;
}

static struct file_operations fops = {
    .open = dev_open,
    .read = dev_read,
    .write = dev_write,
    .release = dev_release,
};

static int __init mem_example_init(void)
{
    // 分配设备缓冲区
    device_buffer = kzalloc(BUFFER_SIZE, GFP_KERNEL);
    if (!device_buffer) {
        pr_err("Failed to allocate device buffer\n");
        return -ENOMEM;
    }
    
    // 注册字符设备
    major_number = register_chrdev(0, DEVICE_NAME, &fops);
    if (major_number < 0) {
        pr_err("Failed to register major number\n");
        kfree(device_buffer);
        return major_number;
    }
    
    pr_info("Memory example device registered with major number %d\n", major_number);
    return 0;
}

static void __exit mem_example_exit(void)
{
    // 释放设备缓冲区
    kfree(device_buffer);
    
    // 注销字符设备
    unregister_chrdev(major_number, DEVICE_NAME);
    pr_info("Memory example device unregistered\n");
}

module_init(mem_example_init);
module_exit(mem_example_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Your Name");
MODULE_DESCRIPTION("Memory management example driver");
```

## 性能优化建议

1. **选择合适的分配函数**：
   - 小对象使用`kmalloc`
   - 大对象使用`vmalloc`
   - 频繁分配的小对象使用slab缓存

2. **避免在原子上下文中睡眠**：
   - 使用`GFP_ATOMIC`而不是`GFP_KERNEL`
   - 避免在中断处理程序中分配大量内存

3. **及时释放内存**：
   - 确保在错误路径上也释放内存
   - 使用`devm_*`函数进行自动资源管理

4. **内存对齐**：
   - 使用`__attribute__((aligned(n)))`进行对齐
   - 利用硬件缓存行对齐提高性能

通过深入理解Linux内核的内存管理机制，你可以编写出更加高效、稳定的驱动程序，并能更好地诊断和解决内存相关的性能问题。