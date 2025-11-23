# 深度学习基础

深度学习是大模型的基础，本章节介绍神经网络的基本概念和工作原理。

## 1. 神经网络基础

### 1.1 感知机

感知机是神经网络的基本单元，模拟生物神经元的工作原理。

```python
# 简单感知机实现
import numpy as np

def perceptron(inputs, weights, bias):
    # 加权求和
    weighted_sum = np.dot(inputs, weights) + bias
    # 激活函数（阶跃函数）
    return 1 if weighted_sum > 0 else 0
```

### 1.2 前馈神经网络

- **网络结构**：
  - 输入层：接收原始数据
  - 隐藏层：提取特征表示
  - 输出层：产生最终结果

- **全连接网络**：每一层的每个神经元都与下一层的所有神经元相连

## 2. 激活函数

激活函数为神经网络引入非线性，使其能够拟合复杂函数。

### 2.1 常用激活函数

- **Sigmoid**：将输入映射到[0,1]区间
  ```python
  def sigmoid(x):
      return 1 / (1 + np.exp(-x))
  ```

- **ReLU**：修正线性单元，计算高效，缓解梯度消失问题
  ```python
  def relu(x):
      return np.maximum(0, x)
  ```

- **Tanh**：双曲正切函数，将输入映射到[-1,1]区间
  ```python
  def tanh(x):
      return (np.exp(x) - np.exp(-x)) / (np.exp(x) + np.exp(-x))
  ```

### 2.2 GELU

GELU（Gaussian Error Linear Unit）是大模型中常用的激活函数

```python
def gelu(x):
    return 0.5 * x * (1 + np.tanh(np.sqrt(2/np.pi) * (x + 0.044715 * x**3)))
```

## 3. 反向传播与梯度下降

### 3.1 损失函数

- **均方误差（MSE）**：回归问题
  ```python
def mse_loss(y_true, y_pred):
    return np.mean((y_true - y_pred) ** 2)
```

- **交叉熵损失**：分类问题
  ```python
def cross_entropy_loss(y_true, y_pred):
    return -np.mean(y_true * np.log(y_pred) + (1 - y_true) * np.log(1 - y_pred))
```

### 3.2 梯度下降

```python
# 简单梯度下降实现
def gradient_descent(params, gradients, learning_rate):
    for i in range(len(params)):
        params[i] -= learning_rate * gradients[i]
    return params
```

### 3.3 优化器变体

- **SGD（随机梯度下降）**：每次使用单个样本更新
- **Adam**：结合动量和自适应学习率，大模型训练常用
  ```python
  # PyTorch中的Adam优化器使用
  import torch.optim as optim
  optimizer = optim.Adam(model.parameters(), lr=1e-4)
  ```

## 4. 常见神经网络架构

### 4.1 CNN（卷积神经网络）

- **核心组件**：
  - 卷积层：特征提取
  - 池化层：降维
  - 全连接层：分类

- **应用**：图像识别、计算机视觉

### 4.2 RNN（循环神经网络）

- **结构特点**：处理序列数据，具有记忆能力

- **变体**：
  - LSTM：长短期记忆网络
  - GRU：门控循环单元

### 4.3 Transformer

- **核心创新**：自注意力机制
- **优势**：并行计算能力强，可处理长序列
- **应用**：大语言模型的基础架构

## 5. 模型训练流程

### 5.1 完整训练循环

```python
epochs = 10
batch_size = 32

for epoch in range(epochs):
    for batch in dataloader:
        # 前向传播
        outputs = model(inputs)
        loss = criterion(outputs, targets)
        
        # 反向传播
        optimizer.zero_grad()
        loss.backward()
        
        # 参数更新
        optimizer.step()
    
    # 验证
    val_loss = evaluate(model, val_dataloader)
    print(f'Epoch {epoch+1}/{epochs}, Train Loss: {loss.item():.4f}, Val Loss: {val_loss:.4f}')
```

### 5.2 防止过拟合

- **正则化**：
  - L1正则化：权重稀疏化
  - L2正则化：权重衰减

- **Dropout**：训练时随机失活部分神经元
  ```python
  # PyTorch中的Dropout层
  dropout = nn.Dropout(p=0.5)
  ```

- **早停**：监控验证损失，停止过拟合

## 6. 学习建议

1. **从简单开始**：先实现简单的神经网络
2. **理解数学原理**：掌握反向传播的推导
3. **实践为主**：使用PyTorch或TensorFlow构建模型
4. **可视化学习**：使用可视化工具理解网络结构

## 7. 推荐资源

- **在线课程**：
  - 吴恩达《深度学习专项课程》
  - Fast.ai《Practical Deep Learning for Coders》

- **书籍**：
  - 《深度学习》（花书）
  - 《动手学深度学习》

- **实践项目**：
  - MNIST手写数字识别
  - 简单图像分类器

---

深度学习是大模型的基础，掌握这些概念后，你将能够更好地理解大模型的工作原理。