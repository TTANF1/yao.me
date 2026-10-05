"""Subset LXGW Marker Gothic to bilingual note titles and scramble characters."""
import argparse
import re
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("font", type=Path, help="Original LXGWMarkerGothic-Regular.ttf")
args = parser.parse_args()

chars = set(chr(i) for i in range(32, 127))
for path in sorted((ROOT / "content/notes").glob("*/*.md*")):
    raw = path.read_text(encoding="utf-8")
    frontmatter = raw.split("---", 2)[1]
    title = re.search(r"^title:\s*(.+)$", frontmatter, re.MULTILINE)
    if not title:
        raise ValueError(f"Missing title: {path}")
    chars.update(title.group(1).strip().strip("\"'"))
# ScrambleText may display these symbols while switching languages.
scramble = (ROOT / "components/scramble-text.tsx").read_text(encoding="utf-8")
pool = re.search(r"const SCRAMBLE_POOL\s*=\s*['\"]([^'\"]+)", scramble)
if pool:
    chars.update(pool.group(1))

font = TTFont(args.font)
missing = chars - set(map(chr, font.getBestCmap()))
if missing:
    raise ValueError(f"Font lacks characters: {''.join(sorted(missing))}")
options = subset.Options()
options.flavor = "woff2"
options.layout_features = ["*"]
options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
subsetter = subset.Subsetter(options=options)
subsetter.populate(text="".join(sorted(chars)))
subsetter.subset(font)
font.flavor = "woff2"
output = ROOT / "public/fonts/lxgw-marker-gothic-note-titles.woff2"
font.save(output)
assert chars <= set(map(chr, TTFont(output).getBestCmap()))
print(f"{len(chars)} characters; {output.stat().st_size:,} bytes; {output}")
