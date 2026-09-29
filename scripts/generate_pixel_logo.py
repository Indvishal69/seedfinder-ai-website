import os
from PIL import Image, ImageDraw, ImageFont

def make_pixel_icon(size=32):
    # 32x32 pixel canvas
    img = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    pixels = img.load()

    # Colors
    BORDER_LIGHT = (85, 85, 85, 255)
    BORDER_DARK = (20, 20, 20, 255)
    BG = (30, 30, 30, 255)
    BG_ACCENT = (38, 38, 38, 255)

    DIAMOND_CYAN_HI = (120, 255, 255, 255)
    DIAMOND_CYAN = (77, 237, 244, 255)
    DIAMOND_CYAN_MID = (43, 183, 192, 255)
    DIAMOND_CYAN_DARK = (19, 119, 128, 255)
    DIAMOND_OUTLINE = (10, 55, 60, 255)

    GOLD_HI = (255, 255, 140, 255)
    GOLD_MID = (255, 215, 0, 255)
    GOLD_DARK = (212, 160, 23, 255)
    GOLD_OUTLINE = (120, 80, 0, 255)

    GREEN_LEAF_HI = (120, 255, 120, 255)
    GREEN_LEAF = (60, 210, 60, 255)
    GREEN_DARK = (20, 120, 20, 255)

    WOOD_MID = (134, 96, 67, 255)
    WOOD_DARK = (87, 61, 38, 255)
    WOOD_SHADOW = (45, 30, 18, 255)

    # 1. Beveled Stone Tile Frame
    for y in range(32):
        for x in range(32):
            # Rounded corners
            if (x == 0 and y == 0) or (x == 31 and y == 0) or (x == 0 and y == 31) or (x == 31 and y == 31):
                continue
            if (x <= 1 and y <= 1) or (x >= 30 and y <= 1) or (x <= 1 and y >= 30) or (x >= 30 and y >= 30):
                pixels[x, y] = BORDER_DARK
                continue
            
            # Outer Bevel Border
            if y == 0 or x == 0:
                pixels[x, y] = BORDER_LIGHT
            elif y == 31 or x == 31:
                pixels[x, y] = BORDER_DARK
            elif y == 1 or x == 1:
                pixels[x, y] = (70, 70, 70, 255)
            elif y == 30 or x == 30:
                pixels[x, y] = (15, 15, 15, 255)
            else:
                # Stone checkerboard pattern
                pixels[x, y] = BG_ACCENT if (x + y) % 3 == 0 else BG

    # 2. Draw Pixel Diamond Pickaxe
    # Stick going from bottom-left (7, 24) to center (16, 15)
    stick_coords = [
        (8, 23), (9, 22), (10, 21), (11, 20), (12, 19), 
        (13, 18), (14, 17), (15, 16), (16, 15)
    ]
    for x, y in stick_coords:
        pixels[x, y] = WOOD_MID
        pixels[x+1, y] = WOOD_DARK
        pixels[x-1, y] = WOOD_SHADOW
        pixels[x, y+1] = WOOD_SHADOW

    # Pickaxe Head (Curved top blade)
    head_coords = [
        # Center socket
        (16, 14, DIAMOND_CYAN_MID),
        (17, 14, DIAMOND_CYAN_MID),
        (16, 13, DIAMOND_CYAN),
        (17, 13, DIAMOND_CYAN_HI),
        # Right wing
        (18, 12, DIAMOND_CYAN),
        (19, 11, DIAMOND_CYAN),
        (20, 10, DIAMOND_CYAN_HI),
        (21, 9, DIAMOND_CYAN),
        (22, 9, DIAMOND_CYAN),
        (23, 10, DIAMOND_CYAN_MID),
        (24, 11, DIAMOND_CYAN_MID),
        (24, 12, DIAMOND_CYAN_DARK),
        # Left wing
        (15, 12, DIAMOND_CYAN),
        (14, 11, DIAMOND_CYAN),
        (13, 10, DIAMOND_CYAN_HI),
        (12, 9, DIAMOND_CYAN),
        (11, 9, DIAMOND_CYAN),
        (10, 10, DIAMOND_CYAN_MID),
        (9, 11, DIAMOND_CYAN_MID),
        (9, 12, DIAMOND_CYAN_DARK),
    ]

    for pt in head_coords:
        x, y, col = pt
        pixels[x, y] = col
        # Outlines around pickaxe head
        for ox, oy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            if pixels[x+ox, y+oy] == BG or pixels[x+ox, y+oy] == BG_ACCENT:
                pixels[x+ox, y+oy] = DIAMOND_OUTLINE

    # 3. Draw Golden Sprouting Seed at the center of the pickaxe
    # Golden Seed Body
    seed_coords = [
        (16, 10, GOLD_HI),
        (17, 10, GOLD_HI),
        (15, 11, GOLD_MID),
        (16, 11, GOLD_MID),
        (17, 11, GOLD_MID),
        (18, 11, GOLD_MID),
        (15, 12, GOLD_MID),
        (16, 12, GOLD_DARK),
        (17, 12, GOLD_DARK),
        (18, 12, GOLD_DARK),
        (16, 13, GOLD_DARK)
    ]
    for x, y, col in seed_coords:
        pixels[x, y] = col

    # Sprouting Green Leaves
    leaves = [
        (16, 8, GREEN_LEAF),
        (15, 7, GREEN_LEAF_HI),
        (14, 6, GREEN_LEAF_HI),
        (13, 6, GREEN_LEAF),
        (17, 7, GREEN_LEAF_HI),
        (18, 6, GREEN_LEAF_HI),
        (19, 6, GREEN_LEAF),
        (16, 9, GREEN_DARK)
    ]
    for x, y, col in leaves:
        pixels[x, y] = col

    # Outline for seed/sprout
    for x, y, _ in seed_coords + leaves:
        for ox, oy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            if pixels[x+ox, y+oy] in [BG, BG_ACCENT, DIAMOND_OUTLINE]:
                pixels[x+ox, y+oy] = GOLD_OUTLINE

    # Scale cleanly with nearest neighbor to 256x256
    scaled = img.resize((256, 256), Image.NEAREST)
    return img, scaled

def make_full_logo(icon_img):
    # Create horizontal banner logo (420 x 80)
    banner = Image.new("RGBA", (440, 84), (0, 0, 0, 0))
    draw = ImageDraw.Draw(banner)

    # Paste scaled icon at left
    icon_64 = icon_img.resize((68, 68), Image.NEAREST)
    banner.paste(icon_64, (8, 8), icon_64)

    # Use pixel style text or clean bold blocky text
    # Draw "SEEDFINDER"
    # Fallback to default or standard font
    try:
        font_large = ImageFont.truetype("arialbd.ttf", 36)
        font_small = ImageFont.truetype("arialbd.ttf", 36)
    except:
        font_large = ImageFont.load_default()
        font_small = font_large

    # Dropshadow for "SEEDFINDER"
    draw.text((90, 22), "SEEDFINDER", fill=(10, 30, 35, 255), font=font_large)
    draw.text((88, 20), "SEEDFINDER", fill=(77, 237, 244, 255), font=font_large)

    # Dropshadow for "AI"
    draw.text((364, 22), "AI", fill=(60, 45, 0, 255), font=font_small)
    draw.text((362, 20), "AI", fill=(255, 215, 0, 255), font=font_small)

    return banner

if __name__ == "__main__":
    os.makedirs("public", exist_ok=True)
    os.makedirs("app", exist_ok=True)

    raw_32, scaled_256 = make_pixel_icon()

    # Save favicon pngs
    scaled_256.save("public/favicon.png", "PNG")
    scaled_256.save("app/icon.png", "PNG")

    # Save multi-size favicon.ico (16, 32, 48, 64)
    ico_16 = raw_32.resize((16, 16), Image.NEAREST)
    ico_32 = raw_32.resize((32, 32), Image.NEAREST)
    ico_48 = raw_32.resize((48, 48), Image.NEAREST)
    ico_64 = raw_32.resize((64, 64), Image.NEAREST)
    ico_32.save("public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    ico_32.save("app/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

    # Save full logo
    full_banner = make_full_logo(raw_32)
    full_banner.save("public/logo.png", "PNG")
    scaled_256.save("public/logo_icon.png", "PNG")

    print("Successfully generated authentic Minecraft pixel-art logo and favicon assets!")
