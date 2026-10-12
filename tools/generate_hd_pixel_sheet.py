"""
高清无损真像素多帧精灵图处理器 (HD True Pixel Sprite Sheet Generator)
特点：
1. 保持原生高清切片分辨率 (不执行 100px 压缩，防止线条糊化)
2. rembg 深度学习剥离纯净背景
3. Alpha 阈值二值化 (0 脏杂毛，边缘清爽锐利)
4. 调用 proper-pixel-art 算法网格对齐与消除抗锯齿 (De-anti-aliasing)
5. 自动多帧对齐与导出 8 帧大图
"""

import os
from PIL import Image
import numpy as np
import rembg
from proper_pixel_art import pixelate, PixelateConfig


def generate_hd_pixel_spritesheet(
    sheet_path: str,
    output_sheet_path: str,
    rows: int = 3,
    cols: int = 3,
    valid_frames_count: int = 8,
    out_frame_size: int = 384
):
    sheet = Image.open(sheet_path).convert("RGBA")
    sw, sh = sheet.size
    cell_w = sw // cols
    cell_h = sh // rows

    print(f"[HD Pipeline] 原图尺寸: {sw}x{sh}, 单格尺寸: {cell_w}x{cell_h}")

    processed_frames = []
    cfg = PixelateConfig(transparent_background=True, scale_result=1)

    for idx in range(valid_frames_count):
        r = idx // cols
        c = idx % cols
        box = (c * cell_w, r * cell_h, (c + 1) * cell_w, (r + 1) * cell_h)
        cell_img = sheet.crop(box)

        print(f"[{idx+1}/{valid_frames_count}] 正在高清去底与像素化还原...")

        # 1. 深度学习去底
        nobg = rembg.remove(cell_img)

        # 2. Alpha 二值化切除半透明杂边
        arr = np.array(nobg)
        alpha = arr[:, :, 3]
        mask = alpha >= 120
        arr[:, :, 3] = np.where(mask, 255, 0)
        arr[~mask, :3] = 0
        crisp_img = Image.fromarray(arr, mode="RGBA")

        # 3. proper-pixel-art 原生网格对齐
        try:
            res = pixelate(crisp_img, config=cfg)
            pix_img = res.image.convert("RGBA")
        except Exception:
            pix_img = crisp_img

        # 4. 居中贴入高清帧画布 (out_frame_size x out_frame_size)
        pw, ph = pix_img.size
        # 放大适配到目标框
        scale = min((out_frame_size - 40) / pw, (out_frame_size - 40) / ph)
        nw, nh = int(pw * scale), int(ph * scale)
        # 用 Nearest 保持超高清晰度
        scaled_char = pix_img.resize((nw, nh), Image.Resampling.NEAREST)

        frame_canvas = Image.new("RGBA", (out_frame_size, out_frame_size), (0, 0, 0, 0))
        paste_x = (out_frame_size - nw) // 2
        paste_y = out_frame_size - nh - 15
        frame_canvas.paste(scaled_char, (paste_x, paste_y), mask=scaled_char)
        processed_frames.append(frame_canvas)

    # 5. 拼接 8 帧大图
    total_w = out_frame_size * valid_frames_count
    total_h = out_frame_size
    strip_sheet = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))

    for idx, f_img in enumerate(processed_frames):
        strip_sheet.paste(f_img, (idx * out_frame_size, 0))

    os.makedirs(os.path.dirname(os.path.abspath(output_sheet_path)), exist_ok=True)
    strip_sheet.save(output_sheet_path, "PNG")
    print(f"\n[SUCCESS] 高清真像素精灵大图已生成: {output_sheet_path}")
    print(f"单帧尺寸: {out_frame_size}x{out_frame_size}, 总图: {strip_sheet.size}")


if __name__ == "__main__":
    src = r"C:\Users\kami\.gemini\antigravity\brain\067e7c08-6455-4684-9322-ed102a0b15e0\anime_girl_meditating_sprite_sheet_1791693652207.jpg"
    out_path = r"D:\projects\xiuxian-game\textures\meditation_hd_pixel_sheet.png"
    generate_hd_pixel_spritesheet(src, out_path, rows=3, cols=3, valid_frames_count=8, out_frame_size=384)
