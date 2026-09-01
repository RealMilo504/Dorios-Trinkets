"""Normalize the generated Trinkets concept board into 16x16 item cells."""

from pathlib import Path
from shutil import copy2
import sys

from PIL import Image


COLS = 12
ROWS = 7
TILE_SIZE = 16
PREVIEW_SCALE = 8
CELL_MARGIN = 6


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: build_item_visual_grid.py SOURCE OUTPUT_DIR")

    source = Path(sys.argv[1])
    output_dir = Path(sys.argv[2])
    output_dir.mkdir(parents=True, exist_ok=True)

    image = Image.open(source).convert("RGB")
    width, height = image.size
    sheet = Image.new(
        "RGB",
        (COLS * TILE_SIZE, ROWS * TILE_SIZE),
        (16, 17, 18),
    )

    for row in range(ROWS):
        for col in range(COLS):
            left = round(col * width / COLS) + CELL_MARGIN
            top = round(row * height / ROWS) + CELL_MARGIN
            right = round((col + 1) * width / COLS) - CELL_MARGIN
            bottom = round((row + 1) * height / ROWS) - CELL_MARGIN
            tile = image.crop((left, top, right, bottom))
            tile = tile.resize(
                (TILE_SIZE, TILE_SIZE),
                Image.Resampling.NEAREST,
            )
            sheet.paste(tile, (col * TILE_SIZE, row * TILE_SIZE))

    native_path = output_dir / "trinkets-item-concepts-16x16.png"
    preview_path = output_dir / "trinkets-item-concepts-preview-8x.png"
    source_path = output_dir / "trinkets-item-concepts-source.png"

    sheet.save(native_path, optimize=True)
    sheet.resize(
        (sheet.width * PREVIEW_SCALE, sheet.height * PREVIEW_SCALE),
        Image.Resampling.NEAREST,
    ).save(preview_path, optimize=True)
    copy2(source, source_path)

    print(f"source={image.size[0]}x{image.size[1]} -> {source_path}")
    print(f"native={sheet.size[0]}x{sheet.size[1]} -> {native_path}")
    print(
        f"preview={sheet.width * PREVIEW_SCALE}x"
        f"{sheet.height * PREVIEW_SCALE} -> {preview_path}"
    )


if __name__ == "__main__":
    main()
