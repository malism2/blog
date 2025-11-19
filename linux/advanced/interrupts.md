---
title: 中断处理机制
description: 深入解析Linux内核中断处理机制，包括中断注册、顶半部和底半部处理、中断线程化等核心技术
---

# 中断处理机制

中断是计算机系统中一种重要的异步事件处理机制，它允许硬件设备在需要CPU关注时主动通知CPU。Linux内核提供了完善的中断处理框架，支持多种类型的中断处理方式。本章将深入解析Linux内核的中断处理机制。

## 中断基本概念

### 什么是中断

中断是指CPU在执行程序过程中，由于硬件或软件的请求而暂停当前程序的执行，转去执行处理该请求的程序，处理完后再回到原来被中断的位置继续执行的过程。

### 中断类型

1. **硬件中断**：由硬件设备产生的中断信号
2. **软件中断**：由软件指令触发的中断
3. **异常**：由CPU内部事件（如除零错误、缺页异常等）引起的中断

### 中断处理过程

中断处理通常分为两个阶段：
1. **顶半部（Top Half）**：快速响应中断，执行时间敏感的操作
2. **底半部（Bottom Half）**：执行耗时较长的操作，可以被其他中断打断

## Linux中断处理框架

### 中断描述符

Linux内核使用`irq_desc`结构体来描述每个中断线：

```c
struct irq_desc {
    struct irq_data         irq_data;
    struct irq_chip         *chip;          // 中断控制器
    struct irqaction        *action;        // 中断处理函数链表
    unsigned int            status_use_accessors;
    unsigned int            core_internal_state__do_not_mess_with_it;
    unsigned int            depth;          // 中断禁用计数
    unsigned int            wake_depth;     // 唤醒使能计数
    unsigned int            irq_count;      // 中断计数
    unsigned long           last_unhandled; // 上次未处理时间
    unsigned int            irqs_unhandled; // 未处理中断计数
    // ... 其他字段
};
```

### 中断处理函数

中断处理函数通过`irqaction`结构体注册：

```c
struct irqaction {
    irq_handler_t           handler;        // 中断处理函数
    void                    *dev_id;        // 设备标识
    struct irqaction        *next;          // 链表指针
    irq_handler_t           thread_fn;      // 线程化处理函数
    struct task_struct      *thread;        // 内核线程
    unsigned long           thread_flags;   // 线程标志
    unsigned long           flags;          // 中断标志
    const char              *name;          // 设备名称
    struct proc_dir_entry   *dir;           // /proc/irq/目录项
};
```

## 中断注册与注销

### 注册中断处理函数

```c
#include <linux/interrupt.h>

// 中断处理函数原型
static irqreturn_t my_interrupt_handler(int irq, void *dev_id)
{
    struct my_device *dev = dev_id;
    
    // 处理中断
    // 读取中断状态寄存器
    u32 status = readl(dev->base + STATUS_REG);
    
    // 清除中断标志
    writel(status, dev->base + CLEAR_REG);
    
    // 处理具体中断源
    if (status & RX_COMPLETE) {
        // 处理接收完成中断
        // ...
    }
    
    if (status & TX_COMPLETE) {
        // 处理发送完成中断
        // ...
    }
    
    return IRQ_HANDLED;
}

// 注册中断
int my_device_init(struct my_device *dev)
{
    int ret;
    
    // 申请中断线
    ret = request_irq(dev->irq, my_interrupt_handler,
                      IRQF_SHARED, "my_device", dev);
    if (ret) {
        pr_err("Failed to request IRQ %d\n", dev->irq);
        return ret;
    }
    
    pr_info("IRQ %d registered for my_device\n", dev->irq);
    return 0;
}
```

### 注销中断处理函数

```c
// 注销中断
void my_device_exit(struct my_device *dev)
{
    free_irq(dev->irq, dev);
    pr_info("IRQ %d freed for my_device\n", dev->irq);
}
```

## 顶半部处理

### 顶半部设计原则

1. **快速执行**：尽量减少执行时间
2. **原子操作**：不能睡眠或执行可能引起阻塞的操作
3. **临界区保护**：必要时禁用中断

### 顶半部实现示例

```c
static irqreturn_t uart_interrupt_handler(int irq, void *dev_id)
{
    struct uart_port *port = dev_id;
    unsigned int status, pass_counter = 100;
    unsigned long flags;
    
    spin_lock_irqsave(&port->lock, flags);
    
    do {
        status = readl(port->membase + UART_STATUS);
        if (!(status & UART_IRQ_MASK))
            break;
            
        if (status & UART_RX_IRQ) {
            // 读取接收数据
            unsigned int ch = readl(port->membase + UART_RX);
            // 将数据放入环形缓冲区
            uart_insert_char(port, ch, TTY_NORMAL);
        }
        
        if (status & UART_TX_IRQ) {
            // 检查发送缓冲区
            if (!uart_tx_empty(port)) {
                unsigned int ch = uart_tx_char(port);
                writel(ch, port->membase + UART_TX);
            } else {
                // 禁用发送中断
                writel(readl(port->membase + UART_CTRL) & ~UART_TX_IRQ_EN,
                       port->membase + UART_CTRL);
            }
        }
        
        // 清除中断标志
        writel(status, port->membase + UART_CLEAR);
    } while (--pass_counter);
    
    spin_unlock_irqrestore(&port->lock, flags);
    
    // 通知底半部处理
    if (status & (UART_RX_IRQ | UART_TX_IRQ))
        return IRQ_WAKE_THREAD;
        
    return IRQ_HANDLED;
}
```

## 底半部处理机制

### 软中断（Softirq）

软中断是静态分配的底半部机制，具有最高的执行优先级：

```c
// 软中断类型定义
enum {
    HI_SOFTIRQ=0,
    TIMER_SOFTIRQ,
    NET_TX_SOFTIRQ,
    NET_RX_SOFTIRQ,
    BLOCK_SOFTIRQ,
    BLOCK_IOPOLL_SOFTIRQ,
    TASKLET_SOFTIRQ,
    SCHED_SOFTIRQ,
    HRTIMER_SOFTIRQ,
    RCU_SOFTIRQ,    /* Preferable RCU should always be the last softirq */
    NR_SOFTIRQS
};

// 软中断处理函数
void my_softirq_handler(struct softirq_action *action)
{
    // 执行软中断处理
    // ...
}

// 注册软中断
static struct softirq_action my_softirq = {
    .action = my_softirq_handler,
};

// 在初始化时注册
open_softirq(MY_SOFTIRQ, my_softirq_handler);
```

### Tasklet

Tasklet是基于软中断实现的动态底半部机制：

```c
// 定义tasklet
static struct tasklet_struct my_tasklet;

// tasklet处理函数
void my_tasklet_handler(unsigned long data)
{
    struct my_device *dev = (struct my_device *)data;
    
    // 处理耗时操作
    process_received_data(dev);
    
    // 更新统计信息
    update_statistics(dev);
    
    pr_debug("Tasklet handler executed\n");
}

// 初始化tasklet
static int __init my_module_init(void)
{
    // 初始化tasklet
    tasklet_init(&my_tasklet, my_tasklet_handler, (unsigned long)my_dev);
    return 0;
}

// 调度tasklet执行
static irqreturn_t my_interrupt_handler(int irq, void *dev_id)
{
    // 顶半部处理...
    
    // 调度tasklet在底半部执行
    tasklet_schedule(&my_tasklet);
    
    return IRQ_HANDLED;
}

// 清理tasklet
static void __exit my_module_exit(void)
{
    // 确保tasklet完成执行
    tasklet_kill(&my_tasklet);
}
```

### 工作队列（Workqueue）

工作队列是最灵活的底半部机制，允许睡眠操作：

```c
#include <linux/workqueue.h>

struct my_device {
    struct work_struct work;
    struct delayed_work dwork;
    // 其他设备数据
};

// 工作处理函数
static void my_work_handler(struct work_struct *work)
{
    struct my_device *dev = container_of(work, struct my_device, work);
    
    // 可以执行可能睡眠的操作
    mutex_lock(&dev->mutex);
    
    // 处理复杂逻辑
    process_complex_operation(dev);
    
    // 访问用户空间
    if (need_user_access())
        access_user_space();
    
    mutex_unlock(&dev->mutex);
    
    pr_debug("Work handler executed\n");
}

// 延迟工作处理函数
static void my_delayed_work_handler(struct work_struct *work)
{
    struct my_device *dev = container_of(to_delayed_work(work), 
                                        struct my_device, dwork);
    
    // 延迟执行的操作
    periodic_task(dev);
    
    // 重新调度延迟工作
    schedule_delayed_work(&dev->dwork, msecs_to_jiffies(1000));
}

// 初始化工作
static int my_device_init(struct my_device *dev)
{
    // 初始化工作
    INIT_WORK(&dev->work, my_work_handler);
    INIT_DELAYED_WORK(&dev->dwork, my_delayed_work_handler);
    
    return 0;
}

// 调度工作执行
static irqreturn_t my_interrupt_handler(int irq, void *dev_id)
{
    struct my_device *dev = dev_id;
    
    // 顶半部处理...
    
    // 调度工作在底半部执行
    schedule_work(&dev->work);
    
    return IRQ_HANDLED;
}

// 调度延迟工作
static void start_periodic_task(struct my_device *dev)
{
    schedule_delayed_work(&dev->dwork, msecs_to_jiffies(1000));
}
```

## 中断线程化

从Linux 2.6.30开始，内核支持中断线程化，允许中断处理函数在内核线程中执行：

```c
// 线程化中断处理函数
static irqreturn_t my_threaded_handler(int irq, void *dev_id)
{
    struct my_device *dev = dev_id;
    
    // 可以执行耗时操作
    // 可以睡眠
    msleep(100);
    
    // 处理复杂逻辑
    process_data(dev);
    
    return IRQ_HANDLED;
}

// 主中断处理函数（顶半部）
static irqreturn_t my_main_handler(int irq, void *dev_id)
{
    struct my_device *dev = dev_id;
    
    // 快速响应中断
    // 清除中断标志
    writel(0, dev->base + INT_CLEAR_REG);
    
    // 返回IRQ_WAKE_THREAD唤醒线程处理函数
    return IRQ_WAKE_THREAD;
}

// 注册线程化中断
int my_device_init(struct my_device *dev)
{
    int ret;
    
    // 注册线程化中断处理函数
    ret = request_threaded_irq(dev->irq, my_main_handler, my_threaded_handler,
                              IRQF_SHARED, "my_device", dev);
    if (ret) {
        pr_err("Failed to request threaded IRQ\n");
        return ret;
    }
    
    return 0;
}
```

## 中断亲和性

Linux支持设置中断亲和性，将中断绑定到特定的CPU核心：

```c
#include <linux/interrupt.h>

// 设置中断亲和性
int set_irq_affinity(unsigned int irq, unsigned long cpu_mask)
{
    struct cpumask mask;
    int ret;
    
    cpumask_clear(&mask);
    cpumask_set_cpu(cpu_mask, &mask);
    
    ret = irq_set_affinity_hint(irq, &mask);
    if (ret) {
        pr_err("Failed to set IRQ affinity for IRQ %d\n", irq);
        return ret;
    }
    
    pr_info("IRQ %d affinity set to CPU %lu\n", irq, cpu_mask);
    return 0;
}

// 在设备初始化时设置中断亲和性
static int my_device_init(struct my_device *dev)
{
    int ret;
    
    // 注册中断...
    
    // 将中断绑定到CPU 0
    ret = set_irq_affinity(dev->irq, 0);
    if (ret) {
        pr_warn("Failed to set IRQ affinity, continuing anyway\n");
    }
    
    return 0;
}
```

## 中断调试与性能分析

### 中断统计信息

```bash
# 查看系统中断统计
cat /proc/interrupts

# 查看软中断统计
cat /proc/softirqs

# 查看特定中断的详细信息
ls /proc/irq/
```

### 使用ftrace跟踪中断

```bash
# 启用中断跟踪
echo 1 > /sys/kernel/debug/tracing/events/irq/enable

# 查看跟踪结果
cat /sys/kernel/debug/tracing/trace

# 禁用跟踪
echo 0 > /sys/kernel/debug/tracing/events/irq/enable
```

### 中断性能监控

```c
// 在驱动中添加性能统计
struct my_device_stats {
    unsigned long interrupts;
    unsigned long bytes_received;
    unsigned long bytes_transmitted;
    ktime_t last_interrupt_time;
};

static irqreturn_t my_interrupt_handler(int irq, void *dev_id)
{
    struct my_device *dev = dev_id;
    ktime_t now = ktime_get();
    
    // 更新统计信息
    dev->stats.interrupts++;
    
    // 计算中断间隔时间
    if (dev->stats.last_interrupt_time.tv64) {
        ktime_t delta = ktime_sub(now, dev->stats.last_interrupt_time);
        // 处理时间间隔统计...
    }
    dev->stats.last_interrupt_time = now;
    
    // 处理中断...
    
    return IRQ_HANDLED;
}
```

## 中断处理最佳实践

### 设计原则

1. **最小化顶半部执行时间**：将耗时操作移到底半部
2. **合理选择底半部机制**：
   - 软中断：高频率、时间敏感的任务
   - Tasklet：一般优先级的异步任务
   - 工作队列：需要睡眠或执行复杂操作的任务
3. **避免在中断上下文中睡眠**：中断上下文不能睡眠
4. **正确使用锁机制**：在SMP系统中保护共享数据

### 代码示例

```c
struct my_device {
    spinlock_t lock;                // 保护共享数据
    struct mutex mutex;             // 保护可以睡眠的操作
    struct work_struct work;        // 工作队列
    struct tasklet_struct tasklet;  // tasklet
    struct my_device_stats stats;   // 统计信息
    // 其他设备数据
};

// 顶半部：快速响应中断
static irqreturn_t my_device_isr(int irq, void *dev_id)
{
    struct my_device *dev = dev_id;
    unsigned long flags;
    u32 status;
    
    // 使用自旋锁保护临界区
    spin_lock_irqsave(&dev->lock, flags);
    
    // 读取中断状态
    status = readl(dev->base + STATUS_REG);
    
    // 清除中断标志
    writel(status, dev->base + CLEAR_REG);
    
    // 更新统计（原子操作）
    dev->stats.interrupts++;
    
    spin_unlock_irqrestore(&dev->lock, flags);
    
    // 根据中断类型决定底半部处理方式
    if (status & HIGH_PRIORITY_MASK) {
        // 高优先级任务使用tasklet
        tasklet_schedule(&dev->tasklet);
    } else {
        // 一般任务使用工作队列
        schedule_work(&dev->work);
    }
    
    return IRQ_HANDLED;
}

// Tasklet处理函数：处理高优先级任务
static void my_device_tasklet(unsigned long data)
{
    struct my_device *dev = (struct my_device *)data;
    
    // 处理高优先级任务
    handle_high_priority_tasks(dev);
}

// 工作队列处理函数：处理一般任务
static void my_device_work(struct work_struct *work)
{
    struct my_device *dev = container_of(work, struct my_device, work);
    
    // 可以执行可能睡眠的操作
    mutex_lock(&dev->mutex);
    
    // 处理复杂逻辑
    handle_complex_operations(dev);
    
    mutex_unlock(&dev->mutex);
}

// 设备初始化
static int my_device_init(struct my_device *dev)
{
    int ret;
    
    // 初始化锁和工作队列
    spin_lock_init(&dev->lock);
    mutex_init(&dev->mutex);
    INIT_WORK(&dev->work, my_device_work);
    tasklet_init(&dev->tasklet, my_device_tasklet, (unsigned long)dev);
    
    // 注册中断处理函数
    ret = request_irq(dev->irq, my_device_isr, IRQF_SHARED, "my_device", dev);
    if (ret) {
        pr_err("Failed to register IRQ handler\n");
        return ret;
    }
    
    return 0;
}
```

通过掌握Linux内核中断处理机制，您可以开发出响应迅速、性能优良的设备驱动程序。合理使用各种中断处理技术，能够有效提高系统的实时性和稳定性。