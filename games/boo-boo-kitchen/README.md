# Boo Boo Kitchen — 游戏内容目录

状态：目录骨架，尚未实现游戏或安装依赖。

- scene/：Three.js 场景、人物、传送带、工作台与动画表现。
- gameplay/：命令、库存、菜谱步骤、题目调度与回合状态。
- data/：词库、菜谱、资源清单；使用稳定 ID，不以显示名称作逻辑键。
- services/：资源加载、音频与本地记录。

运行素材位于 ../../public/games/boo-boo-kitchen/，按 models、textures、sprites、audio 分类。编辑源文件不放入 public，交付运行资源时登记来源与授权。

设计文档入口：[设计总览](../../.codex/boo-boo-kitchen/README.md)。

实验室展示风格尚未确定，本次不创建入口组件、路由或项目列表项。后续按设计 Roadmap 推进，游戏依赖仅在独立入口加载。