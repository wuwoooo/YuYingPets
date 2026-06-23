#!/usr/bin/env python3
"""Repair green-screen damaged pet PNGs without overwriting source assets.

The old cutout pipeline removed/suppressed chroma green pixels from the whole
image. For pets whose real body/decorations are green, the alpha shape is still
usable, but RGB in those areas is faded. This script restores RGB from the
matching raw green-screen render, maps the raw subject bbox to the current alpha
bbox, and keeps the current alpha channel.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

from PIL import Image, ImageFilter


DEFAULT_REPO = Path("/Users/wuwoo/Desktop/work/_育英星宠/YuYingPets")
DEFAULT_HISTORY_ROOT = Path("/Users/wuwoo/Desktop/work/_育英星宠")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=DEFAULT_REPO / "pets" / "需优化萌宠",
        help="Damaged transparent PNG directory.",
    )
    parser.add_argument(
        "--raw-dir",
        type=Path,
        default=DEFAULT_HISTORY_ROOT / "generated_pets_staging" / "raw_queue",
        help="Raw green-screen render directory.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_REPO / "pets" / "需优化萌宠_green_repair_candidate",
        help="Candidate output directory. Existing files are overwritten here only.",
    )
    return parser.parse_args()


def dominant_border_rgb(image: Image.Image) -> tuple[int, int, int]:
    width, height = image.size
    pixels = image.load()
    border: list[tuple[int, int, int]] = []

    for x in range(width):
        border.append(pixels[x, 0][:3])
        border.append(pixels[x, height - 1][:3])
    for y in range(height):
        border.append(pixels[0, y][:3])
        border.append(pixels[width - 1, y][:3])

    return Counter(border).most_common(1)[0][0]


def rough_raw_subject_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    """Find a loose raw subject bbox while ignoring the pure green-screen field."""
    bg = dominant_border_rgb(image)
    width, height = image.size
    pixels = image.load()
    xs: list[int] = []
    ys: list[int] = []

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            distance = abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2])
            green_screen_like = g > 150 and g > r + 45 and g > b + 35 and distance < 180
            if not green_screen_like:
                xs.append(x)
                ys.append(y)

    if not xs:
        return (0, 0, width, height)

    padding = 8
    return (
        max(0, min(xs) - padding),
        max(0, min(ys) - padding),
        min(width, max(xs) + 1 + padding),
        min(height, max(ys) + 1 + padding),
    )


def is_green_screen_like(rgb: tuple[int, int, int], bg: tuple[int, int, int]) -> bool:
    r, g, b = rgb
    distance = abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2])
    return g > 150 and g > r + 45 and g > b + 35 and distance < 180


def green_damage_metrics(raw_mapped: Image.Image, damaged: Image.Image) -> dict[str, float | int]:
    raw_pixels = raw_mapped.convert("RGBA").get_flattened_data()
    damaged_pixels = damaged.convert("RGBA").get_flattened_data()

    greenish_opaque = 0
    damaged_greenish = 0
    g_drop_total = 0.0
    dominance_drop_total = 0.0

    for (rr, rg, rb, _), (dr, dg, db, da) in zip(raw_pixels, damaged_pixels):
        if da < 240:
            continue
        if rg <= rr + 15 or rg <= rb + 5 or rg <= 80:
            continue

        greenish_opaque += 1
        raw_dominance = rg - max(rr, rb)
        damaged_dominance = dg - max(dr, db)
        g_drop = rg - dg
        dominance_drop = raw_dominance - damaged_dominance
        if g_drop > 20 or dominance_drop > 20:
            damaged_greenish += 1
            g_drop_total += g_drop
            dominance_drop_total += dominance_drop

    if damaged_greenish == 0:
        return {
            "greenish_opaque_px": greenish_opaque,
            "damaged_greenish_px": 0,
            "damaged_greenish_ratio": 0.0,
            "avg_g_drop": 0.0,
            "avg_green_dominance_drop": 0.0,
        }

    return {
        "greenish_opaque_px": greenish_opaque,
        "damaged_greenish_px": damaged_greenish,
        "damaged_greenish_ratio": round(damaged_greenish / max(greenish_opaque, 1), 4),
        "avg_g_drop": round(g_drop_total / damaged_greenish, 2),
        "avg_green_dominance_drop": round(dominance_drop_total / damaged_greenish, 2),
    }


def repair_one(damaged_path: Path, raw_path: Path, output_path: Path) -> dict[str, object]:
    damaged = Image.open(damaged_path).convert("RGBA")
    raw = Image.open(raw_path).convert("RGBA")
    raw_bg = dominant_border_rgb(raw)
    alpha = damaged.getchannel("A")
    alpha_bbox = alpha.getbbox()

    if alpha_bbox is None:
        raise ValueError(f"empty alpha: {damaged_path}")

    raw_bbox = rough_raw_subject_bbox(raw)
    target_width = alpha_bbox[2] - alpha_bbox[0]
    target_height = alpha_bbox[3] - alpha_bbox[1]
    raw_subject = raw.crop(raw_bbox).resize((target_width, target_height), Image.Resampling.LANCZOS)

    mapped = Image.new("RGBA", damaged.size, (0, 0, 0, 0))
    mapped.alpha_composite(raw_subject, (alpha_bbox[0], alpha_bbox[1]))

    r, g, b, _ = mapped.split()
    repaired = Image.merge("RGBA", (r, g, b, alpha))

    repaired_pixels = repaired.load()
    damaged_pixels = damaged.load()
    interior_alpha = alpha.filter(ImageFilter.MinFilter(15))
    interior_pixels = interior_alpha.load()
    width, height = repaired.size
    restored_internal_green = 0
    reverted_edge_green = 0

    # Preserve the old edge color near transparent/soft alpha pixels. Interior
    # saturated greens are kept so real jewels/accessories are not treated as
    # green-screen spill.
    for y in range(height):
        for x in range(width):
            rr, rg, rb, aa = repaired_pixels[x, y]
            dr, dg, db, _ = damaged_pixels[x, y]
            if aa == 0:
                repaired_pixels[x, y] = (0, 0, 0, 0)
            elif is_green_screen_like((rr, rg, rb), raw_bg):
                if aa >= 245 and interior_pixels[x, y] >= 245:
                    restored_internal_green += 1
                else:
                    repaired_pixels[x, y] = (dr, dg, db, aa)
                    reverted_edge_green += 1
            elif aa < 220:
                blend = aa / 220.0
                repaired_pixels[x, y] = (
                    int(dr * (1.0 - blend) + rr * blend),
                    int(dg * (1.0 - blend) + rg * blend),
                    int(db * (1.0 - blend) + rb * blend),
                    aa,
                )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    repaired.save(output_path, format="PNG")

    return {
        "file": damaged_path.name,
        "raw": str(raw_path),
        "output": str(output_path),
        "size": list(damaged.size),
        "alpha_bbox": list(alpha_bbox),
        "raw_subject_bbox": list(raw_bbox),
        "metrics": green_damage_metrics(mapped, damaged),
        "restored_internal_green_px": restored_internal_green,
        "reverted_edge_green_px": reverted_edge_green,
    }


def main() -> None:
    args = parse_args()
    pngs = sorted(args.source_dir.glob("*.png"))
    if not pngs:
        raise FileNotFoundError(f"no PNG files found in {args.source_dir}")

    report: list[dict[str, object]] = []
    missing_raw: list[str] = []

    for damaged_path in pngs:
        raw_path = args.raw_dir / f"{damaged_path.stem}_raw.png"
        if not raw_path.exists():
            missing_raw.append(damaged_path.name)
            continue
        output_path = args.output_dir / damaged_path.name
        report.append(repair_one(damaged_path, raw_path, output_path))

    report_path = args.output_dir / "green_repair_report.json"
    report_path.write_text(
        json.dumps(
            {
                "source_dir": str(args.source_dir),
                "raw_dir": str(args.raw_dir),
                "output_dir": str(args.output_dir),
                "processed": len(report),
                "missing_raw": missing_raw,
                "items": report,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"processed={len(report)} missing_raw={len(missing_raw)}")
    print(report_path)


if __name__ == "__main__":
    main()
