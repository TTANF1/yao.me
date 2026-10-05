# 整体技术架构

更新：2026-10-05 · 版本：0.1 · 状态：目标架构，待 M0 验证

## 1. 技术选择

Three.js + React Three Fiber（R3F）组织三维场景，React/HTML 组织界面，TypeScript 维护规则。Drei 仅引入需要的助手。首版 WebGL，无物理引擎、后端或独立状态库。

当前 package.json：Next.js 16.3.4、React 19.3.0，尚无游戏依赖。R3F 官方文档说明 v9 对应 React 19；安装时再次核对 three、@types/three、R3F、Drei 的 peer dependencies 并保留 lockfile。

学习先做原生 Three.js 小场景，再用 R3F 正式实现，避免维护两套正式渲染器。

## 2. 模块边界

| 层 | 职责 | 边界 |
| --- | --- | --- |
| 路由 | locale、SEO、轻量入口、退出 | 公共 layout 不引入游戏 |
| DOM UI | 输入、菜单、暂停、结算 | 不每帧更新角色位置 |
| 游戏规则 | 库存、步骤、题目、计时、事务 | 不依赖 WebGL 判定结果 |
| 场景表现 | 模型、角色、动画、高亮 | 不独立增加库存与分数 |
| 资产服务 | 清单、缓存、阶段加载、重试 | 不预载全部菜谱 |

流程：输入 → 命令校验 → 原子状态更新 → 事件 → 场景/界面。规则可不启动 Canvas 直接验证。

## 3. 目标目录

```text
app/[locale]/projects/boo-boo-kitchen/page.tsx
components/boo-boo-kitchen/
  game-entry.tsx
  game-hud.tsx
  word-input.tsx
  game.module.css
games/boo-boo-kitchen/
  scene/
  gameplay/
  data/
  services/
  types.ts
public/games/boo-boo-kitchen/
  models/ textures/ sprites/ audio/
```

设计文件留在 .codex/boo-boo-kitchen，不作为浏览器资源。games/boo-boo-kitchen 与 public/games/boo-boo-kitchen 的分类目录骨架已建立；游戏代码、依赖、路由与入口组件尚未创建，实验室列表风格待用户选择。

## 4. 数据协议

| 实体 | 关键字段 |
| --- | --- |
| Vocabulary | id、标准答案、acceptedAnswers、双语提示、词性、关联食材/动作 |
| Recipe | id、名称、需求份额、steps、最终输出、词汇与资产清单 ID |
| Step | id、前置、输入状态/数量、工位、动作词、时长、输出、演出 ID |
| IngredientInstance | 唯一 id、type、state、quantity、location |
| Question | 唯一 id、来源、wordId、尝试次数、提示级别、提交状态 |
| Session | 阶段、暂停原因、实例、工位、题目、完成步骤、统计 |

location 为互斥的传送带、收货槽、持有槽、工位槽等位置。启动检查引用完整、依赖无环、输入可获得、终点可到达。逻辑 ID 与显示名称分开，界面语言与英文答案分开。

## 5. 状态与时间

阶段：loading → selection → memorizing → playing → results。暂停使用原因集合 menu/hidden/typing，解除一个原因不能恢复其他原因仍暂停的游戏。

位置、朝向、动画时间用 refs/useFrame，每帧不触发 React setState。业务事件低频更新 Session 和 UI。按 delta 推进位移，后台停止业务时钟，恢复时限制单帧 delta。

工位：idle → awaiting-answer → processing → output-ready → idle。开始预留输入和工位，完成原子消耗与产出；完成事件幂等。回合重置递增 session ID，旧动画与请求回调不能改新回合。

全局题目调度器一次一个题，不在多个场景组件独立弹输入框。

## 6. 移动与输入

XZ 行走平面，Y 向上；小网格 A* 或路点图绕开工作台。对象配命中代理与交互点，到达后再次校验操作条件。

HTML 气泡由世界坐标投影到 Canvas 容器坐标，计算容器偏移与 resize，限制在可见边界。UI 空白不阻挡场景点击，输入自身正常接收事件。

## 7. 加载与现有网站接入

列表只加载静态封面和文字，新入口 prefetch=false。进入独立路由后，客户端入口动态导入游戏组件并配置 ssr:false；先公共厨房，再选菜谱加载专属资源，最后进入记忆。

此前已核对本地 node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md：ssr:false 只在客户端组件使用；服务端动态导入客户端组件不保证自动分包。实施前重新读取相关指南。

当前 components/project-card.tsx 写死 Edgewise SVG、颜色数据和文案，尽管 lib/projects-data.ts 是项目列表。接入前提取 Edgewise 专用预览，增加厨房轻量封面分支；不能让所有卡片加载厨房运行时。

入口沿用现有导航时先显示轻量 loading shell，导航过渡结束再初始化重场景。CSS 限定游戏容器，不扩散主站字体与动画参数。

## 8. 资源生命周期

明确 GLB 缓存、共享纹理、geometry、material 所有权。R3F 卸载清理与手动资源管理分开，不能假设 Canvas 卸载能清除所有外部缓存，也不能销毁其他实例仍引用的资源。

退出清理事件、计时器、音频、动画；加载结果用取消标记/session ID 排除失效回调。复用模型按需克隆，骨骼实例用适合骨骼的克隆方法。StrictMode 重挂载不得产生双 Canvas、双声音或重复提交。

## 9. 性能与故障恢复

初始预算：公共资源传输 ≤ 5 MB，单菜谱新增 ≤ 2 MB，可见 draw calls ≤ 100；参考桌面接近 60 FPS，低档稳定 30 FPS。预算待设备实测，不是已验证保证。M0 记录设备、浏览器、分辨率和网络条件，M4 更新结果。

DPR 上限初值 1.5，低档 1；主灯配环境光，阴影限定关键对象，优先共享材质与少量粒子。后处理逐项测量。加载进度区分传输与解析，不把文件数比例显示成字节进度。

资源失败可重试；WebGL 不可用有说明与返回；上下文丢失暂停并恢复/重启；音频由用户手势启动；存储不可用不阻断游戏。schemaVersion 化存档，损坏回退默认。只存完成记录、词汇表现和设置，不承诺半局恢复或首次离线可玩。

## 10. 验证与参考

规则：答案别名、依赖、库存守恒、重复完成、暂停叠加、旧回调。浏览器：输入法、焦点、resize、后台、重玩、退出、加载失败、透明遮挡。性能：首次载入、三次进出、帧耗时、请求与内存趋势。

主站首页/文章/项目列表不得请求游戏 chunk/GLB，Edgewise 继续正常；主题与语言过渡不回归。实施运行适用 tsc/lint/build。CU 验证遵循 AGENTS.md，先获得用户同意。

官方参考：
- [Three.js 基础](https://threejs.org/manual/en/fundamentals.html)
- [模型加载](https://threejs.org/manual/pages/loading-3d-models.html)
- [阴影](https://threejs.org/manual/pages/shadows.html)
- [R3F 版本关系](https://r3f.docs.pmnd.rs/getting-started/introduction)
- [Next.js 懒加载](https://nextjs.org/docs/app/guides/lazy-loading)

API 与版本以实施时安装依赖及官方文档为准。