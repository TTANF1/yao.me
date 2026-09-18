#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""收集 yao.me 首页/header/footer 实际用到的字符，生成子集化用字符集文件。
范围：messages.ts 的 hero/nav/footer/locale/theme 块（zh+en 两份）、footer 静态文字、
locale 切换文字、ScrambleText 洗牌字符池，另含数字与常用标点兜底。"""
import io
import re
import sys

SRC = r"D:\Project\yao.me\lib\messages.ts"
OUT = r"D:\Project\yao.me\.tmp-font\chars.txt"

with io.open(SRC, "r", encoding="utf-8") as f:
    text = f.read()

# 只提取这些键的对象块内的字符串字面量（zh 与 en 两个对象都覆盖）
KEYS = ("hero", "nav", "footer", "locale", "theme")
chars = set()
for key in KEYS:
    for m in re.finditer(key + r"\s*:\s*\{", text):
        start = m.end()
        # 粗略匹配到下一个同层 "},"（hero 块以 "  }," 结束；nav/footer/locale/theme 单行较多）
        depth = 1
        i = start
        while i < len(text) and depth > 0:
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
            i += 1
        block = text[start : i - 1]
        for s in re.findall(r"""'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`""", block):
            val = next((g for g in s if g), "")
            chars.update(val)

# footer 静态可见文字（footer.tsx：GitHub / Email / © {year} site.name；locale-switcher：中文 / EN）
chars.update("GitHubEmail中文EN")
chars.update("Yao")  # site.name
chars.update("©")

# ScrambleText 洗牌字符池（components/scramble-text.tsx：动画中间帧会显示这些符号）
chars.update("@&$#%*+!?~§£€¥<>^_")

# 兜底：常用 ASCII 可见字符（英文文案标点齐全）
chars.update(chr(c) for c in range(0x21, 0x7F))
# 常用中文标点与符号
chars.update("，。、；：？！《》（）【】「」『』·…—～“”‘’　")

# 空格
chars.add(" ")

# 排序输出（ASCII 在前，其他按码位）
ordered = sorted(chars, key=lambda ch: (ord(ch) < 128, ord(ch)))
with io.open(OUT, "w", encoding="utf-8") as f:
    f.write("".join(ordered))
    f.write("\n")

print("TOTAL_CHARS:", len(ordered))
print("SAMPLE:", "".join(ordered)[:200])
