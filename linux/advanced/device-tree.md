---
title: 设备树详解
description: 深入理解Linux内核设备树机制，包括设备树语法、内核解析过程以及驱动开发实践
---

# 设备树详解

设备树（Device Tree，DT）是一种描述硬件的数据结构，在没有设备树之前，内核需要为每种不同的硬件平台编译不同的内核镜像。设备树的引入使得内核可以在运行时动态地识别和配置硬件，大大提高了内核的可移植性和灵活性。

## 设备树基本概念

### 什么是设备树

设备树是一个描述硬件平台信息的数据结构，采用树状层次结构来表示系统中的所有硬件组件及其属性。它最初来源于Open Firmware (IEEE 1275)，后来被Linux内核采用。

### 设备树的优势

1. **减少内核代码冗余**：无需为每个平台维护单独的板级支持包（BSP）
2. **提高可移植性**：同一内核镜像可在不同硬件平台上运行
3. **简化内核配置**：通过设备树文件描述硬件配置，而不是硬编码在内核中
4. **动态硬件识别**：运行时动态识别和配置硬件资源

## 设备树语法

### 设备树源文件格式

设备树源文件使用`.dts`（Device Tree Source）扩展名，采用特定的语法规则来描述硬件信息：

```dts
/dts-v1/;

/ {
    #address-cells = <1>;
    #size-cells = <1>;
    compatible = "custom,platform";
    model = "Custom Platform";

    memory@0 {
        device_type = "memory";
        reg = <0x0 0x10000000>; /* 256MB */
    };

    cpus {
        #address-cells = <1>;
        #size-cells = <0>;

        cpu@0 {
            compatible = "arm,cortex-a9";
            device_type = "cpu";
            reg = <0>;
        };
    };

    soc {
        compatible = "simple-bus";
        #address-cells = <1>;
        #size-cells = <1>;
        ranges;

        serial@101f0000 {
            compatible = "arm,pl011";
            reg = <0x101f0000 0x1000>;
            interrupts = <1>;
        };
    };
};
```

### 节点和属性

设备树由节点（Node）和属性（Property）组成：

1. **节点（Node）**：表示一个设备或硬件组件
2. **属性（Property）**：描述节点的特征和配置信息

```dts
node-name@unit-address {
    property-name = "property-value";
    #address-cells = <1>;
    #size-cells = <1>;
    
    child-node {
        child-property = "child-value";
    };
};
```

### 常用属性

#### compatible属性

`compatible`属性用于匹配驱动程序：

```dts
serial@101f0000 {
    compatible = "arm,pl011", "arm,primecell";
    reg = <0x101f0000 0x1000>;
    interrupts = <1>;
};
```

#### reg属性

`reg`属性描述设备的地址范围：

```dts
memory@80000000 {
    device_type = "memory";
    reg = <0x80000000 0x40000000>; /* 1GB memory starting at 0x80000000 */
};
```

#### interrupts属性

`interrupts`属性描述设备使用的中断号：

```dts
gpio@10200000 {
    compatible = "ti,omap3-gpio";
    reg = <0x10200000 0x1000>;
    interrupts = <32>;
    gpio-controller;
    #gpio-cells = <2>;
};
```

### 引用和别名

#### phandle引用

设备之间可以通过phandle相互引用：

```dts
clocks {
    osc: oscillator {
        compatible = "fixed-clock";
        #clock-cells = <0>;
        clock-frequency = <25000000>;
    };
};

serial@101f0000 {
    compatible = "arm,pl011";
    reg = <0x101f0000 0x1000>;
    clocks = <&osc>;
};
```

#### 别名（Aliases）

为常用节点创建别名：

```dts
aliases {
    serial0 = &uart0;
    serial1 = &uart1;
    ethernet0 = &eth0;
};

soc {
    uart0: serial@101f0000 {
        compatible = "arm,pl011";
        reg = <0x101f0000 0x1000>;
    };
    
    uart1: serial@101f1000 {
        compatible = "arm,pl011";
        reg = <0x101f1000 0x1000>;
    };
};
```

### 标准化约定

#### chosen节点

传递启动参数给内核：

```dts
chosen {
    bootargs = "console=ttyS0,115200 earlyprintk";
    stdout-path = "serial0:115200n8";
};
```

#### reserved-memory节点

保留特定内存区域：

```dts
reserved-memory {
    #address-cells = <1>;
    #size-cells = <1>;
    ranges;
    
    framebuffer@8f000000 {
        reg = <0x8f000000 0x1000000>;
        no-map;
    };
};
```

## 设备树编译

### DTC工具

设备树编译器（Device Tree Compiler，DTC）用于将`.dts`文件编译成二进制格式的`.dtb`文件：

```bash
# 编译设备树源文件
dtc -I dts -O dtb -o my-platform.dtb my-platform.dts

# 反编译设备树二进制文件
dtc -I dtb -O dts -o my-platform.dts my-platform.dtb

# 检查设备树语法
dtc -I dts -O dtb -o /dev/null my-platform.dts
```

### 设备树覆盖层（Overlay）

设备树覆盖层允许在运行时修改设备树：

```dts
/dts-v1/;
/plugin/;

/ {
    compatible = "rpi,rpi4-model-b";
    
    fragment@0 {
        target = <&spi0>;
        __overlay__ {
            status = "okay";
            spidev@0 {
                status = "disabled";
            };
        };
    };
};
```

## 内核中的设备树解析

### 展平设备树（Flattened Device Tree，FDT）

内核使用展平设备树（FDT）来表示设备树结构：

```c
#include <linux/of_fdt.h>

// 解析设备树
void __init early_init_dt_scan_nodes(void)
{
    /* Retrieve various flat tree items */
    of_scan_flat_dt(early_init_dt_scan_chosen, boot_command_line);
    of_scan_flat_dt(early_init_dt_scan_root, NULL);
    of_scan_flat_dt(early_init_dt_scan_memory, NULL);
}
```

### OF（Open Firmware）API

内核提供了一套OF API用于访问设备树信息：

```c
#include <linux/of.h>

// 查找设备节点
struct device_node *of_find_node_by_path(const char *path);
struct device_node *of_find_compatible_node(struct device_node *from,
                                          const char *type,
                                          const char *compatible);

// 读取属性值
int of_property_read_u32(const struct device_node *np,
                        const char *propname,
                        u32 *out_value);
int of_property_read_string(const struct device_node *np,
                           const char *propname,
                           const char **out_string);
```

### 设备匹配机制

内核通过`compatible`属性匹配设备驱动：

```c
static const struct of_device_id my_driver_of_match[] = {
    { .compatible = "vendor,device1", },
    { .compatible = "vendor,device2", },
    { /* sentinel */ }
};
MODULE_DEVICE_TABLE(of, my_driver_of_match);

static struct platform_driver my_platform_driver = {
    .probe = my_probe,
    .remove = my_remove,
    .driver = {
        .name = "my-driver",
        .of_match_table = my_driver_of_match,
    },
};
```

## 设备树驱动开发

### 获取设备资源

```c
static int my_probe(struct platform_device *pdev)
{
    struct device *dev = &pdev->dev;
    struct device_node *np = dev->of_node;
    struct resource *res;
    void __iomem *base;
    int irq;
    u32 val;
    
    /* 获取内存资源 */
    res = platform_get_resource(pdev, IORESOURCE_MEM, 0);
    if (!res) {
        dev_err(dev, "No memory resource\n");
        return -ENODEV;
    }
    
    base = devm_ioremap_resource(dev, res);
    if (IS_ERR(base))
        return PTR_ERR(base);
    
    /* 获取中断资源 */
    irq = platform_get_irq(pdev, 0);
    if (irq < 0) {
        dev_err(dev, "No IRQ resource\n");
        return irq;
    }
    
    /* 从设备树读取属性 */
    if (of_property_read_u32(np, "clock-frequency", &val)) {
        dev_warn(dev, "Using default clock frequency\n");
        val = 1000000; /* 默认频率1MHz */
    }
    
    /* 初始化设备... */
    
    return 0;
}
```

### GPIO和时钟获取

```c
#include <linux/of_gpio.h>
#include <linux/clk.h>

static int my_probe(struct platform_device *pdev)
{
    struct device *dev = &pdev->dev;
    struct device_node *np = dev->of_node;
    struct clk *clk;
    int gpio;
    
    /* 获取GPIO */
    gpio = of_get_gpio(np, 0);
    if (gpio < 0) {
        dev_err(dev, "Failed to get GPIO\n");
        return gpio;
    }
    
    if (devm_gpio_request_one(dev, gpio, GPIOF_OUT_INIT_LOW, "my-gpio")) {
        dev_err(dev, "Failed to request GPIO\n");
        return -EINVAL;
    }
    
    /* 获取时钟 */
    clk = devm_clk_get(dev, "bus");
    if (IS_ERR(clk)) {
        dev_err(dev, "Failed to get clock\n");
        return PTR_ERR(clk);
    }
    
    clk_prepare_enable(clk);
    
    return 0;
}
```

### 设备树绑定文档

设备树绑定文档描述了如何在设备树中描述特定类型的设备：

```yaml
# Example device tree binding documentation
title: My Custom Device

description: |
  This document describes the device tree bindings for My Custom Device.

compatible: "vendor,my-device"

properties:
  compatible:
    type: string-array
    description: Compatible string for the device
    
  reg:
    type: array
    description: Memory-mapped registers
    maxItems: 1
    
  interrupts:
    type: array
    description: Interrupt specifier
    maxItems: 1
    
  clock-frequency:
    type: int
    description: Clock frequency in Hz
    default: 1000000

examples:
  - |
    my_device: my-device@10000000 {
        compatible = "vendor,my-device";
        reg = <0x10000000 0x1000>;
        interrupts = <10>;
        clock-frequency = <2000000>;
    };
```

## 设备树调试技巧

### 内核调试选项

启用相关内核配置选项：

```bash
CONFIG_OF=y
CONFIG_OF_FLATTREE=y
CONFIG_OF_EARLY_FLATTREE=y
CONFIG_OF_RESOLVE=y
CONFIG_OF_OVERLAY=y
```

### 运行时调试

```bash
# 查看设备树节点
ls /proc/device-tree/

# 查看设备树属性
cat /proc/device-tree/soc/serial@101f0000/compatible

# 使用of_dump命令（如果可用）
echo "soc/serial@101f0000" > /sys/kernel/debug/of/dump
```

### 内核日志调试

```c
static int my_probe(struct platform_device *pdev)
{
    struct device_node *np = pdev->dev.of_node;
    
    /* 调试输出设备树信息 */
    dev_info(&pdev->dev, "Probing device with compatible: %s\n",
             of_node_full_name(np));
             
    of_print_device_tree(np); /* 如果可用 */
    
    return 0;
}
```

## 实际应用案例

### 完整的设备树示例

```dts
/dts-v1/;
/include/ "skeleton.dtsi"

/ {
    model = "My Custom Board";
    compatible = "myvendor,custom-board", "myvendor,generic-board";
    
    aliases {
        serial0 = &uart0;
        spi0 = &spi1;
        i2c0 = &i2c1;
    };
    
    memory@80000000 {
        device_type = "memory";
        reg = <0x80000000 0x40000000>; /* 1GB */
    };
    
    chosen {
        bootargs = "console=ttyS0,115200 root=/dev/mmcblk0p2 rw rootwait";
        stdout-path = "serial0:115200n8";
    };
    
    reserved-memory {
        #address-cells = <1>;
        #size-cells = <1>;
        ranges;
        
        framebuffer@90000000 {
            reg = <0x90000000 0x800000>; /* 8MB */
            no-map;
        };
    };
    
    soc {
        uart0: serial@101f0000 {
            compatible = "ns16550a";
            reg = <0x101f0000 0x1000>;
            interrupts = <1>;
            clock-frequency = <1843200>;
            current-speed = <115200>;
            reg-shift = <2>;
            reg-io-width = <1>;
        };
        
        i2c1: i2c@10200000 {
            compatible = "snps,designware-i2c";
            reg = <0x10200000 0x1000>;
            interrupts = <2>;
            clock-frequency = <400000>;
            #address-cells = <1>;
            #size-cells = <0>;
            
            eeprom@50 {
                compatible = "atmel,24c02";
                reg = <0x50>;
            };
        };
        
        spi1: spi@10210000 {
            compatible = "snps,designware-spi";
            reg = <0x10210000 0x1000>;
            interrupts = <3>;
            #address-cells = <1>;
            #size-cells = <0>;
            
            flash@0 {
                compatible = "jedec,spi-nor";
                reg = <0>;
                spi-max-frequency = <50000000>;
            };
        };
        
        gpio: gpio@10220000 {
            compatible = "myvendor,gpio-controller";
            reg = <0x10220000 0x1000>;
            interrupts = <4>;
            gpio-controller;
            #gpio-cells = <2>;
            ngpios = <32>;
        };
    };
    
    leds {
        compatible = "gpio-leds";
        
        heartbeat {
            label = "heartbeat";
            gpios = <&gpio 0 GPIO_ACTIVE_HIGH>;
            linux,default-trigger = "heartbeat";
        };
        
        network {
            label = "network";
            gpios = <&gpio 1 GPIO_ACTIVE_HIGH>;
            linux,default-trigger = "netdev";
        };
    };
};
```

### 驱动程序示例

```c
#include <linux/module.h>
#include <linux/platform_device.h>
#include <linux/of.h>
#include <linux/of_gpio.h>
#include <linux/io.h>
#include <linux/interrupt.h>

#define DRIVER_NAME "my-custom-device"

struct my_device {
    void __iomem *base;
    int irq;
    int gpio_led;
    struct device *dev;
};

static irqreturn_t my_device_irq_handler(int irq, void *dev_id)
{
    struct my_device *my_dev = dev_id;
    
    /* 处理中断 */
    dev_info(my_dev->dev, "Interrupt received\n");
    
    /* 清除中断标志 */
    writel(0, my_dev->base + 0x10);
    
    return IRQ_HANDLED;
}

static int my_probe(struct platform_device *pdev)
{
    struct device *dev = &pdev->dev;
    struct my_device *my_dev;
    struct resource *res;
    int ret;
    
    my_dev = devm_kzalloc(dev, sizeof(*my_dev), GFP_KERNEL);
    if (!my_dev)
        return -ENOMEM;
        
    my_dev->dev = dev;
    platform_set_drvdata(pdev, my_dev);
    
    /* 获取内存资源 */
    res = platform_get_resource(pdev, IORESOURCE_MEM, 0);
    my_dev->base = devm_ioremap_resource(dev, res);
    if (IS_ERR(my_dev->base))
        return PTR_ERR(my_dev->base);
    
    /* 获取中断 */
    my_dev->irq = platform_get_irq(pdev, 0);
    if (my_dev->irq < 0) {
        dev_err(dev, "Failed to get IRQ\n");
        return my_dev->irq;
    }
    
    ret = devm_request_irq(dev, my_dev->irq, my_device_irq_handler,
                          0, DRIVER_NAME, my_dev);
    if (ret) {
        dev_err(dev, "Failed to request IRQ\n");
        return ret;
    }
    
    /* 获取GPIO */
    my_dev->gpio_led = of_get_named_gpio(dev->of_node, "led-gpio", 0);
    if (gpio_is_valid(my_dev->gpio_led)) {
        ret = devm_gpio_request_one(dev, my_dev->gpio_led,
                                   GPIOF_OUT_INIT_LOW, "led");
        if (ret) {
            dev_warn(dev, "Failed to request GPIO for LED\n");
        }
    }
    
    dev_info(dev, "Device probed successfully\n");
    return 0;
}

static int my_remove(struct platform_device *pdev)
{
    struct my_device *my_dev = platform_get_drvdata(pdev);
    
    dev_info(my_dev->dev, "Device removed\n");
    return 0;
}

static const struct of_device_id my_of_match[] = {
    { .compatible = "myvendor,custom-device", },
    { /* sentinel */ }
};
MODULE_DEVICE_TABLE(of, my_of_match);

static struct platform_driver my_driver = {
    .probe = my_probe,
    .remove = my_remove,
    .driver = {
        .name = DRIVER_NAME,
        .of_match_table = my_of_match,
    },
};

module_platform_driver(my_driver);

MODULE_AUTHOR("Your Name");
MODULE_DESCRIPTION("My Custom Device Driver");
MODULE_LICENSE("GPL v2");
```

通过深入理解设备树机制，开发者可以编写更加灵活和可移植的驱动程序，同时也能更好地利用现代Linux内核提供的硬件抽象能力。