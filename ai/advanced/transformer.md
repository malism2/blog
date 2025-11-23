# Transformer 架构详解

Transformer是现代大模型的基础架构，由Google在2017年的论文《Attention Is All You Need》中提出。本章节深入解析Transformer的核心组件和工作原理。

## 1. Transformer 整体架构

### 1.1 基本结构

Transformer由编码器(Encoder)和解码器(Decoder)两部分组成：

- **编码器**：接收输入序列，生成上下文表示
- **解码器**：基于编码器的输出和已生成的部分预测下一个元素

### 1.2 架构图解析

```
输入序列 → 嵌入层 + 位置编码 → 编码器堆叠 → 解码器堆叠 → 线性层 → 输出层
                                                ↑
                                      已生成序列 → 嵌入层 + 位置编码
```

## 2. 自注意力机制 (Self-Attention)

### 2.1 核心概念

自注意力机制允许模型在处理每个位置时，关注输入序列中的所有位置，捕捉长距离依赖关系。

### 2.2 计算过程

1. **生成查询(Query)、键(Key)、值(Value)向量**：
   ```python
   Q = X @ W_Q  # 查询
   K = X @ W_K  # 键
   V = X @ W_V  # 值
   ```

2. **计算注意力分数**：
   ```python
   scores = Q @ K.T / sqrt(d_k)  # d_k是键向量的维度
   ```

3. **应用掩码(Mask)，防止未来信息泄露**：
   ```python
   # 在解码器中使用，确保只能关注已生成的位置
   mask = torch.tril(torch.ones(L, L))  # L是序列长度
   scores = scores.masked_fill(mask == 0, -1e9)
   ```

4. **Softmax归一化**：
   ```python
   attention_weights = F.softmax(scores, dim=-1)
   ```

5. **加权求和**：
   ```python
   context = attention_weights @ V
   ```

### 2.3 自注意力实现示例

```python
import torch
import torch.nn.functional as F

def scaled_dot_product_attention(Q, K, V, mask=None):
    # 计算注意力分数
    d_k = Q.size(-1)
    scores = torch.matmul(Q, K.transpose(-2, -1)) / torch.sqrt(d_k)
    
    # 应用掩码
    if mask is not None:
        scores = scores.masked_fill(mask == 0, -1e9)
    
    # 计算注意力权重
    attention_weights = F.softmax(scores, dim=-1)
    
    # 加权求和
    output = torch.matmul(attention_weights, V)
    
    return output, attention_weights
```

## 3. 多头注意力机制 (Multi-Head Attention)

### 3.1 工作原理

多头注意力通过多个"头"并行计算注意力，每个头学习不同的表示子空间，能够同时捕捉不同类型的关系。

### 3.2 计算过程

1. **线性投影**：将输入通过不同的线性层投影为多个Query、Key、Value
2. **并行自注意力**：每个头独立计算自注意力
3. **拼接与投影**：将所有头的输出拼接并通过最终的线性层

### 3.3 多头注意力实现示例

```python
class MultiHeadAttention(nn.Module):
    def __init__(self, d_model, num_heads):
        super().__init__()
        self.d_model = d_model  # 模型维度
        self.num_heads = num_heads  # 头数
        self.d_k = d_model // num_heads  # 每个头的维度
        
        # 线性投影层
        self.W_Q = nn.Linear(d_model, d_model)
        self.W_K = nn.Linear(d_model, d_model)
        self.W_V = nn.Linear(d_model, d_model)
        self.W_O = nn.Linear(d_model, d_model)
    
    def forward(self, Q, K, V, mask=None):
        batch_size = Q.size(0)
        
        # 线性投影并分割成多头
        Q = self.W_Q(Q).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        K = self.W_K(K).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        V = self.W_V(V).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        
        # 应用掩码
        if mask is not None:
            mask = mask.unsqueeze(1)  # 扩展维度以适应多头
        
        # 计算自注意力
        context, attention = scaled_dot_product_attention(Q, K, V, mask)
        
        # 拼接多头输出
        context = context.transpose(1, 2).contiguous().view(batch_size, -1, self.d_model)
        
        # 最终线性层
        output = self.W_O(context)
        
        return output, attention
```

## 4. 位置编码 (Positional Encoding)

### 4.1 必要性

自注意力机制本身不包含位置信息，需要显式地将位置信息注入到输入中。

### 4.2 实现方法

Transformer使用正弦和余弦函数生成位置编码：

```python
import numpy as np
def get_positional_encoding(max_seq_len, d_model):
    # 初始化位置编码矩阵
    position_encodings = np.zeros((max_seq_len, d_model))
    
    # 生成位置索引
    positions = np.arange(0, max_seq_len)[:, np.newaxis]
    
    # 计算角度
    div_term = np.exp(np.arange(0, d_model, 2) * -(np.log(10000.0) / d_model))
    
    # 填充矩阵
    position_encodings[:, 0::2] = np.sin(positions * div_term)
    position_encodings[:, 1::2] = np.cos(positions * div_term)
    
    return torch.tensor(position_encodings, dtype=torch.float)
```

## 5. 前馈神经网络 (Feed Forward Networks)

### 5.1 结构

每个编码器和解码器层都包含一个前馈网络，由两个线性变换和GELU激活函数组成：

```python
class FeedForward(nn.Module):
    def __init__(self, d_model, d_ff, dropout=0.1):
        super().__init__()
        self.fc1 = nn.Linear(d_model, d_ff)
        self.fc2 = nn.Linear(d_ff, d_model)
        self.dropout = nn.Dropout(dropout)
        self.gelu = nn.GELU()
    
    def forward(self, x):
        return self.fc2(self.dropout(self.gelu(self.fc1(x))))
```

### 5.2 作用

- 提供非线性变换能力
- 为模型引入额外的表达能力
- 处理注意力层输出的上下文表示

## 6. 层归一化 (Layer Normalization)

### 6.1 实现

```python
class LayerNorm(nn.Module):
    def __init__(self, features, eps=1e-6):
        super().__init__()
        self.gamma = nn.Parameter(torch.ones(features))  # 缩放参数
        self.beta = nn.Parameter(torch.zeros(features))  # 偏移参数
        self.eps = eps
    
    def forward(self, x):
        # 计算均值和方差
        mean = x.mean(-1, keepdim=True)
        std = x.std(-1, keepdim=True)
        
        # 归一化并应用缩放和偏移
        return self.gamma * (x - mean) / (std + self.eps) + self.beta
```

### 6.2 作用

- 加速训练收敛
- 稳定网络内部激活值分布
- 减少梯度消失问题

## 7. Transformer 编码器完整实现

```python
class EncoderLayer(nn.Module):
    def __init__(self, d_model, num_heads, d_ff, dropout=0.1):
        super().__init__()
        self.self_attn = MultiHeadAttention(d_model, num_heads)
        self.feed_forward = FeedForward(d_model, d_ff, dropout)
        self.norm1 = LayerNorm(d_model)
        self.norm2 = LayerNorm(d_model)
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, x, mask=None):
        # 自注意力层（带残差连接）
        attn_output, _ = self.self_attn(x, x, x, mask)
        x = x + self.dropout(attn_output)
        x = self.norm1(x)
        
        # 前馈网络层（带残差连接）
        ff_output = self.feed_forward(x)
        x = x + self.dropout(ff_output)
        x = self.norm2(x)
        
        return x

class Encoder(nn.Module):
    def __init__(self, num_layers, d_model, num_heads, d_ff, dropout=0.1):
        super().__init__()
        self.layers = nn.ModuleList([
            EncoderLayer(d_model, num_heads, d_ff, dropout) 
            for _ in range(num_layers)
        ])
    
    def forward(self, x, mask=None):
        for layer in self.layers:
            x = layer(x, mask)
        return x
```

## 8. Transformer 解码器完整实现

```python
class DecoderLayer(nn.Module):
    def __init__(self, d_model, num_heads, d_ff, dropout=0.1):
        super().__init__()
        self.self_attn = MultiHeadAttention(d_model, num_heads)
        self.cross_attn = MultiHeadAttention(d_model, num_heads)
        self.feed_forward = FeedForward(d_model, d_ff, dropout)
        self.norm1 = LayerNorm(d_model)
        self.norm2 = LayerNorm(d_model)
        self.norm3 = LayerNorm(d_model)
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, x, enc_output, src_mask=None, tgt_mask=None):
        # 自注意力层（带掩码，防止关注未来位置）
        attn_output, _ = self.self_attn(x, x, x, tgt_mask)
        x = x + self.dropout(attn_output)
        x = self.norm1(x)
        
        # 编码器-解码器交叉注意力层
        attn_output, _ = self.cross_attn(x, enc_output, enc_output, src_mask)
        x = x + self.dropout(attn_output)
        x = self.norm2(x)
        
        # 前馈网络层
        ff_output = self.feed_forward(x)
        x = x + self.dropout(ff_output)
        x = self.norm3(x)
        
        return x
```

## 9. 大模型中的 Transformer 变体

### 9.1 GPT 系列中的 Transformer

- 使用仅解码器架构(Decoder-only)
- 自回归生成模式
- 层归一化放在子层之前(Pre-LN)

### 9.2 BERT 系列中的 Transformer

- 使用仅编码器架构(Encoder-only)
- Masked Language Model预训练目标
- 双向上下文表示

### 9.3 T5/PaLM 架构优化

- 相对位置编码
- 更大的前馈网络隐藏层维度
- 改进的注意力计算效率

## 10. Transformer 的计算复杂度

### 10.1 各组件复杂度分析

- **自注意力层**：O(n²·d)，其中n是序列长度，d是模型维度
- **前馈网络层**：O(n·d²)
- **总体复杂度**：O(n²·d + n·d²)

### 10.2 长序列处理挑战

- 内存消耗随序列长度平方增长
- 计算时间随序列长度平方增长
- 注意力矩阵存储开销大

## 11. 理解与实践建议

1. **从简化版本开始**：先实现基本的自注意力机制
2. **可视化学习**：使用注意力权重可视化理解模型关注重点
3. **实验性学习**：修改参数观察对输出的影响
4. **阅读原论文**：《Attention Is All You Need》是理解的关键
5. **对比学习**：与CNN、RNN对比，理解Transformer的优势

## 12. 进阶资源

- **视频教程**：
  - 3Blue1Brown《Transformer架构可视化》
  - Karpathy《Let's build GPT》
  - Stanford CS224n《Deep Learning for NLP》

- **代码实现**：
  - The Annotated Transformer（详细注释版实现）
  - Hugging Face Transformers源码

- **进阶论文**：
  - 《Attention Is All You Need》（原论文）
  - 《BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding》
  - 《Improving Language Understanding by Generative Pre-training》（GPT）

---

Transformer架构是现代大模型的基石，理解其核心组件和工作原理对于深入掌握大模型技术至关重要。