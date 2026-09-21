"""Export a small, reproducible color-cohort demo. Never calls JEV.

Run with the Edgewise Python environment:
  python scripts/edgewise/export-color-groups.py --edgewise-root ../edgewise

The scores below are authored demonstration inputs. Pixel coordinates, grouping,
and representative evidence come from the deterministic candidate extractor.
Patches are computed by that same graphics pipeline using these demo scores.
"""
import argparse
from collections import defaultdict
import hashlib
import json
from pathlib import Path
import sys

parser = argparse.ArgumentParser()
parser.add_argument("--edgewise-root", type=Path, required=True)
parser.add_argument("--site-root", type=Path, default=Path(__file__).resolve().parents[2])
parser.add_argument("--site-packages", type=Path, help="Optional compatible Python dependency directory")
args = parser.parse_args()
root = args.edgewise_root.resolve()
if args.site_packages:
    sys.path.insert(0, str(args.site_packages.resolve()))
sys.path[:0] = [str(root / p) for p in ("apps/cli", "packages/core", "packages/types", "packages/semantic")]

import numpy as np
from PIL import Image
from edgewise_cli.pipeline import analyze_frame, build_blend_map, apply_decontamination
from edgewise_types.params import DecontaminationParams

site = args.site_root.resolve()
source_path = root / "examples/desk8/assets/frames_src/f01.png"
assert Image.open(source_path).convert("RGBA").tobytes() == Image.open(site / "public/projects/edgewise/before.png").convert("RGBA").tobytes()
params = DecontaminationParams(wall_rgb=(210, 218, 228), background_tolerance=30)
source, candidates, masks = analyze_frame(str(source_path), params, skip_jev=True)
by_color = defaultdict(list)
for candidate in candidates:
    by_color[candidate.edge_rgb].append(candidate)
# Stable frequency order; no invented extra particles or duplicate locations.
chosen = sorted(by_color.items(), key=lambda pair: (-len(pair[1]), pair[0]))[:6]
demo_scores = [0.91, 0.18, 0.74, 0.35, 0.82, 0.67]
reviews = {color: score for (color, _), score in zip(chosen, demo_scores)}
arr = np.asarray(source).astype(np.float64)
blend = build_blend_map(masks["edge"], candidates, reviews, params, masks["boundary_evidence"])
patched = apply_decontamination(arr, blend, masks["iy"], masks["ix"], params)
groups = []
for index, ((color, points), score) in enumerate(zip(chosen, demo_scores)):
    representative = max(points, key=lambda p: p.color_dist)
    pixels = []
    for p in points:
        assert tuple(map(int, arr[p.y, p.x, :3])) == color
        assert masks["edge"][p.y, p.x]
        pixels.append({"x": p.x, "y": p.y, "after": list(map(int, patched[p.y, p.x]))})
    groups.append({
        "id": f"C{index + 1:02}",
        "rgb": list(color),
        "demoScore": score,
        "representative": {
            "x": representative.x, "y": representative.y,
            "interior": list(representative.interior_rgb),
            "brightnessDelta": round(representative.bright_diff),
        },
        "pixels": pixels,
    })
data = {
    "width": source.width, "height": source.height,
    "source": "desk8 / f01",
    "sourceSha256": hashlib.sha256(source_path.read_bytes()).hexdigest(),
    "candidateCount": len(candidates), "colorCount": len(by_color),
    "sampledPixelCount": sum(len(g["pixels"]) for g in groups),
    "scoreSource": "authored-demo-not-model-output",
    "patchSource": "deterministic-pipeline-with-demo-scores",
    "groups": groups,
}
assert len({(p["x"], p["y"]) for g in groups for p in g["pixels"]}) == data["sampledPixelCount"]
source.save(site / "public/projects/edgewise/candidates-source.png")
(site / "lib/edgewise-colors.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f'Exported {data["sampledPixelCount"]} candidate pixels / {len(groups)} color groups. Full extraction: {len(candidates)} / {len(by_color)}.')