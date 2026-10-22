#!/usr/bin/env python3
"""Process pot sketch images: remove background, normalize to 1:1, export layers."""

from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "pot-sketches"
TARGET = 1024

ASSETS = Path(
    "/Users/admin/.cursor/projects/Users-admin-Documents-websites-grumpy-n-goofy-pottery-shop/assets"
)

SOURCES = {
    "pinch-pot": ASSETS / "image-a84ac86f-5180-4515-ab78-a616c65141b8.png",
    "cylinder": ASSETS / "image-7c5997c8-fa74-45fe-8661-3ed2b3d55106.png",
}


# Right-side stroke clusters past this x are treated as the handle when clipping fill.
HANDLE_SPLIT_X: dict[str, int] = {
    "pinch-pot": 500,
    "cylinder": 550,
}

# Hard cap on pattern fill x (pinch-pot handle sits close to the body wall).
FILL_MAX_X: dict[str, int | None] = {
    "pinch-pot": 665,
    "cylinder": None,
}


def luminance(r: float, g: float, b: float) -> float:
    return 0.299 * r + 0.587 * g + 0.114 * b


def resolve_source(name: str) -> Path:
    path = SOURCES[name]
    if not path.exists():
        raise FileNotFoundError(f"Missing source image for {name}: {path}")
    return path


def to_square_rgba(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    if w == h:
        return img
    size = max(w, h)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(img, ((size - w) // 2, (size - h) // 2))
    return canvas


def resize_square(img: Image.Image, size: int) -> Image.Image:
    return to_square_rgba(img).resize((size, size), Image.Resampling.LANCZOS)


def flood_paper_background(arr: np.ndarray) -> np.ndarray:
    h, w = arr.shape[:2]
    is_bg = np.zeros((h, w), dtype=bool)
    visited = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()

    def paperish(r: int, g: int, b: int, a: int) -> bool:
        if a < 20:
            return True
        return r > 195 and g > 190 and b > 175 and luminance(r, g, b) > 200

    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    while q:
        x, y = q.popleft()
        if x < 0 or x >= w or y < 0 or y >= h or visited[y, x]:
            continue
        visited[y, x] = True
        r, g, b, a = arr[y, x]
        if paperish(int(r), int(g), int(b), int(a)):
            is_bg[y, x] = True
            q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    return is_bg


def is_stroke(r: int, g: int, b: int, a: int) -> bool:
    if a < 20:
        return False
    return luminance(r, g, b) < 145


def dilate(mask: np.ndarray, radius: int = 8) -> np.ndarray:
    out = mask.copy()
    h, w = mask.shape
    for y in range(h):
        for x in range(w):
            if not mask[y, x]:
                continue
            y0, y1 = max(0, y - radius), min(h, y + radius + 1)
            x0, x1 = max(0, x - radius), min(w, x + radius + 1)
            out[y0:y1, x0:x1] = True
    return out


def keep_pot_strokes(stroke: np.ndarray, fill: np.ndarray) -> np.ndarray:
    """Keep strokes connected to the pot (body + handle), drop stray marks."""
    h, w = fill.shape
    anchor = dilate(fill, radius=28)
    kept = np.zeros((h, w), dtype=bool)
    visited = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()

    for y in range(h):
        for x in range(w):
            if not stroke[y, x] or visited[y, x]:
                continue
            if anchor[y, x]:
                visited[y, x] = True
                kept[y, x] = True
                q.append((x, y))
                continue
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and anchor[ny, nx]:
                    visited[y, x] = True
                    kept[y, x] = True
                    q.append((x, y))
                    break

    while q:
        x, y = q.popleft()
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                if dx == 0 and dy == 0:
                    continue
                nx, ny = x + dx, y + dy
                if (
                    0 <= nx < w
                    and 0 <= ny < h
                    and not visited[ny, nx]
                    and stroke[ny, nx]
                ):
                    visited[ny, nx] = True
                    kept[ny, nx] = True
                    q.append((nx, ny))

    # Cast shadow beneath the pot
    ys, xs = np.where(fill)
    if ys.size:
        y_max = int(ys.max())
        x_min, x_max = int(xs.min()), int(xs.max())
        shadow = np.zeros((h, w), dtype=bool)
        shadow[
            y_max : min(h, y_max + 88),
            max(0, x_min - 36) : min(w, x_max + 120),
        ] = True
        kept |= stroke & shadow

    return kept


def cluster_strokes(xs: np.ndarray, gap: int = 35) -> list[list[int]]:
    if xs.size == 0:
        return []
    clusters: list[list[int]] = [[int(xs[0])]]
    for x in xs[1:]:
        if x - clusters[-1][-1] > gap:
            clusters.append([int(x)])
        else:
            clusters[-1].append(int(x))
    return clusters


def clip_handle_gap_per_row(
    fill: np.ndarray, pot_strokes: np.ndarray, split_x: int
) -> np.ndarray:
    """Stop pattern fill from bleeding into the handle gap on the right."""
    h, w = fill.shape
    clipped = fill.copy()
    for y in range(h):
        xs = np.where(pot_strokes[y])[0]
        clusters = cluster_strokes(xs)
        if len(clusters) < 2:
            continue
        if len(clusters) >= 3:
            cap_x = clusters[1][0] - 1
        else:
            right_clusters = [c for c in clusters if c[0] > split_x]
            if not right_clusters:
                continue
            cap_x = min(c[0] for c in right_clusters) - 1
        clipped[y, max(0, cap_x + 1) :] = False
    return clipped


def body_front_face_fill(
    is_bg: np.ndarray,
    stroke: np.ndarray,
    split_x: int,
) -> np.ndarray:
    """Fill the visible mug body panel row-by-row, stopping before the handle."""
    h, w = stroke.shape
    fill = np.zeros((h, w), dtype=bool)
    ys = np.where(stroke.any(axis=1))[0]
    if ys.size == 0:
        return fill

    y_min, y_max = int(ys.min()), int(ys.max())
    for y in range(y_min, y_max + 1):
        xs = np.where(stroke[y])[0]
        if xs.size < 2:
            continue
        clusters = cluster_strokes(xs)
        if len(clusters) < 2:
            continue

        left_bound = clusters[0][-1] + 1
        right_bound = min(c[0] for c in clusters[1:]) - 1
        handle_clusters = [c for c in clusters[1:] if c[0] > split_x]
        if handle_clusters:
            right_bound = min(
                right_bound, min(c[0] for c in handle_clusters) - 1
            )

        if right_bound <= left_bound + 8:
            continue

        for x in range(max(0, left_bound), min(w, right_bound + 1)):
            if not is_bg[y, x] and not stroke[y, x]:
                fill[y, x] = True

    return fill


def body_pattern_fill(
    is_bg: np.ndarray,
    stroke: np.ndarray,
    name: str,
) -> np.ndarray:
    """Fill the mug body front panel so patterns preview inside the silhouette."""
    split_x = HANDLE_SPLIT_X[name]
    fill = body_front_face_fill(is_bg, stroke, split_x)
    pot_strokes = keep_pot_strokes(stroke, fill)
    fill = clip_handle_gap_per_row(fill, pot_strokes, split_x)
    max_x = FILL_MAX_X.get(name)
    if max_x is not None:
        fill[:, max_x + 1 :] = False
    return fill & ~stroke


def flood_interior(
    is_bg: np.ndarray,
    stroke: np.ndarray,
    seed: tuple[int, int],
) -> np.ndarray:
    h, w = is_bg.shape
    fill = np.zeros((h, w), dtype=bool)
    visited = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque([seed])

    while q:
        x, y = q.popleft()
        if x < 0 or x >= w or y < 0 or y >= h or visited[y, x]:
            continue
        visited[y, x] = True
        if is_bg[y, x] or stroke[y, x]:
            continue
        fill[y, x] = True
        q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    return fill


def fit_artwork_in_canvas(arr: np.ndarray, margin: int = 130) -> np.ndarray:
    """Scale artwork down and center it so handles/shadows are never flush to edges."""
    return fit_layers_in_canvas(arr, margin=margin)[0]


def fit_layers_in_canvas(
    *layers: np.ndarray, margin: int = 130
) -> list[np.ndarray]:
    """Fit multiple layers with one shared crop/scale so masks stay aligned."""
    if not layers:
        return []

    visible = np.zeros(layers[0].shape[:2], dtype=bool)
    for layer in layers:
        visible |= layer[:, :, 3] > 8

    ys, xs = np.where(visible)
    if ys.size == 0:
        return [layer.copy() for layer in layers]

    y0, y1 = int(ys.min()), int(ys.max())
    x0, x1 = int(xs.min()), int(xs.max())
    ch = y1 - y0 + 1
    cw = x1 - x0 + 1
    inner = TARGET - 2 * margin
    scale = min(inner / cw, inner / ch, 1.0)
    new_w = max(1, int(round(cw * scale)))
    new_h = max(1, int(round(ch * scale)))
    ox = (TARGET - new_w) // 2
    oy = (TARGET - new_h) // 2

    fitted: list[np.ndarray] = []
    for layer in layers:
        crop = layer[y0 : y1 + 1, x0 : x1 + 1]
        resized = np.array(
            Image.fromarray(crop).resize((new_w, new_h), Image.Resampling.LANCZOS)
        )
        canvas = np.zeros((TARGET, TARGET, 4), dtype=np.uint8)
        canvas[oy : oy + new_h, ox : ox + new_w] = resized
        fitted.append(canvas)

    return fitted


def process(name: str) -> None:
    src = resolve_source(name)
    img = resize_square(Image.open(src), TARGET)
    arr = np.array(img)
    is_bg = flood_paper_background(arr)

    stroke = np.zeros(arr.shape[:2], dtype=bool)
    for y in range(arr.shape[0]):
        for x in range(arr.shape[1]):
            r, g, b, a = arr[y, x]
            stroke[y, x] = is_stroke(int(r), int(g), int(b), int(a))

    fill = body_pattern_fill(is_bg, stroke, name)
    stroke = keep_pot_strokes(stroke, fill)
    near_pot = dilate(fill, radius=30)

    # Include cast shadow / hatching as part of sketch, not fill
    fill &= ~stroke

    sketch = np.zeros_like(arr)
    for y in range(arr.shape[0]):
        for x in range(arr.shape[1]):
            if stroke[y, x]:
                sketch[y, x] = (13, 43, 82, 255)
            elif not is_bg[y, x] and not fill[y, x] and near_pot[y, x]:
                r, g, b, a = arr[y, x]
                if luminance(r, g, b) < 220:
                    alpha = int(min(255, (220 - luminance(r, g, b)) * 2.2))
                    sketch[y, x] = (13, 43, 82, alpha)

    fill_mask = np.zeros((TARGET, TARGET, 4), dtype=np.uint8)
    fill_mask[fill] = (255, 255, 255, 255)

    sketch, fill_mask = fit_layers_in_canvas(sketch, fill_mask, margin=200)

    OUT.mkdir(parents=True, exist_ok=True)
    Image.fromarray(sketch).save(OUT / f"{name}-sketch.png", optimize=True)
    Image.fromarray(fill_mask).save(OUT / f"{name}-fill-mask.png", optimize=True)
    print(f"Wrote {name}: sketch + fill-mask ({TARGET}x{TARGET})")


def main() -> None:
    for name in SOURCES:
        process(name)


if __name__ == "__main__":
    main()
