---
title: "DaVinci D-LogM Color Grading Workflow"
date: '2026-09-26'
summary: "More skills never hurt — my DaVinci color grading notes."
ai: false
draft: false
---

# DaVinci D-LogM Color Grading Workflow

This workflow is what I settled on after shooting D-Log M footage with the Osmo Nano: a fixed node order, baseline values for every parameter, and an acceptance check at each step, ending with a 33-point cube LUT I can reuse directly in After Effects and CapCut Pro.

## Scope

- Footage: DJI Osmo Nano, color space D-Gamut, gamma D-Log M, indoor scenes.
- Goal: Rec.709 delivery; export a 33-point cube LUT for reuse in After Effects / CapCut Pro.
- Prerequisite: D-Log M has no built-in CST gamma preset in DaVinci; log recovery relies on DJI's official `DLog-M to Rec709 Vivid.cube`; the CST only handles the gamut conversion.

## Node chain

1. Denoise (Motion Effects)
2. CST color space conversion (D-Gamut → Rec.709)
3. DJI official recovery LUT
4. Primary correction (white balance, exposure, black/white levels)
5. Creative grade (global, no masks)
6. Export LUT

The order is fixed, don't swap it: denoise must come first, the CST right after, and the recovery LUT after the CST.

## Node 1: Denoise

- Applies to: DaVinci Resolve Studio (the panel is unavailable in the free version).
- How: create a serial node (`Alt+S`) → open the Motion Effects panel.
- Settings:
  - Temporal NR: Frames 2; motion estimation Better; motion range Medium; Luma Threshold 18; Chroma Threshold 30.
  - Spatial NR: Mode Better; Radius Small; Luma Threshold 10; Chroma Threshold 25.
- Check: zoom to 100% and look; toggle the node with `Ctrl+D` for A/B comparison.
- Pass: no visible noise in the shadows; wood grain and similar textures stay sharp; no ghosting in moving areas. These are baseline values — fine-tune per the footage's lighting.

## Node 2: CST color space conversion

- Where: Effects Library → Resolve FX → Color → Color Space Transform (CST).
- How: create a serial node, drag CST onto the node, and set it in the inspector on the right:
  - Input color space: DJI D-Gamut
  - Input gamma: None
  - Output color space: Rec.709
  - Output gamma: Rec.709 Gamma 2.4
- Check: toggle the node and compare for a color shift.
- Pass: all four settings match the list above; no obvious color cast, no greenish-gray tint.

## Node 3: DJI official recovery LUT

- LUT file location (Windows, all users):
  `C:\ProgramData\Blackmagic Design\DaVinci Resolve\Support\LUT`
  Create a `DJI` folder under the LUT directory, put `DLog-M to Rec709 Vivid.cube` in it, and restart DaVinci.
- How: create a serial node → right-click the node → LUT → 3D LUT → pick that LUT.
- Pass: the image looks normal again (white walls near pure white, exposure correct). This node only recovers — no style here.

## Node 4: Primary correction

- The color tools live at the bottom of the Color page (wheels / curves / levels tabs); the inspector on the right adjusts OFX plugin parameters.
- White balance: Primary → color wheels → white balance eyedropper, click a pure white object in the frame (a white wall); fine-tune the color temperature by hand when needed (within ±200K), and leave tint mostly alone.
- Black/white levels and exposure: curves → RGB master curve. Move the black point right to lift the shadows slightly (over-lifting amplifies noise); move the white point left to tame highlights (keep the window detail); the midpoint controls overall brightness.
- Saturation: micro corrections within ±5, no styling at this stage.
- Scopes: right-click the viewer on the Color page → show scopes (disabled on the Edit page).

| Scope | Pass criteria |
|---|---|
| Waveform | Highlights don't hit 1023; shadows don't sit flat at 0 |
| Vectorscope | White wall pixels sit near the center (neutral) |
| Histogram | Right edge doesn't clip against 1023 |

- Pass: white wall neutral, highlights not clipped, shadows not crushed, no noise spike; toggling the node shows no grading artifacts.

## Node 5: Creative grade

- Constraint: global-only grading — no windows, masks, qualifiers, or HSL selections (they break LUT export).
- Primary → color wheels: very slight warmth in the midtones (the white wall must not go yellow); very slight cool blue in the shadows.
- Curves: a gentle shallow S (midtones up a touch, highlights down a touch, shadows up a touch) — no heavy contrast.
- Hue/saturation: global saturation +3 to +8 (never above +10); orange channel +2 to +4 (warmer wood tones); leave the hue sliders alone.
- Pass: toggling the node keeps white balance and exposure the same — only the mood changes; the white wall stays centered on the vectorscope; the waveform stays within 0–1023.

## Exporting the LUT

- Select the last node (Node 5) → right-click the viewer → generate LUT.
- Settings: 33-point size; `.cube` format; full range 0–1023.
- Using it:
  - After Effects: load the cube in a Color Lookup effect; finish the D-LogM recovery first, then stack the LUT.
  - CapCut Pro: Adjust → LUT → import and apply; intensity 80–100. This LUT already includes the recovery, so don't stack DJI's official recovery LUT on top; the CapCut mobile app doesn't support external cubes.

## Saving presets

- Whole node tree: right-click the viewer → grab a still → Gallery panel (`Ctrl+G`) → right-click on the left and add a shared still (PowerGrade) → drag the still in.
- Applying: right-click the still thumbnail → attach node graph (appends, doesn't replace your nodes) / apply grade (replaces all nodes); select multiple clips and right-click to apply in one go.
- Single node: right-click the node → save as a shared node (saves just that node).
- Backup: right-click the thumbnail → export a `.drx` file.

## Final checklist

- [ ] Node 1: no noise in the shadows, textures sharp, no ghosting
- [ ] Node 2: all four CST settings correct, no color cast
- [ ] Node 3: footage looks normal again
- [ ] Node 4: white wall neutral, highlights < 1023, shadows not crushed
- [ ] Node 5: global-only grade, base exposure not broken
- [ ] Export: last node selected, 33-point, cube, full range
- [ ] Preset: still saved to the shared still
