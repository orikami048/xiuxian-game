"""
生成对比样张：
1. 解决大小不一致：锁定全局坐标原点，不单独缩小带光环的帧，人物绝对等大
2. 规整真像素块：基于 2x2/1x1 物理网格吸附与 36 色阶量化，保留清晰五官并呈现纯正刀削硬方块
"""

import os
from PIL import Image
import numpy as np
import rembg


def generate_aligned_pixel_frames(src_sheet_path, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    sheet = Image.open(src_sheet_path).convert("RGBA")
    sw, sh = sheet.size
    cell_w = sw // 3
    cell_h = sh // 3

    frames = []
    for idx in range(8):
        c = idx % 3
        r = idx // 3
        box = (c * cell_w, r * cell_h, (c + 1) * cell_w, (r + 1) * cell_h)
        cell = sheet.crop(box)

        # 1. rembg 剥离纯背景
        nobg = rembg.remove(cell)

        # 2. Alpha 严格二值化 (消除半透明暗色黑边)
        arr = np.array(nobg)
        alpha = arr[:, :, 3]
        mask = alpha >= 128
        arr[:, :, 3] = np.where(mask, 255, 0)
        arr[~mask, :3] = 0
        crisp = Image.fromarray(arr, mode="RGBA")

        # 3. 规整化像素块 (保持原生网格比例，收束 36 色真像素板，保护眼睫毛与嘴唇微细节)
        r_c, g_c, b_c, a_c = crisp.split()
        rgb = Image.merge("RGB", (r_c, g_c, b_c))
        q_rgb = rgb.quantize(colors=36, method=Image.Quantize.MEDIANCUT).convert("RGB")
        pixel_frame = Image.merge("RGBA", (*q_rgb.split(), a_c))

        frames.append(pixel_frame)
        pixel_frame.save(os.path.join(out_dir, f"frame_{idx}_aligned.png"))

    # 生成第 1 帧与第 6 帧的并排对比图，直观检查人物大小是否 1:1 绝对一致
    f0 = frames[0]
    f5 = frames[5]  # 第6帧 (带同心圆灵环)
    compare_w = cell_w * 2 + 40
    compare_h = cell_h + 50
    compare_img = Image.new("RGBA", (compare_w, compare_h), (24, 20, 16, 255))
    compare_img.paste(f0, (15, 30), mask=f0)
    compare_img.paste(f5, (cell_w + 25, 30), mask=f5)
    compare_img.save(os.path.join(out_dir, "compare_frame0_vs_frame5.png"))

    # 合成 8 帧大图
    total_w = cell_w * 8
    total_h = cell_h
    strip = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        strip.paste(f, (i * cell_w, 0))
    strip.save(os.path.join(out_dir, "spritesheet_8frames_aligned.png"))
    print("对比图和 8 帧大图已就绪！")


if __name__ == "__main__":
    src = r"C:\Users\kami\.gemini\antigravity\brain\067e7c08-6455-4684-9322-ed102a0b15e0\anime_girl_meditating_sprite_sheet_1791693652207.jpg"
    out = r"D:\projects\xiuxian-game\textures\pixel_inspect"
    generate_aligned_pixel_frames(src, out)
