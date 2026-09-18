# fusion-pixel 字体子集化

## 用途
yao.me 首页 / header / footer 使用 Fusion Pixel Font（10px 比例模式 zh-Hans）的**子集**，
只含这些区域实际用到的字符（173 字符，产物 4.3KB）。

## 重新生成（文案变更后）
1. 下载字体包（GitHub release `2026.09.01`）：
   https://github.com/TakWolf/fusion-pixel-font/releases/download/2026.09.01/fusion-pixel-font-10px-proportional-otf.woff2-v2026.09.01.zip
   解压取 `fusion-pixel-10px-proportional-zh_hans.otf.woff2`
2. 运行 `python collect_chars.py`（从 lib/messages.ts 提取 hero/nav/footer/locale/theme 的 zh+en 文案，
   自动并入 footer 静态文字、ScrambleText 符号池、数字与常用标点，输出 chars.txt）
3. 子集化：
   python -m fontTools.subset <zh_hans.woff2> --text-file=chars.txt ^
     --output-file=../../public/fonts/fusion-pixel-10px-zh-hans.woff2 --flavor=woff2 --layout-features="*"

依赖：Python 3.14 + `pip install fonttools brotli`

## 注意
- 只覆盖首页/header/footer 文案；新增文案必须重跑子集化，否则新字符会回退到系统字体。
- @font-face 定义在 app/globals.css，应用于 [data-site-header] / footer / .font-pixel。
