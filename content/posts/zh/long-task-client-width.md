---
title: 一次472ms长任务排查：最后是一行clientWidth的锅
date: '2026-10-12'
summary: Performance面板一层层点下去，最后定位到一行读宽度
ai: true
draft: false
---

> 前几天在飞书文档里打字，顺手开了 Performance 录了一段，发现一个 472ms 的 Long task。第一反应是文档编辑器逻辑复杂，估计得扒半天业务代码。结果顺着 DevTools 一层层点下去，最后停在一行 `pageContainer.clientWidth` 上。
>
> 整个排查不到半小时，但有几个地方差点判断错——把过程记下来，下次再遇到长任务可以直接照着走。

---

## 一、先看概览：这 500ms 在忙什么

录完先看顶部概览轨（Overview）。红框框出来的这段大概 500ms，从上往下读：

- 最上面一排红色短竖条：连续掉帧，每一帧都超过 16.7ms；
- 灰色块比左右明显高：主线程 CPU 很忙；
- 灰块下面紫黄相间：紫色是 Rendering（样式计算 + 布局），黄色是 Scripting（JS）。

![概览轨上的472ms长任务](/posts/long-task-client-width/perf-overview-longtask.png) _图：概览轨上的 472ms 长任务，紫色 Rendering 与黄色 Scripting 相间，主线程 CPU 占满_

这一步先排除了网络问题——不是接口慢、不是资源加载慢，是纯计算卡。下面 tooltip 也直接标了：`Long task took 472.00 ms`，但 self 只有 0.14ms，说明 Task 本身是个壳，时间全在它展开的子调用里。

## 二、Bottom-up：按 self time 给嫌疑人名单

切到 Bottom-up 标签，它默认按 self time 从高到低排。前两名非常扎眼：

- `Layout`：56.4ms（45.8%）
- `ssrUpdateLayout`：56.2ms（45.6%）
- 最下面 `appendChild`：self 只有 1.5ms，但 total 121ms（98.2%）——整个长任务的入口是一次 DOM 插入。

![Bottom-up按self time排序](/posts/long-task-client-width/perf-bottomup.png) _图：Bottom-up 按 self time 排序，Layout 与 ssrUpdateLayout 各占约 45%_

两个 self 大户加起来快 110ms，而且数字几乎相等。我第一反应是：这业务函数是不是在自己调自己，形成了循环？

## 三、Call tree：先搞清楚谁调谁

切到 Call tree，缩进规则是**父在上、子缩进在下 = 上层调用下层**。展开 appendChild 这条链：

```
Event: load
└─ Run microtasks
   └─ …打包后代码…
      └─ appendChild
         └─ (anonymous)
            └─ (anonymous)
               └─ ssrUpdateLayout   ← 还没展开
```

![Call tree展开前](/posts/long-task-client-width/perf-calltree-collapsed.png) _图：appendChild 调用链展开前，ssrUpdateLayout 还是叶子节点_

方向和我想的正好相反——不是 ssrUpdateLayout 里调了 appendChild，而是 **appendChild 触发的回调链里跑到了 ssrUpdateLayout**。

注意最上层的 `Run microtasks`：整段是在微任务里跑的。结合 appendChild 的上下文，基本能猜到：插入节点触发了 MutationObserver，observer 回调作为微任务排队执行，回调里调了 ssrUpdateLayout。

但这时候 ssrUpdateLayout 是个叶子节点，self 只有 0.5ms，total 却有 63ms——63ms 的去向还在它下面没展开。

## 四、再展开一层：不是循环，是同步重排

点 ssrUpdateLayout 前面的箭头展开，子调用就三个：

```
ssrUpdateLayout              self 0.5ms / total 63ms
├─ Layout                    self 54.7ms（86.8%）
├─ Recalculate style         self  7.4ms（11.7%）
└─ replaceMentionDocTitle    self  0.4ms
```

![展开ssrUpdateLayout后的子调用](/posts/long-task-client-width/perf-calltree-expanded.png) _图：展开后子调用三项：Layout 54.7ms、Recalculate style 7.4ms、replaceMentionDocTitle 0.4ms_

两个关键事实：

1. **没有再出现 appendChild，也没有递归 ssrUpdateLayout**——不是我猜的循环。
2. 63ms 几乎全在浏览器渲染管线里（Layout 54.7 + RecalcStyle 7.4 ≈ 62ms）。Layout 直接挂在 ssrUpdateLayout 下面当子调用，说明是业务代码里**读了布局属性**，浏览器被迫同步重排。

## 五、跳源码：就是这一行

Call tree 里点 `Layout` 那一行，DevTools 直接跳到 Sources。高亮停在 1126 行，但往上一行看就明白了：

```js
1107  mountPoint.style.display = 'block';                  // 写：布局变脏
1108  entryPoint && (entryPoint.style.display = 'block');  // 写
...
1125  const containerWidth = pageContainer.clientWidth;     // 读：被迫同步重排
1132  replaceMentionDocTitle();
```

![Sources里定位到clientWidth那行](/posts/long-task-client-width/perf-source-clientwidth.png) _图：Sources 面板跳转到第 1125 行的 clientWidth 读取_

完整的故事是这样的：

1. MutationObserver 回调进来跑 ssrUpdateLayout；
2. 1107–1108 行把两个元素设成 `display: block`，浏览器把布局标记为 dirty，打算异步重排；
3. 1125 行立刻读 `clientWidth`——浏览器为了返回准确值，只能当场把 dirty 布局 flush 掉，Layout 54.7ms 就这么来的；
4. 拿到宽度后继续调 `replaceMentionDocTitle`。

## 六、为什么读个宽度要 54ms

浏览器平时是懒布局的：你改了样式，它记下来不立刻算，等下一帧绘制前统一算一次，这样连续改十次也只重排一次。

但 JS 一旦读 `offsetWidth`、`clientWidth`、`getBoundingClientRect` 这类属性，浏览器必须给你准确值——于是它不得不把刚才攒着的 dirty 布局立刻算完。这叫 **forced synchronous layout（强制同步布局）**，写后立刻读就是 **Layout Thrashing**。

飞书文档的 DOM 节点量是按"篇"算的，一次整文档重排就是几十毫秒。这个成本跟你读哪个属性没关系，跟你在多脏的状态下读它有关系。

## 七、Performance 面板这几个 tab 怎么配合用

这次排查顺下来，几个 tab 的分工其实很清楚：

| Tab | 干什么 | 什么时候用 |
|---|---|---|
| 概览轨 | 先判断是不是网络问题、看掉帧 | 打开第一眼 |
| Bottom-up | 按 self time 排，找"谁自己花得多" | 第一刀切下去找嫌疑人 |
| Call tree | 看单次调用链的父子关系 | 追"谁调了谁"，搞清方向 |
| 火焰图 | 宽度=total time，露出的纯色段=self time，上下嵌套=父子，左右=时间 | 直觉感受耗时分布 |
| Sources | 点 Activity 行直接跳源码 | 落到具体代码行 |

最容易踩的坑是搞反调用方向。Call tree 和火焰图里，**上层都是调用者**，别看着看着就以为下面的是入口。

## 八、怎么改

核心就一条：**别在写样式之后、同一个同步上下文里读布局**。

```js
// 现在的写法：写 display 后立刻读宽度
mountPoint.style.display = 'block';
entryPoint && (entryPoint.style.display = 'block');
const w = pageContainer.clientWidth;   // 触发同步 Layout
```

改法一：读操作挪到 rAF，等浏览器这一帧自动布局完。

```js
mountPoint.style.display = 'block';
entryPoint && (entryPoint.style.display = 'block');

requestAnimationFrame(() => {
  const w = pageContainer.clientWidth;   // 此时布局已完成，不触发同步重排
  // 后续依赖 w 的逻辑放进来
});
```

改法二（更彻底）：用 ResizeObserver 维护宽度缓存，业务代码里永远不主动读。

```js
let containerWidth = pageContainer.clientWidth;
new ResizeObserver(() => {
  containerWidth = pageContainer.clientWidth;
}).observe(pageContainer);
```

另外，文档这种大树结构给容器加个 `contain: layout`，就算将来还有同步读，重排范围也会被限制住，几十毫秒能砍到个位数。

## 九、一个还没想透的问题：什么算过度优化？

写完上面这些，反而有点纠结。

飞书文档是有骨架屏的——用户打开链接，先看到骨架、再看到内容，等待过程是有视觉反馈的。那这个 472ms 的长任务，真的值得专门拉出来优化吗？判断标准到底是什么？是死磕 LCP 的 2.5s 阈值，还是看用户应该在多久内看到文档内容？

我现在的想法是：**骨架屏掩盖的是"等"的焦虑，掩盖不了"看到了但点不动"的卡顿**。

回看截图，FCP 和 LCP 的标记都在这 472ms 之后——也就是说，用户已经看到文档了，这时候再卡主线程，影响的不是"白屏多久"，而是**看到内容之后的第一次输入、第一次滚动、第一次 @人**。这已经不是 LCP 的赛道了，是 INP。用户对着一篇已经打开的文档打字，键盘都敲下去了主线程还在重排，那种卡是真的能感知到的，骨架屏帮不上忙。

所以判断标准可能不是"有没有骨架屏"，而是**这个长任务发生在用户正在做什么的时候**：

- 发生在加载空档、用户还没开始操作——优先级可以放低；
- 发生在用户输入、滚动、点击的路径上——就是真问题；
- 如果是高频路径（这次是每次插入 mention 都触发一次），哪怕单次只有几十毫秒，累积起来也值得修。

反过来，如果是偶发一次、又不在用户交互路径上，为了那几十毫秒上 rAF、上 ResizeObserver，反而可能是过度优化——多出来的异步复杂度，后续维护成本未必划算。

不过这次最让我觉得值的，其实不是干掉了一个 `clientWidth`，而是**这套排查流程本身**：概览轨先排除网络，Bottom-up 给嫌疑人名单，Call tree 理清调用方向，Sources 落到具体代码行。它不依赖业务知识，也不依赖对飞书文档内部实现的了解——换一个页面、换一个长任务，照着走一遍照样能用。性能问题的表象千奇百怪，但"先看证据、再下结论"这步是通用的。

---

> 排查长任务最忌讳一上来就猜。这次如果只看 Bottom-up 里 `ssrUpdateLayout` 排第二，很可能会误以为是这个业务函数自己算得慢，去优化它的循环。但顺着 Call tree 和 Sources 走到底，发现它其实只是个"读属性"的调用点——真正的成本是浏览器被迫重排。
>
> 每一步都有证据：概览轨排除网络，Bottom-up 给名单，Call tree 理方向，Sources 落代码。少任何一步，结论都可能跑偏。
