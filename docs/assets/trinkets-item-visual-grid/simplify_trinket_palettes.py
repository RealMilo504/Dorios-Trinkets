from pathlib import Path
from collections import Counter, deque
from PIL import Image
import math

# ============================================================
# CONFIGURAÇÃO
# ============================================================

ATLAS_FILE = Path("trinkets-item-concepts-16x16.png")

COLUMNS = 12
ROWS = 7
TILE_SIZE = 16

OUTPUT_DIR = Path("trinkets_simplified")
RAW_DIR = OUTPUT_DIR / "raw"
SIMPLIFIED_DIR = OUTPUT_DIR / "simplified"

# Quanto maior, mais cores semelhantes serão fundidas.
#
# Sugestões:
# 0.035 = conservador
# 0.050 = equilibrado
# 0.065 = forte
# 0.080 = muito forte
SIMPLIFY_DISTANCE = 0.050

# Evita que um highlight/acento saturado seja absorvido
# por uma cor semelhante, porém mais "lavada".
ACCENT_CHROMA_PROTECTION = 0.030

# A imagem gerada por IA possui um fundo quase preto com várias
# microvariações de RGB. Este modo detecta APENAS o fundo escuro
# conectado às bordas de cada célula.
#
# "normalize"   = transforma o fundo em uma única cor
# "transparent" = remove o fundo
# "keep"        = mantém o fundo como está
BACKGROUND_MODE = "transparent"

# Critérios para reconhecer o fundo escuro e quase neutro.
BACKGROUND_MAX_CHANNEL = 48
BACKGROUND_MAX_SPREAD = 8

# Ignora células totalmente vazias se houver transparência.
SKIP_EMPTY = True


# ============================================================
# COR / OKLAB
# ============================================================

def srgb_channel_to_linear(c):
    c /= 255.0
    if c <= 0.04045:
        return c / 12.92
    return ((c + 0.055) / 1.055) ** 2.4


def rgb_to_oklab(rgb):
    r, g, b = [srgb_channel_to_linear(v) for v in rgb]

    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b

    l_ = l ** (1 / 3)
    m_ = m ** (1 / 3)
    s_ = s ** (1 / 3)

    L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    A = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_

    return (L, A, B)


def oklab_distance(a, b):
    return math.sqrt(
        (a[0] - b[0]) ** 2 +
        (a[1] - b[1]) ** 2 +
        (a[2] - b[2]) ** 2
    )


def chroma(lab):
    return math.sqrt(lab[1] ** 2 + lab[2] ** 2)


# ============================================================
# FUNDO
# ============================================================

def is_background_candidate(rgb):
    maximum = max(rgb)
    minimum = min(rgb)

    return (
        maximum <= BACKGROUND_MAX_CHANNEL
        and (maximum - minimum) <= BACKGROUND_MAX_SPREAD
    )


def detect_connected_background(icon):
    """
    Detecta apenas pixels escuros/quase neutros conectados às bordas.

    Assim, pixels pretos internos do próprio item não são apagados
    simplesmente por serem escuros.
    """
    width, height = icon.size
    pixels = icon.load()

    visited = set()
    queue = deque()

    def try_add(x, y):
        if (x, y) in visited:
            return

        r, g, b, a = pixels[x, y]

        if a == 0:
            visited.add((x, y))
            queue.append((x, y))
            return

        if is_background_candidate((r, g, b)):
            visited.add((x, y))
            queue.append((x, y))

    for x in range(width):
        try_add(x, 0)
        try_add(x, height - 1)

    for y in range(height):
        try_add(0, y)
        try_add(width - 1, y)

    while queue:
        x, y = queue.popleft()

        for nx, ny in (
            (x + 1, y),
            (x - 1, y),
            (x, y + 1),
            (x, y - 1),
        ):
            if (
                0 <= nx < width
                and 0 <= ny < height
                and (nx, ny) not in visited
            ):
                r, g, b, a = pixels[nx, ny]

                if a == 0 or is_background_candidate((r, g, b)):
                    visited.add((nx, ny))
                    queue.append((nx, ny))

    return visited


def choose_background_color(icon, background_pixels):
    if not background_pixels:
        return (22, 22, 22)

    pixels = icon.load()

    histogram = Counter(
        pixels[x, y][:3]
        for x, y in background_pixels
        if pixels[x, y][3] > 0
    )

    if not histogram:
        return (22, 22, 22)

    return histogram.most_common(1)[0][0]


# ============================================================
# SIMPLIFICAÇÃO
# ============================================================

def build_simplified_palette(icon, background_pixels):
    """
    Não força N cores.

    Em vez disso, mantém cores reais da imagem como "âncoras"
    e funde apenas cores perceptualmente próximas em OKLab.
    """
    pixels = icon.load()
    histogram = Counter()

    for y in range(icon.height):
        for x in range(icon.width):
            if (x, y) in background_pixels:
                continue

            r, g, b, a = pixels[x, y]

            if a == 0:
                continue

            histogram[(r, g, b)] += 1

    # Cores dominantes primeiro.
    entries = sorted(
        histogram.items(),
        key=lambda item: item[1],
        reverse=True,
    )

    representatives = []
    representative_labs = []

    for rgb, count in entries:
        lab = rgb_to_oklab(rgb)

        if not representatives:
            representatives.append(rgb)
            representative_labs.append(lab)
            continue

        distances = [
            oklab_distance(lab, rep_lab)
            for rep_lab in representative_labs
        ]

        nearest_index = min(
            range(len(distances)),
            key=distances.__getitem__,
        )

        nearest_distance = distances[nearest_index]
        nearest_lab = representative_labs[nearest_index]

        # Protege acentos/highlights mais cromáticos.
        accent_is_stronger = (
            chroma(lab)
            > chroma(nearest_lab) + ACCENT_CHROMA_PROTECTION
        )

        if (
            nearest_distance <= SIMPLIFY_DISTANCE
            and not accent_is_stronger
        ):
            continue

        representatives.append(rgb)
        representative_labs.append(lab)

    return representatives, representative_labs, histogram


def find_nearest_palette_color(rgb, palette, palette_labs):
    lab = rgb_to_oklab(rgb)

    distances = [
        oklab_distance(lab, candidate)
        for candidate in palette_labs
    ]

    nearest_index = min(
        range(len(distances)),
        key=distances.__getitem__,
    )

    return palette[nearest_index]


def simplify_icon(icon):
    icon = icon.convert("RGBA")

    background_pixels = detect_connected_background(icon)
    background_color = choose_background_color(
        icon,
        background_pixels,
    )

    palette, palette_labs, histogram = build_simplified_palette(
        icon,
        background_pixels,
    )

    result = icon.copy()
    source = icon.load()
    destination = result.load()

    for y in range(icon.height):
        for x in range(icon.width):
            r, g, b, a = source[x, y]

            if (x, y) in background_pixels:
                if BACKGROUND_MODE == "transparent":
                    destination[x, y] = (0, 0, 0, 0)

                elif BACKGROUND_MODE == "normalize":
                    destination[x, y] = (
                        background_color[0],
                        background_color[1],
                        background_color[2],
                        a,
                    )

                elif BACKGROUND_MODE == "keep":
                    pass

                else:
                    raise ValueError(
                        'BACKGROUND_MODE deve ser '
                        '"normalize", "transparent" ou "keep".'
                    )

                continue

            if a == 0:
                continue

            mapped = find_nearest_palette_color(
                (r, g, b),
                palette,
                palette_labs,
            )

            destination[x, y] = (
                mapped[0],
                mapped[1],
                mapped[2],
                a,
            )

    original_foreground_colors = len(histogram)
    simplified_foreground_colors = len(palette)

    return (
        result,
        original_foreground_colors,
        simplified_foreground_colors,
        len(background_pixels),
    )


# ============================================================
# ATLAS
# ============================================================

def split_atlas(atlas):
    expected_size = (
        COLUMNS * TILE_SIZE,
        ROWS * TILE_SIZE,
    )

    if atlas.size != expected_size:
        raise ValueError(
            f"Atlas possui {atlas.width}x{atlas.height}px. "
            f"O esperado para {COLUMNS}x{ROWS} células "
            f"de {TILE_SIZE}px é "
            f"{expected_size[0]}x{expected_size[1]}px."
        )

    icons = []

    for row in range(ROWS):
        for col in range(COLUMNS):
            left = col * TILE_SIZE
            top = row * TILE_SIZE

            icon = atlas.crop((
                left,
                top,
                left + TILE_SIZE,
                top + TILE_SIZE,
            )).convert("RGBA")

            if SKIP_EMPTY and icon.getbbox() is None:
                continue

            index = row * COLUMNS + col + 1

            filename = (
                f"item_{index:03d}_"
                f"r{row + 1:02d}_"
                f"c{col + 1:02d}.png"
            )

            icons.append({
                "index": index,
                "row": row,
                "col": col,
                "filename": filename,
                "image": icon,
            })

    return icons


def rebuild_atlas(items):
    output = Image.new(
        "RGBA",
        (
            COLUMNS * TILE_SIZE,
            ROWS * TILE_SIZE,
        ),
        (0, 0, 0, 0),
    )

    for item in items:
        icon = item["image"]

        output.paste(
            icon,
            (
                item["col"] * TILE_SIZE,
                item["row"] * TILE_SIZE,
            ),
            icon,
        )

    return output


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
    SIMPLIFIED_DIR.mkdir(exist_ok=True)

    atlas = Image.open(ATLAS_FILE).convert("RGBA")
    icons = split_atlas(atlas)

    simplified_items = []
    report_lines = [
        "Palette simplification report",
        "=" * 50,
        f"Distance: {SIMPLIFY_DISTANCE}",
        f"Accent protection: {ACCENT_CHROMA_PROTECTION}",
        f"Background mode: {BACKGROUND_MODE}",
        "",
    ]

    total_before = 0
    total_after = 0

    for item in icons:
        original = item["image"]
        original.save(RAW_DIR / item["filename"])

        (
            simplified,
            colors_before,
            colors_after,
            background_pixels,
        ) = simplify_icon(original)

        simplified.save(
            SIMPLIFIED_DIR / item["filename"]
        )

        total_before += colors_before
        total_after += colors_after

        report_lines.append(
            f"{item['filename']}: "
            f"{colors_before} -> {colors_after} foreground colors "
            f"| background pixels: {background_pixels}"
        )

        simplified_items.append({
            **item,
            "image": simplified,
        })

    rebuilt = rebuild_atlas(simplified_items)
    rebuilt.save(OUTPUT_DIR / "atlas_simplified.png")

    average_before = total_before / max(len(icons), 1)
    average_after = total_after / max(len(icons), 1)

    report_lines.extend([
        "",
        "=" * 50,
        f"Icons: {len(icons)}",
        f"Average foreground colors before: {average_before:.2f}",
        f"Average foreground colors after:  {average_after:.2f}",
    ])

    (OUTPUT_DIR / "palette_report.txt").write_text(
        "\n".join(report_lines),
        encoding="utf-8",
    )

    print(f"[OK] {len(icons)} ícones processados.")
    print(
        f"[OK] Média de cores do foreground: "
        f"{average_before:.1f} -> {average_after:.1f}"
    )
    print(
        f"[OK] Resultado: "
        f"{OUTPUT_DIR / 'atlas_simplified.png'}"
    )
    print(
        f"[OK] Relatório: "
        f"{OUTPUT_DIR / 'palette_report.txt'}"
    )


if __name__ == "__main__":
    main()
