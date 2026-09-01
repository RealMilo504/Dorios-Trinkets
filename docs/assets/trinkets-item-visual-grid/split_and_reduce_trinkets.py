from pathlib import Path
from PIL import Image

# ============================================================
# CONFIGURAÇÃO
# ============================================================

ATLAS_FILE = Path("trinkets-item-concepts-16x16.png")

COLUMNS = 12
ROWS = 7
TILE_SIZE = 16

# "global"     = todos os ícones usam a mesma paleta
# "individual" = cada ícone gera sua própria paleta
# "none"       = apenas separa os ícones, sem reduzir cores
PALETTE_MODE = "individual"

# Quantidade máxima de cores.
# Para pixel art 16x16, 12, 16, 24 ou 32 costumam ser bons testes.
PALETTE_COLORS = 32

# Evita que pixels transparentes influenciem a paleta.
ALPHA_THRESHOLD = 1

# Se uma célula for totalmente transparente, não cria arquivo para ela.
SKIP_EMPTY = True

OUTPUT_DIR = Path("trinkets_output")
RAW_DIR = OUTPUT_DIR / "raw"
REDUCED_DIR = OUTPUT_DIR / "reduced"


# ============================================================
# FUNÇÕES
# ============================================================

def split_atlas(atlas: Image.Image):
    expected_width = COLUMNS * TILE_SIZE
    expected_height = ROWS * TILE_SIZE

    if atlas.size != (expected_width, expected_height):
        raise ValueError(
            f"Atlas com tamanho {atlas.width}x{atlas.height}. "
            f"Com {COLUMNS}x{ROWS} células de {TILE_SIZE}x{TILE_SIZE}, "
            f"o esperado é {expected_width}x{expected_height}."
        )

    icons = []

    for row in range(ROWS):
        for col in range(COLUMNS):
            left = col * TILE_SIZE
            top = row * TILE_SIZE

            icon = atlas.crop(
                (left, top, left + TILE_SIZE, top + TILE_SIZE)
            ).convert("RGBA")

            if SKIP_EMPTY and icon.getbbox() is None:
                continue

            index = row * COLUMNS + col + 1
            filename = f"item_{index:03d}_r{row + 1:02d}_c{col + 1:02d}.png"

            icons.append({
                "index": index,
                "row": row,
                "col": col,
                "filename": filename,
                "image": icon,
            })

    return icons


def make_global_palette(icons, colors):
    """
    Cria uma única paleta a partir de todos os pixels visíveis
    dos ícones, ignorando transparência.
    """
    pixels = []

    for item in icons:
        rgba = item["image"]
        for r, g, b, a in rgba.getdata():
            if a >= ALPHA_THRESHOLD:
                pixels.append((r, g, b))

    if not pixels:
        raise ValueError("Nenhum pixel visível encontrado no atlas.")

    # Imagem temporária contendo todos os pixels visíveis.
    sample = Image.new("RGB", (len(pixels), 1))
    sample.putdata(pixels)

    palette_source = sample.quantize(
        colors=colors,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    )

    return palette_source


def quantize_with_palette(icon, palette_source):
    alpha = icon.getchannel("A")
    rgb = icon.convert("RGB")

    reduced = rgb.quantize(
        palette=palette_source,
        dither=Image.Dither.NONE,
    ).convert("RGBA")

    reduced.putalpha(alpha)
    return reduced


def quantize_individual(icon, colors):
    alpha = icon.getchannel("A")
    rgb = icon.convert("RGB")

    reduced = rgb.quantize(
        colors=colors,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    ).convert("RGBA")

    reduced.putalpha(alpha)
    return reduced


def make_palette_preview(palette_source, colors):
    """
    Gera uma imagem simples mostrando as cores da paleta global.
    Cada quadrado tem 16x16 px.
    """
    raw_palette = palette_source.getpalette()
    palette_colors = []

    for i in range(colors):
        base = i * 3
        palette_colors.append(tuple(raw_palette[base:base + 3]))

    columns = min(8, colors)
    rows = (colors + columns - 1) // columns

    preview = Image.new("RGB", (columns * 16, rows * 16), (0, 0, 0))

    for i, color in enumerate(palette_colors):
        x = (i % columns) * 16
        y = (i // columns) * 16

        for py in range(y, y + 16):
            for px in range(x, x + 16):
                preview.putpixel((px, py), color)

    return preview


def rebuild_atlas(processed_icons):
    rebuilt = Image.new(
        "RGBA",
        (COLUMNS * TILE_SIZE, ROWS * TILE_SIZE),
        (0, 0, 0, 0),
    )

    for item in processed_icons:
        rebuilt.paste(
            item["image"],
            (item["col"] * TILE_SIZE, item["row"] * TILE_SIZE),
            item["image"],
        )

    return rebuilt


# ============================================================
# EXECUÇÃO
# ============================================================

def main():
    if not ATLAS_FILE.exists():
        raise FileNotFoundError(
            f"Não encontrei '{ATLAS_FILE}'. "
            "Coloque o PNG na mesma pasta deste script "
            "ou altere ATLAS_FILE no início do arquivo."
        )

    OUTPUT_DIR.mkdir(exist_ok=True)
    RAW_DIR.mkdir(exist_ok=True)

    atlas = Image.open(ATLAS_FILE).convert("RGBA")
    icons = split_atlas(atlas)

    # Salva os ícones separados sem alteração.
    for item in icons:
        item["image"].save(RAW_DIR / item["filename"])

    print(f"[OK] {len(icons)} ícones separados em: {RAW_DIR}")

    if PALETTE_MODE == "none":
        print("[OK] Redução de paleta desativada.")
        return

    REDUCED_DIR.mkdir(exist_ok=True)

    processed = []

    if PALETTE_MODE == "global":
        palette_source = make_global_palette(icons, PALETTE_COLORS)

        preview = make_palette_preview(palette_source, PALETTE_COLORS)
        preview.save(OUTPUT_DIR / "palette_reference.png")

        for item in icons:
            reduced = quantize_with_palette(item["image"], palette_source)
            reduced.save(REDUCED_DIR / item["filename"])

            processed.append({
                **item,
                "image": reduced,
            })

        print(
            f"[OK] Paleta global de até {PALETTE_COLORS} cores aplicada."
        )
        print(
            f"[OK] Referência da paleta: "
            f"{OUTPUT_DIR / 'palette_reference.png'}"
        )

    elif PALETTE_MODE == "individual":
        for item in icons:
            reduced = quantize_individual(
                item["image"],
                PALETTE_COLORS,
            )

            reduced.save(REDUCED_DIR / item["filename"])

            processed.append({
                **item,
                "image": reduced,
            })

        print(
            f"[OK] Paleta individual de até "
            f"{PALETTE_COLORS} cores aplicada."
        )

    else:
        raise ValueError(
            "PALETTE_MODE precisa ser "
            '"global", "individual" ou "none".'
        )

    rebuilt = rebuild_atlas(processed)
    rebuilt.save(OUTPUT_DIR / "atlas_reduced.png")

    print(f"[OK] Ícones processados em: {REDUCED_DIR}")
    print(
        f"[OK] Atlas reconstruído para comparação: "
        f"{OUTPUT_DIR / 'atlas_reduced.png'}"
    )
    print("[CONCLUÍDO]")


if __name__ == "__main__":
    main()
