from pathlib import Path

from PIL import Image


SOURCE = Path("docs/assets/underused-relic-wave/source.png")
OUTPUT = Path("docs/assets/underused-relic-wave/icons")
PREVIEW = Path("docs/assets/underused-relic-wave/preview-8x.png")

ITEMS = (
    "silverfish_scale_ring",
    "breeze_core_loop",
    "ominous_key_ring",
    "phantom_membrane_mantle",
    "armadillo_shield_brooch",
    "lost_allay_bell",
    "desert_scarab_charm",
    "packed_snow_doll",
    "shipwrecked_doll",
    "wind_bracer",
    "cracked_bastion_medallion",
    "jungle_reliquary",
)

COLUMNS = 4
ROWS = 3
FINAL_SIZE = 16
CONTENT_SIZE = 15


def visible_bbox(image: Image.Image):
    alpha = image.getchannel("A").point(lambda value: 255 if value >= 24 else 0)
    return alpha.getbbox()


def fit_icon(cell: Image.Image) -> Image.Image:
    bbox = visible_bbox(cell)
    if bbox is None:
        raise ValueError("Generated sheet contains an empty cell.")

    icon = cell.crop(bbox)
    scale = min(CONTENT_SIZE / icon.width, CONTENT_SIZE / icon.height)
    size = (
        max(1, round(icon.width * scale)),
        max(1, round(icon.height * scale)),
    )
    icon = icon.resize(size, Image.Resampling.LANCZOS)

    # Inventory sprites need hard alpha edges after the high-resolution downscale.
    alpha = icon.getchannel("A").point(lambda value: 0 if value < 48 else value)
    icon.putalpha(alpha)

    output = Image.new("RGBA", (FINAL_SIZE, FINAL_SIZE), (0, 0, 0, 0))
    offset = ((FINAL_SIZE - icon.width) // 2, (FINAL_SIZE - icon.height) // 2)
    output.alpha_composite(icon, offset)
    return output


def main():
    sheet = Image.open(SOURCE).convert("RGBA")
    if sheet.width % COLUMNS or sheet.height % ROWS:
        raise ValueError(
            f"Sheet {sheet.width}x{sheet.height} is not divisible by "
            f"the {COLUMNS}x{ROWS} grid."
        )

    cell_width = sheet.width // COLUMNS
    cell_height = sheet.height // ROWS
    if cell_width != cell_height:
        raise ValueError(f"Expected square cells, got {cell_width}x{cell_height}.")

    OUTPUT.mkdir(parents=True, exist_ok=True)
    preview = Image.new(
        "RGBA",
        (COLUMNS * FINAL_SIZE, ROWS * FINAL_SIZE),
        (0, 0, 0, 0),
    )

    for index, item_id in enumerate(ITEMS):
        row, column = divmod(index, COLUMNS)
        cell = sheet.crop((
            column * cell_width,
            row * cell_height,
            (column + 1) * cell_width,
            (row + 1) * cell_height,
        ))
        icon = fit_icon(cell)
        icon.save(OUTPUT / f"{item_id}.png")
        preview.alpha_composite(icon, (column * FINAL_SIZE, row * FINAL_SIZE))

    preview.resize(
        (preview.width * 8, preview.height * 8),
        Image.Resampling.NEAREST,
    ).save(PREVIEW)
    print(f"Generated {len(ITEMS)} 16x16 icons and {PREVIEW}.")


if __name__ == "__main__":
    main()
