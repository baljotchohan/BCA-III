"""
High-Resolution BCA III Logo & Icon Generator
Renders the exact B-III logo from mathematical vector geometry at 4096px canvas
and downscales via Lanczos anti-aliasing for razor-sharp icons at all resolutions.
"""

import os
from PIL import Image, ImageDraw, ImageFont

def render_logo_hd(size):
    # Render at a large master canvas (4096px or 8x size) for pristine anti-aliasing
    SCALE = 8
    S = size * SCALE
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Dark obsidian squircle background (#141413)
    radius = int(S * (14.0 / 64.0)) # 0.21875
    draw.rounded_rectangle([0, 0, S - 1, S - 1], radius=radius, fill=(20, 20, 19, 255))

    # 2. Subtle warm coral glowing border
    border_w = max(SCALE, int(S * (1.5 / 64.0)))
    border_col = (204, 120, 92, 110)
    draw.rounded_rectangle(
        [border_w // 2, border_w // 2, S - 1 - border_w // 2, S - 1 - border_w // 2],
        radius=radius,
        outline=border_col,
        width=border_w
    )

    # 3. Bold Classic Serif 'B'
    font_path = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
    if not os.path.exists(font_path):
        font_path = "/Library/Fonts/Georgia Bold.ttf"
    
    # In 64x64 design, B is 23px tall, starting from y=20 to y=43, x from 9 to 32
    target_b_h = S * (23.0 / 64.0)
    target_b_x = S * (9.0 / 64.0)
    target_b_y = S * (20.0 / 64.0)

    # Find matching font size
    test_font_size = int(S * 0.54)
    font_b = ImageFont.truetype(font_path, test_font_size)
    bbox = draw.textbbox((0, 0), "B", font=font_b)
    actual_h = bbox[3] - bbox[1]

    # Adjust font size precisely
    adjusted_size = int(test_font_size * (target_b_h / actual_h))
    font_b = ImageFont.truetype(font_path, adjusted_size)
    bbox = draw.textbbox((0, 0), "B", font=font_b)

    b_draw_x = int(target_b_x - bbox[0])
    b_draw_y = int(target_b_y - bbox[1])

    draw.text((b_draw_x, b_draw_y), "B", fill=(250, 249, 245, 255), font=font_b)

    # 4. Roman Numeral 'III' in Signature Coral (#CC785C)
    coral = (204, 120, 92, 255)
    
    # Dimensions proportional to 64x64 reference
    iii_x1 = int(S * (32.0 / 64.0))
    iii_w  = int(S * (22.0 / 64.0))
    iii_x2 = iii_x1 + iii_w
    
    top_bar_y1 = int(S * (21.0 / 64.0))
    top_bar_y2 = int(S * (23.0 / 64.0))
    
    bot_bar_y1 = int(S * (41.0 / 64.0))
    bot_bar_y2 = int(S * (43.0 / 64.0))
    
    bar_radius = max(1, int(SCALE * 0.4))
    
    # Top horizontal bar
    draw.rounded_rectangle([iii_x1, top_bar_y1, iii_x2, top_bar_y2], radius=bar_radius, fill=coral)
    
    # Bottom horizontal bar
    draw.rounded_rectangle([iii_x1, bot_bar_y1, iii_x2, bot_bar_y2], radius=bar_radius, fill=coral)
    
    # 3 Vertical Stems
    stem_w = int(S * (2.2 / 64.0))
    stem_y1 = top_bar_y2 - int(SCALE * 0.5)
    stem_y2 = bot_bar_y1 + int(SCALE * 0.5)
    stem_radius = max(1, int(SCALE * 0.3))
    
    stem_centers = [
        int(S * (36.5 / 64.0)),
        int(S * (43.0 / 64.0)),
        int(S * (49.5 / 64.0))
    ]
    
    for sc in stem_centers:
        sx1 = sc - stem_w // 2
        sx2 = sx1 + stem_w
        draw.rounded_rectangle([sx1, stem_y1, sx2, stem_y2], radius=stem_radius, fill=coral)

    # 5. Downscale with Lanczos resampling
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

if __name__ == "__main__":
    targets = {
        "favicon-16x16.png": 16,
        "favicon-32x32.png": 32,
        "favicon.png": 64,
        "apple-touch-icon.png": 180,
        "icon-192.png": 192,
        "icon-512.png": 512,
    }

    for fname, sz in targets.items():
        icon = render_logo_hd(sz)
        icon.save(fname, "PNG")
        print(f"✓ {fname} ({sz}x{sz})")

    # Multi-resolution favicon.ico
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    ico_imgs = [render_logo_hd(s[0]) for s in ico_sizes]
    ico_imgs[0].save("favicon.ico", format="ICO", sizes=ico_sizes)
    print("✓ favicon.ico (multi-resolution 16/32/48/64)")
