import os
from PIL import Image

src_path = r"C:\Users\kami\.gemini\antigravity\brain\067e7c08-6455-4684-9322-ed102a0b15e0\anime_girl_blacksmith_sprite_sheet_1791692703944.jpg"
out_dir = r"D:\projects\xiuxian-game\textures\anime_girl_sheet"
coco_dir = r"D:\xiuxian\assets\textures\anime_girl_sheet"
os.makedirs(out_dir, exist_ok=True)
os.makedirs(coco_dir, exist_ok=True)

img = Image.open(src_path).convert("RGBA")
W, H = img.size

# 图像是 2 行 3 列 (共 6 帧打铁序列动作)
# 第一行:
# Frame 1 (待机持锤): x 40..330, y 80..490
# Frame 2 (向后蓄力): x 330..650, y 80..490
# Frame 3 (高举神锤): x 650..980, y 40..490
# 第二行:
# Frame 4 (下劈残影): x 30..360, y 520..960
# Frame 5 (砸中爆火星): x 360..680, y 550..960
# Frame 6 (收招回弹): x 680..980, y 550..960

box_w = W // 3 # ~341
box_h = H // 2 # ~512

# 统一目标帧大小 (如 256x256 或 200x200 像素，生成单行水平长条精灵大图 1200x200)
FRAME_SZ = 256
horizontal_sheet = Image.new("RGBA", (FRAME_SZ * 6, FRAME_SZ), (0, 0, 0, 0))

coords = [
    # (col, row)
    (0, 0), # Frame 1: 待机
    (1, 0), # Frame 2: 蓄力
    (2, 0), # Frame 3: 凌空
    (0, 1), # Frame 4: 弧形斩击残影
    (1, 1), # Frame 5: 暴击砸中火星爆破
    (2, 1), # Frame 6: 弹起收招
]

bg_color = img.getpixel((10, 10)) # 背景深灰蓝

for idx, (c, r) in enumerate(coords):
    x1 = c * box_w
    y1 = r * box_h
    x2 = x1 + box_w
    y2 = y1 + box_h
    
    cell = img.crop((x1, y1, x2, y2))
    # 抠除纯色背景（容差比较）
    cell_rgba = cell.convert("RGBA")
    pix = cell_rgba.load()
    cw, ch = cell_rgba.size
    for cy in range(ch):
        for cx in range(cw):
            r_c, g_c, b_c, a_c = pix[cx, cy]
            # 计算与背景色的欧式距离
            dist = ((r_c - bg_color[0])**2 + (g_c - bg_color[1])**2 + (b_c - bg_color[2])**2)**0.5
            if dist < 22:
                pix[cx, cy] = (0, 0, 0, 0)
            elif dist < 35:
                # 边缘微柔化
                alpha = int(255 * (dist - 22) / 13)
                pix[cx, cy] = (r_c, g_c, b_c, alpha)
    
    # 缩放居中到 FRAME_SZ x FRAME_SZ
    # 找到有效 bbox
    bbox = cell_rgba.getbbox()
    if bbox:
        cropped_char = cell_rgba.crop(bbox)
        # 按比例缩放到适合 256x256
        ratio = min(220 / cropped_char.width, 230 / cropped_char.height)
        new_w = int(cropped_char.width * ratio)
        new_h = int(cropped_char.height * ratio)
        resized_char = cropped_char.resize((new_w, new_h), Image.Resampling.NEAREST)
        
        # 居中对齐贴到底座铁砧水平线 (底边靠齐 y=240)
        paste_x = idx * FRAME_SZ + (FRAME_SZ - new_w) // 2
        paste_y = 245 - new_h
        horizontal_sheet.paste(resized_char, (paste_x, paste_y), resized_char)

out_sheet_web = os.path.join(out_dir, "anime_blacksmith_girl_sheet.png")
out_sheet_coco = os.path.join(coco_dir, "anime_blacksmith_girl_sheet.png")

horizontal_sheet.save(out_sheet_web, "PNG")
horizontal_sheet.save(out_sheet_coco, "PNG")

print(f"6-Frame Clean Horizontal Sprite Sheet created! Total: {horizontal_sheet.size} at {out_sheet_web}")
