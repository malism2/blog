# LeetCode 刷题指南

## 前言

本指南旨在帮助开发者系统性地提升算法与数据结构能力，通过 LeetCode 平台进行高效刷题。无论你是算法新手，还是准备面试的求职者，本指南都将为你提供清晰的学习路径和实用的刷题策略。

## 刷题策略与建议

### 入门阶段（1-3个月）

#### 学习计划
1. **系统学习数据结构**：
   - 数组、链表、栈、队列的基本操作
   - 哈希表、集合的原理与应用
   - 树、二叉树、二叉搜索树的遍历和基本操作

2. **掌握基础算法**：
   - 双指针技巧（快慢指针、左右指针）
   - 滑动窗口方法
   - 二分查找
   - 基础排序算法（快速排序、归并排序等）

3. **实践建议**：
   - 每天刷2-3道简单题
   - 重点关注理解题目和暴力解法
   - 逐步优化到最优解
   - 做好笔记，总结解题思路

#### 推荐资源
- 《算法图解》- 通俗易懂的算法入门书籍
- LeetCode 官方题解和讨论区
- B站算法教学视频

### 进阶阶段（3-6个月）

#### 深入专题
1. **搜索与回溯**：
   - 深度优先搜索（DFS）
   - 广度优先搜索（BFS）
   - 回溯算法（排列、组合、子集问题）

2. **动态规划**：
   - 线性DP（一维、二维）
   - 背包问题（0-1背包、完全背包）
   - 区间DP、状态压缩DP

3. **图论算法**：
   - 图的表示方法（邻接矩阵、邻接表）
   - 最短路径算法（Dijkstra、Floyd）
   - 并查集（Union-Find）
   - 拓扑排序

#### 解题技巧
1. **按标签集中突破**：
   - 每周选择一个专题进行集中训练
   - 总结该专题的通用解法和模板

2. **多解法训练**：
   - 同一道题尝试多种解法
   - 对比不同解法的时间复杂度和空间复杂度

3. **模拟面试环境**：
   - 设定时间限制（简单题15分钟，中等题30分钟）
   - 边解题边口述思路
   - 完成后检查代码健壮性

### 高级阶段（6个月以上）

#### 挑战难题
1. **困难题目训练**：
   - 攻克Hard难度题目
   - 学习高级算法和数据结构（如红黑树、线段树、字典树等）

2. **算法优化**：
   - 极致优化时间复杂度和空间复杂度
   - 学习位运算、数学优化等技巧

3. **参加竞赛**：
   - 定期参加LeetCode周赛和双周赛
   - 挑战自己的解题速度和应变能力

#### 持续提升
1. **学习源码**：
   - 阅读知名开源项目中的算法实现
   - 学习工业级算法的工程实践

2. **写作与教学**：
   - 撰写题解，巩固知识点
   - 尝试向他人讲解算法，检验理解程度

3. **关注前沿**：
   - 了解算法在人工智能、大数据等领域的应用
   - 跟踪最新的算法研究和优化方向

### 刷题技巧总结

#### 解题步骤
1. **理解题意**：仔细阅读题目，明确输入输出和约束条件
2. **分析示例**：通过示例理解问题的具体要求
3. **构思解法**：从暴力解法开始，逐步优化
4. **编写代码**：实现算法，注意边界条件和异常处理
5. **测试验证**：使用不同的测试用例验证代码正确性
6. **优化改进**：分析时间复杂度和空间复杂度，寻找优化空间

#### 心态调整
1. **保持耐心**：算法学习是一个循序渐进的过程，不要急于求成
2. **接受挑战**：遇到难题是正常的，这正是成长的机会
3. **定期回顾**：复习做过的题目，加深理解
4. **享受过程**：将解题视为一种思维训练和乐趣

#### 效率提升
1. **建立题库**：对做过的题目进行分类整理
2. **使用工具**：善用LeetCode的筛选和收藏功能
3. **团队学习**：可以和朋友组队刷题，互相讨论
4. **持续记录**：记录自己的学习进度和心得

## 推荐题目列表

> 💡 建议：按照难度循序渐进，每个主题从简单题开始，掌握基础后再挑战中等和困难题目。

### 数组与字符串（基础必备）

#### 入门必刷（简单）
- [1. 两数之和](https://leetcode.cn/problems/two-sum/) - 哈希表经典应用，面试高频
- [26. 删除有序数组中的重复项](https://leetcode.cn/problems/remove-duplicates-from-sorted-array/) - 双指针技巧基础
- [27. 移除元素](https://leetcode.cn/problems/remove-element/) - 双指针技巧应用
- [53. 最大子数组和](https://leetcode.cn/problems/maximum-subarray/) - 动态规划入门题
- [88. 合并两个有序数组](https://leetcode.cn/problems/merge-sorted-array/) - 归并思想基础

#### 能力提升（中等）
- [3. 无重复字符的最长子串](https://leetcode.cn/problems/longest-substring-without-repeating-characters/) - 滑动窗口经典题
- [11. 盛最多水的容器](https://leetcode.cn/problems/container-with-most-water/) - 双指针优化技巧
- [15. 三数之和](https://leetcode.cn/problems/3sum/) - 排序+双指针综合应用
- [49. 字母异位词分组](https://leetcode.cn/problems/group-anagrams/) - 哈希表+字符串处理
- [56. 合并区间](https://leetcode.cn/problems/merge-intervals/) - 区间处理经典问题
- [128. 最长连续序列](https://leetcode.cn/problems/longest-consecutive-sequence/) - 哈希表优化时间复杂度

#### 挑战进阶（困难）
- [42. 接雨水](https://leetcode.cn/problems/trapping-rain-water/) - 多种解法，面试高频
- [76. 最小覆盖子串](https://leetcode.cn/problems/minimum-window-substring/) - 滑动窗口高级应用
- [32. 最长有效括号](https://leetcode.cn/problems/longest-valid-parentheses/) - 栈或动态规划解法
- [239. 滑动窗口最大值](https://leetcode.cn/problems/sliding-window-maximum/) - 单调队列应用

### 链表（数据结构基础）

#### 入门必刷（简单）
- [21. 合并两个有序链表](https://leetcode.cn/problems/merge-two-sorted-lists/) - 链表操作基础
- [206. 反转链表](https://leetcode.cn/problems/reverse-linked-list/) - 链表指针操作经典
- [234. 回文链表](https://leetcode.cn/problems/palindrome-linked-list/) - 快慢指针+反转链表综合

#### 能力提升（中等）
- [19. 删除链表的倒数第 N 个结点](https://leetcode.cn/problems/remove-nth-node-from-end-of-list/) - 快慢指针应用
- [24. 两两交换链表中的节点](https://leetcode.cn/problems/swap-nodes-in-pairs/) - 链表指针操作进阶
- [142. 环形链表 II](https://leetcode.cn/problems/linked-list-cycle-ii/) - Floyd判圈算法
- [143. 重排链表](https://leetcode.cn/problems/reorder-list/) - 链表操作综合题

#### 挑战进阶（困难）
- [23. 合并K个升序链表](https://leetcode.cn/problems/merge-k-sorted-lists/) - 分治或优先队列
- [146. LRU 缓存](https://leetcode.cn/problems/lru-cache/) - 哈希表+双向链表实现
- [25. K 个一组翻转链表](https://leetcode.cn/problems/reverse-nodes-in-k-group/) - 链表复杂操作

### 栈与队列（算法思想）

#### 入门必刷（简单）
- [20. 有效的括号](https://leetcode.cn/problems/valid-parentheses/) - 栈的经典应用
- [232. 用栈实现队列](https://leetcode.cn/problems/implement-queue-using-stacks/) - 数据结构设计
- [225. 用队列实现栈](https://leetcode.cn/problems/implement-stack-using-queues/) - 数据结构设计

#### 能力提升（中等）
- [155. 最小栈](https://leetcode.cn/problems/min-stack/) - 辅助栈设计
- [394. 字符串解码](https://leetcode.cn/problems/decode-string/) - 栈的应用进阶
- [739. 每日温度](https://leetcode.cn/problems/daily-temperatures/) - 单调栈入门
- [496. 下一个更大元素 I](https://leetcode.cn/problems/next-greater-element-i/) - 单调栈应用

#### 挑战进阶（困难）
- [239. 滑动窗口最大值](https://leetcode.cn/problems/sliding-window-maximum/) - 单调队列应用
- [347. 前 K 个高频元素](https://leetcode.cn/problems/top-k-frequent-elements/) - 优先队列应用

### 树与二叉树（重要数据结构）

#### 入门必刷（简单）
- [104. 二叉树的最大深度](https://leetcode.cn/problems/maximum-depth-of-binary-tree/) - 树的遍历基础
- [111. 二叉树的最小深度](https://leetcode.cn/problems/minimum-depth-of-binary-tree/) - BFS或DFS应用
- [101. 对称二叉树](https://leetcode.cn/problems/symmetric-tree/) - 树的遍历应用
- [543. 二叉树的直径](https://leetcode.cn/problems/diameter-of-binary-tree/) - 树的遍历进阶

#### 能力提升（中等）
- [94. 二叉树的中序遍历](https://leetcode.cn/problems/binary-tree-inorder-traversal/) - 树的遍历经典
- [102. 二叉树的层序遍历](https://leetcode.cn/problems/binary-tree-level-order-traversal/) - BFS应用
- [105. 从前序与中序遍历序列构造二叉树](https://leetcode.cn/problems/construct-binary-tree-from-preorder-and-inorder-traversal/) - 树的构造
- [114. 二叉树展开为链表](https://leetcode.cn/problems/flatten-binary-tree-to-linked-list/) - 树的结构转换
- [124. 二叉树中的最大路径和](https://leetcode.cn/problems/binary-tree-maximum-path-sum/) - 递归+路径问题

#### 挑战进阶（困难）
- [236. 二叉树的最近公共祖先](https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/) - 树的搜索应用
- [148. 排序链表](https://leetcode.cn/problems/sort-list/) - 链表排序（归并排序）
- [124. 二叉树中的最大路径和](https://leetcode.cn/problems/binary-tree-maximum-path-sum/) - 复杂递归应用

### 动态规划（算法思想重点）

#### 入门必刷（简单）
- [70. 爬楼梯](https://leetcode.cn/problems/climbing-stairs/) - 动态规划入门
- [121. 买卖股票的最佳时机](https://leetcode.cn/problems/best-time-to-buy-and-sell-stock/) - 贪心或DP
- [198. 打家劫舍](https://leetcode.cn/problems/house-robber/) - 线性DP基础

#### 能力提升（中等）
- [53. 最大子数组和](https://leetcode.cn/problems/maximum-subarray/) - 动态规划经典
- [62. 不同路径](https://leetcode.cn/problems/unique-paths/) - 二维DP应用
- [64. 最小路径和](https://leetcode.cn/problems/minimum-path-sum/) - 二维DP应用
- [300. 最长递增子序列](https://leetcode.cn/problems/longest-increasing-subsequence/) - 经典DP问题
- [322. 零钱兑换](https://leetcode.cn/problems/coin-change/) - 完全背包变形
- [416. 分割等和子集](https://leetcode.cn/problems/partition-equal-subset-sum/) - 0-1背包问题

#### 挑战进阶（困难）
- [72. 编辑距离](https://leetcode.cn/problems/edit-distance/) - 字符串DP经典
- [139. 单词拆分](https://leetcode.cn/problems/word-break/) - 背包问题变形
- [188. 买卖股票的最佳时机 IV](https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-iv/) - 状态机DP
- [309. 最佳买卖股票时机含冷冻期](https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-with-cooldown/) - 状态机DP

### 搜索与回溯（算法思想）

#### 入门必刷（简单）
- [784. 字母大小写全排列](https://leetcode.cn/problems/letter-case-permutation/) - 回溯入门
- [104. 二叉树的最大深度](https://leetcode.cn/problems/maximum-depth-of-binary-tree/) - DFS应用
- [101. 对称二叉树](https://leetcode.cn/problems/symmetric-tree/) - 递归应用

#### 能力提升（中等）
- [22. 括号生成](https://leetcode.cn/problems/generate-parentheses/) - 回溯剪枝应用
- [39. 组合总和](https://leetcode.cn/problems/combination-sum/) - 回溯经典题
- [46. 全排列](https://leetcode.cn/problems/permutations/) - 回溯全排列
- [77. 组合](https://leetcode.cn/problems/combinations/) - 组合问题
- [113. 路径总和 II](https://leetcode.cn/problems/path-sum-ii/) - 树的路径搜索
- [200. 岛屿数量](https://leetcode.cn/problems/number-of-islands/) - 图的遍历应用

#### 挑战进阶（困难）
- [51. N 皇后](https://leetcode.cn/problems/n-queens/) - 回溯经典难题
- [72. 编辑距离](https://leetcode.cn/problems/edit-distance/) - 字符串DP
- [126. 单词接龙 II](https://leetcode.cn/problems/word-ladder-ii/) - BFS+DFS综合应用

### 图论（高级数据结构）

#### 入门必刷（中等）
- [133. 克隆图](https://leetcode.cn/problems/clone-graph/) - 图的遍历与复制
- [207. 课程表](https://leetcode.cn/problems/course-schedule/) - 拓扑排序应用
- [684. 冗余连接](https://leetcode.cn/problems/redundant-connection/) - 并查集应用

#### 挑战进阶（困难）
- [210. 课程表 II](https://leetcode.cn/problems/course-schedule-ii/) - 拓扑排序进阶
- [743. 网络延迟时间](https://leetcode.cn/problems/network-delay-time/) - Dijkstra算法应用
- [841. 钥匙和房间](https://leetcode.cn/problems/keys-and-rooms/) - 图的连通性判断
- [787. K 站中转内最便宜的航班](https://leetcode.cn/problems/cheapest-flights-within-k-stops/) - Bellman-Ford算法

### 面试高频专题

#### 系统设计题
- [146. LRU 缓存](https://leetcode.cn/problems/lru-cache/) - 数据结构设计经典题
- [155. 最小栈](https://leetcode.cn/problems/min-stack/) - 栈的设计与优化
- [208. 实现 Trie (前缀树)](https://leetcode.cn/problems/implement-trie-prefix-tree/) - 字典树实现

#### 贪心算法
- [455. 分发饼干](https://leetcode.cn/problems/assign-cookies/) - 贪心入门
- [322. 零钱兑换](https://leetcode.cn/problems/coin-change/) - 贪心或DP解法
- [55. 跳跃游戏](https://leetcode.cn/problems/jump-game/) - 贪心策略应用
- [45. 跳跃游戏 II](https://leetcode.cn/problems/jump-game-ii/) - 贪心算法优化

#### 二分查找
- [35. 搜索插入位置](https://leetcode.cn/problems/search-insert-position/) - 二分查找基础
- [74. 搜索二维矩阵](https://leetcode.cn/problems/search-a-2d-matrix/) - 二维二分应用
- [153. 寻找旋转排序数组中的最小值](https://leetcode.cn/problems/find-minimum-in-rotated-sorted-array/) - 二分查找变形
- [162. 寻找峰值](https://leetcode.cn/problems/find-peak-element/) - 二分查找应用

## 结语

刷题是一个持续积累的过程，关键在于坚持和总结。希望本指南能够帮助你在算法学习的道路上更加顺利！

记住：
- 理解算法思想比死记硬背更重要
- 定期复习和总结是提升的关键
- 保持耐心，循序渐进