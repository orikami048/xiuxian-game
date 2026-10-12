import os
from PIL import Image

src_path = r"C:\Users\kami\.gemini\antigravity\brain\067e7c08-6455-4684-9322-ed102a0b15e0\anime_girl_meditating_sprite_sheet_1791693652207.jpg"
out_dir = r"D:\projects\xiuxian-game\textures\anime_meditation_sheet"
coco_dir = r"D:\xiuxian\assets\textures\anime_meditation_sheet"
os.makedirs(out_dir, exist_ok=True)
os.makedirs(coco_dir, exist_ok=True)

img = Image.open(src_path).convert("RGBA")
W, H = img.size

# 3行3列网格
box_w = W // 3 # 341
box_h = H // 3 # 341

FRAME_SZ = 256
# 我们选择 6 帧最经典连贯的吐纳循环序列：
# 1. 待机打坐 (0,0)
# 2. 灵气微聚 (1,0)
# 3. 灵流升腾 (2,0)
# 4. 护体神光 (0,1)
# 5. 灵波扩散 (2,1)
# 6. 天人合一金纹结印 (0,2)

coords = [
    (0, 0), # 1: 平静闭目结印
    (1, 0), # 2: 吐纳灵息汇聚
    (2, 0), # 3: 银发飘逸灵光流转
    (0, 1), # 4: 碧海灵气光环
    (2, 1), # 5: 灵纹水波扩散
    (0, 2), # 6: 额生金印气血平复
]

horizontal_sheet = Image.new("RGBA", (FRAME_SZ * len(coords), FRAME_SZ), (0, 0, 0, 0))
bg_color = img.getpixel((10, 10))

for idx, (c, r) in enumerate(coords):
    x1 = c * box_w
    y1 = r * box_h
    x2 = x1 + box_w
    y2 = y1 + box_h
    
    cell = img.crop((x1, y1, x2, y2))
    cell_rgba = cell.convert("RGBA")
    pix = cell_rgba.load()
    cw, ch = cell_rgba.size
    for cy in range(ch):
        for cx in range(cw):
            r_c, g_c, b_c, a_c = pix[cx, cy]
            dist = ((r_c - bg_color[0])**2 + (g_c - bg_color[1])**2 + (b_c - bg_color[2])**2)**0.5
            if dist < 22:
                pix[cx, cy] = (0, 0, 0, 0)
            elif dist < 36:
                alpha = int(255 * (dist - 22) / 14)
                pix[cx, cy] = (r_c, g_c, b_c, alpha)
    
    bbox = cell_rgba.getbbox()
    if bbox:
        cropped = cell_rgba.crop(bbox)
        ratio = min(220 / cropped.width, 220 / cropped.height)
        new_w = int(cropped.width * ratio)
        new_h = int(cropped.height * ratio)
        resized = cropped.resize((new_w, new_h), Image.Resampling.NEAREST)
        
        # 居中对齐到底边 (y=245)
        paste_x = idx * FRAME_SZ + (FRAME_SZ - new_w) // 2
        paste_y = 245 - new_h
        horizontal_sheet.paste(resized, (paste_x, paste_y), resized)

out_sheet_web = os.path.join(out_dir, "anime_meditation_girl_sheet.png")
out_sheet_coco = os.path.join(coco_dir, "anime_meditation_girl_sheet.png")

horizontal_sheet.save(out_sheet_web, "PNG")
horizontal_sheet.save(out_sheet_coco, "PNG")

print(f"Meditation 6-Frame Sheet created! Total: {horizontal_sheet.size} at {out_sheet_web}")
